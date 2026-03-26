/**
 * Candidate session-mutating E2E tests.
 *
 * Covers:
 * - CAND-02: Password change with original password restoration
 * - CAND-01: Logout
 *
 * Separated from candidate-auth.spec.ts because these tests invalidate the
 * stored session's refresh token (signOut revokes it, updateUser invalidates it),
 * which breaks tests that depend on the same storageState.
 *
 * Both tests log in fresh via the login form rather than relying on storageState,
 * because Supabase's admin.updateUserById (called in registration tests to restore
 * passwords) revokes all sessions for the user, invalidating any saved storageState.
 *
 * IMPORTANT: Password change must run BEFORE logout. The logout test calls
 * signOut() which revokes the server-side session. Any test using the same
 * storageState tokens after that will fail with "session not found".
 */

import { test, expect } from '../../fixtures';
import { buildRoute } from '../../utils/buildRoute';
import { TEST_CANDIDATE_EMAIL as CANDIDATE_EMAIL, TEST_CANDIDATE_PASSWORD as CANDIDATE_PASSWORD } from '../../utils/testCredentials';
import { testIds } from '../../utils/testIds';

// Use empty storageState — tests authenticate themselves via login form
test.use({ storageState: { cookies: [], origins: [] } });

/**
 * Log in as the alpha candidate via the login form.
 */
async function loginAsCandidate(page: import('@playwright/test').Page, password = CANDIDATE_PASSWORD): Promise<void> {
  await page.goto(buildRoute({ route: 'CandAppHome', locale: 'en' }));
  await page.getByTestId(testIds.candidate.login.email).waitFor({ state: 'visible', timeout: 15000 });
  await page.getByTestId(testIds.candidate.login.email).fill(CANDIDATE_EMAIL);
  await page.getByTestId(testIds.candidate.login.password).fill(password);
  await page.getByTestId(testIds.candidate.login.submit).click();
  await expect(page).not.toHaveURL(/login/, { timeout: 10000 });
}

test.describe('candidate password change', { tag: ['@candidate'] }, () => {
  test('should change password and login with new password', async ({ page, settingsPage, homePage }) => {
    const originalPassword = CANDIDATE_PASSWORD;
    const newPassword = 'NewPassword2!';

    // Step 1: Log in fresh and navigate to settings page
    await loginAsCandidate(page);
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
    await expect(page.getByTestId(testIds.candidate.login.email)).toBeVisible();

    // Step 6: Login with the new password
    await page.getByTestId(testIds.candidate.login.email).fill(CANDIDATE_EMAIL);
    await page.getByTestId(testIds.candidate.login.password).fill(newPassword);
    await page.getByTestId(testIds.candidate.login.submit).click();

    // Step 7: Expect to reach the candidate home page
    await expect(page).not.toHaveURL(/login/, { timeout: 10000 });
    await homePage.expectStatus();

    // Step 8: RESTORE original password - navigate to settings, change back
    await page.goto(buildRoute({ route: 'CandAppSettings', locale: 'en' }));
    await settingsPage.changePassword(newPassword, originalPassword, originalPassword);

    // Wait for the password change to be processed
    await expect(page.getByText(/updated|saved|success/i)).toBeVisible({ timeout: 10000 });
  });
});

test.describe('candidate logout', { tag: ['@candidate', '@smoke'] }, () => {
  test('should logout and return to login page', async ({ page, homePage }) => {
    // Log in fresh, then navigate to candidate home
    await loginAsCandidate(page);
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
