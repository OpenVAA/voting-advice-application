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
 * ## The red-control switch (red controls only)
 *
 * `PLAYWRIGHT_RED_CONTROL_SKIP_MODE_CHECK=1` exists only to run this spec as a red control against a server in the default mode, so that the property assertions themselves can be seen failing instead of the mode precondition. It does three things and nothing else: it skips the one assertion of the mode precondition (the privacy-text check at the top of the first test; the navigation to the privacy page still runs); before the first test's walk it closes the consent prompt without a choice when the test process is not in consent-free mode (`closeConsentPromptInRedControl`), because in the default mode the prompt covers the intro's Continue button and the walk would stop there before the send assertion; and it runs the tests in the default describe mode instead of in series, so that a failing test does not keep the later ones from running. Every property assertion, including the send assertion that ends the first test (its own message, `SEND_MESSAGE`) and the privacy-text assertion of "the privacy page describes the mode", runs unchanged. It is off unless the variable is exactly `1`; a green run never needs it, and a failing run that sets it is evidence of failing properties only.
 *
 * ## How events are observed
 *
 * `createRelayCapture` listens on the browser context before the first navigation of each test and records every batch the browser sends to the relay path. Each test flushes on the same document by reaching the hidden flush point (`flushTrackingBuffer`) until the batch it needs is captured. Every send this spec reads is made while the document is alive.
 *
 * ## Identifiers in this mode
 *
 * In consent-free mode the browser attaches the visit id only to events that reveal no answer and no leaning; the relay gives each sensitive event a fresh random id of its own, which the browser never sees. So a captured `answer` has no `id` member, a `pageview` never has one, and a non-sensitive event of the same document, such as `menu_open`, carries the visit id, a UUIDv7 (visit-id mode `memory`, the default).
 *
 * Rigidity contract (project E2E Hard Rule): every assertion is hard — no soft assertion, no try/catch around expect(), no .catch fallback.
 */

import { expect, test } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { RELAY_PATH } from '../../../../apps/frontend/src/lib/analytics/constants';
import { isUuidV7 } from '../../../../apps/frontend/src/lib/analytics/uuidv7';
import { expectOnlyAllowedDeviceState } from '../../fixtures/shared/deviceStores.fixture';
import { createNavMenu } from '../../fixtures/shared/navMenu.fixture';
import { createRelayCapture } from '../../fixtures/shared/relayCapture.fixture';
import { answerAndAdvanceToResults } from '../../fixtures/voter/voter-journey.fixture';
import { createVoterHomePage } from '../../fixtures/voter/voterHomePage.fixture';
import { TIMEOUTS } from '../../helpers';
import { testIds } from '../../utils/testIds';
import { TESTS_DIR } from '../../utils/testsDir';
import { walkVoterStages } from '../../utils/voterNavigation';
import type { BrowserContext, Page } from '@playwright/test';
import type { CapturedRelayEvent, RelayCaptureFixture } from '../../fixtures/shared/relayCapture.fixture';

/** The English text of `privacy.analytics.content.free`, read from the message source rather than copied, so a copy edit cannot turn this spec into an assertion about a stale string. */
const FREE_MODE_TEXT: string = JSON.parse(
  fs.readFileSync(path.join(TESTS_DIR, '../../apps/frontend/messages/en/privacy.json'), 'utf8')
).privacy.analytics.content.free;

/** The message of the mode precondition, which fails when the server is not in consent-free mode. */
const MODE_MESSAGE =
  'the server is not in consent-free mode: this spec needs the server started with ANALYTICS_CONSENT_MODE=free and ANALYTICS_PROVIDER=log (the privacy page does not describe consent-free mode)';

/** The message of the first test's send assertion, which fails when an answer made with no consent choice is not sent. It differs from the mode precondition's message, so a failure says which of the two failed. */
const SEND_MESSAGE = `the answer was not sent without a prompt: no answer event reached the relay path ${RELAY_PATH} while no consent choice was made (consent-free mode sends it without asking; this spec needs ANALYTICS_CONSENT_MODE=free and ANALYTICS_PROVIDER=log)`;

/** True only in a red-control run made with `PLAYWRIGHT_RED_CONTROL_SKIP_MODE_CHECK=1` (see the file docblock): the mode precondition is skipped, a consent prompt is closed without a choice before the first test's walk, and the tests do not run in series. */
const RED_CONTROL_SKIP_MODE_CHECK = process.env.PLAYWRIGHT_RED_CONTROL_SKIP_MODE_CHECK === '1';

/** Whether the test process was started in consent-free mode; read only by the red-control switch, to know whether a consent prompt is to be closed. */
const CONSENT_FREE_MODE = process.env.ANALYTICS_CONSENT_MODE?.trim().toLowerCase() === 'free';

/** localStorage key the app persists `userPreferences` under (the `localStorageState` call in appContext.svelte.ts). */
const PREFS_KEY = 'appContext-userPreferences';

/** The accessible name of the voter app's consent prompt (`common.privacy.dataCollection.title`, the title of DataConsentPopup's Alert), which is also the heading of the privacy page's consent control. */
const CONSENT_PROMPT = /collecting usage data/i;

/** The accessible name of the consent control's button that grants consent. */
const GRANTED_BUTTON = /agree to share my data/i;

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

