/**
 * Voter answer fixture for E2E tests.
 *
 * Provides an `answeredVoterPage` that navigates the voter journey
 * (Home -> Intro -> Questions -> Results) and answers all questions
 * with a configurable Likert value.
 *
 * Assumes:
 * - Single election + single constituency (auto-implied by data setup)
 * - Questions are opinion-type Likert-5 questions
 *
 * Handles questions intro / category selection and category intro pages
 * gracefully, clicking through them if they appear (e.g., when parallel
 * settings-mutating specs re-enable these features).
 *
 * @example
 * ```typescript
 * import { voterTest } from '../fixtures/voter.fixture';
 *
 * voterTest('should display results', async ({ answeredVoterPage }) => {
 *   // answeredVoterPage is on the results page with all questions answered
 * });
 *
 * // Override defaults
 * voterTest.use({ voterAnswerCount: 4, voterAnswerIndex: 0 });
 * voterTest('partial answers', async ({ answeredVoterPage }) => {
 *   // Only 4 questions answered with "Fully disagree"
 * });
 * ```
 */
import { test as base } from '@playwright/test';
import { testIds } from '../utils/testIds';
import { navigateToFirstQuestion, waitForNextQuestion } from '../utils/voterNavigation';
import type { Page } from '@playwright/test';

type VoterFixtureOptions = {
  /** Number of questions to answer. Default: 16 (all opinion questions from combined default + voter datasets) */
  voterAnswerCount: number;
  /** Likert answer value index (0-based: 0=Fully disagree, 4=Fully agree). Default: 4 */
  voterAnswerIndex: number;
};

type VoterFixtures = VoterFixtureOptions & {
  /** A page with voter answers already submitted, currently on the results page */
  answeredVoterPage: Page;
};

export const voterTest = base.extend<VoterFixtures>({
  voterAnswerCount: [16, { option: true }],
  voterAnswerIndex: [4, { option: true }],

  answeredVoterPage: async ({ page, voterAnswerCount, voterAnswerIndex }, use) => {
    // Navigate Home -> Intro -> (optional pages) -> First Question
    await navigateToFirstQuestion(page);

    // Answer questions: each click on a Likert choice auto-advances after a 350ms delay.
    // We track the URL to detect when auto-advance navigates to the next question/results page.
    for (let i = 0; i < voterAnswerCount; i++) {
      // Wait for the answer option to be visible before clicking
      const answerOption = page.getByTestId(testIds.voter.questions.answerOption).nth(voterAnswerIndex);
      await answerOption.waitFor({ state: 'visible' });

      // Record URL before clicking to detect auto-advance navigation
      const urlBefore = page.url();
      await answerOption.click();

      // Wait for auto-advance: URL changes to the next question or results page.
      // 10s budget (was 5s) accommodates full-suite render-time pressure
      // post-Plan-64-01 parent_nomination wiring + supabase adapter
      // parent-type derivation. See Phase 64-04 SUMMARY.md (Task 6).
      await page.waitForURL((url) => url.toString() !== urlBefore, { timeout: 10000 });

      if (i < voterAnswerCount - 1) {
        // Wait for the next answer option, clicking through any category intro page
        await waitForNextQuestion(page, voterAnswerIndex);
      }
    }

    // After the last opinion answer, auto-advance lands either on /results
    // or on a sort-17+ unanswered optional opinion question (categorical at
    // sort 17, boolean at sort 18 per Phase 74 P05 + Phase 75 P01). The
    // post-loop fallback needs to Skip-Next up to 3 times to walk past those
    // optional questions and reach /results.
    //
    // reason: Phase 77 P02 — bumped from a single Skip to a 3-iteration loop
    // (mirroring voter-matching.spec.ts:174 + voter-journey.spec.ts:64 Skip-Next
    // fallback pattern established in Phase 75 P01). Before this fix the
    // fixture's single nextButton.click() landed voter on sort 18 (boolean)
    // and then page.waitForURL(/\/results/) timed out — surfacing as a
    // fixture-level setup failure cascading into ALL voter-results spec
    // cells. Mirrors the existing 3-iter pattern in voter-matching.spec.ts.
    // The maxSteps cap of 3 covers sort 17 (categorical) + sort 18 (boolean)
    // + a 3rd-headroom step. /results breaks the loop early.
    for (let skip = 0; skip < 3; skip++) {
      if (page.url().includes('/results')) break;
      const urlBefore = page.url();
      await page.getByTestId(testIds.voter.questions.nextButton).click();
      // 30s budget (was 10s) for SSR + reactivity settle on full-suite
      // runs. See Phase 64-04 SUMMARY.md (Task 6).
      await page.waitForURL((url) => url.toString() !== urlBefore, { timeout: 30000 });
    }

    // Wait for the results list to be visible.
    // 30s budget (was 10s) for SSR + reactivity settle on full-suite
    // runs. See Phase 64-04 SUMMARY.md (Task 6).
    await page.getByTestId(testIds.voter.results.list).waitFor({ state: 'visible', timeout: 30000 });

    await use(page);
  }
});
