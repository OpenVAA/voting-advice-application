/**
 * Voter mega-journey fixture — Phase 88 Plan 01 Task 3.
 *
 * Design source: TEST-INVENTORY-REFACTOR-1.md line 10
 *   - "Make the answering func robust so that the answer mode is 'min'
 *     or 'max' (first or last option, or min/max in numbers)"
 *
 * Phase 91 Plan 04 extension: `locatedVoterPage` fixture variant added to
 * support the a11y-smoke questions-route scan (D-91-RS-02b). The walk diverges
 * from `answeredVoterPage` AT the /questions intro page — `locatedVoterPage`
 * STOPS at the intro page (DOES NOT answer questions; DOES NOT proceed to
 * /results), while `answeredVoterPage` continues to answer + advance to
 * /results.
 *
 * SIBLING (not replacement) to the existing tests/tests/fixtures/voter.fixture.ts.
 * The legacy fixture is consumed by ~12 specs and is preserved per the
 * parallel-landing contract in 88-CONTEXT.md §"Parallel-setup principle".
 * Phase 91 Plan 04 marks the legacy fixture with a JSDoc `@deprecated` banner;
 * deletion is deferred to v2.11+ legacy-retirement phase after all consumers
 * migrate (D-91-RS-03 / D-91-RS-04).
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
 *     route scan per D-91-RS-02b (Phase 91 Plan 04).
 *
 * This fixture is wired against the new BUILT_IN `baseV1` dataset
 * (multi-election + multi-constituency hierarchy). The legacy
 * `voter.fixture.ts` assumes a single-election + single-constituency
 * auto-implied dataset and is NOT used by the mega-journey.
 *
 * The mega-journey spec uses the raw `page` for the pre-results
 * walkthrough (steps 9.1.x → 9.5.x intro-flow) so it can assert at
 * intermediate checkpoints; `answeredVoterPage` is intended for tests
 * that just need a results-landing fixture and don't care about the
 * intermediate steps.
 *
 * Implementation note (Phase 91 Plan 04): the two-fixture split was chosen
 * over an option-fixture `stopBeforeAnswering?: boolean` per RESEARCH
 * §"A11Y Route Refactor + locatedVoterPage Fixture Extension" — keeps
 * each fixture's invariant unambiguous at the call site, mirrors the
 * existing `answeredVoterPage` declaration shape. The shared traversal
 * code lives in `walkUntilQuestionsIntro` (Home → constituencies →
 * /questions intro page); `answeredVoterPage` then invokes
 * `answerAndAdvanceToResults` on top.
 */

import { test as base } from '@playwright/test';
import { buildRoute } from '../utils/buildRoute';
import { testIds } from '../utils/testIds';

export type AnswerMode = 'min' | 'max';

type VoterMegaFixtureOptions = {
  /** Which extreme to pick on each opinion question. Default: 'max'. */
  answerMode: AnswerMode;
  /** Optional: cap total answers (for partial-answer scenarios). Default: undefined (answer all). */
  answerCount?: number;
};

type VoterMegaFixtures = VoterMegaFixtureOptions & {
  /** A page on /results with all reachable opinion questions answered per answerMode. */
  answeredVoterPage: import('@playwright/test').Page;
  /**
   * A page parked ON the /questions intro page (located but NOT answered).
   * Walks Home → Intro → Elections → Constituencies → /questions intro and
   * STOPS. Consumed by a11y-smoke for the questions-route scan
   * (Phase 91 Plan 04 / D-91-RS-02b).
   */
  locatedVoterPage: import('@playwright/test').Page;
};

/**
 * Shared traversal: walk Home → Intro → Elections → Constituencies and
 * land ON the /questions intro page. Used by BOTH `answeredVoterPage`
 * (which continues to answer + advance to /results) AND `locatedVoterPage`
 * (which stops here per D-91-RS-02b).
 *
 * Post-condition: page is on the /questions intro page; the
 * `voter-questions-start` button is visible AND has NOT been clicked.
 * Voter context has electionId + constituencyId resolved.
 */
