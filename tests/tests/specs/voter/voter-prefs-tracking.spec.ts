/**
 * @file voter-prefs-tracking.spec.ts.
 *
 * The voter app's usage events in the default (consent-gated) mode, and the round trip of the stored user preferences. Hosted under the `voter-prefs-tracking` Playwright project, which depends on `data-setup-perm-analytics-tracking`.
 *
 * ## Why this is a perm-hosted spec (NOT a base leaf)
 *
 * The `perm-analytics-tracking` dataset turns `analytics.trackEvents` on in the shared `app_settings` row. A base leaf on `data-setup-base` could not depend on that row-writing perm node, so the spec is hosted under the perm project. The consent choice is made at run time through the voter app's consent popup; it is not seeded.
 *
 * ## How events are observed
 *
 * The browser sends its events as `POST` requests to the application's own relay path (`RELAY_PATH`), one JSON batch `{ routeId, locale, events }` per flush. `createRelayCapture` listens on the browser context before the first navigation and records every such request body; the spec asserts on the captured batches. Nothing is stubbed: the relay answers as it does for any visitor.
 *
 * The relay only forwards when the server has an analytics provider configured. The tests below need `ANALYTICS_PROVIDER=log`, as `.env.example` sets it; with provider `none` the browser sends nothing, and the first test fails with a message that says so.
 *
 * What the default mode promises, and what the tests assert:
 *  - Each view sends one pageview, with no id, whether or not the visitor has consented.
 *  - Every other event is sent only after consent, and each carries the visit id, a UUIDv7 that lives in memory for one document and is stored nowhere.
 *  - Events buffered before the grant are dropped at the grant; they are never sent.
 *
 * ## Flushing
 *
 * A batch is sent at the next flush point: a client navigation, the page becoming hidden, or the page being left. `flushTrackingBuffer` reaches the hidden flush point on the same document by overriding `document.visibilityState` and dispatching `visibilitychange`, then restores the real value. Where a test needs a batch to have arrived, it flushes again until the batch is captured, which also covers a first flush made before the page has hydrated.
 *
 * ## Persisted-prefs scope
 *
 * `userPreferences` (userPreferences.type.ts) persists exactly: `dataCollection.consent` + `feedback.status` + `survey.status` — there is NO theme field (dark mode is OS-media-driven, not a persisted preference). The round-trip writes all three through the app's real `localStorageState` versioned envelope (`appContext-userPreferences`), reloads, and re-reads them back THROUGH the version check (proving persistence, not a raw blob echo).
 *
 * Rigidity contract (project E2E Hard Rule): every assertion is HARD — no expect.soft, no try/catch around expect(), no .catch fallback. No one-shot `isVisible({timeout})` as a wait.
 */

import { expect, test } from '@playwright/test';
import { RELAY_PATH } from '../../../../apps/frontend/src/lib/analytics/constants';
import { isUuidV7 } from '../../../../apps/frontend/src/lib/analytics/uuidv7';
import { ROUTE } from '../../../../apps/frontend/src/lib/routes/route';
import { createNavMenu } from '../../fixtures/shared/navMenu.fixture';
import { createRelayCapture } from '../../fixtures/shared/relayCapture.fixture';
import { answerAndAdvanceToResults } from '../../fixtures/voter/voter-journey.fixture';
import { createVoterHomePage } from '../../fixtures/voter/voterHomePage.fixture';
import { TIMEOUTS } from '../../helpers';
import { testIds } from '../../utils/testIds';
import { walkVoterStages } from '../../utils/voterNavigation';
import type { BrowserContext, Page } from '@playwright/test';
import type { CapturedRelayEvent, RelayCaptureFixture } from '../../fixtures/shared/relayCapture.fixture';

/** The in-app DataConsent "granted" button accessible name (DataConsent.svelte). */
const GRANTED_BUTTON = /agree to share my data/i;

/** The message of the first assertion, which fails when the relay forwards nothing. */
const RELAY_INACTIVE_MESSAGE = `no request to the relay path ${RELAY_PATH} was captured: the server must run with ANALYTICS_PROVIDER=log, as .env.example sets it`;

