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
import { RELAY_PATH } from '../../../../apps/frontend/src/lib/analytics/constants';
import { expectOnlyAllowedDeviceState } from '../../fixtures/shared/deviceStores.fixture';
import {
  CONSENT_PROMPT,
  createRelayCapture,
  flushTrackingBuffer,
  GRANTED_BUTTON,
  PREFS_KEY
} from '../../fixtures/shared/relayCapture.fixture';
import { answerAndAdvanceToResults } from '../../fixtures/voter/voter-journey.fixture';
import { createVoterHomePage } from '../../fixtures/voter/voterHomePage.fixture';
import { settleNetworkIdle, TIMEOUTS, waitForNavigationFocusReset } from '../../helpers';
import { messageOf } from '../../utils/messages';
import { testIds } from '../../utils/testIds';
import { walkVoterStages } from '../../utils/voterNavigation';
import type { Page } from '@playwright/test';
import type { RelayCaptureFixture } from '../../fixtures/shared/relayCapture.fixture';

/** The English text of `privacy.analytics.gpc`, read from the message source rather than copied, so a copy edit cannot turn this spec into an assertion about a stale string. */
const GPC_TEXT = messageOf('privacy', 'analytics.gpc');

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
