/**
 * Voter journey fixture. The answering function is robust: the answer mode is 'min' or 'max' (first or last option, or min/max in numbers).
 *
 * The walk diverges between two exposed pages AT the /questions intro page — `locatedVoterPage` STOPS at the intro page (DOES NOT answer questions; DOES NOT proceed to /results), while `answeredVoterPage` continues to answer + advance to /results.
 *
 * This is the sole voter-walk fixture.
 *
 * What this fixture exposes:
 *   - `answerMode: 'min' | 'max'` — which extreme to pick on each
 *     opinion question. `'min'` → first option / min value /
 *     `false`-boolean; `'max'` → last option / max value /
 *     `true`-boolean.
 *   - `answerCount?: number` — optional cap on total answered questions (partial-answer scenarios).
 *   - `answeredVoterPage: Page` — page navigated through the new base
 *     dataset's full intro flow (Home → Intro → election-select →
 *     constituency-select → questions-intro → category-intros +
 *     questions → results).
 *   - `locatedVoterPage: Page` — page navigated through Home → Intro →
 *     election-select → constituency-select and PARKED ON the /questions
 *     intro page. Located (electionId + constituencyId resolved in voter context) but NOT answered. Consumed by a11y-smoke's `questions` route scan.
 *
 * This fixture is wired against the BUILT_IN `e2e/base` dataset (multi-election + multi-constituency hierarchy).
 *
 * The voter-journey spec uses the raw `page` for the pre-results walkthrough (intro-flow steps) so it can assert at intermediate checkpoints; `answeredVoterPage` is intended for tests that just need a results-landing fixture and don't care about the intermediate steps.
 *
 * Implementation note: the two-fixture split was chosen over an option-fixture `stopBeforeAnswering?: boolean` — it keeps each fixture's invariant unambiguous at the call site and mirrors the existing `answeredVoterPage` declaration shape. The shared traversal code lives in `walkUntilQuestionsIntro` (Home → constituencies → /questions intro page); `answeredVoterPage` then invokes `answerAndAdvanceToResults` on top.
 */

import { expect, test as base } from '@playwright/test';
import { FIRST_QUESTION_ID } from '../../../../apps/frontend/src/lib/routes/route';
import { TIMEOUTS } from '../../helpers';
import { buildRoute } from '../../utils/buildRoute';
import { selectSmallestValidMultiChoice } from '../../utils/multiChoice';
import { testIds } from '../../utils/testIds';
import { followCategoryStart, resolveVoterStage, STAGE_BUDGET, walkVoterStages } from '../../utils/voterNavigation';
import type { Page } from '@playwright/test';

export type AnswerMode = 'min' | 'max';

/**
 * Settle a navigation the answer walk REQUIRES to have happened, failing LOUDLY and AT THE FAULT SITE when it did not.
 *
 * Every advance in `answerAndAdvanceToResults`'s loop is a URL change: a question route, a category-intro route, or `/results`. So a missing URL change is a fault, never a reason to retry. A retry would re-answer the same question: multi-choice CHECKBOXES toggle, so the answer set that reaches `/results`, and the visual baseline captured from it, would change silently, and an `answerCount`-capped walk would under-answer. It would also move the failure away from the navigation that stalled.
 *
 * The budget is the walk's `STAGE_BUDGET`, not a navigation-sized window, because the last answer's navigation lands on `/results`: SvelteKit changes the URL only after the results loads resolve, and that render is the heaviest in the walk. It stays below the test ceiling, so a stalled navigation still fails here with this message.
 *
 * @param page - the page whose URL must change.
 * @param urlBefore - the URL captured at the top of the iteration.
 * @param action - human-readable description of the action that should have
 *   navigated, interpolated into the failure message.
 */
async function requireNavigation(page: Page, urlBefore: string, action: string): Promise<void> {
  try {
    await page.waitForURL((url) => url.toString() !== urlBefore, { timeout: STAGE_BUDGET });
  } catch {
    throw new Error(
      `voter-journey: the answer walk did not advance after ${action}. ` +
        `The URL is still ${page.url()} ${STAGE_BUDGET} ms later. ` +
        'The walk cannot progress without a URL change, so this fails HERE instead of retrying: ' +
        'a retry re-answers the same question, and multi-choice checkboxes TOGGLE, which silently ' +
        'rewrites the answer set the visual baseline is captured from. ' +
        'A known cause is a dev-server asset request that never receives a response.'
    );
  }
}