/**
 * Flush the tracking buffer on the SAME document. The root layout calls `submitAllEvents()` when the document becomes hidden, so the helper overrides `document.visibilityState` with `'hidden'` and dispatches `visibilitychange`; it then removes the override, so the real value shows through again, and dispatches the event once more, which marks the page visible.
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
 * Flush until `arrived` holds. A flush made before the page has hydrated reaches no listener, and a batch is captured a moment after it is sent, so the helper flushes again on each poll; a flush with nothing to send sends nothing, so the repeats add no batch.
 * @param page - The page to flush.
 * @param arrived - True once the expected batch is captured.
 * @param message - The failure message when it never is.
 */
async function flushUntil(page: Page, arrived: () => boolean, message: string): Promise<void> {
  await expect
    .poll(
      async () => {
        await flushTrackingBuffer(page);
        return arrived();
      },
      { message, timeout: TIMEOUTS.slowPage }
    )
    .toBe(true);
}

/** True when a pageview was captured for a route whose id `matches` accepts. */
function hasPageview(capture: RelayCaptureFixture, matches: (routeId: string) => boolean): boolean {
  return capture.getEvents().some((event) => event.name === 'pageview' && matches(event.routeId));
}

/** True for the route id of the front page. */
const isHomeRoute = (routeId: string): boolean => routeId === ROUTE.Home;

/** True for the route id of a single question page. */
const isQuestionRoute = (routeId: string): boolean => routeId === ROUTE.Question;

/** True for the route id of any results page. */
const isResultsRoute = (routeId: string): boolean => routeId.startsWith(ROUTE.Results);

/** The distinct visit ids the captured events carry, in the order first seen. */
function visitIds(capture: RelayCaptureFixture): Array<string> {
  return [...new Set(capture.getEvents().flatMap((event) => (event.id === undefined ? [] : [event.id])))];
}

/** A short description of a captured event, for failure messages. */
function describeEvent(event: CapturedRelayEvent): string {
  return `${event.name} on ${event.routeId}${event.id === undefined ? '' : ` with id ${event.id}`}`;
}

/** Open the voter app's front page and wait for its content. */
async function openVoterHome(page: Page): Promise<void> {
  await page.goto('/en/');
  await expect(page.getByTestId(testIds.voter.home.page)).toBeVisible({ timeout: TIMEOUTS.slowPage });
}

/** From the front page, start and walk to the first question, whose choices must show. */
async function startToFirstQuestion(page: Page): Promise<void> {
  await createVoterHomePage(page).clickStart();
  await walkVoterStages(page, ['question']);
  await expect(page.getByTestId(testIds.voter.questions.answerOption).first()).toBeVisible({
    timeout: TIMEOUTS.slowPage
  });
}

/** Open the menu, which buffers a `menu_open` event, and close it again. */
async function openAndCloseMenu(page: Page): Promise<void> {
  const navMenu = createNavMenu(page);
  await navMenu.openMobileNav();
  await navMenu.closeNav();
}

/**
 * Everything the device holds for `context` as one string: the cookies, the localStorage and the IndexedDB databases with their records from the storage state, and the sessionStorage entries of `page`, keys and values alike.
 */
async function readStoredText(context: BrowserContext, page: Page): Promise<string> {
  const storage = await context.storageState({ indexedDB: true });
  const session = await page.evaluate(() => Object.entries(window.sessionStorage));
  return JSON.stringify({ storage, session });
}

/**
 * Grant data-collection consent via the in-app DataConsent control (NOT seeded).
 *
 * When consent is `indetermined` the voter layout auto-opens the DataConsentPopup (a non-modal `Alert` dialog) which carries its OWN DataConsent — the canonical consent surface a voter sees. We drive the dialog's granted button (scoped to `getByRole('dialog')` to avoid the strict-mode clash with an inline copy). Clicking it runs `setDataConsent('granted')` → `startEvent('dataConsent_granted')` and closes the dialog (`onChange` → `closeAlert()`).
 */
async function grantConsentViaPopup(page: Page): Promise<void> {
  const dialog = page.getByRole('dialog');
  const grantedButton = dialog.getByRole('button', { name: GRANTED_BUTTON });
  await expect(grantedButton).toBeVisible({ timeout: TIMEOUTS.slowPage });
  await grantedButton.click();
  // The popup closes once consent is set (Alert.closeAlert via onChange).
  await expect(dialog).toBeHidden({ timeout: TIMEOUTS.slowPage });
}

