/**
 * Candidate session-mutating E2E tests.
 *
 * Covers:
 * - CAND-01: Logout
 * - CAND-02: Password change with original password restoration
 *
 * Separated from candidate-auth.spec.ts because these tests invalidate the
 * stored session's refresh token (signOut revokes it, updateUser invalidates it),
 * which breaks tests that depend on the same storageState.
 *
 * Runs in the `candidate-app-password` project which depends on `re-auth-setup`
 * to provide fresh authentication after mutation tests invalidated the original
 * storageState (password reset revokes refresh tokens via admin setPassword).
 */

import { test, expect } from '../../fixtures';
import { buildRoute } from '../../utils/buildRoute';
import { TEST_CANDIDATE_EMAIL as CANDIDATE_EMAIL, TEST_CANDIDATE_PASSWORD as CANDIDATE_PASSWORD } from '../../utils/testCredentials';

test.describe('candidate logout', { tag: ['@candidate', '@smoke'] }, () => {
  test('should logout and return to login page', async ({ page, homePage }) => {
    // Navigate to candidate home (authenticated via re-auth storageState)
    await page.goto(buildRoute({ route: 'CandAppHome', locale: 'en' }));
    await homePage.expectStatus();

    // Click the logout button on the candidate home page
    const logoutButton = page.getByTestId('candidate-home-logout');
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
    await expect(page.getByTestId('login-email')).toBeVisible();
  });
});

test.describe('candidate password change', { tag: ['@candidate'] }, () => {
  test('should change password and login with new password', async ({ page, loginPage, settingsPage, homePage }) => {
    const originalPassword = CANDIDATE_PASSWORD;
    const newPassword = 'NewPassword2!';

    // Step 1: Navigate to settings page (authenticated via re-auth storageState)
    await page.goto(buildRoute({ route: 'CandAppSettings', locale: 'en' }));

    // Step 2: Change password
    await settingsPage.changePassword(originalPassword, newPassword, newPassword);

    // Step 3: Wait for the password change to succeed
    // The settings page shows a SuccessMessage with the "updated" text
    await expect(page.getByText(/updated|saved|success/i)).toBeVisible({ timeout: 10000 });

    // Step 4: Navigate to login page (this also clears the authenticated session context)
    await page.context().clearCookies();
    await page.goto(buildRoute({ route: 'CandAppLogin', locale: 'en' }));

    // Step 5: Verify we're on the login page
    await expect(page.getByTestId('login-email')).toBeVisible();

    // Step 6: Login with the new password
    await loginPage.login(CANDIDATE_EMAIL, newPassword);

    // Step 7: Expect to reach the candidate home page
    await expect(page).not.toHaveURL(/login/);
    await homePage.expectStatus();

    // Step 8: RESTORE original password - navigate to settings, change back
    await page.goto(buildRoute({ route: 'CandAppSettings', locale: 'en' }));
    await settingsPage.changePassword(newPassword, originalPassword, originalPassword);

    // Wait for the password change to be processed
    await expect(page.getByText(/updated|saved|success/i)).toBeVisible({ timeout: 10000 });
  });
});