async function walkUntilQuestionsIntro(page: import('@playwright/test').Page): Promise<void> {
  // 1. Home page → start.
  await page.goto(buildRoute({ route: 'Home', locale: 'en' }));
  const homeStart = page.getByTestId(testIds.voter.home.startButton);
  await homeStart.waitFor({ state: 'visible', timeout: 10_000 });
  await homeStart.click();

  // 2. Intro start.
  const introStart = page.getByTestId(testIds.voter.intro.startButton);
  // Intro may auto-redirect to elections/constituencies; tolerate either.
  await page
    .waitForURL((url) => !url.toString().endsWith('/en/') && !url.toString().endsWith('/en'), {
      timeout: 10_000
    })
    .catch(() => null);
  if (await introStart.isVisible().catch(() => false)) {
    await introStart.click();
  }

  // 3. Elections page (multi-election): select all elections then continue.
  const electionsList = page.getByTestId(testIds.voter.elections.list);
  const electionsContinue = page.getByTestId(testIds.voter.elections.continue);
  if (await electionsList.isVisible({ timeout: 5_000 }).catch(() => false)) {
    // Accept default (both elections selected) or click each card to ensure selection.
    await electionsContinue.waitFor({ state: 'visible' });
    await electionsContinue.click();
  }

  // 4. Constituencies page: pick the first option in each combobox.
  const constituenciesList = page.getByTestId(testIds.voter.constituencies.list);
  const constituenciesContinue = page.getByTestId(testIds.voter.constituencies.continue);
  if (await constituenciesList.isVisible({ timeout: 5_000 }).catch(() => false)) {
    const comboboxes = constituenciesList.getByRole('combobox');
    const count = await comboboxes.count();
    for (let i = 0; i < count; i++) {
      const combo = comboboxes.nth(i);
      await combo.click();
      const listbox = page.getByRole('listbox');
      await listbox.waitFor({ state: 'visible', timeout: 5_000 });
      await listbox.getByRole('option').first().click();
    }
    await constituenciesContinue.waitFor({ state: 'visible' });
    await constituenciesContinue.click();
  }

  // 5. Park on /questions intro — wait for the start button to be visible.
  //    Do NOT click it; that's the divergence point between locatedVoterPage
  //    (stops here) and answeredVoterPage (continues to answer-loop).
  const questionsStart = page.getByTestId(testIds.voter.questions.startButton);
  await questionsStart.waitFor({ state: 'visible', timeout: 10_000 });
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
 *   - Number (NOT expected in opinion questions per refactor-doc:38-44,
 *     but the helper is future-proof): 'min' → first option index 0;
 *     'max' → last option index (nth(-1)).
 */
async function answerAndAdvanceToResults(
  page: import('@playwright/test').Page,
  answerMode: AnswerMode,
  answerCount?: number
): Promise<void> {
  // 5b. Click questions-intro start.
  const questionsStart = page.getByTestId(testIds.voter.questions.startButton);
  if (await questionsStart.isVisible({ timeout: 5_000 }).catch(() => false)) {
    await questionsStart.click();
  }

  // 6. Answer loop: each iteration looks for either a category-intro
  //    (continue) or a question (answer per mode). Terminates on /results.
  const categoryStart = page.getByTestId(testIds.voter.questions.categoryStart);
  const answerOption = page.getByTestId(testIds.voter.questions.answerOption);
  const nextButton = page.getByTestId(testIds.voter.questions.nextButton);
  const terminal = /\/results/;
  let answered = 0;
  const cap = answerCount ?? Number.POSITIVE_INFINITY;
  const maxIterations = 50; // generous ceiling — base dataset has ≤9 reachable opinion questions
  for (let iter = 0; iter < maxIterations; iter++) {
    if (terminal.test(page.url())) break;
    const urlBefore = page.url();
    // Wait for either a category-intro or a question.
    await categoryStart
      .or(answerOption.first())
      .first()
      .waitFor({ state: 'visible', timeout: 10_000 });

    if (await categoryStart.isVisible().catch(() => false)) {
      await categoryStart.click();
      await page.waitForURL((url) => url.toString() !== urlBefore, { timeout: 10_000 }).catch(() => null);
      continue;
    }

    // Question page — pick by answerMode.
    if (answered >= cap) {
      // Use Skip to advance past remaining questions when answerCount is capped.
      await nextButton.click();
      await page.waitForURL((url) => url.toString() !== urlBefore, { timeout: 10_000 }).catch(() => null);
      continue;
    }
    const choiceCount = await answerOption.count();
    if (choiceCount === 0) {
      // No selectable choices (e.g. text/number rendering) — Skip.
      await nextButton.waitFor({ state: 'visible', timeout: 5_000 });
      await nextButton.click();
      await page.waitForURL((url) => url.toString() !== urlBefore, { timeout: 10_000 }).catch(() => null);
      continue;
    }
    const pickIndex = answerMode === 'min' ? 0 : choiceCount - 1;
    await answerOption.nth(pickIndex).click();
    answered++;
    // Auto-advance OR fallback to nextButton (last-question case).
    try {
      await page.waitForURL((url) => url.toString() !== urlBefore, { timeout: 3_000 });
    } catch {
      if (await nextButton.isVisible().catch(() => false)) {
        await nextButton.click();
        await page.waitForURL((url) => url.toString() !== urlBefore, { timeout: 10_000 }).catch(() => null);
      }
    }
  }

  // 7. Wait for the results list.
  await page.getByTestId(testIds.voter.results.list).waitFor({ state: 'visible', timeout: 15_000 });
}

/**
 * @deprecated Use `walkUntilQuestionsIntro` + `answerAndAdvanceToResults`
 *   directly. Retained as a thin wrapper for backward-compat with any
 *   external consumer that imported this symbol. Internal fixtures below
 *   call the two helpers directly.
 */
async function walkVoterMegaJourney(
  page: import('@playwright/test').Page,
  answerMode: AnswerMode,
  answerCount?: number
): Promise<void> {
  await walkUntilQuestionsIntro(page);
  await answerAndAdvanceToResults(page, answerMode, answerCount);
}

export const voterMegaTest = base.extend<VoterMegaFixtures>({
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
export { walkUntilQuestionsIntro, answerAndAdvanceToResults, walkVoterMegaJourney };
