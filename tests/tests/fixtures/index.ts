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
 * test('candidate can login', async ({ loginPage, page }) => {
 *   await page.goto('/en/candidate');
 *   await loginPage.login(TEST_CANDIDATE_EMAIL, TEST_CANDIDATE_PASSWORD);
 * });
 * ```
 *
 * New page objects are added here as they are created in Phase 2+.
 */
import { expect, test as base } from '@playwright/test';
import { HomePage } from '../pages/candidate/HomePage';
import { LoginPage } from '../pages/candidate/LoginPage';
import { PreviewPage } from '../pages/candidate/PreviewPage';
import { ProfilePage } from '../pages/candidate/ProfilePage';
import { QuestionPage } from '../pages/candidate/QuestionPage';
import { QuestionsPage as CandidateQuestionsPage } from '../pages/candidate/QuestionsPage';
import { SettingsPage } from '../pages/candidate/SettingsPage';
import { EntityDetailPage as VoterEntityDetailPage } from '../pages/voter/EntityDetailPage';
import { HomePage as VoterHomePage } from '../pages/voter/HomePage';
import { IntroPage as VoterIntroPage } from '../pages/voter/IntroPage';
import { QuestionsPage as VoterQuestionsPage } from '../pages/voter/QuestionsPage';
import { ResultsPage as VoterResultsPage } from '../pages/voter/ResultsPage';

// Page fixture types
type PageFixtures = {
  loginPage: LoginPage;
  homePage: HomePage;
  profilePage: ProfilePage;
  candidateQuestionsPage: CandidateQuestionsPage;
  questionPage: QuestionPage;
  settingsPage: SettingsPage;
  previewPage: PreviewPage;
  voterQuestionsPage: VoterQuestionsPage;
  voterHomePage: VoterHomePage;
  voterIntroPage: VoterIntroPage;
  voterResultsPage: VoterResultsPage;
  voterEntityDetailPage: VoterEntityDetailPage;
};

// Extend base test with page object fixtures
export const test = base.extend<PageFixtures>({
  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },
  homePage: async ({ page }, use) => {
    await use(new HomePage(page));
  },
  profilePage: async ({ page }, use) => {
    await use(new ProfilePage(page));
  },
  candidateQuestionsPage: async ({ page }, use) => {
    await use(new CandidateQuestionsPage(page));
  },
  questionPage: async ({ page }, use) => {
    await use(new QuestionPage(page));
  },
  settingsPage: async ({ page }, use) => {
    await use(new SettingsPage(page));
  },
  previewPage: async ({ page }, use) => {
    await use(new PreviewPage(page));
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
export { HomePage } from '../pages/candidate/HomePage';
export { LoginPage } from '../pages/candidate/LoginPage';
export { PreviewPage } from '../pages/candidate/PreviewPage';
export { ProfilePage } from '../pages/candidate/ProfilePage';
export { QuestionPage } from '../pages/candidate/QuestionPage';
export { QuestionsPage as CandidateQuestionsPage } from '../pages/candidate/QuestionsPage';
export { SettingsPage } from '../pages/candidate/SettingsPage';
export { EntityDetailPage as VoterEntityDetailPage } from '../pages/voter/EntityDetailPage';
export { HomePage as VoterHomePage } from '../pages/voter/HomePage';
export { IntroPage as VoterIntroPage } from '../pages/voter/IntroPage';
export { QuestionsPage as VoterQuestionsPage } from '../pages/voter/QuestionsPage';
export { ResultsPage as VoterResultsPage } from '../pages/voter/ResultsPage';
