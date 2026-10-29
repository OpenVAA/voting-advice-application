/**
 * @file analytics-privacy.spec.ts.
 *
 * What a visitor's browser does and keeps when it goes through all three apps with usage tracking enabled: the requests it makes, the state it leaves on the device, the pageviews it sends from each app, the sends made as a page is left, and that the interface never waits for the relay.
 *
 * ## The journey
 *
 * One journey, run once in `beforeAll` in a browser context the describe creates and closes itself: the voter app (consent granted through the popup, the dataset's question answered, the results reached), then the Contestant app's login page and its privacy page, then the Admin app's login page. The three tests of the describe each read what the journey left behind; none depends on another's result, and the describe is not serial, so a failure of one never hides the others.
 *
 * Each Contestant and Admin page is left only after it has hydrated (`settleNetworkIdle`), and by a navigation: the last one, the Admin login page, is loaded again, so the journey still ends on it. A page counts its view from hydration on and sends its pageview at the view's first flush point: the next client navigation, the tab becoming hidden, or page hide. The voter app's pages are left by client navigations, whose batches the relay capture sees. Playwright does not report a batch sent at page hide, so on the Contestant login page and on the Admin login page the journey reaches the hidden flush point itself (`flushTrackingBuffer`), on the same document, until that app's pageview is captured, and only then leaves the page.
 *
 * Before the first navigation the context gets a relay capture, a request recorder and then a route that aborts every request to a third origin. A request to such an origin is therefore recorded, and fails the origin test, but never leaves the machine.
 *
 * ## Arming
 *
 * The dataset is the analytics-tracking template, which enables event tracking in the app settings; consent is granted at run time. The app's origin is the project's `baseURL`; Supabase's is the URL the dev server gives the browser, read from the environment the config loads. The relay forwards only when the server runs with an analytics provider (`ANALYTICS_PROVIDER=log`, as `.env.example` sets it).
 *
 * ## Sends made as the page is left
 *
 * Two tests, each on a context of its own:
 *  - The first starts a keepalive `POST` to the relay from page script and leaves the page in the same step, on a context that reaches the app through a recording proxy (the proxy form). It asserts that the request is captured with its body, which Playwright reports because the send starts while the document is still alive, and that the relay answers it with 204, as the proxy records the answer. The answer is no longer read as the captured request's own response (the direct form): Playwright resolves `response()` only when the answer arrives before the page is left, never for one that arrives after. In a probe, an answer that came 50 ms after the leave was reported in 0 of 6 tries and one that came before it in 6 of 6, and the direct form of this test failed in 11 of 30 repeats, each time with no response reported; when it passed, it had seen an answer that came before the page was left. The proxy sees the browser's own request and the relay's answer whenever that answer arrives. The test does not show that the `keepalive` flag is necessary for the send to arrive: that necessity remains not observed.
 *  - The second leaves the results page with no flush by hand, so the application makes its own send at page hide. Playwright reports no such send (see `relayProxy.fixture.ts`), so this context reaches the app through a recording proxy, which sees the batch and the relay's answer to it.
 *
 * ## The interface does not wait
 *
 * A test holds every request to the relay open with a `context.route` handler, walks to the results through an answer, and asserts that the results show while the batch with the answer is still held. It releases the held requests at its end.
 *
 * Rigidity contract (project E2E Hard Rule): every assertion is hard — no soft assertion, no try/catch around expect(), no .catch fallback.
 */

