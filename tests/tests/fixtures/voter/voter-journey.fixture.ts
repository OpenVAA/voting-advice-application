/**
 * Voter journey fixture. The answering function is robust: the answer mode is
 * 'min' or 'max' (first or last option, or min/max in numbers).
 *
 * The walk diverges between two exposed pages AT the /questions intro page —
 * `locatedVoterPage` STOPS at the intro page (DOES NOT answer questions; DOES
 * NOT proceed to /results), while `answeredVoterPage` continues to answer +
 * advance to /results.
 *
 * This is the sole voter-walk fixture.
 *
 * What this fixture exposes:
 *   - `answerMode: 'min' | 'max'` — which extreme to pick on each
 *     opinion question. `'min'` → first option / min value /
 *     `false`-boolean; `'max'` → last option / max value /
 *     `true`-boolean.
 *   - `answerCount?: number` — optional cap on total answered questions
 *     (partial-answer scenarios).
 *   - `answeredVoterPage: Page` — page navigated through the new base
 *     dataset's full intro flow (Home → Intro → election-select →
 *     constituency-select → questions-intro → category-intros +
 *     questions → results).
 *   - `locatedVoterPage: Page` — page navigated through Home → Intro →
 *     election-select → constituency-select and PARKED ON the /questions
 *     intro page. Located (electionId + constituencyId resolved in voter
 *     context) but NOT answered. Consumed by a11y-smoke's `questions`
 *     route scan.
 *
 * This fixture is wired against the BUILT_IN `e2e/base` dataset
 * (multi-election + multi-constituency hierarchy).
 *
 * The voter-journey spec uses the raw `page` for the pre-results
 * walkthrough (intro-flow steps) so it can assert at intermediate
 * checkpoints; `answeredVoterPage` is intended for tests that just need a
 * results-landing fixture and don't care about the intermediate steps.
 *
 * Implementation note: the two-fixture split was chosen over an
 * option-fixture `stopBeforeAnswering?: boolean` — it keeps each fixture's
 * invariant unambiguous at the call site and mirrors the existing
 * `answeredVoterPage` declaration shape. The shared traversal code lives in
 * `walkUntilQuestionsIntro` (Home → constituencies → /questions intro page);
 * `answeredVoterPage` then invokes `answerAndAdvanceToResults` on top.
 */

import { expect, test as base } from '@playwright/test';
import { TIMEOUTS } from '../../helpers';
import { buildRoute } from '../../utils/buildRoute';
import { selectSmallestValidMultiChoice } from '../../utils/multiChoice';
import { testIds } from '../../utils/testIds';
import type { Locator, Page } from '@playwright/test';

export type AnswerMode = 'min' | 'max';

/**
 * Polling visibility probe. Unlike `locator.isVisible({ timeout })` — which is
 * a one-shot snapshot that silently ignores its `timeout` option — this WAITS
 * up to `timeout` ms for `locator` to become visible, resolving `true` if it
 * does and `false` on timeout. Used for "did we land on this optional page?"
 * branches where the page's content may mount a beat after navigation (e.g.
 * the post-hydration `$dataRoot` provide window on the elections /
 * constituencies selectors — the elections-continue-stall hazard).
 */
async function waitForVisible(locator: Locator, timeout: number): Promise<boolean> {
  return locator
    .waitFor({ state: 'visible', timeout })
    .then(() => true)
    .catch(() => false);
}

/**
 * Follow an `<a>` link by navigating directly to its resolved `href`, once that
 * href has settled to match `hrefPattern`.
 *
 * Guards against two hazards that make a plain `.click()` on these links
 * flake until the 90s ceiling:
 *   1. Reactive-render churn — the link's `href` is bound to a post-hydration
 *      `$derived` value (the category-intro start button's `questionId` resolves
 *      from `voterCtx.selectedQuestionBlocks`, a reactive `$state`); clicking
 *      before it settles detaches the element mid-click.
 *   2. Pointer interception — during navigation the document root
 *      ("<html> intercepts pointer events") sits over the link, so the click
 *      never lands.
 * Navigating to the resolved href sidesteps both: it waits for the href to be
 * real, then drives a deterministic navigation instead of a racy pointer click.
 */