type VoterJourneyFixtureOptions = {
  /** Which extreme to pick on each opinion question. Default: 'max'. */
  answerMode: AnswerMode;
  /** Optional: cap total answers (for partial-answer scenarios). Default: undefined (answer all). */
  answerCount?: number;
};

type VoterJourneyFixtures = VoterJourneyFixtureOptions & {
  /** A page on /results with all reachable opinion questions answered per answerMode. */
  answeredVoterPage: Page;
  /**
   * A page parked ON the /questions intro page (located but NOT answered).
   * Walks Home → Intro → Elections → Constituencies → /questions intro and STOPS. Consumed by a11y-smoke for the questions-route scan.
   */
  locatedVoterPage: Page;
};

/**
 * Shared traversal: walk Home → Intro → Elections → Constituencies and land ON the /questions intro page. Used by BOTH `answeredVoterPage` (which continues to answer + advance to /results) AND `locatedVoterPage` (which stops here).
 *
 * Post-condition: page has reached the /questions stage; the `voter-questions-start` button is visible AND has NOT been clicked WHEN `questions.questionsIntro.show === true` (the `e2e/base` posture). When a seed sets `questionsIntro.show === false` (the minimal perm seeds), the intro page auto-redirects past itself and the post-condition is instead the bypassed landing (a category intro start `voter-questions-category-start`, or the first question's `question-choice`). Voter context has electionId + constituencyId resolved either way.
 */
async function walkUntilQuestionsIntro(page: Page): Promise<void> {
  // 0. Consent-popup guard. When data-collection consent is `indetermined` (the
  //    default for a fresh context) the voter layout auto-opens the DataConsentPopup — a modal `Alert` (role=dialog "Collecting Usage Data").
  //    It mounts a beat after navigation and, depending on timing, can overlay the bottom-anchored "Continue" button on the elections/constituencies pages (full-width at mobile; intermittently at desktop under full-suite load), intercepting the click and stalling the walk at /elections. `addLocatorHandler` grants consent through the real in-app control the moment the popup obstructs an actionability check, then Playwright retries the original action — so the walk proceeds deterministically. It fires ONLY when the popup is present (no-op otherwise), so it is safe for every walk consumer.
  const consentGrant = page.getByRole('dialog').getByRole('button', { name: /agree to share my data/i });
  await page.addLocatorHandler(consentGrant, async () => {
    await consentGrant.click();
  });

  // 1. Home page, then the stage walk. Each optional page (intro, elections, constituencies) is acted on when it renders, whenever that is; the walk stops on the /questions stage. BYPASS-TOLERANT: when a seed sets `questionsIntro.show=false`, the intro page redirects past itself on mount, and the walk stops on the category intro or the first question instead.
  await page.goto(buildRoute({ route: 'Home', locale: 'en' }));
  await walkVoterStages(page, ['questions-intro', 'category-intro', 'question']);
}

/**
 * Continuation of the walk from the /questions intro page through the answer-loop to /results. Pre-condition: page is on the /questions intro page with `voter-questions-start` visible (i.e. `walkUntilQuestionsIntro` has run).
 *
 * Each opinion question is answered per the `answerMode`:
 *   - Likert (5/4/7): 'min' → first option; 'max' → last option.
 *   - singleChoiceCategorical: 'min' → first option; 'max' → last option.
 *   - Boolean: 'min' → 'No' (index 0); 'max' → 'Yes' (index 1).
 *   - Number (native range slider): 'min' → keyboard Home (exact min);
 *     'max' → keyboard End (exact max). Does not auto-advance — Next clicked
 *     explicitly.
 *   - MultipleChoiceCategorical (checkbox multi-select): clicks choices from index 0 upward until the app reports the selection VALID (constraint-agnostic, so both the 2..3 and the exact-1 seeded questions are answered correctly); does not auto-advance — Next clicked explicitly.
 *
 * All three answer-input families share the question-choice testid + name=questionChoices-{id} scoping contract EXCEPT the slider (which has no question-choice options — detected by a scoped choice count of 0). Both branches are inert against a seed that surfaces no number or multi-choice OPINION question.
 */
