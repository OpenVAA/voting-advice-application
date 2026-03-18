/**
 * Candidate authentication E2E tests.
 *
 * Covers:
 * - CAND-01: Login with valid/invalid credentials, logout
 * - CAND-02: Password change with original password restoration
 *
 * Runs within the `candidate-app` project which provides pre-authenticated
 * storageState via auth-setup.
 */

import { expect, test } from '../../fixtures';
import { buildRoute } from '../../utils/buildRoute';
import {
  TEST_CANDIDATE_EMAIL as CANDIDATE_EMAIL,
  TEST_CANDIDATE_PASSWORD as CANDIDATE_PASSWORD
} from '../../utils/testCredentials';
import { testIds } from '../../utils/testIds';

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

  test('should logout and return to login page', async ({ page, homePage }) => {
    // Navigate to candidate home (authenticated via storageState)
    await page.goto(buildRoute({ route: 'CandAppHome', locale: 'en' }));
    await homePage.expectStatus();

    // Click the logout button on the candidate home page
    const logoutButton = page.getByTestId(testIds.candidate.home.logout);
    await logoutButton.click();

    // The candidate has unanswered questions, so a confirmation dialog appears
    // with a countdown timer that auto-logs-out after 3 seconds.
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible({ timeout: 5000 });

    // Click the "Log Out" button inside the dialog (note the space in "Log Out")
    await dialog.getByRole('button', { name: /log out/i }).click();

    // Wait for navigation to the login page
    const loginUrl = buildRoute({ route: 'CandAppLogin', locale: 'en' });
    await expect(page).toHaveURL(new RegExp(loginUrl), { timeout: 15000 });

    // Verify we are on the login page by checking for the login form
    await expect(page.getByTestId(testIds.candidate.login.email)).toBeVisible();
  });
});

test.describe('candidate password change', { tag: ['@candidate'] }, () => {
  test('should change password and login with new password', async ({ page, loginPage, settingsPage, homePage }) => {
    const originalPassword = CANDIDATE_PASSWORD;
    const newPassword = 'NewPassword2!';

    // Step 1: Navigate to settings page (authenticated via storageState)
    await page.goto(buildRoute({ route: 'CandAppSettings', locale: 'en' }));

    // Step 2: Change password
    await settingsPage.changePassword(originalPassword, newPassword, newPassword);

    // Step 3: Wait for success feedback or at least for the form to process
    // The settings page shows a SuccessMessage on successful password change
    await expect(page.getByTestId(testIds.candidate.settings.updateButton)).toBeVisible();

    // Step 4: Navigate to login page (this also clears the authenticated session context)
    await page.context().clearCookies();
    await page.goto(buildRoute({ route: 'CandAppLogin', locale: 'en' }));

    // Step 5: Verify we're on the login page
    await expect(page.getByTestId(testIds.candidate.login.email)).toBeVisible();

    // Step 6: Login with the new password
    await loginPage.login(CANDIDATE_EMAIL, newPassword);

    // Step 7: Expect to reach the candidate home page
    await expect(page).not.toHaveURL(/login/);
    await homePage.expectStatus();

    // Step 8: RESTORE original password - navigate to settings, change back
    await page.goto(buildRoute({ route: 'CandAppSettings', locale: 'en' }));
    await settingsPage.changePassword(newPassword, originalPassword, originalPassword);

    // Wait for the password change to be processed
    await expect(page.getByTestId(testIds.candidate.settings.updateButton)).toBeVisible();
  });
});