async function followLinkWhenHrefResolved(
  page: Page,
  link: Locator,
  hrefPattern: RegExp,
  timeout: number
): Promise<void> {
  await expect(link).toHaveAttribute('href', hrefPattern, { timeout });
  const href = await link.getAttribute('href');
  if (href) await page.goto(href);
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
   * Walks Home → Intro → Elections → Constituencies → /questions intro and
   * STOPS. Consumed by a11y-smoke for the questions-route scan.
   */
  locatedVoterPage: Page;
};

/**
 * Shared traversal: walk Home → Intro → Elections → Constituencies and
 * land ON the /questions intro page. Used by BOTH `answeredVoterPage`
 * (which continues to answer + advance to /results) AND `locatedVoterPage`
 * (which stops here).
 *
 * Post-condition: page has reached the /questions stage; the
 * `voter-questions-start` button is visible AND has NOT been clicked WHEN
 * `questions.questionsIntro.show === true` (the `e2e/base` posture). When a seed
 * sets `questionsIntro.show === false` (the minimal perm seeds), the intro page
 * auto-redirects past itself and the post-condition is instead the bypassed
 * landing (a category intro start `voter-questions-category-start`, or the first
 * question's `question-choice`). Voter context has electionId + constituencyId
 * resolved either way. See for the trace.
 */