/** The accessible name of the voter app's consent prompt (`common.privacy.dataCollection.title`, the title of DataConsentPopup's Alert). */
const CONSENT_PROMPT = /collecting usage data/i;

/**
 * Whether the server runs in consent-free mode, read from the variable that sets the mode, as the server reads it (trimmed, any case). The wrapper starts the dev server and Playwright from one environment, so a run under the `ANALYTICS_CONSENT_MODE=free` prefix (plan 182-31's red control) sets it for both. Unset, or any other value, is the default mode.
 */
const CONSENT_FREE_MODE = process.env.ANALYTICS_CONSENT_MODE?.trim().toLowerCase() === 'free';

/**
 * Wait until the root layout's post-navigation focus reset has landed on the page's focus target (`[data-focus-on-nav] ?? h1`, the selector `focusNavigationTarget` uses), the wait `voter-journey.spec.ts` makes. The reset runs in the root layout's `afterNavigate`, so on a page that is opened by its URL it shows that the page has hydrated and the voter layout has mounted, which is when the consent prompt is queued.
 */
async function waitForNavigationFocusReset(page: Page): Promise<void> {
  await expect
    .poll(
      () =>
        page.evaluate(() => {
          const target = document.querySelector('[data-focus-on-nav]') ?? document.querySelector('h1');
          return target !== null && document.activeElement === target;
        }),
      { message: 'the page did not hydrate: the post-navigation focus reset never landed', timeout: TIMEOUTS.page }
    )
    .toBe(true);
}

/**
 * Close the voter app's consent prompt WITHOUT making a choice, and assert that no choice is stored.
 *
 * In the default mode the prompt opens on its own while no choice is stored. It is a non-modal alert fixed to the bottom of the viewport, and the pages of the walk keep their primary action at the bottom of the viewport too (the intro's Continue button), so whatever the viewport, the alert covers it. Its close button closes the alert and records nothing; the prompt is queued once, when the voter layout mounts, so it does not open again during the walk.
 *
 * In consent-free mode no prompt is shown, so there is nothing to close: after the page has hydrated, the prompt must be absent. Only in that mode is its absence accepted.
 *
 * @param page - A voter page opened by its URL, with no consent choice stored.
 */
async function dismissConsentPrompt(page: Page): Promise<void> {
  const prompt = page.getByRole('dialog', { name: CONSENT_PROMPT });
  if (CONSENT_FREE_MODE) {
    await waitForNavigationFocusReset(page);
    await expect(
      prompt,
      'the consent prompt is shown although ANALYTICS_CONSENT_MODE=free: the server is not in consent-free mode'
    ).toHaveCount(0);
  } else {
    await expect(
      prompt,
      'the consent prompt did not open: the server must run in the default mode, with ANALYTICS_CONSENT_MODE unset or gated'
    ).toBeVisible({ timeout: TIMEOUTS.slowPage });
    await prompt.getByRole('button', { name: /^close$/i }).click();
    await expect(prompt).toBeHidden({ timeout: TIMEOUTS.slowPage });
  }
  await expectNoConsentChoiceStored(page);
}

/** Assert that the stored user preferences hold no consent choice: no consent at all, or `indetermined`. */
async function expectNoConsentChoiceStored(page: Page): Promise<void> {
  const consent = (await readPersistedPrefs(page))?.dataCollection?.consent;
  expect([undefined, 'indetermined'], `a consent choice is stored: ${String(consent)}`).toContain(consent);
}

/** localStorage key the app persists `userPreferences` under (the `localStorageState` call in appContext.svelte.ts). */
const PREFS_KEY = 'appContext-userPreferences';

/**
 * The persisted `userPreferences` shape we round-trip. Mirrors userPreferences.type.ts (consent + feedback.status + survey.status). `date` fields are persisted alongside but the round-trip assertion targets the status/consent values.
 */
interface PersistedPrefs {
  dataCollection?: { consent: string; date: string };
  feedback?: { status: string; date: string };
  survey?: { status: string; date: string };
}

/**
 * Read the `data` payload of the app's versioned localStorage envelope (`{ version, data }`, written by persistedState.svelte.ts). Returns `null` when the key is absent. Reads through `JSON.parse` exactly as the app would.
 */
