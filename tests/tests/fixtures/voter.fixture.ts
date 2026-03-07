/**
 * Voter answer fixture for E2E tests.
 *
 * Provides an `answeredVoterPage` that navigates the voter journey
 * (Home -> Intro -> Questions -> Results) and answers all questions
 * with a configurable Likert value.
 *
 * Assumes:
 * - Single election + single constituency (auto-implied by data setup)
 * - Category intros disabled (configured in data.setup.ts)
 * - Questions are opinion-type Likert-5 questions
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
import { buildRoute } from '../utils/buildRoute';
import { testIds } from '../utils/testIds';
import type { Page } from '@playwright/test';

type VoterFixtureOptions = {
  /** Number of questions to answer. Default: 8 (all) */
  voterAnswerCount: number;
  /** Likert answer value index (0-based: 0=Fully disagree, 4=Fully agree). Default: 4 */
  voterAnswerIndex: number;
};

type VoterFixtures = VoterFixtureOptions & {
  /** A page with voter answers already submitted, currently on the results page */
  answeredVoterPage: Page;
};

export const voterTest = base.extend<VoterFixtures>({
  voterAnswerCount: [8, { option: true }],
  voterAnswerIndex: [4, { option: true }],

  answeredVoterPage: async ({ page, voterAnswerCount, voterAnswerIndex }, use) => {
    // Navigate to the voter home page
    await page.goto(buildRoute({ route: 'Home', locale: 'en' }));

    // Click start on the home page -- auto-implication handles election + constituency
    await page.getByTestId(testIds.voter.home.startButton).click();

    // Should land on the intro page (no election/constituency selection with single of each)
    await page.getByTestId(testIds.voter.intro.startButton).click();

    // Answer questions: each click on a Likert choice auto-advances after a short delay.
    // After auto-advance, the answer options reset (no selected state), so we wait for
    // a fresh unselected answer option to confirm we're on the next question.
    for (let i = 0; i < voterAnswerCount; i++) {
      // Wait for the answer option to be visible before clicking
      const answerOption = page.getByTestId(testIds.voter.questions.answerOption).nth(voterAnswerIndex);
      await answerOption.waitFor({ state: 'visible' });
      await answerOption.click();

      if (i < voterAnswerCount - 1) {
        // Wait for auto-advance: the next button becomes visible on the new question page.
        // After auto-advance the URL changes to the next question, so we wait for
        // the answer option to be visible again (fresh question, unselected options).
        await page.getByTestId(testIds.voter.questions.nextButton).waitFor({ state: 'visible' });
      }
    }

    // After answering the last question, the Next button shows "Results" -- click it
    await page.getByTestId(testIds.voter.questions.nextButton).click();

    // Wait for the results page to load
    await page.getByTestId(testIds.voter.results.list).waitFor({ state: 'visible', timeout: 10000 });

    await use(page);
  }
});
