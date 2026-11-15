/**
 * @file voter-pageview-only.spec.ts.
 *
 * With `analytics.trackEvents` off the voter app sends the pageview and nothing else: every captured event is a `pageview` without an id, and no consent prompt is shown, because there is nothing to consent to.
 *
 * ## Dataset
 *
 * The base dataset, read only. Its stored settings hold no `analytics` member, so `trackEvents` takes the shipped default, off. The spec writes nothing to the database. It runs in its own leaf project on `data-setup-base`, which the first perm setup waits for, so no perm setup replaces the settings row while it runs.
 *
 * ## Arming
 *
 * The relay forwards only when the server runs with an analytics provider (`ANALYTICS_PROVIDER=log`, as `.env.example` sets it); with provider `none` nothing is sent, and the first wait fails with a message that says so.
 *
 * ## Flushing
 *
 * A batch is sent at the next flush point: a client navigation, the page becoming hidden, or the page being left. `flushTrackingBuffer` reaches the hidden flush point on the same document, and each step flushes until the step's pageview is captured, which also covers a first flush made before the page has hydrated.
 *
 * Rigidity contract (project E2E Hard Rule): every assertion is hard — no soft assertion, no try/catch around expect(), no .catch fallback.
 */

import { expect, test } from '@playwright/test';
import { RELAY_PATH } from '../../../../apps/frontend/src/lib/analytics/constants';
import { ROUTE } from '../../../../apps/frontend/src/lib/routes/route';
import { createRelayCapture } from '../../fixtures/shared/relayCapture.fixture';
import { TIMEOUTS } from '../../helpers';
import { testIds } from '../../utils/testIds';
import { navigateToFirstQuestion } from '../../utils/voterNavigation';
import type { Page } from '@playwright/test';
import type { CapturedRelayEvent, RelayCaptureFixture } from '../../fixtures/shared/relayCapture.fixture';

/** The accessible name of the voter app's consent prompt (`common.privacy.dataCollection.title`, the title of DataConsentPopup's Alert). */
const CONSENT_PROMPT = /collecting usage data/i;

/** The accessible name of the consent control's button that grants consent. */
const GRANTED_BUTTON = /agree to share my data/i;

/** The message of the first wait and the first assertion, which fail when the relay forwards nothing. */
const RELAY_INACTIVE_MESSAGE = `no pageview reached the relay path ${RELAY_PATH}: the server must run with ANALYTICS_PROVIDER=log, as .env.example sets it`;

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
 * Flush until `arrived` holds. A flush made before the page has hydrated reaches no listener, and a batch is captured a moment after it is sent, so this flushes again on each poll; a flush with nothing to send sends nothing, so the repeats add no batch.
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

/** The number of pageviews captured so far. */
function pageviewCount(capture: RelayCaptureFixture): number {
  return capture.getEvents().filter((event) => event.name === 'pageview').length;
}

/** A short description of a captured event, for failure messages. */
function describeEvent(event: CapturedRelayEvent): string {
  return `${event.name} on ${event.routeId}${event.id === undefined ? '' : ` with id ${event.id}`}`;
}

/** Assert that no consent prompt and no control that grants consent is on the page. */
async function expectNoConsentPrompt(page: Page): Promise<void> {
  await expect(page.getByRole('dialog', { name: CONSENT_PROMPT }), 'a consent prompt is shown').toHaveCount(0);
  await expect(
    page.getByRole('button', { name: GRANTED_BUTTON }),
    'a control that grants consent is shown'
  ).toHaveCount(0);
}

/**
 * Take an action that must change the URL, and wait until it has.
 * @param page - The page whose URL must change.
 * @param action - The action, for example a click.
 */
async function navigateBy(page: Page, action: () => Promise<void>): Promise<void> {
  const before = page.url();
  await action();
  await page.waitForURL((url) => url.toString() !== before, { timeout: TIMEOUTS.slowPage });
}

test.describe('with trackEvents off', () => {
  test('only pageviews without an id are sent, and no consent prompt appears', async ({ context, page }) => {
    const capture = createRelayCapture(context);

    // The front page and the walk to the first question; the walk's client navigations send the earlier pages' pageviews, and the flush sends the question's.
    await navigateToFirstQuestion(page);
    await expectNoConsentPrompt(page);
    await flushUntil(
      page,
      () => capture.getEvents().some((event) => event.name === 'pageview' && event.routeId === ROUTE.Question),
      RELAY_INACTIVE_MESSAGE
    );

    // Answer the question; a single-choice answer moves on to the next page by itself.
    let seen = pageviewCount(capture);
    await navigateBy(page, () => page.getByTestId(testIds.voter.questions.answerOption).last().click());
    await expectNoConsentPrompt(page);
    await flushUntil(page, () => pageviewCount(capture) > seen, 'the page after the answer sent no pageview');

    // One page more, by skipping its question.
    seen = pageviewCount(capture);
    await navigateBy(page, () => page.getByTestId(testIds.voter.questions.nextButton).click());
    await expectNoConsentPrompt(page);
    await flushUntil(page, () => pageviewCount(capture) > seen, 'the page after the skip sent no pageview');

    const events = capture.getEvents();
    expect(events.length, RELAY_INACTIVE_MESSAGE).toBeGreaterThanOrEqual(2);
    const notPageviews = events.filter((event) => event.name !== 'pageview').map(describeEvent);
    expect(notPageviews, `events other than the pageview were sent: ${notPageviews.join(', ')}`).toStrictEqual([]);
    const withId = events.filter((event) => event.id !== undefined).map(describeEvent);
    expect(withId, `events with an id were sent: ${withId.join(', ')}`).toStrictEqual([]);
  });
});
