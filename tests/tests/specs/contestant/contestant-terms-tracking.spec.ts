/**
 * @file contestant-terms-tracking.spec.ts.
 *
 * # The consent to usage data at the Contestant App's terms of use
 *
 * In the Contestant App, accepting the terms of use counts as consent to the collection of usage data, unless the user ticks the opt-out box the terms-of-use view shows under its acceptance checkbox. The choice is written to the same origin-wide store the voter app's consent prompt writes (`appContext-userPreferences`, `data.dataCollection.consent`), and the Contestant App's privacy page offers the consent control by which it can be changed.
 *
 * This spec observes that in a browser, on the `perm-analytics-tracking` dataset, whose settings row turns `analytics.trackEvents` on:
 *  - the view shows the box unticked, passes the suite's axe scan with the box visible, and the box is reached with Tab and toggled with Space; the terms text holds the usage-data section;
 *  - at 320 px wide the view does not overflow sideways and the box lies inside the viewport;
 *  - accepting without ticking the box stores `granted`, after which a menu opening is sent with a visit id and every pageview is sent without one;
 *  - accepting with the box ticked stores `denied`, after which nothing but pageviews is sent;
 *  - the privacy page shows the consent control, and refusing there stores `denied`;
 *  - the device holds only allow-listed state in a Contestant session, its Supabase auth cookies included.
 *
 * ## The users
 *
 * Two users, one for each member candidate of the dataset, are registered in `beforeAll` with the suite's helper `registerAndStoreSession` and `acceptTermsOfUse: false`, so each is shown the terms-of-use view at every protected URL until it accepts. The **granting** user accepts in the third test and the **refusing** user in the fourth; nothing else accepts for them. The helper unregisters any earlier holder of either address first, and the dataset's teardown unregisters both users and asserts that they are gone.
 *
 * Each test opens a browser context from one of the two stored sessions, through `test.use({ storageState })`; the sessions are written by `beforeAll`, before the first context is created. The contexts `beforeAll` opens itself name an empty storage state, since Playwright would otherwise give them the first test's, which does not exist yet. The acceptance is held on the server, so a session stored before it still shows the user's home after it.
 *
 * ## How events are observed
 *
 * `createRelayCapture` is attached to each test's context before its first navigation. It sees the batches a document sends while it is alive: at a client navigation and at the hidden flush point, which `flushTrackingBuffer` reaches on the same document. A Contestant page counts its view from hydration on, so each page is settled before it is flushed. The server must run with `ANALYTICS_PROVIDER=log`, as `.env.example` sets it, and in the default consent mode; otherwise the box is not shown and the first assertion about it fails.
 *
 * ## Order
 *
 * The describe is serial: the acceptances of the third and fourth tests remove the view the first two read, and every test reads the dataset's settings row, which only the perm serial chain writes. The project that hosts the spec runs its files one test at a time.
 *
 * Rigidity contract: hard assertions only, no retry, every locator behind a fixture.
 */

import { devices, expect, test } from '@playwright/test';
import { isUuidV7 } from '../../../../apps/frontend/src/lib/analytics/uuidv7';
import { CONTESTANT, CONTESTANT_ENTITY } from '../../../../apps/frontend/src/lib/routes/route';
import { createContestantEntityHomePage } from '../../fixtures/contestant/contestantEntityHomePage.fixture';
import { createContestantPrivacyPage } from '../../fixtures/contestant/contestantPrivacyPage.fixture';
import { createContestantTermsOfUsePage } from '../../fixtures/contestant/contestantTermsOfUsePage.fixture';
import { expectOnlyAllowedDeviceState, readDeviceState } from '../../fixtures/shared/deviceStores.fixture';
import { createNavMenu } from '../../fixtures/shared/navMenu.fixture';
import { createRelayCapture } from '../../fixtures/shared/relayCapture.fixture';
import { settleNetworkIdle, TIMEOUTS } from '../../helpers';
import { registerAndStoreSession } from '../../setup/shared/registerAndStoreSession';
import { assertAxeScan } from '../../utils/axeScan';
import { toScanEntry } from '../../utils/contestantAxeScan';
import { SupabaseAdminClient } from '../../utils/supabaseAdminClient';
import {
  ANALYTICS_TERMS_GRANTING_EMAIL,
  ANALYTICS_TERMS_GRANTING_EXTERNAL_ID,
  ANALYTICS_TERMS_GRANTING_STORAGE_STATE,
  ANALYTICS_TERMS_REFUSING_EMAIL,
  ANALYTICS_TERMS_REFUSING_EXTERNAL_ID,
  ANALYTICS_TERMS_REFUSING_STORAGE_STATE,
  TEST_CANDIDATE_PASSWORD
} from '../../utils/testCredentials';
import { testIds } from '../../utils/testIds';
import type { BrowserContext, Page, TestInfo } from '@playwright/test';
import type { ContestantTermsOfUsePageFixture } from '../../fixtures/contestant/contestantTermsOfUsePage.fixture';
import type { CapturedRelayEvent, RelayCaptureFixture } from '../../fixtures/shared/relayCapture.fixture';
import type { StoredSessionIdentity } from '../../setup/shared/registerAndStoreSession';
import type { ContestantAxeRoute } from '../../utils/contestantAxeScan';