async function walkUntilQuestionsIntro(page: Page): Promise<void> {
  // 0. Consent-popup guard. When data-collection consent is `indetermined` (the
  //    default for a fresh context) the voter layout auto-opens the
  //    DataConsentPopup — a modal `Alert` (role=dialog "Collecting Usage Data").
  //    It mounts a beat after navigation and, depending on timing, can overlay
  //    the bottom-anchored "Continue" button on the elections/constituencies
  //    pages (full-width at mobile; intermittently at desktop under full-suite
  //    load), intercepting the click and stalling the walk at /elections. This
  //    was a latent full-suite flake (voter-journey / a11y-smoke / performance /
  //    voter-journey-mobile) before this guard. `addLocatorHandler` grants
  //    consent through the real in-app control the moment the popup obstructs an
  //    actionability check, then Playwright retries the original action — so the
  //    walk proceeds deterministically. It fires ONLY when the popup is present
  //    (no-op otherwise), so it is safe for every walk consumer.
  const consentGrant = page.getByRole('dialog').getByRole('button', { name: /agree to share my data/i });
  await page.addLocatorHandler(consentGrant, async () => {
    await consentGrant.click();
  });

  // 1. Home page → start.
  await page.goto(buildRoute({ route: 'Home', locale: 'en' }));
  const homeStart = page.getByTestId(testIds.voter.home.startButton);
  await homeStart.waitFor({ state: 'visible', timeout: TIMEOUTS.slowPage });
  await homeStart.click();

  // 2. Intro start.
  const introStart = page.getByTestId(testIds.voter.intro.startButton);
  const electionsListProbe = page.getByTestId(testIds.voter.elections.list);
  // Intro may auto-redirect to elections/constituencies; tolerate either.
  await page
    .waitForURL((url) => !url.toString().endsWith('/en/') && !url.toString().endsWith('/en'), {
      timeout: TIMEOUTS.slowPage
    })
    .catch(() => null);
  // NB. Same non-waiting-`isVisible` hazard as the Elections/Constituencies
  // steps below — `locator.isVisible()` is a one-shot snapshot, so on a parked
  // Intro page whose "Continue" button mounts a beat AFTER navigation (the
  // post-hydration `$dataRoot` `$effect` render window), it returns false, the
  // Continue click is skipped, and the walk falls through still ON /intro —
  // stalling every downstream step and failing at fixture line ~231
  // (questions-start/category-start/question-choice never visible). This was a
  // latent full-suite flake (perm-question-video desktop + mobile,
  // voter-journey-mobile) — worse at the mobile viewport where the slower render
  // widens the window.
  //
  // Wait for the page to RESOLVE to one of two states, whichever comes first:
  //   (a) the Intro "Continue" button paints (questionsIntro.show=true, the
  //       e2e/base posture) → click it; OR
  //   (b) the page has already advanced PAST the intro to the elections
  //       selector (auto-redirect seeds, questionsIntro.show=false) → the
  //       elections list is present, so skip the click and let step 3 proceed.
  // Racing the two locators (vs. a bare polling waitForVisible on introStart)
  // means the auto-redirect path resolves the instant the elections list mounts
  // — no fixed 5s penalty — while the base path still waits deterministically
  // for the Continue button to paint instead of one-shot-missing it.
  await introStart
    .or(electionsListProbe)
    .first()
    .waitFor({ state: 'visible', timeout: TIMEOUTS.slowPage })
    .catch(() => null);
  if (await waitForVisible(introStart, TIMEOUTS.element)) {
    await introStart.click();
  }

  // 3. Elections page (multi-election): select all elections then continue.
  const electionsList = page.getByTestId(testIds.voter.elections.list);
  const electionsContinue = page.getByTestId(testIds.voter.elections.continue);
  // NB. `locator.isVisible({ timeout })` does NOT wait — Playwright's
  // `isVisible` is a one-shot snapshot and silently ignores the `timeout`
  // option (playwright-core/client/frame.ts). The elections list mounts a beat
  // AFTER navigation — `$dataRoot` is populated by a post-hydration `$effect` in
  // routes/+layout.svelte rather than synchronously at first paint — so a
  // non-waiting probe lands in that sub-second window, returns false, and skips
  // the Continue click, stalling the located walk at /elections (the
  // elections-continue-stall regression). Use a polling `waitForVisible`
  // helper so the conditional "did we land on this page?" check actually waits.
  if (await waitForVisible(electionsList, TIMEOUTS.page)) {
    // Accept default (both elections selected) or click each card to ensure selection.
    await electionsContinue.waitFor({ state: 'visible' });
    await electionsContinue.click();
  }

  // 4. Constituencies page: pick the first option in each combobox.
  const constituenciesList = page.getByTestId(testIds.voter.constituencies.list);
  const constituenciesContinue = page.getByTestId(testIds.voter.constituencies.continue);
  // Same non-waiting-`isVisible` hazard as the elections step above — use the
  // polling helper so the post-hydration render window can't skip this page.
  if (await waitForVisible(constituenciesList, TIMEOUTS.page)) {
    const comboboxes = constituenciesList.getByRole('combobox');
    const count = await comboboxes.count();
    for (let i = 0; i < count; i++) {
      const combo = comboboxes.nth(i);
      await combo.click();
      const listbox = page.getByRole('listbox');
      await listbox.waitFor({ state: 'visible', timeout: TIMEOUTS.page });
      await listbox.getByRole('option').first().click();
    }
    await constituenciesContinue.waitFor({ state: 'visible' });
    await constituenciesContinue.click();
  }

  // 5. Park on the /questions intro — wait for the start button to be visible.
  //    Do NOT click it; that's the divergence point between locatedVoterPage
  //    (stops here) and answeredVoterPage (continues to answer-loop).
  //
  //    BYPASS-TOLERANT (see phase 120 trace-confirmed): the /questions intro page
  //    auto-redirects on mount (questions/+page.svelte onMount, line 61) when
  //    `appSettings.questions.questionsIntro.show === false`. The minimal perm
  //    seeds (MINIMAL_BASE_APP_SETTINGS, packages/dev-seed/.../perm/shared.ts:92)
  //    set `questionsIntro.show=false`, so the page redirects PAST the intro —
  //    to a category intro (when `categoryIntros.show=true`, e.g.
  //    perm-question-video) or straight to the first question (when
  //    `categoryIntros.show=false`). In both cases `voter-questions-start` never
  //    paints, so a bare hard-wait on it times out at the WALK stage. The
  //    `e2e/base` dataset keeps `questionsIntro.show=true` (base.ts:196), so the
  //    start button DOES paint there and the `.or()` resolves on it first —
  //    making this change zero-regression for the base journey + a11y-smoke.
  //    This is the trace-grounded root cause from (the
  //    119-08 "reactive churn / TOCTOU detach" verdict is REFUTED — the failure
  //    is deterministic and settings-driven, and occurs here at line ~184, never
  //    reaching the suspected `answerAndAdvanceToResults` churn site at line ~209
  //    which stays untouched).
  const questionsStart = page.getByTestId(testIds.voter.questions.startButton);
  const categoryStart = page.getByTestId(testIds.voter.questions.categoryStart);
  const firstQuestion = page.getByTestId(testIds.voter.questions.answerOption).first();
  await questionsStart
    .or(categoryStart)
    .or(firstQuestion)
    .first()
    .waitFor({ state: 'visible', timeout: TIMEOUTS.slowPage });
}

