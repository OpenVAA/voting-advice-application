/**
 * @file voter-tracking-consent-free.spec.ts.
 *
 * The voter app's usage events in consent-free mode: events are sent without a prompt, an event that carries an answer has no id from the browser, the privacy page describes the mode, and the device holds only what the application may keep there.
 *
 * ## The mode is a deployment setting
 *
 * The consent mode is read by the server from `ANALYTICS_CONSENT_MODE`, so one E2E run sees one mode. This spec therefore runs only in the opt-in project `analytics-consent-free`, as a single-project run with the dev server started under the prefix `PLAYWRIGHT_ANALYTICS_STANDALONE=1 ANALYTICS_PROVIDER=log ANALYTICS_CONSENT_MODE=free` (the command is in the opt-in list of `tests/playwright.config.ts`). No project of the default run collects it.
 *
 * ## Failing by name without the prefix
 *
 * The first test's first assertion is the mode precondition, made on the privacy page before any click: the page must show the consent-free description. The page chooses that text from the same projection the tracking service reads. In the default mode it shows the consent-gated text instead, and the consent prompt would block the first click of a walk; with no provider it shows no analytics section at all. In both cases this assertion fails with a message that names the variables, not as a timeout of a blocked action. The tests run in series, so the later ones do not run after it fails.
 *
 * ## How events are observed
 *
 * `createRelayCapture` listens on the browser context before the first navigation of each test and records every batch the browser sends to the relay path. Each test flushes on the same document by reaching the hidden flush point (`flushTrackingBuffer`) until the batch it needs is captured. Every send this spec reads is made while the document is alive.
 *
 * ## Identifiers in this mode
 *
 * In consent-free mode the browser attaches the visit id only to events that reveal no answer and no leaning; the relay gives each sensitive event a fresh random id of its own, which the browser never sees. So no captured sensitive event (`isSensitiveEvent`: an `answer`, or the `results_ranked_entity` of an opened entity) has a visit-id member, a `pageview` never has one, and a non-sensitive event of the same document, such as `menu_open`, carries the visit id, a UUIDv7 (visit-id mode `memory`, the default).
 *
 * Rigidity contract (project E2E Hard Rule): every assertion is hard — no soft assertion, no try/catch around expect(), no .catch fallback.
 */

import { expect, test } from '@playwright/test';
import { RELAY_PATH } from '../../../../apps/frontend/src/lib/analytics/constants';
import { isSensitiveEvent } from '../../../../apps/frontend/src/lib/analytics/events.schema';
import { isUuidV7 } from '../../../../apps/frontend/src/lib/analytics/uuidv7';
import { expectOnlyAllowedDeviceState } from '../../fixtures/shared/deviceStores.fixture';
import { createNavMenu } from '../../fixtures/shared/navMenu.fixture';
import {
  CONSENT_PROMPT,
  createRelayCapture,
  flushUntil,
  GRANTED_BUTTON,
  hasVisitId,
  visitIdOf
} from '../../fixtures/shared/relayCapture.fixture';
import { createResultsPage } from '../../fixtures/voter/resultsPage.fixture';
import { answerAndAdvanceToResults } from '../../fixtures/voter/voter-journey.fixture';
import { createVoterHomePage } from '../../fixtures/voter/voterHomePage.fixture';
import { TIMEOUTS, waitForNavigationFocusReset } from '../../helpers';
import { messageOf } from '../../utils/messages';
import { testIds } from '../../utils/testIds';
import { walkVoterStages } from '../../utils/voterNavigation';
import type { BrowserContext, Page } from '@playwright/test';
import type { CapturedRelayEvent, RelayCaptureFixture } from '../../fixtures/shared/relayCapture.fixture';

/** The English text of `privacy.analytics.content.free`, read from the message source rather than copied, so a copy edit cannot turn this spec into an assertion about a stale string. */
const FREE_MODE_TEXT = messageOf('privacy', 'analytics.content.free');

/** The message of the mode precondition, which fails when the server is not in consent-free mode. */
const MODE_MESSAGE =
  'the server is not in consent-free mode: this spec needs the server started with ANALYTICS_CONSENT_MODE=free and ANALYTICS_PROVIDER=log (the privacy page does not describe consent-free mode)';

/** The message of the first test's send assertion, which fails when an answer made with no consent choice is not sent. It differs from the mode precondition's message, so a failure says which of the two failed. */
const SEND_MESSAGE = `the answer was not sent without a prompt: no answer event reached the relay path ${RELAY_PATH} while no consent choice was made (consent-free mode sends it without asking; this spec needs ANALYTICS_CONSENT_MODE=free and ANALYTICS_PROVIDER=log)`;