/** The message of the waits for a batch, which fail when the relay forwards nothing. */
const RELAY_MESSAGE =
  'the expected batch was not captured: the server must run with ANALYTICS_PROVIDER=log, as .env.example sets it, and in the default consent mode';

/** The terms-of-use view with the opt-out box, as the suite's shared scan core scans it. Anchored on the box, so the scan waits until the box is rendered; the reach proof's marker is the view's Continue button, which only the protected layout renders for a user who has not accepted. */
const OPT_OUT_SCAN: ContestantAxeRoute = {
  name: 'contestant-terms-gate-with-opt-out',
  fixture: 'raw',
  routeId: 'ContestantAppHome',
  contentTestId: testIds.contestant.terms.trackingOptOut,
  postLoginTestId: testIds.contestant.terms.submit
};

/** The two users, registered as editors of the dataset's two member candidates without an acceptance of the terms of use. Each session is stored only once the terms-of-use view has rendered for its user. */
const TERMS_PENDING_IDENTITIES: ReadonlyArray<StoredSessionIdentity> = [
  {
    externalId: ANALYTICS_TERMS_GRANTING_EXTERNAL_ID,
    email: ANALYTICS_TERMS_GRANTING_EMAIL,
    password: TEST_CANDIDATE_PASSWORD,
    storageStatePath: ANALYTICS_TERMS_GRANTING_STORAGE_STATE,
    acceptTermsOfUse: false,
    settledTestId: testIds.contestant.terms.submit
  },
  {
    externalId: ANALYTICS_TERMS_REFUSING_EXTERNAL_ID,
    email: ANALYTICS_TERMS_REFUSING_EMAIL,
    password: TEST_CANDIDATE_PASSWORD,
    storageStatePath: ANALYTICS_TERMS_REFUSING_STORAGE_STATE,
    acceptTermsOfUse: false,
    settledTestId: testIds.contestant.terms.submit
  }
];

/** The base URL of the project, which a context `beforeAll` opens itself does not inherit. */
function requireBaseURL(testInfo: TestInfo): string {
  const baseURL = testInfo.project.use.baseURL;
  if (!baseURL) throw new Error('contestant-terms-tracking: the project has no baseURL.');
  return baseURL;
}

/**
 * Reach the hidden flush point on the SAME document. The root layout sends the pending batch when the document becomes hidden, so this overrides `document.visibilityState` with `'hidden'` and dispatches `visibilitychange`; it then removes the override, so the real value shows through again, and dispatches the event once more, which marks the page visible.
 */
async function flushTrackingBuffer(page: Page): Promise<void> {
  await page.evaluate(() => {
    Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'hidden' });
    document.dispatchEvent(new Event('visibilitychange'));
    Reflect.deleteProperty(document, 'visibilityState');
    document.dispatchEvent(new Event('visibilitychange'));
  });
}

/**
 * Flush until `arrived` holds, and fail with `RELAY_MESSAGE` when it never does. A flush with nothing to send sends nothing, so the repeats add no batch.
 */
async function flushUntil(page: Page, arrived: () => boolean): Promise<void> {
  await expect
    .poll(
      async () => {
        await flushTrackingBuffer(page);
        return arrived();
      },
      { message: RELAY_MESSAGE, timeout: TIMEOUTS.slowPage }
    )
    .toBe(true);
}

