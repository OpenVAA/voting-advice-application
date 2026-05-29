/**
 * Extended test fixture providing page objects as test parameters.
 *
 * All test files should import `{ test, expect }` from this file instead of
 * from `@playwright/test` directly. This ensures consistent patterns, reduces
 * boilerplate, and makes tests more readable.
 *
 * Usage:
 * ```typescript
 * import { test, expect } from '../fixtures';
 *
 * test('candidate translation flow', async ({ candidateQuestionsPage, questionPage, page }) => {
 *   await page.goto('/en/candidate/questions');
 *   await candidateQuestionsPage.expandAllCategories();
 *   await candidateQuestionsPage.navigateToQuestion(0);
 *   await expect(questionPage.answerInput).toBeVisible();
 * });
 * ```
 *
 * Phase 89 Plan LAST: HomePage, LoginPage, PreviewPage, SettingsPage classes
 * were pruned per the 89-LAST-AUDIT.md verdict — they had no surviving
 * consumers after the 5 absorbed candidate specs were deleted. The new
 * candidate function-fixtures live at `tests/tests/fixtures/candidate/`
 * (Phase 89 Plan 02) and are consumed by `candidate-mega-journey.spec.ts`.
 */
import { expect, test as base } from '@playwright/test';
import { ProfilePage } from '../pages/candidate/ProfilePage';
import { QuestionPage } from '../pages/candidate/QuestionPage';
import { QuestionsPage as CandidateQuestionsPage } from '../pages/candidate/QuestionsPage';
import { EntityDetailPage as VoterEntityDetailPage } from '../pages/voter/EntityDetailPage';
import { HomePage as VoterHomePage } from '../pages/voter/HomePage';
import { IntroPage as VoterIntroPage } from '../pages/voter/IntroPage';
import { QuestionsPage as VoterQuestionsPage } from '../pages/voter/QuestionsPage';
import { ResultsPage as VoterResultsPage } from '../pages/voter/ResultsPage';

// Page fixture types
type PageFixtures = {
  profilePage: ProfilePage;
  candidateQuestionsPage: CandidateQuestionsPage;
  questionPage: QuestionPage;
  voterQuestionsPage: VoterQuestionsPage;
  voterHomePage: VoterHomePage;
  voterIntroPage: VoterIntroPage;
  voterResultsPage: VoterResultsPage;
  voterEntityDetailPage: VoterEntityDetailPage;
};

// Extend base test with page object fixtures
export const test = base.extend<PageFixtures>({
  profilePage: async ({ page }, use) => {
    await use(new ProfilePage(page));
  },
  candidateQuestionsPage: async ({ page }, use) => {
    await use(new CandidateQuestionsPage(page));
  },
  questionPage: async ({ page }, use) => {
    await use(new QuestionPage(page));
  },
  voterQuestionsPage: async ({ page }, use) => {
    await use(new VoterQuestionsPage(page));
  },
  voterHomePage: async ({ page }, use) => {
    await use(new VoterHomePage(page));
  },
  voterIntroPage: async ({ page }, use) => {
    await use(new VoterIntroPage(page));
  },
  voterResultsPage: async ({ page }, use) => {
    await use(new VoterResultsPage(page));
  },
  voterEntityDetailPage: async ({ page }, use) => {
    await use(new VoterEntityDetailPage(page));
  }
});

// Re-export expect for convenience
export { expect };

// Re-export page objects for direct use if needed
export { ProfilePage } from '../pages/candidate/ProfilePage';
export { QuestionPage } from '../pages/candidate/QuestionPage';
export { QuestionsPage as CandidateQuestionsPage } from '../pages/candidate/QuestionsPage';
export { EntityDetailPage as VoterEntityDetailPage } from '../pages/voter/EntityDetailPage';
export { HomePage as VoterHomePage } from '../pages/voter/HomePage';
export { IntroPage as VoterIntroPage } from '../pages/voter/IntroPage';
export { QuestionsPage as VoterQuestionsPage } from '../pages/voter/QuestionsPage';
export { ResultsPage as VoterResultsPage } from '../pages/voter/ResultsPage';