/** The accessible name of the consent control's button that denies consent. */
const DENIED_BUTTON = /want to share my data/i;

/** The window member the init script of `watchForConsentPrompt` sets when a consent prompt appears in the document. */
const PROMPT_SEEN_MEMBER = '__openvaaConsentPromptSeen';

/**
 * Record, for every document of `context`, whether a dialog or alert holding the consent control's granting button ever appears in it. The init script runs before any page script and observes the document from its first node, so a prompt that opens and closes between two assertions is still recorded.
 */
async function watchForConsentPrompt(context: BrowserContext): Promise<void> {
  await context.addInitScript(
    ({ member, pattern }) => {
      const granted = new RegExp(pattern, 'i');
      const record = window as unknown as Record<string, boolean>;
      record[member] = false;
      const scan = (): void => {
        for (const button of Array.from(document.querySelectorAll('button'))) {
          if (granted.test(button.textContent ?? '') && button.closest('[role="dialog"], [role="alert"], dialog')) {
            record[member] = true;
          }
        }
      };
      new MutationObserver(scan).observe(document, { childList: true, subtree: true });
    },
    { member: PROMPT_SEEN_MEMBER, pattern: GRANTED_BUTTON.source }
  );
}

/** Whether a consent prompt has appeared in the current document since it was created. */
async function consentPromptSeen(page: Page): Promise<boolean> {
  return page.evaluate((member) => (window as unknown as Record<string, boolean>)[member] === true, PROMPT_SEEN_MEMBER);
}

/** The mode precondition on the privacy page that is open: it must show the consent-free description. */
async function expectConsentFreeMode(page: Page): Promise<void> {
  await expect(page.getByTestId(testIds.voter.privacy.content), MODE_MESSAGE).toContainText(FREE_MODE_TEXT, {
    timeout: TIMEOUTS.slowPage
  });
}

/** Open the voter app's front page and wait until it has hydrated. */
async function openVoterHome(page: Page): Promise<void> {
  await page.goto('/en/');
  await expect(page.getByTestId(testIds.voter.home.page)).toBeVisible({ timeout: TIMEOUTS.slowPage });
  await waitForNavigationFocusReset(page);
}