async function readPersistedPrefs(page: Page): Promise<PersistedPrefs | null> {
  return page.evaluate((key) => {
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;
    const env = JSON.parse(raw) as { version: number; data: unknown };
    return (env.data as PersistedPrefs) ?? null;
  }, PREFS_KEY);
}

/**
 * Merge `patch` into the app's versioned localStorage envelope, PRESERVING the existing version number (so the app's `getItemFromStorage` version gate accepts it on reload). Requires the envelope to already exist (consent granted via UI first), so we never fabricate a version.
 */
async function patchPersistedPrefs(page: Page, patch: PersistedPrefs): Promise<void> {
  await page.evaluate(
    ({ key, patch }) => {
      const raw = window.localStorage.getItem(key);
      if (!raw) throw new Error(`patchPersistedPrefs: ${key} not present — grant consent via UI first`);
      const env = JSON.parse(raw) as { version: number; data: Record<string, unknown> };
      env.data = { ...env.data, ...patch };
      window.localStorage.setItem(key, JSON.stringify(env));
    },
    { key: PREFS_KEY, patch }
  );
}

test.describe('voter-prefs-tracking (EFLOW-08)', () => {
  test.describe.configure({ mode: 'serial' });

  test('the relay is active', async ({ context, page }) => {
    const capture = createRelayCapture(context);

    await openVoterHome(page);
    // A bounded poll, so that an inactive relay fails with a message that names the cause rather than with a bare timeout. Each poll flushes again: a flush made before the page has hydrated reaches no listener.
    await expect
      .poll(
        async () => {
          await flushTrackingBuffer(page);
          return capture.getBatches().length;
        },
        { message: RELAY_INACTIVE_MESSAGE, timeout: TIMEOUTS.slowPage }
      )
      .toBeGreaterThan(0);
  });

  test('before consent only pageviews are sent, with no id', async ({ context, page }) => {
    const capture = createRelayCapture(context);

    // Two pages and an answer, with no consent choice, flushing after each step. The consent prompt is closed without a choice, so it covers none of the controls the walk clicks.
    await openVoterHome(page);
    await dismissConsentPrompt(page);
    await flushUntil(page, () => hasPageview(capture, isHomeRoute), 'the front page sent no pageview');
    await startToFirstQuestion(page);
    await flushUntil(page, () => hasPageview(capture, isQuestionRoute), 'the question page sent no pageview');
    await answerAndAdvanceToResults(page, 'max');
    // The results pageview is sent by this last flush, after every batch of the earlier pages.
    await flushUntil(page, () => hasPageview(capture, isResultsRoute), 'the results page sent no pageview');
    // Still no choice at the end of the walk, so every captured batch was sent before consent.
    await expectNoConsentChoiceStored(page);

    const events = capture.getEvents();
    const notPageviews = events.filter((event) => event.name !== 'pageview').map((event) => event.name);
    expect(notPageviews, `non-pageview events were sent before consent: ${notPageviews.join(', ')}`).toStrictEqual([]);
    const withId = events.filter((event) => event.id !== undefined).map(describeEvent);
    expect(withId, `events with an id were sent before consent: ${withId.join(', ')}`).toStrictEqual([]);
    const pageviewCount = events.filter((event) => event.name === 'pageview').length;
    expect(pageviewCount, 'at least two pageviews were sent').toBeGreaterThanOrEqual(2);
  });

  test('after consent the events are sent with the visit id, and nothing buffered before the grant is sent', async ({
    context,
    page
  }) => {
    const capture = createRelayCapture(context);

    await openVoterHome(page);
    // Opening the menu buffers `menu_open` while no consent choice is stored; the grant must drop it.
    await openAndCloseMenu(page);
    await grantConsentViaPopup(page);
    await startToFirstQuestion(page);
    await answerAndAdvanceToResults(page, 'max');
    await flushUntil(page, () => hasPageview(capture, isResultsRoute), 'the results page sent no pageview');

    const events = capture.getEvents();
    const names = events.map((event) => event.name);
    expect(names, 'the grant was sent as its own event').toContain('dataConsent_granted');
    expect(names, 'the answer was sent as its own event').toContain('answer');
    expect(names, 'the menu_open buffered before the grant was not sent').not.toContain('menu_open');

    const answer = events.find((event) => event.name === 'answer');
    expect(isUuidV7(answer?.id), `the answer event carries a UUIDv7 visit id, got ${String(answer?.id)}`).toBe(true);

    const pageviewsWithId = events
      .filter((event) => event.name === 'pageview' && event.id !== undefined)
      .map(describeEvent);
    expect(pageviewsWithId, `pageviews carried an id: ${pageviewsWithId.join(', ')}`).toStrictEqual([]);
  });

  test('the visit id lives for one document', async ({ context, page }) => {
    const capture = createRelayCapture(context);

    // The first batch with events: the grant, sent with the front page's pageview.
    await openVoterHome(page);
    await grantConsentViaPopup(page);
    await flushUntil(page, () => visitIds(capture).length > 0, 'no event with a visit id was sent after the grant');
    const firstIds = visitIds(capture);
    expect(firstIds, 'the first batch carries one visit id').toHaveLength(1);
    const [firstId] = firstIds;
    expect(isUuidV7(firstId), `the visit id is a UUIDv7, got ${firstId}`).toBe(true);

    // A second batch of the same document.
    capture.clear();
    await openAndCloseMenu(page);
    await flushUntil(page, () => capture.getEventNames().includes('menu_open'), 'the menu_open event was not sent');
    expect(visitIds(capture), 'the second batch of the document carries the same visit id').toStrictEqual([firstId]);

    // A reload starts a new document, and with it a new visit id; the stored consent keeps the events flowing.
    capture.clear();
    await page.reload();
    await expect(page.getByTestId(testIds.voter.home.page)).toBeVisible({ timeout: TIMEOUTS.slowPage });
    await openAndCloseMenu(page);
    await flushUntil(
      page,
      () => capture.getEventNames().includes('menu_open'),
      'the menu_open event was not sent after the reload'
    );
    const reloadIds = visitIds(capture);
    expect(reloadIds, 'the batch after the reload carries one visit id').toHaveLength(1);
    const [reloadId] = reloadIds;
    expect(isUuidV7(reloadId), `the visit id after the reload is a UUIDv7, got ${reloadId}`).toBe(true);
    expect(reloadId, 'the visit id after the reload differs from the one before it').not.toBe(firstId);

    // Neither id is stored on the device, under any key or in any value.
    const stored = await readStoredText(context, page);
    expect(stored.includes(firstId), `the device stores the first visit id ${firstId}`).toBe(false);
    expect(stored.includes(reloadId), `the device stores the visit id after the reload ${reloadId}`).toBe(false);
  });

  test('user-preferences round-trip: consent + feedback + survey survive a reload', async ({ page }) => {
    // Grant consent via the in-app DataConsent control so the app writes the real versioned localStorage envelope (NOT a fabricated blob).
    await page.goto('/en/privacy');
    await expect(page.getByTestId('voter-privacy-return')).toBeVisible({ timeout: TIMEOUTS.slowPage });
    await grantConsentViaPopup(page);

    // The other two persisted fields (feedback.status / survey.status) are written through the app's own versioned envelope (version preserved from the consent write), so the reload read passes the version gate.
    await patchPersistedPrefs(page, {
      feedback: { status: 'received', date: new Date().toISOString() },
      survey: { status: 'dismissed', date: new Date().toISOString() }
    });

    // Reload — forces the app to re-read userPreferences THROUGH the version check.
    await page.reload();
    await expect(page).toHaveURL(/\/en\/privacy/, { timeout: TIMEOUTS.slowPage });

    // Re-read every persisted field after the reload and assert each round-trips.
    const prefs = await readPersistedPrefs(page);
    expect(prefs, 'persisted userPreferences present after reload').not.toBeNull();
    expect(prefs?.dataCollection?.consent, 'dataCollection.consent round-trips').toBe('granted');
    expect(prefs?.feedback?.status, 'feedback.status round-trips').toBe('received');
    expect(prefs?.survey?.status, 'survey.status round-trips').toBe('dismissed');

    // The reloaded app must still reflect the persisted consent (granted button disabled) — proves the round-trip is consumed by the app, not just storage.
    const grantedAfterReload = page.getByRole('button', { name: GRANTED_BUTTON });
    await expect(grantedAfterReload).toBeDisabled({ timeout: TIMEOUTS.slowPage });
  });
});
