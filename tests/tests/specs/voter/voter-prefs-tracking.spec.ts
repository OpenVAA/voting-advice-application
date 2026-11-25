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
 * In the voter app, `userPreferences` (userPreferences.type.ts) persists exactly: `dataCollection.consent` + `feedback.status` + `survey.status` (the Contestant App keeps its consent apart, in `contestantDataConsent`) — there is NO theme field (dark mode is OS-media-driven, not a persisted preference). The round-trip writes all three through the app's real `localStorageState` versioned envelope (`appContext-userPreferences`), reloads, and re-reads them back THROUGH the version check (proving persistence, not a raw blob echo).
 *
 * Rigidity contract (project E2E Hard Rule): every assertion is HARD — no expect.soft, no try/catch around expect(), no .catch fallback. No one-shot `isVisible({timeout})` as a wait.
 */

import { expect, test } from '@playwright/test';
import { RELAY_PATH } from '../../../../apps/frontend/src/lib/analytics/constants';
import { isUuidV7 } from '../../../../apps/frontend/src/lib/analytics/uuidv7';
import { ROUTE } from '../../../../apps/frontend/src/lib/routes/route';
import { createNavMenu } from '../../fixtures/shared/navMenu.fixture';
import {
  CONSENT_PROMPT,
  createRelayCapture,
  flushTrackingBuffer,
  flushUntil,
  GRANTED_BUTTON,
  hasVisitId,
  PREFS_KEY,
  visitIdOf
} from '../../fixtures/shared/relayCapture.fixture';
import { answerAndAdvanceToResults } from '../../fixtures/voter/voter-journey.fixture';
import { createVoterHomePage } from '../../fixtures/voter/voterHomePage.fixture';
import { TIMEOUTS, waitForNavigationFocusReset } from '../../helpers';
import { testIds } from '../../utils/testIds';
import { walkVoterStages } from '../../utils/voterNavigation';
import type { BrowserContext, Page } from '@playwright/test';
import type { CapturedRelayEvent, RelayCaptureFixture } from '../../fixtures/shared/relayCapture.fixture';

/** The message of the first assertion, which fails when the relay forwards nothing. */
const RELAY_INACTIVE_MESSAGE = `no request to the relay path ${RELAY_PATH} was captured: the server must run with ANALYTICS_PROVIDER=log, as .env.example sets it`;

/** The accessible name of the consent prompt's information button (DataConsentInfoButton.svelte). */
const CONSENT_INFO_BUTTON = /further information collecting usage data/i;

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
  return [...new Set(capture.getEvents().flatMap((event) => visitIdOf(event) ?? []))];
}