async function answerAndAdvanceToResults(page: Page, answerMode: AnswerMode, answerCount?: number): Promise<void> {
  // 5b. Leave the questions intro, if it is the page showing, for the first category intro or question.
  await walkVoterStages(page, ['category-intro', 'question']);

  // 6. Answer loop: each iteration looks for either a category-intro
  //    (continue) or a question (answer per mode). Terminates on /results.
  // A NUMBER-scale opinion question renders ONLY a native range slider (question-number-slider) and carries NO question-choice options, so the answer-surface wait below races the slider in beside the scoped choices.
  const numberSlider = page.getByTestId(testIds.voter.questions.numberSlider);
  const nextButton = page.getByTestId(testIds.voter.questions.nextButton);
  const heading = page.getByTestId(testIds.voter.questions.heading);
  const terminal = /\/results/;
  let answered = 0;
  // The heading text of the NUMBER-scale question the PREVIOUS iteration answered, or `undefined` when it answered something else. Read by the loop's answer-surface wait below; see the note there.
  let answeredSliderHeading: string | undefined;
  const cap = answerCount ?? Number.POSITIVE_INFINITY;
  const maxIterations = 50; // generous ceiling — base dataset has ≤9 reachable opinion questions
  for (let iter = 0; iter < maxIterations; iter++) {
    if (terminal.test(page.url())) break;
    const urlBefore = page.url();
    // Resolve the page that is showing: a category intro, or a question with a choice or a number slider. Both are matched on their route, so the outgoing page's content never counts.
    const stage = await resolveVoterStage(page, ['category-intro', 'question']);

    if (stage === 'category-intro') {
      // The start link's href resolves after hydration; the helper waits for it to point at one of this category's questions, then navigates to it.
      await followCategoryStart(page);
      await requireNavigation(page, urlBefore, 'following the category-intro start link');
      // Reaching here means the category-intro page RENDERED (we waited for its start link), so any question-page slider is long unmounted — the next iteration may safely race the slider again.
      answeredSliderHeading = undefined;
      continue;
    }

    // Question page — pick by answerMode.
    if (answered >= cap) {
      // Use Skip to advance past remaining questions when answerCount is capped.
      answeredSliderHeading = undefined;
      await nextButton.click();
      await requireNavigation(page, urlBefore, 'clicking Skip on a capped walk');
      continue;
    }
    // SETTLE-BEFORE-COUNT. On a Q→Q param-only nav SvelteKit REUSES questions/[questionId]/+page.svelte (the page derives `question` via `$derived` rather than remounting), so the OUTGOING question's `[data-testid=question-choice]` options stay mounted until the PREVIOUS click's deferred `goto` resolves and the incoming options swap in. A bare `answerOption.count()` therefore captures the OUTGOING question's option count, and `.nth(count-1)` points at a stale index that the INCOMING question (fewer options — e.g. Likert4 after Likert5) never has, so the click waits until the test times out.
    //
    // Anchor to the CURRENT question deterministically: each choice's `name` is `questionChoices-<questionId>` and the questionId is the last `/questions/` path segment. Scope the option locator to that questionId so the count + `.nth()` only ever see the INCOMING question's options. Mirrors the voter-journey spec's SETTLE-BEFORE-COUNT rationale (specs/voter/voter-journey.spec.ts) — a deterministic settle, NOT a View-Transition workaround (reduced-motion does not fix this and the Playwright option does not reach the app's matchMedia anyway).
    let questionId = new URL(page.url()).pathname.replace(/\/+$/, '').split('/').filter(Boolean).pop() ?? '';
    // The first-question alias (`/questions/__first__`) renders the first question under a placeholder id, so the choices carry the real id. No question precedes it, so nothing stale can be mounted: resolve its surface and read the real id off a rendered choice. A number question has no choice to read and keeps the alias, which the slider branch below handles.
    if (questionId === FIRST_QUESTION_ID) {
      const anyChoice = page.getByTestId(testIds.voter.questions.answerOption).first();
      await expect(anyChoice.or(numberSlider.first()).first()).toBeVisible({ timeout: STAGE_BUDGET });
      const name = await anyChoice.getAttribute('name', { timeout: TIMEOUTS.element }).catch(() => null);
      if (name?.startsWith('questionChoices-')) questionId = name.slice('questionChoices-'.length);
    }
    // reason: locale-stable composite selector — the `question-choice` testid is ambiguous across the outgoing+incoming questions mounted simultaneously during a param-only Q→Q nav; scoping by the `questionChoices-<id>` name attribute disambiguates to the CURRENT question. No getByTestId/getByRole form expresses a testid+attribute conjunction.
    // eslint-disable-next-line playwright/no-restricted-locators
    const currentChoices = page.locator(`[data-testid="question-choice"][name="questionChoices-${questionId}"]`);
    // Wait until the incoming question's own ANSWER SURFACE is present (not the stale outgoing one), then read a stable choice count. The surface is the scoped choices, or the number slider on a NUMBER-scale question, which renders no choices.
    //
    // The slider carries no question-id-scoped attribute, so on the iteration right after a slider question an unscoped slider match could be the OUTGOING question's, still mounted during the page-reuse DOM lag; reading `choiceCount === 0` off it would re-answer the previous question. Two adjacent number questions even share one slider element, because the input remounts only at a question-type boundary. So after a slider question the wait first requires the question heading to differ from the answered question's, which it does once the layout renders the incoming question, and then its surface. Otherwise a visible slider can only be this question's. Both waits end when the surface renders, however late.
    if (answeredSliderHeading !== undefined) {
      const previousHeading = answeredSliderHeading;
      await expect
        .poll(
          async () =>
            (await heading.allInnerTexts()).join('\n') !== previousHeading &&
            ((await currentChoices.count()) > 0 || (await numberSlider.first().isVisible())),
          {
            message: `voter-journey: question ${questionId} did not replace the number question answered before it`,
            timeout: STAGE_BUDGET
          }
        )
        .toBe(true);
    } else {
      await expect(currentChoices.first().or(numberSlider.first()).first()).toBeVisible({ timeout: STAGE_BUDGET });
    }
    const choiceCount = await currentChoices.count();
    if (choiceCount === 0) {
      // Slider branch: a matchable NUMBER opinion question renders a native range (question-number-slider) and carries NO question-choice options, so the scoped choice count is 0. The surface wait above has already resolved, so a question with neither choices nor a visible slider fails here: skipping it would silently change the answer set. Number questions do NOT auto-advance (the questions layout's `handleAnswer` jumps only for single-choice and boolean inputs), so drive the answer by keyboard — native range Home/End land the EXACT min/max value per answerMode (the keyboard contract) — then click Next explicitly and settle the URL like the radio path.
      const slider = numberSlider.first();
      if (!(await slider.isVisible())) {
        throw new Error(
          `voter-journey: question ${questionId} rendered neither choices nor a number slider at ${page.url()}`
        );
      }
      await slider.focus();
      await slider.press(answerMode === 'max' ? 'End' : 'Home');
      answered++;
      // The next iteration's answer-surface wait must NOT race an unscoped slider — this one stays mounted through the page-reuse DOM lag.
      answeredSliderHeading = (await heading.allInnerTexts()).join('\n');
      await nextButton.waitFor({ state: 'visible', timeout: TIMEOUTS.page });
      await nextButton.click();
      await requireNavigation(page, urlBefore, 'clicking Next on a number-scale question');
      continue;
    }
    // Checkbox branch: MultipleChoiceCategorical opinion questions render CHECKBOX inputs that reuse the question-choice testid + name=questionChoices-{id} contract, while single-choice / boolean / Likert render RADIOS.
    // The input type is authoritative — detect it off the first scoped choice.
    const inputType = await currentChoices.first().getAttribute('type');
    if (inputType === 'checkbox' && answered < cap) {
      // Select the SMALLEST VALID number of choices, discovered from the app's own validity signal. A fixed click count cannot fit every window: `qu-opin-base-7` allows 2..3 and `qu-opin-base-8-multichoice-exact` exactly 1, and the layout's handleAnswer refuses to persist an out-of-range selection, which would leave the question silently UNANSWERED.
      //
      // Validity signal: the DELETE button, which QuestionActions enables iff `answers[question.id].value != null && opinionInputValid` — i.e. iff a valid answer actually landed in voterCtx.answers. So the walk also verifies that the answer registered.
      //
      // Multi-choice does NOT auto-advance, so advance via the explicit Next button. Count the question ONCE regardless of how many boxes were ticked.
      await selectSmallestValidMultiChoice({
        choices: currentChoices,
        validWhenEnabled: page.getByTestId(testIds.shared.questionDelete)
      });
      answered++;
      answeredSliderHeading = undefined;
      await nextButton.waitFor({ state: 'visible', timeout: TIMEOUTS.page });
      await nextButton.click();
      await requireNavigation(page, urlBefore, 'clicking Next on a multi-choice question');
      continue;
    }
    // Radio path (single-choice / boolean / Likert).
    answeredSliderHeading = undefined;
    const pickIndex = answerMode === 'min' ? 0 : choiceCount - 1;
    await currentChoices.nth(pickIndex).click();
    answered++;
    // A single-choice, boolean or Likert answer always auto-advances after a short debounce, to the next question, a category intro or /results after the last question (questions/+layout.svelte `handleAnswer` / `handleJump`). So the walk waits for that navigation and never clicks Next as well: a Next click racing a late auto-advance would skip a question.
    // The wait is also the SETTLE-BEFORE-COUNT contract: the URL leaves the just-answered question before the next iteration counts options. It is the loop's progress invariant and fails loudly.
    await requireNavigation(page, urlBefore, 'answering a single-choice / boolean / Likert question');
  }

  // 7. Multi-election results landing: with 2+ elections and no `electionTab`
  //    in the URL the results page renders the election picker ("Select an election first") instead of the list — case 3 of results/[[electionTab]]/+layout.ts. Select the first election so the candidate/party list renders. The picker is an AccordionSelect exposing ARIA `option` roles (mirrors voter-journey.spec.ts:expectElectionOptionAndSelect).
  // Resolve which of the two renders first: the picker, or the list itself. The picker can stay visible above the list as the election selector, so the list is the deciding signal.
  const electionAccordion = page.getByTestId(testIds.voter.results.electionAccordion);
  const resultsList = page.getByTestId(testIds.voter.results.list);
  await expect(electionAccordion.or(resultsList).first()).toBeVisible({ timeout: STAGE_BUDGET });
  if (!(await resultsList.isVisible())) {
    const options = electionAccordion.getByRole('option');
    await options.first().waitFor({ state: 'visible', timeout: STAGE_BUDGET });
    // Collapsed accordion shows only the active option; expand it first, then pick the first election to load its results.
    if ((await options.count()) === 1) await options.first().click({ timeout: TIMEOUTS.click });
    await options.first().click({ timeout: TIMEOUTS.click });
  }

  // 8. Wait for the results list, which renders after the matching compute; the same budget as the landing above.
  await resultsList.waitFor({ state: 'visible', timeout: STAGE_BUDGET });
}

