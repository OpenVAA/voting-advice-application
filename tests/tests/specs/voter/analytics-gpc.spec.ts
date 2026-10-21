/**
 * @file analytics-gpc.spec.ts.
 *
 * The browser side of a visitor's objection by Global Privacy Control: with the signal set there is no consent prompt, no request to the relay, nothing stored to record the objection, and the privacy page says so.
 *
 * ## The signal
 *
 * A browser that sends the signal sets the `Sec-GPC: 1` request header and the `navigator.globalPrivacyControl` property. Page script can set neither, so the harness sets both: the header with `extraHTTPHeaders` on the context, and the property with an init script that runs before any page script. The app reads the property and the relay reads the header.
 *
 * ## The control
 *
 * Zero requests and no prompt would also be seen with an inactive relay, or on a dataset where the prompt is never shown. A second describe therefore makes the same first steps without the signal, and asserts that the prompt shows and that a request reaches the relay. Together the two show that the absences under the signal are the signal's.
 *
 * ## Arming
 *
 * The dataset is the analytics-tracking template, which enables event tracking in the app settings. The relay forwards only when the server runs with an analytics provider (`ANALYTICS_PROVIDER=log`, as `.env.example` sets it), and the prompt is shown only in the default consent mode.
 *
 * ## Flushing
 *
 * A batch is sent at the next flush point: a client navigation, the page becoming hidden, or the page being left. `flushTrackingBuffer` reaches the hidden flush point on the same document, after the page has hydrated, so that a send the signal failed to stop would be seen.
 *
 * Rigidity contract (project E2E Hard Rule): every assertion is hard — no soft assertion, no try/catch around expect(), no .catch fallback.
 */

import { expect, test } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { RELAY_PATH } from '../../../../apps/frontend/src/lib/analytics/constants';
import { expectOnlyAllowedDeviceState } from '../../fixtures/shared/deviceStores.fixture';
import { createRelayCapture } from '../../fixtures/shared/relayCapture.fixture';
import { answerAndAdvanceToResults } from '../../fixtures/voter/voter-journey.fixture';
import { createVoterHomePage } from '../../fixtures/voter/voterHomePage.fixture';
import { settleNetworkIdle, TIMEOUTS } from '../../helpers';
import { testIds } from '../../utils/testIds';
import { TESTS_DIR } from '../../utils/testsDir';
import { walkVoterStages } from '../../utils/voterNavigation';
import type { Page } from '@playwright/test';
import type { RelayCaptureFixture } from '../../fixtures/shared/relayCapture.fixture';

/** The accessible name of the voter app's consent prompt (`common.privacy.dataCollection.title`, the title of DataConsentPopup's Alert). */
const CONSENT_PROMPT = /collecting usage data/i;

/** The accessible name of the consent control's button that grants consent. */
const GRANTED_BUTTON = /agree to share my data/i;

/** localStorage key the app persists `userPreferences` under. */
const PREFS_KEY = 'appContext-userPreferences';

/** The English text of `privacy.analytics.gpc`, read from the message source rather than copied, so a copy edit cannot turn this spec into an assertion about a stale string. */
const GPC_TEXT: string = JSON.parse(
  fs.readFileSync(path.join(TESTS_DIR, '../../apps/frontend/messages/en/privacy.json'), 'utf8')
).privacy.analytics.gpc;

/** The message of the control's capture assertion, which fails when the relay forwards nothing. */
const RELAY_INACTIVE_MESSAGE = `no request to the relay path ${RELAY_PATH} was captured without the signal: the server must run with ANALYTICS_PROVIDER=log, as .env.example sets it`;

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

/**
 * Wait until the root layout's post-navigation focus reset has landed on the page's focus target (`[data-focus-on-nav] ?? h1`, the selector `focusNavigationTarget` uses). The reset runs in the root layout's `afterNavigate`, so on a page opened by its URL it shows that the page has hydrated: the voter layout has mounted, which is when the consent prompt is queued, and the flush points are registered.
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

/** Assert that no consent prompt and no control that grants consent is on the page. */
async function expectNoConsentPrompt(page: Page): Promise<void> {
  await expect(page.getByRole('dialog', { name: CONSENT_PROMPT }), 'a consent prompt is shown').toHaveCount(0);
  await expect(
    page.getByRole('button', { name: GRANTED_BUTTON }),
    'a control that grants consent is shown'
  ).toHaveCount(0);
}