/** A short description of a captured event, for failure messages. */
function describeEvent(event: CapturedRelayEvent): string {
  return `${event.name} on ${event.routeId}${hasVisitId(event) ? ` with visit id ${String(visitIdOf(event))}` : ''}`;
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
 * When consent is `indetermined` the voter layout auto-opens the DataConsentPopup, a modal dialog that carries its OWN DataConsent — the canonical consent surface a voter sees. While it is open the page under it is inert. We drive the dialog's granted button (scoped to `getByRole('dialog')` to avoid the strict-mode clash with an inline copy). Clicking it runs `setDataConsent('granted')` → `track('dataConsent_granted')` and closes the dialog (`onChange` → `closeModal()`), which records nothing more.
 */
async function grantConsentViaPopup(page: Page): Promise<void> {
  const dialog = page.getByRole('dialog');
  const grantedButton = dialog.getByRole('button', { name: GRANTED_BUTTON });
  await expect(grantedButton).toBeVisible({ timeout: TIMEOUTS.slowPage });
  await grantedButton.click();
  // The popup closes once consent is set (Modal.closeModal via onChange).
  await expect(dialog).toBeHidden({ timeout: TIMEOUTS.slowPage });
}

/**
 * Whether the server runs in consent-free mode, read from the variable that sets the mode, as the server reads it (trimmed, any case). The wrapper starts the dev server and Playwright from one environment, so a run under the `ANALYTICS_CONSENT_MODE=free` prefix sets it for both. Unset, or any other value, is the default mode.
 */
const CONSENT_FREE_MODE = process.env.ANALYTICS_CONSENT_MODE?.trim().toLowerCase() === 'free';

/**
 * Close the voter app's consent prompt with Escape, which declines, and assert that the decline is stored.
 *
 * In the default mode the prompt opens on its own while no choice is stored. It is a modal dialog: while it is open the page under it is inert, so a walk cannot go on until it is closed. Every close without a choice, Escape included, is a decline, recorded as the decline button records it, and a stored decline keeps the prompt from opening again.
 *
 * In consent-free mode no prompt is shown, so there is nothing to close: after the page has hydrated, the prompt must be absent and no choice stored. Only in that mode is its absence accepted.
 *
 * @param page - A voter page opened by its URL, with no consent choice stored.
 */
async function dismissConsentPrompt(page: Page): Promise<void> {
  const prompt = page.getByRole('dialog', { name: CONSENT_PROMPT });
  if (CONSENT_FREE_MODE) {
    // The consent prompt is queued when the voter layout mounts, so its absence counts only once the page has hydrated.
    await waitForNavigationFocusReset(page, { timeout: TIMEOUTS.page });
    await expect(
      prompt,
      'the consent prompt is shown although ANALYTICS_CONSENT_MODE=free: the server is not in consent-free mode'
    ).toHaveCount(0);
    await expectNoConsentChoiceStored(page);
    return;
  }
  await expect(
    prompt,
    'the consent prompt did not open: the server must run in the default mode, with ANALYTICS_CONSENT_MODE unset or gated'
  ).toBeVisible({ timeout: TIMEOUTS.slowPage });
  await page.keyboard.press('Escape');
  await expect(prompt).toBeHidden({ timeout: TIMEOUTS.slowPage });
  await expectStoredConsent(page, 'denied');
}

/** Assert that the stored user preferences hold no consent choice: no consent at all, or `indetermined`. */
async function expectNoConsentChoiceStored(page: Page): Promise<void> {
  const consent = (await readPersistedPrefs(page))?.dataCollection?.consent;
  expect([undefined, 'indetermined'], `a consent choice is stored: ${String(consent)}`).toContain(consent);
}

/** Assert that the stored user preferences hold `consent` as the voter app's consent choice. */
async function expectStoredConsent(page: Page, consent: string): Promise<void> {
  await expect
    .poll(async () => (await readPersistedPrefs(page))?.dataCollection?.consent, {
      message: `the stored consent choice is not ${consent}`,
      timeout: TIMEOUTS.slowPage
    })
    .toBe(consent);
}

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

  test('before a choice and after a decline only pageviews are sent, with no id, and the declined prompt does not open again', async ({
    context,
    page
  }) => {
    const capture = createRelayCapture(context);

    // The front page's pageview is sent while the prompt is open and no choice is stored; Escape then declines, and the walk goes on under the decline.
    await openVoterHome(page);
    await expect(page.getByRole('dialog', { name: CONSENT_PROMPT })).toBeVisible({ timeout: TIMEOUTS.slowPage });
    await flushUntil(page, () => hasPageview(capture, isHomeRoute), 'the front page sent no pageview');
    await expectNoConsentChoiceStored(page);
    await dismissConsentPrompt(page);
    await startToFirstQuestion(page);
    await flushUntil(page, () => hasPageview(capture, isQuestionRoute), 'the question page sent no pageview');
    await answerAndAdvanceToResults(page, 'max');
    // The results pageview is sent by this last flush, after every batch of the earlier pages.
    await flushUntil(page, () => hasPageview(capture, isResultsRoute), 'the results page sent no pageview');
    await expectStoredConsent(page, 'denied');

    const events = capture.getEvents();
    const notPageviews = events.filter((event) => event.name !== 'pageview').map((event) => event.name);
    expect(
      notPageviews,
      `non-pageview events were sent before a choice or after a decline: ${notPageviews.join(', ')}`
    ).toStrictEqual([]);
    const withId = events.filter(hasVisitId).map(describeEvent);
    expect(
      withId,
      `events with an id were sent before a choice or after a decline: ${withId.join(', ')}`
    ).toStrictEqual([]);
    const pageviewCount = events.filter((event) => event.name === 'pageview').length;
    expect(pageviewCount, 'at least three pageviews were sent').toBeGreaterThanOrEqual(3);

    // The stored decline keeps the prompt from opening again on a new document.
    await page.reload();
    await expect(page.getByTestId(testIds.voter.results.list)).toBeVisible({ timeout: TIMEOUTS.slowPage });
    // The prompt is queued when the voter layout mounts, so its absence counts only once the page has hydrated.
    await waitForNavigationFocusReset(page, { timeout: TIMEOUTS.page });
    await expect(page.getByRole('dialog', { name: CONSENT_PROMPT }), 'the declined prompt opened again').toHaveCount(0);
    await expectStoredConsent(page, 'denied');
  });

  test('after a grant the events are sent with the visit id, and nothing buffered before the grant is sent', async ({
    context,
    page
  }) => {
    const capture = createRelayCapture(context);

    // A decline on the privacy page, then a menu opening, which is buffered while consent is declined and stays buffered until the next flush.
    await page.goto('/en/privacy');
    await expect(page.getByTestId(testIds.voter.privacy.content)).toBeVisible({ timeout: TIMEOUTS.slowPage });
    await dismissConsentPrompt(page);
    await openAndCloseMenu(page);
    // The grant on the same document, through the page's own consent control; the grant must drop the buffered `menu_open`.
    await page.getByTestId(testIds.voter.privacy.content).getByRole('button', { name: GRANTED_BUTTON }).click();
    await expectStoredConsent(page, 'granted');
    await flushUntil(
      page,
      () => capture.getEventNames().includes('dataConsent_granted'),
      'the grant was not sent from the privacy page'
    );
    await openVoterHome(page);
    await startToFirstQuestion(page);
    await answerAndAdvanceToResults(page, 'max');
    await flushUntil(page, () => hasPageview(capture, isResultsRoute), 'the results page sent no pageview');

    const events = capture.getEvents();
    const names = events.map((event) => event.name);
    expect(names, 'the grant was sent as its own event').toContain('dataConsent_granted');
    expect(names, 'the answer was sent as its own event').toContain('answer');
    expect(names, 'the menu_open buffered before the grant was not sent').not.toContain('menu_open');

    const [answerVisitId] = events.filter((event) => event.name === 'answer').map(visitIdOf);
    expect(isUuidV7(answerVisitId), `the answer event carries a UUIDv7 visit id, got ${String(answerVisitId)}`).toBe(
      true
    );

    const pageviewsWithId = events.filter((event) => event.name === 'pageview' && hasVisitId(event)).map(describeEvent);
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

test.describe('the consent prompt over a question', () => {
  test('the consent prompt is a modal: the answer choices under it cannot be reached, and Escape declines', async ({
    page
  }) => {
    const prompt = page.getByRole('dialog', { name: CONSENT_PROMPT });
    // reason: `:modal` is the one selector that tells a dialog opened with showModal(), whose page is inert, from any other dialog; no role or test id carries that, and it reads no translated string.
    // eslint-disable-next-line playwright/no-restricted-locators, playwright/no-raw-locators
    const modalDialogs = page.locator('dialog:modal');

    // The prompt opens on the front page as the one modal dialog, and Escape declines it, so the walk can reach a question.
    await openVoterHome(page);
    await expect(prompt).toBeVisible({ timeout: TIMEOUTS.slowPage });
    await expect(modalDialogs, 'the consent prompt is not shown as a modal dialog (dialog:modal)').toHaveCount(1);
    await page.keyboard.press('Escape');
    await expect(prompt).toBeHidden({ timeout: TIMEOUTS.slowPage });
    await expectStoredConsent(page, 'denied');
    await startToFirstQuestion(page);

    // With no stored choice, the voter layout queues the prompt again as it mounts, now over the question.
    await page.evaluate((key) => window.localStorage.removeItem(key), PREFS_KEY);
    await page.reload();
    await expect(prompt).toBeVisible({ timeout: TIMEOUTS.slowPage });
    await expect(modalDialogs, 'the consent prompt over the question is not a modal dialog (dialog:modal)').toHaveCount(
      1
    );

    // The last answer choice, which the prompt covers, can be neither focused nor clicked.
    const choice = page.getByTestId(testIds.voter.questions.answerOption).last();
    // reason: the choice's label has no role and no test id of its own; it is the parent of the choice's input, reached by the parent axis, which reads no translated string.
    // eslint-disable-next-line playwright/no-restricted-locators, playwright/no-raw-locators
    const choiceLabel = choice.locator('xpath=..');
    await choice.focus();
    await expect(choice, 'the answer choice under the prompt took focus').not.toBeFocused();
    const box = await choiceLabel.boundingBox();
    expect(box, "the answer choice's label has no box").not.toBeNull();
    const hitDialog = await page.evaluate(
      ({ x, y }) => document.elementFromPoint(x, y)?.closest('dialog')?.getAttribute('aria-label') ?? null,
      { x: box!.x + box!.width / 2, y: box!.y + box!.height / 2 }
    );
    expect(hitDialog, "a pointer at the answer choice's label does not land in the prompt").toMatch(CONSENT_PROMPT);
    await expect(
      choice.click({ trial: true, timeout: 2000 }),
      'the answer choice under the prompt took a click'
    ).rejects.toThrow();

    // Escape declines, and the page under the prompt is reachable again.
    await page.keyboard.press('Escape');
    await expect(prompt).toBeHidden({ timeout: TIMEOUTS.slowPage });
    await expectStoredConsent(page, 'denied');
    await choice.focus();
    await expect(choice, 'the answer choice cannot take focus after the prompt closed').toBeFocused();
  });
});

test.describe('the information dialog inside the consent prompt', () => {
  test('an Escape in the information dialog closes that dialog alone, and the next Escape declines the prompt', async ({
    page
  }) => {
    const prompt = page.getByRole('dialog', { name: CONSENT_PROMPT });
    // reason: `:modal` is the one selector that tells a dialog opened with showModal(), whose page is inert, from any other dialog; no role or test id carries that, and it reads no translated string.
    // eslint-disable-next-line playwright/no-restricted-locators, playwright/no-raw-locators
    const modalDialogs = page.locator('dialog:modal');

    await openVoterHome(page);
    await expect(prompt).toBeVisible({ timeout: TIMEOUTS.slowPage });
    await expect(modalDialogs).toHaveCount(1);

    // The information dialog carries the prompt's accessible name, so while both are open they are told apart by counting `dialog:modal`, not through the role locator.
    await prompt.getByRole('button', { name: CONSENT_INFO_BUTTON }).click();
    await expect(modalDialogs, 'the information dialog did not open inside the prompt').toHaveCount(2);

    await page.keyboard.press('Escape');
    await expect(modalDialogs, 'one Escape in the information dialog closed the consent prompt too').toHaveCount(1);
    await expect(
      prompt.getByRole('button', { name: GRANTED_BUTTON }),
      'the dialog left open is not the consent prompt'
    ).toBeVisible();
    await expectNoConsentChoiceStored(page);

    await page.keyboard.press('Escape');
    await expect(modalDialogs).toHaveCount(0);
    await expectStoredConsent(page, 'denied');
  });
});