import { devices, expect, test } from '@playwright/test';
import { RELAY_PATH } from '../../../../apps/frontend/src/lib/analytics/constants';
import { ADMIN, CONTESTANT, ROUTE, VOTER } from '../../../../apps/frontend/src/lib/routes/route';
import { createAdminLoginPage } from '../../fixtures/admin/adminLoginPage.fixture';
import { expectOnlyAllowedDeviceState } from '../../fixtures/shared/deviceStores.fixture';
import { createRelayCapture } from '../../fixtures/shared/relayCapture.fixture';
import { startRelayRecordingProxy } from '../../fixtures/shared/relayProxy.fixture';
import {
  attachRequestRecorder,
  blockForeignOrigins,
  expectOnlyAllowedOrigins
} from '../../fixtures/shared/requestOrigins.fixture';
import { answerAndAdvanceToResults } from '../../fixtures/voter/voter-journey.fixture';
import { createVoterHomePage } from '../../fixtures/voter/voterHomePage.fixture';
import { settleNetworkIdle, TIMEOUTS } from '../../helpers';
import { buildRoute } from '../../utils/buildRoute';
import { testIds } from '../../utils/testIds';
import { navigateToFirstQuestion, walkVoterStages } from '../../utils/voterNavigation';
import type { BrowserContext, Page, Route, TestInfo } from '@playwright/test';
import type { RelayBatch, RelayCaptureFixture } from '../../fixtures/shared/relayCapture.fixture';
import type { ProxiedRelayExchange, RelayRecordingProxy } from '../../fixtures/shared/relayProxy.fixture';
import type { RequestRecorder } from '../../fixtures/shared/requestOrigins.fixture';

/** The accessible name of the consent popup's button that grants consent. */
const GRANTED_BUTTON = /agree to share my data/i;

/** The duration the page-leave batch's pageview carries; no view the app sends in this test lasts exactly this long, so it tells the test's own request from the app's batches. */
const PAGE_LEAVE_MARKER_DURATION = 987_600;

/** A valid one-event batch for the voter front page, as the browser would send it. */
const PAGE_LEAVE_BATCH: RelayBatch = {
  routeId: ROUTE.Home,
  locale: 'en',
  events: [{ name: 'pageview', ago: 0, attributes: { params: {}, duration: PAGE_LEAVE_MARKER_DURATION } }]
};

/** The request init of the page-leave send, as the browser's transport makes it. */
const PAGE_LEAVE_REQUEST_INIT = {
  method: 'POST',
  keepalive: true,
  credentials: 'omit',
  headers: { 'content-type': 'application/json' }
} as const;

/** True when `body` is the page-leave batch, told apart from the app's own batches by its marker duration. */
function isPageLeaveBody(body: string | null): boolean {
  return body !== null && body.includes(`"duration":${PAGE_LEAVE_MARKER_DURATION}`);
}

/**
 * The origin of the Supabase URL the browser is given.
 *
 * The dev server hands the browser `PUBLIC_SUPABASE_URL`; the Playwright config loads the same environment file, so the value read here is the one the browser uses. `SUPABASE_URL`, which the harness's own clients read, is the fallback. With neither set the origin cannot be known, and the spec stops rather than guess one.
 */
function resolveSupabaseOrigin(): string {
  const url = process.env.PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
  if (!url) {
    throw new Error(
      'analytics-privacy: neither PUBLIC_SUPABASE_URL nor SUPABASE_URL is set, so the Supabase origin the browser may talk to is unknown.'
    );
  }
  return new URL(url).origin;
}

/** The project's `baseURL`, without which the app's origin is unknown. */
function requireBaseURL(testInfo: TestInfo): string {
  const baseURL = testInfo.project.use.baseURL;
  if (!baseURL) throw new Error('analytics-privacy: the project has no baseURL, so the app origin is unknown.');
  return baseURL;
}

/**
 * Grant data-collection consent through the voter app's consent popup, which opens on its own while no choice is stored.
 */
async function grantConsentViaPopup(page: Page): Promise<void> {
  const dialog = page.getByRole('dialog');
  const grantedButton = dialog.getByRole('button', { name: GRANTED_BUTTON });
  await expect(grantedButton).toBeVisible({ timeout: TIMEOUTS.slowPage });
  await grantedButton.click();
  await expect(dialog).toBeHidden({ timeout: TIMEOUTS.slowPage });
}