/**
 * Wait until the root layout's post-navigation focus reset has landed on the page's focus target (`[data-focus-on-nav] ?? h1`, the selector `focusNavigationTarget` uses). The reset runs in the root layout's `afterNavigate`, so on a page opened by its URL it shows that the page has hydrated: the voter layout has mounted, which is when a consent prompt would be queued, and the flush points are registered.
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
 * The mode precondition on the privacy page that is open: it must show the consent-free description. In a red-control run (`PLAYWRIGHT_RED_CONTROL_SKIP_MODE_CHECK=1`) this one assertion is skipped, and the skip is recorded as an annotation of the test.
 */
async function expectConsentFreeMode(page: Page): Promise<void> {
  if (RED_CONTROL_SKIP_MODE_CHECK) {
    test.info().annotations.push({
      type: 'red-control',
      description: 'PLAYWRIGHT_RED_CONTROL_SKIP_MODE_CHECK=1: the mode precondition was skipped'
    });
    return;
  }
  await expect(page.getByTestId(testIds.voter.privacy.content), MODE_MESSAGE).toContainText(FREE_MODE_TEXT, {
    timeout: TIMEOUTS.slowPage
  });
}

/**
 * In a red-control run only, close the voter app's consent prompt WITHOUT making a choice, and assert that no choice is stored; with the switch off it does nothing. The mechanics are those of `dismissConsentPrompt` in `voter-prefs-tracking.spec.ts`: in the default mode the prompt opens on its own, a non-modal alert fixed to the bottom of the viewport that covers the intro's Continue button, and its close button closes it and records nothing; it is queued once, when the voter layout mounts, so it does not open again during the walk. In consent-free mode no prompt is shown, so after the page has hydrated it must be absent. So a red-control walk reaches the send assertion, and in the default mode that assertion sees an answer made with no consent choice.
 * @param page - The voter front page opened by its URL and hydrated, with no consent choice stored.
 */
async function closeConsentPromptInRedControl(page: Page): Promise<void> {
  if (!RED_CONTROL_SKIP_MODE_CHECK) return;
  const prompt = page.getByRole('dialog', { name: CONSENT_PROMPT });
  if (CONSENT_FREE_MODE) {
    await expect(prompt, 'red control: a consent prompt is shown although ANALYTICS_CONSENT_MODE=free').toHaveCount(0);
  } else {
    await expect(prompt, 'red control: the consent prompt did not open in the default mode').toBeVisible({
      timeout: TIMEOUTS.slowPage
    });
    await prompt.getByRole('button', { name: /^close$/i }).click();
    await expect(prompt).toBeHidden({ timeout: TIMEOUTS.slowPage });
  }
  const consent = await page.evaluate((key) => {
    const raw = window.localStorage.getItem(key);
    if (!raw) return undefined;
    const envelope = JSON.parse(raw) as { data?: { dataCollection?: { consent?: string } } };
    return envelope.data?.dataCollection?.consent;
  }, PREFS_KEY);
  expect([undefined, 'indetermined'], `red control: a consent choice is stored: ${String(consent)}`).toContain(consent);
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
  return `${event.name} on ${event.routeId}${'id' in event ? ` with id ${String(event.id)}` : ''}`;
}

/** The captured events named `name`. */
function eventsNamed(capture: RelayCaptureFixture, name: string): Array<CapturedRelayEvent> {
  return capture.getEvents().filter((event) => event.name === name);
}

/**
 * The walk every test after the first makes, on one document: the front page, the menu opened and closed (a non-sensitive event), the first question answered (a sensitive event), and the results; then a flush until both events are captured.
 */
async function walkAndAnswer(page: Page, capture: RelayCaptureFixture): Promise<void> {
  await openVoterHome(page);
  await expectNoConsentPrompt(page);
  await openAndCloseMenu(page);
  await startToFirstQuestion(page);
  await expectNoConsentPrompt(page);
  await answerAndAdvanceToResults(page, 'max');
  await expectNoConsentPrompt(page);
  await flushUntil(
    page,
    () => eventsNamed(capture, 'answer').length > 0 && eventsNamed(capture, 'menu_open').length > 0,
    `the answer and menu_open events were not both sent without a prompt; captured: ${capture
      .getEvents()
      .map(describeEvent)
      .join(', ')}`
  );
}

test.describe('voter-tracking-consent-free', () => {
  // In series, so that nothing runs after the mode precondition fails; a red-control run skips that precondition, so its tests run independently.
  test.describe.configure({ mode: RED_CONTROL_SKIP_MODE_CHECK ? 'default' : 'serial' });

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

    // Then the voter app, with no interaction with any dialog (outside a red-control run): an answer is sent without a prompt.
    await openVoterHome(page);
    await closeConsentPromptInRedControl(page);
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

    const answersWithId = eventsNamed(capture, 'answer')
      .filter((event) => 'id' in event)
      .map(describeEvent);
    expect(answersWithId, `answer events carried an id from the browser: ${answersWithId.join(', ')}`).toStrictEqual(
      []
    );

    const pageviewsWithId = events.filter((event) => event.name === 'pageview' && 'id' in event).map(describeEvent);
    expect(pageviewsWithId, `pageviews carried an id: ${pageviewsWithId.join(', ')}`).toStrictEqual([]);

    // A non-sensitive event of the same document carries the visit id, so the absence on the answer is the mode's and not an absence of every id.
    const menuOpenIds = eventsNamed(capture, 'menu_open').map((event) => event.id);
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