/**
 * Drive the native range slider to an EXACT `value` (the slider's keyboard contract: step=1, `Home`→min, `ArrowRight` +1). Unlike the walk's extreme-only Home/End branch (which only reaches min/max keyed on `answerMode`), this lands an ARBITRARY in-range value — the boundary test needs mid values (e.g. 5), not just the poles.
 *
 * Behaviour: focus the first `question-number-slider`, press `Home` to land deterministically on `min`, then press `ArrowRight` `(value - min)` times.
 * Driving past `max` is a NO-OP per press — the native range input clamps to `[min,max]`, so an out-of-range answer is physically impossible (the boundary proof).
 *
 * Never uses `fill()` — that bypasses the slider's persist-on-release logic entirely. Does NOT click Next: number inputs never auto-advance, so the caller clicks Next explicitly. Takes only the target value + the scale `min` (default 0) — no full question object required.
 */
async function answerNumberScale(page: Page, value: number, min = 0): Promise<void> {
  const slider = page.getByTestId(testIds.voter.questions.numberSlider).first();
  await slider.waitFor({ state: 'visible', timeout: TIMEOUTS.page });
  await slider.focus();
  await slider.press('Home');
  const steps = Math.max(0, value - min);
  for (let i = 0; i < steps; i++) {
    await slider.press('ArrowRight');
  }
}

export const voterJourneyTest = base.extend<VoterJourneyFixtures>({
  answerMode: ['max', { option: true }],
  answerCount: [undefined, { option: true }],

  answeredVoterPage: async ({ page, answerMode, answerCount }, use) => {
    await walkUntilQuestionsIntro(page);
    await answerAndAdvanceToResults(page, answerMode, answerCount);
    await use(page);
  },

  locatedVoterPage: async ({ page }, use) => {
    await walkUntilQuestionsIntro(page);
    await use(page);
  }
});

// Internal helper exported for tests that need to compose the walk manually (e.g. spec-level intermediate checkpoints between Home and /questions intro).
export { answerAndAdvanceToResults, answerNumberScale, walkUntilQuestionsIntro };
