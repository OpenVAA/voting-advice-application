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

import { test, expect } from '../../fixtures';
import { buildRoute } from '../../utils/buildRoute';

test.describe('candidate authentication', () => {
  test('should login with valid credentials', async ({ page, loginPage, homePage }) => {
    // Clear auth state so we start unauthenticated
    await page.context().clearCookies();
    await page.goto(buildRoute({ route: 'CandAppLogin', locale: 'en' }));

    await loginPage.login('mock.candidate.2@openvaa.org', 'Password1!');

    // Expect navigation away from login page
    await expect(page).not.toHaveURL(/login/);

    // Expect the candidate home status message to be visible
    await homePage.expectStatus();
  });

  test('should show error on invalid credentials', async ({ page, loginPage }) => {
    // Clear auth state so we start unauthenticated
    await page.context().clearCookies();
    await page.goto(buildRoute({ route: 'CandAppLogin', locale: 'en' }));

    await loginPage.login('mock.candidate.2@openvaa.org', 'WrongPassword!');

    // Expect the error message to appear
    await loginPage.expectLoginError();
  });

  test('should logout and return to login page', async ({ page, homePage }) => {
    // Navigate to candidate home (authenticated via storageState)
    await page.goto(buildRoute({ route: 'CandAppHome', locale: 'en' }));
    await homePage.expectStatus();

    // Click the logout button on the candidate home page
    const logoutButton = page.getByTestId('candidate-home-logout');
    await logoutButton.click();

    // The logout button may trigger a modal if there are unanswered questions.
    // If a modal appears, confirm logout by clicking the logout button in the modal.
    // Wait for either: URL changes to login, or a modal appears.
    const loginUrl = buildRoute({ route: 'CandAppLogin', locale: 'en' });
    try {
      await expect(page).toHaveURL(new RegExp(loginUrl), { timeout: 5000 });
    } catch {
      // If we didn't navigate to login, a modal may have appeared. Look for
      // a secondary logout confirmation button (the modal has a logout button).
      // The modal logout button uses color="warning" and text "Logout".
      // Since we can't use text selectors, use role-based locator.
      const modalLogoutButton = page.getByRole('button', { name: /logout/i });
      // There may be multiple -- the first is the original, the second is in the modal
      const buttons = await modalLogoutButton.all();
      if (buttons.length > 1) {
        await buttons[buttons.length - 1].click();
      } else if (buttons.length === 1) {
        await buttons[0].click();
      }
      await expect(page).toHaveURL(new RegExp(loginUrl), { timeout: 10000 });
    }

    // Verify we are on the login page by checking for the login form
    await expect(page.getByTestId('login-email')).toBeVisible();
  });
});

test.describe('candidate password change', () => {
  test('should change password and login with new password', async ({ page, loginPage, settingsPage, homePage }) => {
    const originalPassword = 'Password1!';
    const newPassword = 'NewPassword2!';

    // Step 1: Navigate to settings page (authenticated via storageState)
    await page.goto(buildRoute({ route: 'CandAppSettings', locale: 'en' }));

    // Step 2: Change password
    await settingsPage.changePassword(originalPassword, newPassword, newPassword);

    // Step 3: Wait for success feedback or at least for the form to process
    // The settings page shows a SuccessMessage on successful password change
    await expect(page.getByTestId('settings-update-password')).toBeVisible();

    // Step 4: Navigate to login page (this also clears the authenticated session context)
    await page.context().clearCookies();
    await page.goto(buildRoute({ route: 'CandAppLogin', locale: 'en' }));

    // Step 5: Verify we're on the login page
    await expect(page.getByTestId('login-email')).toBeVisible();

    // Step 6: Login with the new password
    await loginPage.login('mock.candidate.2@openvaa.org', newPassword);

    // Step 7: Expect to reach the candidate home page
    await expect(page).not.toHaveURL(/login/);
    await homePage.expectStatus();

    // Step 8: RESTORE original password - navigate to settings, change back
    await page.goto(buildRoute({ route: 'CandAppSettings', locale: 'en' }));
    await settingsPage.changePassword(newPassword, originalPassword, originalPassword);

    // Wait for the password change to be processed
    await expect(page.getByTestId('settings-update-password')).toBeVisible();
  });
});
