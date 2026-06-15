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
 * resolved either way. See 120-01-PROBE-DIAGNOSIS.md for the trace.
 */
async function walkUntilQuestionsIntro(page: Page): Promise<void> {
  // 1. Home page → start.
  await page.goto(buildRoute({ route: 'Home', locale: 'en' }));
  const homeStart = page.getByTestId(testIds.voter.home.startButton);
  await homeStart.waitFor({ state: 'visible', timeout: TIMEOUTS.slowPage });
  await homeStart.click();

  // 2. Intro start.
  const introStart = page.getByTestId(testIds.voter.intro.startButton);
  // Intro may auto-redirect to elections/constituencies; tolerate either.
  await page
    .waitForURL((url) => !url.toString().endsWith('/en/') && !url.toString().endsWith('/en'), {
      timeout: TIMEOUTS.slowPage
    })
    .catch(() => null);
  if (await introStart.isVisible().catch(() => false)) {
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
  //    BYPASS-TOLERANT (Phase 120-01 trace-confirmed): the /questions intro page
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
  //    This is the trace-grounded root cause from 120-01-PROBE-DIAGNOSIS.md (the
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
 *   - Number (NOT expected in opinion questions, but the helper is
 *     future-proof): 'min' → first option index 0; 'max' → last option
 *     index (nth(-1)).
 */
async function answerAndAdvanceToResults(
  page: Page,
  answerMode: AnswerMode,
  answerCount?: number
): Promise<void> {
  // 5b. Click questions-intro start.
  const questionsStart = page.getByTestId(testIds.voter.questions.startButton);
  if (await questionsStart.isVisible({ timeout: TIMEOUTS.page }).catch(() => false)) {
    await questionsStart.click();
  }

  // 6. Answer loop: each iteration looks for either a category-intro
  //    (continue) or a question (answer per mode). Terminates on /results.
  const categoryStart = page.getByTestId(testIds.voter.questions.categoryStart);
  const answerOption = page.getByTestId(testIds.voter.questions.answerOption);
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
  const cap = answerCount ?? Number.POSITIVE_INFINITY;
  const maxIterations = 50; // generous ceiling — base dataset has ≤9 reachable opinion questions
  for (let iter = 0; iter < maxIterations; iter++) {
    if (terminal.test(page.url())) break;
    const urlBefore = page.url();
    // Wait for either a category-intro or a question to be present.
    await categoryStart.or(answerOption.first()).first().waitFor({ state: 'visible', timeout: TIMEOUTS.slowPage });

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
      continue;
    }

    // Question page — pick by answerMode.
    if (answered >= cap) {
      // Use Skip to advance past remaining questions when answerCount is capped.
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
    // Wait until the incoming question's own options are present (not the stale
    // outgoing set), then read a stable count.
    await currentChoices
      .first()
      .waitFor({ state: 'visible', timeout: TIMEOUTS.slowPage })
      .catch(() => null);
    const choiceCount = await currentChoices.count();
    if (choiceCount === 0) {
      // No selectable choices (e.g. text/number rendering) — Skip.
      await nextButton.waitFor({ state: 'visible', timeout: TIMEOUTS.page });
      await nextButton.click();
      await page.waitForURL((url) => url.toString() !== urlBefore, { timeout: TIMEOUTS.slowPage }).catch(() => null);
      continue;
    }
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
export { answerAndAdvanceToResults, walkUntilQuestionsIntro };
