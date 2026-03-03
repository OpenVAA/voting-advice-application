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
import { QuestionsPage } from '../pages/voter/QuestionsPage';

// Page fixture types
type PageFixtures = {
  loginPage: LoginPage;
  homePage: HomePage;
  questionsPage: QuestionsPage;
};

// Extend base test with page object fixtures
export const test = base.extend<PageFixtures>({
  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },
  homePage: async ({ page }, use) => {
    await use(new HomePage(page));
  },
  questionsPage: async ({ page }, use) => {
    await use(new QuestionsPage(page));
  }
});

// Re-export expect for convenience
export { expect };

// Re-export page objects for direct use if needed
export { HomePage } from '../pages/candidate/HomePage';
export { LoginPage } from '../pages/candidate/LoginPage';
export { QuestionsPage } from '../pages/voter/QuestionsPage';