/** From the front page, start and walk to the first question, whose choices must show. */
async function startToFirstQuestion(page: Page): Promise<void> {
  await createVoterHomePage(page).clickStart();
  await walkVoterStages(page, ['question']);
  await expect(page.getByTestId(testIds.voter.questions.answerOption).first()).toBeVisible({
    timeout: TIMEOUTS.slowPage
  });
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
 * Flush until `arrived` holds or the slow-page budget runs out, asserting nothing. The journey runs in `beforeAll`, where a failed assertion would fail every test of the describe, so the test that needs the batch asserts it. A flush made before the page has hydrated reaches no listener, and a flush with nothing to send sends nothing, so the repeats add no batch.
 */
async function flushUntilCaptured(page: Page, arrived: () => boolean): Promise<void> {
  const deadline = Date.now() + TIMEOUTS.slowPage;
  while (!arrived() && Date.now() < deadline) {
    await flushTrackingBuffer(page);
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
}

/** True when `routeId` belongs to the app whose root route id is `root`. */
function isUnder(root: string, routeId: string): boolean {
  return routeId === root || routeId.startsWith(`${root}/`);
}

/** True when a pageview was captured for a route of the app whose root route id is `root`. */
function hasPageviewUnder(capture: RelayCaptureFixture, root: string): boolean {
  return capture.getEvents().some((event) => event.name === 'pageview' && isUnder(root, event.routeId));
}

/** The batch a request body holds. */
function parseBatch(body: string | null): RelayBatch {
  return JSON.parse(body ?? '') as RelayBatch;
}

/** The relay exchanges whose batch belongs to a results view. */
function resultsExchanges(proxy: RelayRecordingProxy): Array<ProxiedRelayExchange> {
  return proxy.getExchanges().filter((exchange) => parseBatch(exchange.body).routeId.startsWith(ROUTE.Results));
}

test.describe('analytics privacy across the voter, Contestant and Admin apps', () => {
  let context: BrowserContext;
  let page: Page;
  let recorder: RequestRecorder;
  let capture: RelayCaptureFixture;
  let appOrigin: string;
  let supabaseOrigin: string;

  test.beforeAll(async ({ browser }, testInfo) => {
    const baseURL = requireBaseURL(testInfo);
    appOrigin = new URL(baseURL).origin;
    supabaseOrigin = resolveSupabaseOrigin();

    context = await browser.newContext({ ...devices['Desktop Chrome'], baseURL });
    capture = createRelayCapture(context);
    recorder = attachRequestRecorder(context);
    await blockForeignOrigins(context, appOrigin, supabaseOrigin);
    page = await context.newPage();

    // The voter app: consent, one answer, the results.
    await page.goto('/en/');
    await grantConsentViaPopup(page);
    await navigateToFirstQuestion(page);
    await answerAndAdvanceToResults(page, 'max');

    // The Contestant app: its login page and its privacy page. Each is left only after it has hydrated; the login page's pageview is flushed on the same document first (see the file header).
    await page.goto(buildRoute({ route: 'ContestantAppLogin', locale: 'en' }));
    await expect(page.getByTestId(testIds.contestant.login.page)).toBeVisible({ timeout: TIMEOUTS.slowPage });
    await settleNetworkIdle(page, { timeoutMs: TIMEOUTS.slowPage });
    await flushUntilCaptured(page, () => hasPageviewUnder(capture, CONTESTANT));
    await page.goto(buildRoute({ route: 'ContestantAppPrivacy', locale: 'en' }));
    await expect(page.getByTestId(testIds.contestant.privacy.home)).toBeVisible({ timeout: TIMEOUTS.slowPage });
    await settleNetworkIdle(page, { timeoutMs: TIMEOUTS.slowPage });

    // The Admin app: its login page, hydrated, its pageview flushed on the same document, and then loaded again, so the journey ends on that page.
    const adminLogin = createAdminLoginPage(page);
    await adminLogin.goToPage();
    await settleNetworkIdle(page, { timeoutMs: TIMEOUTS.slowPage });
    await flushUntilCaptured(page, () => hasPageviewUnder(capture, ADMIN));
    await adminLogin.goToPage();
  });

  test.afterAll(async () => {
    await context?.close();
  });

  test('every request went to the app or to Supabase, and every script was same-origin', () => {
    expectOnlyAllowedOrigins(recorder, appOrigin, supabaseOrigin);
  });

  test('the device holds only allow-listed state after the journey', async () => {
    await expectOnlyAllowedDeviceState(context, page);
  });

  test('pageviews are sent for all three apps', () => {
    const pageviews = capture.getEvents().filter((event) => event.name === 'pageview');
    const routeIds = pageviews.map((event) => event.routeId);
    const listed = routeIds.join(', ');
    expect(
      routeIds.some((routeId) => isUnder(VOTER, routeId)),
      `no pageview of the voter app (${VOTER}) was captured; pageviews: ${listed}`
    ).toBe(true);
    expect(
      routeIds.some((routeId) => isUnder(CONTESTANT, routeId)),
      `no pageview of the Contestant app (${CONTESTANT}) was captured; pageviews: ${listed}`
    ).toBe(true);
    expect(
      routeIds.some((routeId) => isUnder(ADMIN, routeId)),
      `no pageview of the Admin app (${ADMIN}) was captured; pageviews: ${listed}`
    ).toBe(true);
    const withId = pageviews.filter((event) => event.id !== undefined).map((event) => event.routeId);
    expect(withId, `pageviews carried an id: ${withId.join(', ')}`).toStrictEqual([]);
  });
});

test.describe('the relay at page leave', () => {
  let proxy: RelayRecordingProxy | undefined;
  let proxiedContext: BrowserContext | undefined;

  test.afterEach(async () => {
    await proxiedContext?.close();
    await proxy?.close();
  });

  test('a keepalive POST to the relay made as the page is left is captured and answered (proxy form)', async ({
    browser
  }, testInfo) => {
    const recording = await startRelayRecordingProxy();
    proxy = recording;
    proxiedContext = await browser.newContext({
      ...devices['Desktop Chrome'],
      baseURL: requireBaseURL(testInfo),
      proxy: { server: recording.server }
    });
    const capture = createRelayCapture(proxiedContext);
    const page = await proxiedContext.newPage();

    await page.goto('/en/');
    await expect(page.getByTestId(testIds.voter.home.page)).toBeVisible({ timeout: TIMEOUTS.slowPage });

    // Start the send without awaiting it, and leave the page at once.
    await page.evaluate(
      ({ path, body, init }) => {
        void fetch(path, { ...init, body });
      },
      { path: RELAY_PATH, body: JSON.stringify(PAGE_LEAVE_BATCH), init: PAGE_LEAVE_REQUEST_INIT }
    );
    await page.goto('about:blank');

    const pageLeaveBatches = (): Array<RelayBatch> =>
      capture.getBatches().filter((batch) => isPageLeaveBody(JSON.stringify(batch)));
    await expect
      .poll(() => pageLeaveBatches().length, {
        message: 'the send made as the page was left was not captured',
        timeout: TIMEOUTS.slowPage
      })
      .toBe(1);
    expect(pageLeaveBatches()[0], 'the captured request holds the body that was sent').toStrictEqual(PAGE_LEAVE_BATCH);

    // The answer may arrive after the document is gone, when Playwright no longer reports it, so it is read where the request leaves the browser.
    await expect
      .poll(
        () =>
          recording
            .getExchanges()
            .filter((exchange) => isPageLeaveBody(exchange.body))
            .map((exchange) => exchange.status),
        {
          message: "the relay's answer to the send made as the page was left, observed by the recording proxy",
          timeout: TIMEOUTS.slowPage
        }
      )
      .toStrictEqual([204]);
  });
});

test.describe("the application's own send at page leave", () => {
  let proxy: RelayRecordingProxy | undefined;
  let proxiedContext: BrowserContext | undefined;

  test.afterEach(async () => {
    await proxiedContext?.close();
    await proxy?.close();
  });

  test("the application's own send at page leave arrives", async ({ browser }, testInfo) => {
    const recording = await startRelayRecordingProxy();
    proxy = recording;
    proxiedContext = await browser.newContext({
      ...devices['Desktop Chrome'],
      baseURL: requireBaseURL(testInfo),
      proxy: { server: recording.server }
    });
    const page = await proxiedContext.newPage();

    // Consent, then the dataset's one question: the answer makes the navigation to the results, and that navigation sends the batch with the answer.
    await page.goto('/en/');
    await grantConsentViaPopup(page);
    await startToFirstQuestion(page);
    await answerAndAdvanceToResults(page, 'max');
    await expect
      .poll(
        () =>
          recording
            .getExchanges()
            .filter((exchange) => parseBatch(exchange.body).events.some((event) => event.name === 'answer'))
            .map((exchange) => exchange.status),
        {
          message: `the batch with the answer did not reach the relay ${RELAY_PATH} and get 204: the server must run with ANALYTICS_PROVIDER=log, as .env.example sets it`,
          timeout: TIMEOUTS.slowPage
        }
      )
      .toStrictEqual([204]);

    // The results view's pageview waits for the view's first flush point, and none is reached before the page is left.
    expect(
      resultsExchanges(recording).map((exchange) => exchange.body),
      'a batch of the results view was sent before the page was left'
    ).toStrictEqual([]);

    // Leave the page, with no flush by hand.
    await page.goto('about:blank');

    await expect
      .poll(() => resultsExchanges(recording).length, {
        message: 'the results view sent no batch to the relay when the page was left',
        timeout: TIMEOUTS.slowPage
      })
      .toBeGreaterThan(0);
    const sentAtLeave = resultsExchanges(recording);
    const names = sentAtLeave.flatMap((exchange) => parseBatch(exchange.body).events.map((event) => event.name));
    expect(names, "the batch sent at page leave holds the results view's pageview").toContain('pageview');
    expect(
      sentAtLeave.map((exchange) => exchange.status),
      'the relay answered every batch sent at page leave with 204'
    ).toStrictEqual(sentAtLeave.map(() => 204));
  });
});

test.describe('the relay does not hold up the interface', () => {
  test('the interface does not wait for the relay', async ({ context, page }) => {
    // Hold every request to the relay open until the end of the test.
    const held: Array<Route> = [];
    await context.route(
      (url) => url.pathname === RELAY_PATH,
      (route) => {
        held.push(route);
      }
    );
    const heldNames = (): Array<string> =>
      held.flatMap((route) => parseBatch(route.request().postData()).events.map((event) => event.name));

    await page.goto('/en/');
    await grantConsentViaPopup(page);
    await startToFirstQuestion(page);
    // The answer makes the navigation to the results, and that navigation sends the batch with the answer; the results must show while that batch is held.
    await answerAndAdvanceToResults(page, 'max');
    await expect(page.getByTestId(testIds.voter.results.list)).toBeVisible({ timeout: TIMEOUTS.slowPage });
    await expect
      .poll(heldNames, {
        message: `the batch with the answer is not among the requests to the relay ${RELAY_PATH} held while the results show`,
        timeout: TIMEOUTS.slowPage
      })
      .toContain('answer');
    expect(page.url(), 'the page is still on the results while the relay requests are held').toContain('/results');

    // Release the held requests, then stop holding new ones.
    for (const route of held.splice(0)) await route.continue();
    await context.unrouteAll({ behavior: 'wait' });
  });
});
