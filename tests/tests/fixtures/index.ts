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
 *   await loginPage.login('mock.candidate.2@openvaa.org', 'Password1!');
 * });
 * ```
 *
 * New page objects are added here as they are created in Phase 2+.
 * Auth fixture is available separately in `auth.fixture.ts` for tests
 * that need re-authentication within a worker.
 */
import { expect, test as base } from '@playwright/test';
import { HomePage } from '../pages/candidate/HomePage';
import { LoginPage } from '../pages/candidate/LoginPage';
import { ProfilePage } from '../pages/candidate/ProfilePage';
import { QuestionsPage as CandidateQuestionsPage } from '../pages/candidate/QuestionsPage';
import { QuestionPage } from '../pages/candidate/QuestionPage';
import { SettingsPage } from '../pages/candidate/SettingsPage';
import { PreviewPage } from '../pages/candidate/PreviewPage';
import { RegisterPage } from '../pages/candidate/RegisterPage';
import { ForgotPasswordPage } from '../pages/candidate/ForgotPasswordPage';
import { QuestionsPage as VoterQuestionsPage } from '../pages/voter/QuestionsPage';
import { HomePage as VoterHomePage } from '../pages/voter/HomePage';
import { IntroPage as VoterIntroPage } from '../pages/voter/IntroPage';
import { ResultsPage as VoterResultsPage } from '../pages/voter/ResultsPage';
import { EntityDetailPage as VoterEntityDetailPage } from '../pages/voter/EntityDetailPage';

// Page fixture types
type PageFixtures = {
  loginPage: LoginPage;
  homePage: HomePage;
  profilePage: ProfilePage;
  candidateQuestionsPage: CandidateQuestionsPage;
  questionPage: QuestionPage;
  settingsPage: SettingsPage;
  previewPage: PreviewPage;
  registerPage: RegisterPage;
  forgotPasswordPage: ForgotPasswordPage;
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
  registerPage: async ({ page }, use) => {
    await use(new RegisterPage(page));
  },
  forgotPasswordPage: async ({ page }, use) => {
    await use(new ForgotPasswordPage(page));
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
export { ProfilePage } from '../pages/candidate/ProfilePage';
export { QuestionsPage as CandidateQuestionsPage } from '../pages/candidate/QuestionsPage';
export { QuestionPage } from '../pages/candidate/QuestionPage';
export { SettingsPage } from '../pages/candidate/SettingsPage';
export { PreviewPage } from '../pages/candidate/PreviewPage';
export { RegisterPage } from '../pages/candidate/RegisterPage';
export { ForgotPasswordPage } from '../pages/candidate/ForgotPasswordPage';
export { QuestionsPage as VoterQuestionsPage } from '../pages/voter/QuestionsPage';
export { HomePage as VoterHomePage } from '../pages/voter/HomePage';
export { IntroPage as VoterIntroPage } from '../pages/voter/IntroPage';
export { ResultsPage as VoterResultsPage } from '../pages/voter/ResultsPage';
export { EntityDetailPage as VoterEntityDetailPage } from '../pages/voter/EntityDetailPage';
