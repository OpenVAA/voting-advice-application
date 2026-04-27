/**
 * Candidate authentication E2E tests (non-destructive).
 *
 * Covers CAND-01: Login with valid/invalid credentials.
 *
 * Tests that invalidate the stored session (logout, password change) are in
 * candidate-password.spec.ts, which runs in candidate-app-mutation AFTER
 * all tests that depend on the stored storageState have completed.
 *
 * Runs within the `candidate-app` project which provides pre-authenticated
 * storageState via auth-setup.
 */

import { test, expect } from '../../fixtures';
import { buildRoute } from '../../utils/buildRoute';
import { TEST_CANDIDATE_EMAIL as CANDIDATE_EMAIL, TEST_CANDIDATE_PASSWORD as CANDIDATE_PASSWORD } from '../../utils/testCredentials';

test.describe('candidate authentication', { tag: ['@candidate', '@smoke'] }, () => {
  test('should login with valid credentials', async ({ page, loginPage, homePage }) => {
    // Clear auth state so we start unauthenticated
    await page.context().clearCookies();
    await page.goto(buildRoute({ route: 'CandAppLogin', locale: 'en' }));

    await loginPage.login(CANDIDATE_EMAIL, CANDIDATE_PASSWORD);

    // Expect navigation away from login page
    await expect(page).not.toHaveURL(/login/);

    // Expect the candidate home status message to be visible
    await homePage.expectStatus();
  });

  test('should show error on invalid credentials', async ({ page, loginPage }) => {
    // Clear auth state so we start unauthenticated
    await page.context().clearCookies();
    await page.goto(buildRoute({ route: 'CandAppLogin', locale: 'en' }));

    await loginPage.login(CANDIDATE_EMAIL, 'WrongPassword!');

    // Expect the error message to appear
    await loginPage.expectLoginError();
  });
});