/** True when `routeId` belongs to the route whose id is `root`, or to a route under it. */
function isUnder(root: string, routeId: string): boolean {
  return routeId === root || routeId.startsWith(`${root}/`);
}

/** A short description of a captured event, for failure messages. */
function describeEvent(event: CapturedRelayEvent): string {
  return `${event.name} on ${event.routeId}${event.id === undefined ? '' : ` with id ${event.id}`}`;
}

/** The captured events named `name`. */
function eventsNamed(capture: RelayCaptureFixture, name: string): Array<CapturedRelayEvent> {
  return capture.getEvents().filter((event) => event.name === name);
}

/**
 * The consent choice stored on the device, read from the user preferences' `{ version, data }` envelope; `undefined` when no choice is stored.
 */
async function readStoredConsent(context: BrowserContext, page: Page): Promise<string | undefined> {
  const { userPreferences } = await readDeviceState(context, page);
  if (userPreferences === null) return undefined;
  const envelope = JSON.parse(userPreferences) as { data?: { dataCollection?: { consent?: string } } };
  return envelope.data?.dataCollection?.consent;
}

/** Open the menu, which buffers a `menu_open` event, and close it again. */
async function openAndCloseMenu(page: Page): Promise<void> {
  const navMenu = createNavMenu(page);
  await navMenu.openMobileNav();
  await navMenu.closeNav();
}

/**
 * Open the terms-of-use view and wait until it has hydrated, so its checkboxes are bound before they are pressed and its view is counted.
 */
async function openTermsView(page: Page): Promise<ContestantTermsOfUsePageFixture> {
  const termsPage = createContestantTermsOfUsePage(page);
  await termsPage.open();
  await settleNetworkIdle(page, { timeoutMs: TIMEOUTS.slowPage });
  return termsPage;
}