/**
 * Continuation of the walk from the /questions intro page through the
 * answer-loop to /results. Pre-condition: page is on the /questions intro
 * page with `voter-questions-start` visible (i.e. `walkUntilQuestionsIntro`
 * has run).
 *
 * Each opinion question is answered per the `answerMode`:
 *   - Likert (5/4/7): 'min' → first option; 'max' → last option.
 *   - singleChoiceCategorical: 'min' → first option; 'max' → last option.
 *   - Boolean: 'min' → 'No' (index 0); 'max' → 'Yes' (index 1).
 *   - Number (native range slider): 'min' → keyboard Home (exact min);
 *     'max' → keyboard End (exact max). Does not auto-advance — Next clicked
 *     explicitly (plans 04/06).
 *   - MultipleChoiceCategorical (checkbox multi-select): clicks choices from
 *     index 0 upward until the app reports the selection VALID (see phase 135
 *     constraint-agnostic, so both the 2..3 and the exact-1 seeded
 *     questions are answered correctly); does not auto-advance — Next clicked
 *     explicitly (plan 06).
 *
 * All three answer-input families share the question-choice testid +
 * name=questionChoices-{id} scoping contract EXCEPT the slider (which has no
 * question-choice options — detected by a scoped choice count of 0). Both new
 * branches are inert against the current (pre-plan-08) seed, which surfaces no
 * number or multi-choice OPINION question.
 */