/** A short list of the captured batches, for failure messages. */
function describeBatches(capture: RelayCaptureFixture): string {
  return capture
    .getBatches()
    .map((batch) => `${batch.routeId}: ${batch.events.map((event) => event.name).join(', ')}`)
    .join('; ');
}

/** The member names of the stored user preferences' `data`, or none when nothing is stored. */
async function readStoredPreferenceMembers(page: Page): Promise<Array<string>> {
  return page.evaluate((key) => {
    const raw = window.localStorage.getItem(key);
    if (!raw) return [];
    const envelope = JSON.parse(raw) as { data?: Record<string, unknown> | null };
    return Object.keys(envelope.data ?? {});
  }, PREFS_KEY);
}

test.describe('under Global Privacy Control', () => {
  test.describe.configure({ mode: 'serial' });
  test.use({ extraHTTPHeaders: { 'Sec-GPC': '1' } });

  test.beforeEach(async ({ context }) => {
    // The property the browser sets with the header; defined before any page script runs.
    await context.addInitScript(() => {
      Object.defineProperty(navigator, 'globalPrivacyControl', { configurable: true, get: () => true });
    });
  });

  test('no prompt and no send under the signal', async ({ context, page }) => {
    const capture = createRelayCapture(context);

    // The front page, hydrated.
    await openVoterHome(page);
    await waitForNavigationFocusReset(page);
    await expectNoConsentPrompt(page);
    await flushTrackingBuffer(page);

    // The first question, answered; the answer leads to a second page, the results.
    await startToFirstQuestion(page);
    await expectNoConsentPrompt(page);
    await flushTrackingBuffer(page);
    await answerAndAdvanceToResults(page, 'max');
    await expectNoConsentPrompt(page);
    await flushTrackingBuffer(page);

    // The privacy page, hydrated.
    await page.goto('/en/privacy');
    await expect(page.getByTestId(testIds.voter.privacy.content)).toBeVisible({ timeout: TIMEOUTS.slowPage });
    await waitForNavigationFocusReset(page);
    await expectNoConsentPrompt(page);
    await flushTrackingBuffer(page);
    await settleNetworkIdle(page, { timeoutMs: TIMEOUTS.slowPage });

    expect(
      capture.getBatches(),
      `requests were sent to the relay under the signal: ${describeBatches(capture)}`
    ).toHaveLength(0);
    await expectOnlyAllowedDeviceState(context, page);
    expect(
      await readStoredPreferenceMembers(page),
      'the stored user preferences record a consent choice under the signal'
    ).not.toContain('dataCollection');
  });

  test('the privacy page says so', async ({ page }) => {
    await page.goto('/en/privacy');
    await expect(page.getByTestId(testIds.voter.privacy.content)).toBeVisible({ timeout: TIMEOUTS.slowPage });
    await waitForNavigationFocusReset(page);

    await expect(
      page.getByTestId(testIds.voter.privacy.content),
      'the privacy page states the Global Privacy Control rule'
    ).toContainText(GPC_TEXT, { timeout: TIMEOUTS.slowPage });
    await expect(
      page.getByRole('heading', { name: CONSENT_PROMPT }),
      'the privacy page offers the consent control under the signal'
    ).toHaveCount(0);
    await expectNoConsentPrompt(page);
  });
});

test.describe('without the signal (control)', () => {
  test('the same first steps show the prompt and send to the relay', async ({ context, page }) => {
    const capture = createRelayCapture(context);

    await openVoterHome(page);
    await expect(
      page.getByRole('dialog', { name: CONSENT_PROMPT }).getByRole('button', { name: GRANTED_BUTTON }),
      'the consent prompt did not open without the signal: the server must run in the default mode, with ANALYTICS_CONSENT_MODE unset or gated'
    ).toBeVisible({ timeout: TIMEOUTS.slowPage });

    // Each poll flushes again: a flush made before the page has hydrated reaches no listener.
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
});