/** Open the voter app's privacy page by its URL and wait until its content shows. */
async function openPrivacyPage(page: Page): Promise<void> {
  await page.goto('/en/privacy');
  await expect(page.getByTestId(testIds.voter.privacy.content)).toBeVisible({ timeout: TIMEOUTS.slowPage });
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

/** Assert that no consent prompt and no control that grants consent is on the page now. */
async function expectNoConsentPrompt(page: Page): Promise<void> {
  await expect(page.getByRole('dialog', { name: CONSENT_PROMPT }), 'a consent prompt is shown').toHaveCount(0);
  await expect(
    page.getByRole('button', { name: GRANTED_BUTTON }),
    'a control that grants consent is shown'
  ).toHaveCount(0);
}

/** A short description of a captured event, for failure messages. */
function describeEvent(event: CapturedRelayEvent): string {
  return `${event.name} on ${event.routeId}${hasVisitId(event) ? ` with visit id ${String(visitIdOf(event))}` : ''}`;
}

/** The captured events named `name`. */
function eventsNamed(capture: RelayCaptureFixture, name: string): Array<CapturedRelayEvent> {
  return capture.getEvents().filter((event) => event.name === name);
}

/**
 * From the results list, open the first entity's details, which sends a `results_ranked_entity` event (a sensitive event that carries the entity's match score).
 *
 * The click goes through the card's title: on a card with no subcards the card's link wraps the card instead of sitting inside it, and the title is inside both.
 */
async function openFirstRankedEntity(page: Page): Promise<void> {
  const resultsPage = createResultsPage(page);
  const card = await resultsPage.getEntityCard(() => 0);
  await card.getByTestId(testIds.voter.results.cardTitle).first().click();
  await expect(page.getByTestId(testIds.voter.results.entityDetails)).toBeVisible({ timeout: TIMEOUTS.slowPage });
}

/**
 * The walk every test after the first makes, on one document: the front page, the menu opened and closed (a non-sensitive event), the first question answered and one entity of the results opened (two sensitive events); then a flush until all three events are captured.
 */
async function walkAndAnswer(page: Page, capture: RelayCaptureFixture): Promise<void> {
  await openVoterHome(page);
  await expectNoConsentPrompt(page);
  await openAndCloseMenu(page);
  await startToFirstQuestion(page);
  await expectNoConsentPrompt(page);
  await answerAndAdvanceToResults(page, 'max');
  await expectNoConsentPrompt(page);
  await openFirstRankedEntity(page);
  await flushUntil(
    page,
    () =>
      eventsNamed(capture, 'answer').length > 0 &&
      eventsNamed(capture, 'results_ranked_entity').length > 0 &&
      eventsNamed(capture, 'menu_open').length > 0,
    `the answer, results_ranked_entity and menu_open events were not all sent without a prompt; captured: ${capture
      .getEvents()
      .map(describeEvent)
      .join(', ')}`
  );
}

test.describe('voter-tracking-consent-free', () => {
  // In series, so that nothing runs after the mode precondition fails.
  test.describe.configure({ mode: 'serial' });

  let capture: RelayCaptureFixture;

  test.beforeEach(async ({ context }) => {
    // Attached before the first navigation of each test, so that no batch and no prompt of the test is missed.
    capture = createRelayCapture(context);
    await watchForConsentPrompt(context);
  });

  test('the server is in consent-free mode', async ({ page }) => {
    // The mode precondition, before any click a consent prompt could cover.
    await page.goto('/en/privacy');
    await expectConsentFreeMode(page);

    // Then the voter app, with no interaction with any dialog: an answer is sent without a prompt.
    await openVoterHome(page);
    await startToFirstQuestion(page);
    await answerAndAdvanceToResults(page, 'max');
    await flushUntil(page, () => eventsNamed(capture, 'answer').length > 0, SEND_MESSAGE);
  });

  test('no prompt is shown', async ({ page }) => {
    await walkAndAnswer(page, capture);
    expect(await consentPromptSeen(page), 'a consent prompt appeared during the walk').toBe(false);
  });

  test('an answer cannot be linked', async ({ page }) => {
    await walkAndAnswer(page, capture);
    const events = capture.getEvents();

    expect(eventsNamed(capture, 'answer').length, 'no answer event was captured').toBeGreaterThan(0);
    expect(
      eventsNamed(capture, 'results_ranked_entity').length,
      'no results_ranked_entity event was captured'
    ).toBeGreaterThan(0);
    const sensitiveWithId = events
      .filter((event) => isSensitiveEvent(event.name) && hasVisitId(event))
      .map(describeEvent);
    expect(
      sensitiveWithId,
      `sensitive events carried an id from the browser: ${sensitiveWithId.join(', ')}`
    ).toStrictEqual([]);

    const pageviewsWithId = events.filter((event) => event.name === 'pageview' && hasVisitId(event)).map(describeEvent);
    expect(pageviewsWithId, `pageviews carried an id: ${pageviewsWithId.join(', ')}`).toStrictEqual([]);

    // A non-sensitive event of the same document carries the visit id, so the absence on the sensitive events is the mode's and not an absence of every id.
    const menuOpenIds = eventsNamed(capture, 'menu_open').map(visitIdOf);
    expect(menuOpenIds.length, 'no menu_open event was captured').toBeGreaterThan(0);
    for (const id of menuOpenIds) {
      expect(
        isUuidV7(id),
        `a menu_open event of the same document does not carry a UUIDv7 visit id, got ${String(id)}; the server must run with visit-id mode memory, the default`
      ).toBe(true);
    }
  });

  test('the privacy page describes the mode', async ({ page }) => {
    await openPrivacyPage(page);
    await waitForNavigationFocusReset(page);

    await expect(
      page.getByTestId(testIds.voter.privacy.content),
      'the privacy page does not show the consent-free description'
    ).toContainText(FREE_MODE_TEXT, { timeout: TIMEOUTS.slowPage });
    await expect(
      page.getByRole('heading', { name: CONSENT_PROMPT }),
      'the privacy page offers the consent control in consent-free mode'
    ).toHaveCount(0);
    await expect(
      page.getByRole('button', { name: DENIED_BUTTON }),
      'a control that denies consent is shown in consent-free mode'
    ).toHaveCount(0);
    await expectNoConsentPrompt(page);
    expect(await consentPromptSeen(page), 'a consent prompt appeared on the privacy page').toBe(false);
  });

  test('the device holds only allow-listed state', async ({ context, page }) => {
    await walkAndAnswer(page, capture);
    await expectOnlyAllowedDeviceState(context, page);
  });
});