async function answerAndAdvanceToResults(page: Page, answerMode: AnswerMode, answerCount?: number): Promise<void> {
  // 5b. Click questions-intro start.
  const questionsStart = page.getByTestId(testIds.voter.questions.startButton);
  if (await questionsStart.isVisible({ timeout: TIMEOUTS.page }).catch(() => false)) {
    await questionsStart.click();
  }

  // 6. Answer loop: each iteration looks for either a category-intro
  //    (continue) or a question (answer per mode). Terminates on /results.
  const categoryStart = page.getByTestId(testIds.voter.questions.categoryStart);
  const answerOption = page.getByTestId(testIds.voter.questions.answerOption);
  // A NUMBER-scale opinion question renders ONLY a native range slider
  // (question-number-slider) and carries NO question-choice options, so it is
  // NOT matched by `answerOption`. Include it in the loop-entry surface probe
  // below: without it, the entry wait can only pass while the OUTGOING choice
  // question's options are still mounted (the page-reuse DOM-lag race). On a
  // contended run (mobile viewport, full-suite workers) the outgoing choices
  // unmount before the incoming number question paints, leaving neither a
  // category-intro nor a question-choice to match → a 10s timeout on the
  // number question (qu-opin-base-6-number). Probing the slider testid makes the
  // number-scale surface a first-class loop-entry match. The slider is then
  // driven by the choiceCount===0 branch below.
  const numberSlider = page.getByTestId(testIds.voter.questions.numberSlider);
  const nextButton = page.getByTestId(testIds.voter.questions.nextButton);
  const terminal = /\/results/;
  // A category-intro route is `/questions/category/<id>`; a question route is
  // `/questions/<id>` (no `/category/` segment). Branch on the URL — which is
  // authoritative and immune to the page-reuse DOM lag — rather than a
  // racy `isVisible()` snapshot against a page whose OUTGOING content is still
  // mounted mid-navigation (specs/voter/voter-journey.spec.ts SETTLE-BEFORE-
  // COUNT rationale).
  const categoryIntro = /\/questions\/category\//;
  let answered = 0;
  // True iff the PREVIOUS loop iteration answered a NUMBER-scale question via
  // the slider branch. Read by the loop's answer-surface wait below — see the
  // DEAD-WAIT REMOVAL note there for why the slider can only be raced in when
  // this is false.
  let sliderJustAnswered = false;
  const cap = answerCount ?? Number.POSITIVE_INFINITY;
  const maxIterations = 50; // generous ceiling — base dataset has ≤9 reachable opinion questions
  for (let iter = 0; iter < maxIterations; iter++) {
    if (terminal.test(page.url())) break;
    const urlBefore = page.url();
    // Wait for a category-intro, a choice/likert question, OR a number-scale
    // slider to be present (number questions render no question-choice option).
    await categoryStart
      .or(answerOption.first())
      .or(numberSlider.first())
      .first()
      .waitFor({ state: 'visible', timeout: TIMEOUTS.slowPage });

    if (categoryIntro.test(page.url())) {
      // The category-intro start button is an `<a href={getRoute('Question',
      // questionId)}>` whose `questionId` is `$derived` from
      // `voterCtx.selectedQuestionBlocks` (a post-hydration reactive `$state`).
      // On first paint the href is
      // unresolved; when the block populates the link re-renders and a plain
      // click both detaches mid-click AND is intercepted by the navigating
      // document root ("<html> intercepts pointer events") until the 90s ceiling.
      // Wait for the href to resolve to a real question route, then NAVIGATE to
      // it. See category/[categoryId]/+page.svelte:52,113 (the
      // elections-continue-stall sibling render-timing class).
      await followLinkWhenHrefResolved(page, categoryStart, /\/questions\//, TIMEOUTS.slowPage);
      await page.waitForURL((url) => url.toString() !== urlBefore, { timeout: TIMEOUTS.slowPage }).catch(() => null);
      // Reaching here means the category-intro page RENDERED (we waited for its
      // start link), so any question-page slider is long unmounted — the next
      // iteration may safely race the slider again.
      sliderJustAnswered = false;
      continue;
    }

    // Question page — pick by answerMode.
    if (answered >= cap) {
      // Use Skip to advance past remaining questions when answerCount is capped.
      sliderJustAnswered = false;
      await nextButton.click();
      await page.waitForURL((url) => url.toString() !== urlBefore, { timeout: TIMEOUTS.slowPage }).catch(() => null);
      continue;
    }
    // SETTLE-BEFORE-COUNT. On a Q→Q param-only nav SvelteKit
    // REUSES questions/[questionId]/+page.svelte (the page derives `question`
    // via `$derived` rather than remounting), so the OUTGOING question's
    // `[data-testid=question-choice]` options stay mounted until the PREVIOUS
    // click's deferred `goto` resolves and the incoming options swap in. A bare
    // `answerOption.count()` therefore captures the OUTGOING question's option
    // count, and `.nth(count-1)` points at a stale index that the INCOMING
    // question (fewer options — e.g. Likert4 after Likert5) never has → 90s
    // timeout.
    //
    // Anchor to the CURRENT question deterministically: each choice's `name` is
    // `questionChoices-<questionId>` and the questionId is the last `/questions/`
    // path segment. Scope the option locator to that questionId so the count +
    // `.nth()` only ever see the INCOMING question's options. Mirrors the
    // voter-journey spec's SETTLE-BEFORE-COUNT rationale
    // (specs/voter/voter-journey.spec.ts) — a deterministic settle, NOT a
    // View-Transition workaround (reduced-motion does not fix this and the
    // Playwright option does not reach the app's matchMedia anyway).
    const questionId = new URL(page.url()).pathname.replace(/\/+$/, '').split('/').filter(Boolean).pop() ?? '';
    // reason: locale-stable composite selector — the `question-choice` testid is
    // ambiguous across the outgoing+incoming questions mounted simultaneously
    // during a param-only Q→Q nav; scoping by the `questionChoices-<id>`
    // name attribute disambiguates to the CURRENT question. No getByTestId/
    // getByRole form expresses a testid+attribute conjunction.
    // eslint-disable-next-line playwright/no-restricted-locators
    const currentChoices = page.locator(`[data-testid="question-choice"][name="questionChoices-${questionId}"]`);
    // Wait until the incoming question's own ANSWER SURFACE is present (not the
    // stale outgoing one), then read a stable choice count.
    //
    // DEAD-WAIT REMOVAL (see phase 136). This used to wait on the scoped
    // choices ALONE. A NUMBER-scale opinion question renders ONLY
    // `question-number-slider` and carries NO `question-choice` nodes, so on
    // that question the wait could never resolve: it burned the full
    // `TIMEOUTS.slowPage` (measured 10 002 ms — 38% of this fixture's 26.4 s)
    // on EVERY traversal, deterministically, and every consumer of
    // `answeredVoterPage` paid it (a11y scans, visual, perf, voter journeys).
    // Racing the slider in ends the wait on the real surface rather than on the
    // clock. It is NOT a shortened timeout — the wait is still condition-based;
    // the condition just now covers the surface that actually renders.
    //
    // The race is GUARDED. Unlike the choices, the slider carries no
    // question-id-scoped attribute (the `name=questionChoices-<id>` contract),
    // so an unscoped slider match cannot distinguish the INCOMING number
    // question from the OUTGOING one still mounted during the page-reuse DOM
    // lag this whole SETTLE-BEFORE-COUNT block exists to defeat. Racing it
    // unguarded on the iteration right after a slider question would resolve on
    // the STALE surface, read `choiceCount === 0` off the not-yet-swapped DOM,
    // re-answer the previous question and skew `answered`. So when the previous
    // question was itself the slider we fall back to the scoped-choices-only
    // wait — byte-equivalent to the pre-136 behaviour. Worst case (two adjacent
    // NUMBER questions) is therefore exactly today's cost, never worse; every
    // other transition loses the dead wait. Dropping the guard requires giving
    // the slider the same `name=questionChoices-<id>` contract QuestionChoices
    // already has (product change — deliberately out of scope here).
    const answerSurface = sliderJustAnswered
      ? currentChoices.first()
      : currentChoices.first().or(numberSlider.first()).first();
    await answerSurface.waitFor({ state: 'visible', timeout: TIMEOUTS.slowPage }).catch(() => null);
    const choiceCount = await currentChoices.count();
    if (choiceCount === 0) {
      // Slider branch: a matchable NUMBER opinion question renders a
      // native range (question-number-slider) and carries NO question-choice
      // options, so the scoped choice count is 0. Probe for a visible slider
      // BEFORE falling through to the Skip fallback. Number questions do NOT
      // auto-advance (plan 06 suppresses the jump for the slider), so drive the
      // answer by keyboard — native range Home/End land the EXACT min/max value
      // per answerMode (the keyboard contract) — then click Next explicitly
      // and settle the URL like the radio path. If no slider is present (e.g. a
      // text-only rendering), fall through to the existing Skip path unchanged.
      const slider = page.getByTestId(testIds.voter.questions.numberSlider).first();
      if (answered < cap && (await waitForVisible(slider, TIMEOUTS.page))) {
        await slider.focus();
        await slider.press(answerMode === 'max' ? 'End' : 'Home');
        answered++;
        // The next iteration's answer-surface wait must NOT race an unscoped
        // slider — this one stays mounted through the page-reuse DOM lag.
        sliderJustAnswered = true;
        await nextButton.waitFor({ state: 'visible', timeout: TIMEOUTS.page });
        await nextButton.click();
        await page.waitForURL((url) => url.toString() !== urlBefore, { timeout: TIMEOUTS.slowPage }).catch(() => null);
        continue;
      }
      // No selectable choices and no slider (e.g. text rendering) — Skip.
      sliderJustAnswered = false;
      await nextButton.waitFor({ state: 'visible', timeout: TIMEOUTS.page });
      await nextButton.click();
      await page.waitForURL((url) => url.toString() !== urlBefore, { timeout: TIMEOUTS.slowPage }).catch(() => null);
      continue;
    }
    // Checkbox branch: MultipleChoiceCategorical opinion questions render
    // CHECKBOX inputs that reuse the question-choice testid + name=questionChoices-{id}
    // contract (plan 06), while single-choice / boolean / Likert render RADIOS.
    // The input type is authoritative — detect it off the first scoped choice.
    const inputType = await currentChoices.first().getAttribute('type');
    if (inputType === 'checkbox' && answered < cap) {
      // Select the SMALLEST VALID number of choices, discovered from the app's
      // own validity signal (see phase 135). This used to hard-code "click
      // the first 2", citing the single seeded multi-choice question's
      // minSelections=2 / maxSelections=3 window — a coupling that BREAKS the
      // moment a second window exists: `qu-opin-base-8-multichoice-exact` is
      // authored min===max===1, so 2 clicks is OVER-max and the layout's
      // handleAnswer refuses to persist an out-of-range selection, leaving the
      // question silently UNANSWERED while the walk believed it had answered it.
      //
      // Validity signal: the DELETE button, which QuestionActions enables iff
      // `answers[question.id].value != null && opinionInputValid` — i.e. iff a
      // valid answer actually landed in voterCtx.answers. That makes the walk
      // strictly stricter than before (it now verifies the answer registered).
      //
      // Multi-choice does NOT auto-advance (plan 06), so advance via the
      // explicit Next button. Count the question ONCE regardless of how many
      // boxes were ticked.
      await selectSmallestValidMultiChoice({
        choices: currentChoices,
        validWhenEnabled: page.getByTestId(testIds.shared.questionDelete)
      });
      answered++;
      sliderJustAnswered = false;
      await nextButton.waitFor({ state: 'visible', timeout: TIMEOUTS.page });
      await nextButton.click();
      await page.waitForURL((url) => url.toString() !== urlBefore, { timeout: TIMEOUTS.slowPage }).catch(() => null);
      continue;
    }
    // Radio path (single-choice / boolean / Likert) — answering behaviour
    // unchanged; only the `sliderJustAnswered` bookkeeping below is new (136).
    sliderJustAnswered = false;
    const pickIndex = answerMode === 'min' ? 0 : choiceCount - 1;
    await currentChoices.nth(pickIndex).click();
    answered++;
    // Auto-advance OR fallback to nextButton (last-question case). The deferred
    // auto-advance `goto` fires after a ~350ms debounce, so allow a beat before
    // falling back to the explicit Next button.
    try {
      // reason: tight 3s auto-advance probe — deliberately below TIMEOUTS.page; on
      // timeout the nextButton fallback fires (last-question case). Not bucket-mappable.
      await page.waitForURL((url) => url.toString() !== urlBefore, { timeout: 3_000 });
    } catch {
      if (await nextButton.isVisible().catch(() => false)) {
        await nextButton.click();
        await page.waitForURL((url) => url.toString() !== urlBefore, { timeout: TIMEOUTS.slowPage }).catch(() => null);
      }
    }
    // Settle the param-only Q→Q nav: wait until the URL leaves the just-answered
    // question route before the next iteration counts options, so the stale
    // outgoing option set can't be captured (the SETTLE-BEFORE-COUNT contract).
    await page.waitForURL((url) => url.toString() !== urlBefore, { timeout: TIMEOUTS.slowPage }).catch(() => null);
  }

  // 7. Multi-election results landing: with 2+ elections and no `electionTab`
  //    in the URL the results page renders the election picker ("Select an
  //    election first") instead of the list — case 3 of
  //    results/[[electionTab]]/+layout.ts. Select the first election so the
  //    candidate/party list renders. The picker is an AccordionSelect exposing
  //    ARIA `option` roles (mirrors voter-journey.spec.ts:expectElectionOptionAndSelect).
  const electionAccordion = page.getByTestId(testIds.voter.results.electionAccordion);
  if (await waitForVisible(electionAccordion, TIMEOUTS.slowPage)) {
    const options = electionAccordion.getByRole('option');
    await options.first().waitFor({ state: 'visible', timeout: TIMEOUTS.slowPage });
    // Collapsed accordion shows only the active option; expand it first, then
    // pick the first election to load its results.
    if ((await options.count()) === 1) await options.first().click({ timeout: TIMEOUTS.click });
    await options.first().click({ timeout: TIMEOUTS.click });
  }

  // 8. Wait for the results list.
  // reason: 15s exceeds TIMEOUTS.slowPage (10s) — the post-answer-loop /results landing
  // is the heaviest single wait in the walk (full matching compute + entity-list render)
  // and needs extra cold-start headroom. Kept inline as a documented exception.
  await page.getByTestId(testIds.voter.results.list).waitFor({ state: 'visible', timeout: 15_000 });
}

/**
 * Drive the native range slider to an EXACT `value` (129 keyboard
 * contract: step=1, `Home`→min, `ArrowRight` +1). Unlike the walk's
 * extreme-only Home/End branch (which only reaches min/max keyed on
 * `answerMode`), this lands an ARBITRARY in-range value — the
 * boundary test needs mid values (e.g. 5), not just the poles.
 *
 * Behaviour: focus the first `question-number-slider`, press `Home` to land
 * deterministically on `min`, then press `ArrowRight` `(value - min)` times.
 * Driving past `max` is a NO-OP per press — the native range input clamps to
 * `[min,max]`, so an out-of-range answer is physically impossible (the
 * boundary proof).
 *
 * Never uses `fill()` — that bypasses the slider's persist-on-release logic
 * (129). Does NOT click Next: number inputs never auto-advance
 * (129-06); the caller clicks Next explicitly. Takes only the target value +
 * the scale `min` (default 0) — no full question object required.
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

// Internal helper exported for tests that need to compose the walk manually
// (e.g. spec-level intermediate checkpoints between Home and /questions intro).
export { answerAndAdvanceToResults, answerNumberScale, walkUntilQuestionsIntro };