test.describe('the consent to usage data at the Contestant terms of use', () => {
  test.describe.configure({ mode: 'serial' });

  let capture: RelayCaptureFixture;

  test.beforeAll(async ({ browser }, testInfo) => {
    const baseURL = requireBaseURL(testInfo);
    for (const identity of TERMS_PENDING_IDENTITIES) {
      // A context of its own for each user, so that no state of one sign-in reaches the other's stored session.
      // The empty storage state is explicit: Playwright fills every option `newContext` leaves out from the use options of the test that runs this hook, and the first test's `storageState` names a file this hook has not written yet.
      const context = await browser.newContext({
        ...devices['Desktop Chrome'],
        baseURL,
        storageState: { cookies: [], origins: [] }
      });
      const page = await context.newPage();
      await registerAndStoreSession(page, identity);
      await context.close();
    }
  });

  test.beforeEach(({ context }) => {
    capture = createRelayCapture(context);
  });

  test.describe('as the user who will accept without opting out', () => {
    test.use({ storageState: ANALYTICS_TERMS_GRANTING_STORAGE_STATE });

    test('the opt-out box is shown, unticked and accessible', async ({ page }, testInfo) => {
      const termsPage = await openTermsView(page);
      await termsPage.expectTrackingOptOutUnticked();

      await assertAxeScan(page, toScanEntry(OPT_OUT_SCAN, OPT_OUT_SCAN.name, false), testInfo, OPT_OUT_SCAN.name);

      await termsPage.toggleTrackingOptOutByKeyboard();
      await expect.poll(() => termsPage.isTrackingOptOutTicked(), { message: 'Space did not tick the box' }).toBe(true);
      await termsPage.toggleTrackingOptOutByKeyboard();
      await expect
        .poll(() => termsPage.isTrackingOptOutTicked(), { message: 'Space did not untick the box' })
        .toBe(false);

      await termsPage.expectUsageDataInTerms();
    });
  });

  test.describe('as the same user at 320 px wide', () => {
    test.use({
      storageState: ANALYTICS_TERMS_GRANTING_STORAGE_STATE,
      viewport: { width: 320, height: 568 },
      isMobile: true,
      hasTouch: true
    });

    test('the view reflows at 320 px', async ({ page }) => {
      const termsPage = await openTermsView(page);
      await termsPage.expectNoHorizontalOverflow();
      await termsPage.expectTrackingOptOutUnticked();
      await termsPage.expectTrackingOptOutInsideViewport();
    });
  });

  test.describe('as the user who accepts without opting out', () => {
    test.use({ storageState: ANALYTICS_TERMS_GRANTING_STORAGE_STATE });

    test('accepting without ticking grants', async ({ context, page }) => {
      const termsPage = await openTermsView(page);
      await termsPage.expectTrackingOptOutUnticked();
      await termsPage.acceptAndAdvance();
      await termsPage.expectLeft();
      await createContestantEntityHomePage(page, new SupabaseAdminClient()).expectLanded({
        entityType: 'candidate',
        externalId: ANALYTICS_TERMS_GRANTING_EXTERNAL_ID
      });

      await expect
        .poll(() => readStoredConsent(context, page), { message: 'the stored consent choice' })
        .toBe('granted');

      await settleNetworkIdle(page, { timeoutMs: TIMEOUTS.slowPage });
      await openAndCloseMenu(page);
      await flushUntil(page, () => eventsNamed(capture, 'menu_open').length > 0);

      const unlinkedMenuOpens = eventsNamed(capture, 'menu_open').filter((event) => !isUuidV7(event.id));
      expect(
        unlinkedMenuOpens.map(describeEvent),
        'a menu opening was sent without a UUIDv7 visit id after a granting acceptance'
      ).toEqual([]);

      const pageviews = eventsNamed(capture, 'pageview');
      expect(pageviews.length, 'no pageview was captured').toBeGreaterThan(0);
      expect(
        pageviews.filter((event) => !isUnder(CONTESTANT, event.routeId)).map(describeEvent),
        `a pageview outside the Contestant App (${CONTESTANT}) was captured`
      ).toEqual([]);
      expect(
        pageviews.filter((event) => event.id !== undefined).map(describeEvent),
        'a pageview carries an id'
      ).toEqual([]);
    });
  });

  test.describe('as the user who accepts with the opt-out ticked', () => {
    test.use({ storageState: ANALYTICS_TERMS_REFUSING_STORAGE_STATE });

    test('accepting with the box ticked refuses', async ({ context, page }) => {
      const termsPage = await openTermsView(page);
      await termsPage.expectTrackingOptOutUnticked();
      await termsPage.tickTrackingOptOut();
      await termsPage.acceptAndAdvance();
      await termsPage.expectLeft();
      await createContestantEntityHomePage(page, new SupabaseAdminClient()).expectLanded({
        entityType: 'candidate',
        externalId: ANALYTICS_TERMS_REFUSING_EXTERNAL_ID
      });

      await expect
        .poll(() => readStoredConsent(context, page), { message: 'the stored consent choice' })
        .toBe('denied');

      // The home's own pageview is sent at the first flush after the menu was opened, in the batch a menu opening would join if it were allowed, so its arrival is the moment to read the capture.
      await settleNetworkIdle(page, { timeoutMs: TIMEOUTS.slowPage });
      await openAndCloseMenu(page);
      await flushUntil(page, () =>
        eventsNamed(capture, 'pageview').some((event) => isUnder(CONTESTANT_ENTITY, event.routeId))
      );

      expect(
        capture
          .getEvents()
          .filter((event) => event.name !== 'pageview')
          .map(describeEvent),
        'an event other than a pageview was sent after a refusing acceptance'
      ).toEqual([]);
    });
  });

  test.describe('on the privacy page and in the session', () => {
    test.use({ storageState: ANALYTICS_TERMS_GRANTING_STORAGE_STATE });

    test('the choice can be changed on the privacy page', async ({ context, page }) => {
      const privacyPage = createContestantPrivacyPage(page);
      await privacyPage.open();
      await privacyPage.expectConsentControl();
      await privacyPage.refuse();
      await expect
        .poll(() => readStoredConsent(context, page), { message: 'the stored consent choice' })
        .toBe('denied');
    });

    test('the device holds only allow-listed state', async ({ context, page }) => {
      const homePage = createContestantEntityHomePage(page, new SupabaseAdminClient());
      await homePage.open();
      await homePage.expectLanded({ entityType: 'candidate', externalId: ANALYTICS_TERMS_GRANTING_EXTERNAL_ID });
      await settleNetworkIdle(page, { timeoutMs: TIMEOUTS.slowPage });
      await openAndCloseMenu(page);
      await expectOnlyAllowedDeviceState(context, page);
    });
  });
});
