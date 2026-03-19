/**
 * Candidate registration and password reset E2E tests.
 *
 * Covers:
 * - CAND-07: Registration via email link (send email, extract link from Inbucket, set password)
 * - CAND-08: Password reset (trigger forgot-password, read reset link from Inbucket email, reset, verify login, restore)
 *
 * Uses unauthenticated browser context since registration and reset flows
 * are for users who are not yet logged in.
 */

import { test, expect } from '../../fixtures';
import { buildRoute } from '../../utils/buildRoute';
import { SupabaseAdminClient } from '../../utils/supabaseAdminClient';
import { countEmailsForRecipient, getLatestEmailHtml, extractLinkFromHtml } from '../../utils/emailHelper';
import candidateAddendum from '../../data/candidate-addendum.json' assert { type: 'json' };
import defaultDataset from '../../data/default-dataset.json' assert { type: 'json' };
import { TEST_CANDIDATE_PASSWORD } from '../../utils/testCredentials';

// Run all tests in this file without authentication
test.use({ storageState: { cookies: [], origins: [] } });

test.describe('candidate registration via email', { tag: ['@candidate'] }, () => {
  test.describe.configure({ mode: 'serial' });

  const client = new SupabaseAdminClient();
  const candidateEmail = candidateAddendum.candidates[0].email;
  const candidateExternalId = candidateAddendum.candidates[0].external_id;
  let registrationLink: string;

  test('should send registration email and extract link', async () => {
    // Count existing emails to skip stale ones from previous test runs
    const emailsBefore = await countEmailsForRecipient(candidateEmail);

    // Send registration email via SupabaseAdminClient (uses candidateExternalId)
    await client.sendEmail({
      candidateExternalId,
      subject: 'Registration',
      content: 'Click here to register: {LINK}'
    });

    // Step 2: Poll for NEW email arrival (skip stale emails from previous runs)
    await expect
      .poll(async () => await getLatestEmailHtml(candidateEmail, emailsBefore), {
        message: 'Waiting for registration email',
        timeout: 15000,
        intervals: [1000, 2000, 3000]
      })
      .toBeTruthy();

    // Step 3: Extract registration link from the NEW email
    const emailHtml = await getLatestEmailHtml(candidateEmail, emailsBefore);
    const link = extractLinkFromHtml(emailHtml!);
    expect(link).toBeTruthy();
    registrationLink = link!;
  });

  test('should complete registration via email link', async ({ page }) => {
    // This test covers registration, login, and ToU acceptance — needs extra time
    test.setTimeout(60000);

    // Step 1: Navigate to the registration link extracted from the email
    await page.goto(registrationLink);

    // Step 2: Set password on the register/password page
    // The register/password page uses PasswordSetter with passwordTestId="register-password"
    // and confirmPasswordTestId="register-confirm-password", and submit at "register-password-submit"
    const passwordWrapper = page.getByTestId('register-password');
    const confirmWrapper = page.getByTestId('register-confirm-password');
    const submitButton = page.getByTestId('register-password-submit');

    // Fill the password input within the wrapper div
    await passwordWrapper.getByTestId('password-field').fill('RegisteredPass1!');
    await confirmWrapper.getByTestId('password-field').fill('RegisteredPass1!');
    await submitButton.click();

    // Step 3: After registration, the app redirects to the login page (not auto-login)
    await expect(page).toHaveURL(/login/, { timeout: 10000 });

    // Step 4: Verify we can login with the newly set password
    await page.getByTestId('login-email').fill(candidateEmail);
    await page.getByTestId('password-field').fill('RegisteredPass1!');
    await page.getByTestId('login-submit').click();

    // Expect navigation away from login
    await expect(page).not.toHaveURL(/login/, { timeout: 10000 });

    // Step 5: Accept Terms of Use (shown on first login after registration)
    const touCheckbox = page.getByTestId('terms-checkbox');
    await expect(touCheckbox).toBeVisible({ timeout: 10000 });
    await touCheckbox.check();
    // Wait for the continue button to be enabled (not in loading state)
    const continueButton = page.getByRole('button', { name: /continue/i });
    await expect(continueButton).toBeEnabled({ timeout: 10000 });
    await continueButton.click();

    // Step 6: Verify we reach the candidate home (save may take a moment)
    await expect(page.getByTestId('candidate-home-status')).toBeVisible({ timeout: 15000 });
  });
});

test.describe('candidate password reset', { tag: ['@candidate'] }, () => {
  test.describe.configure({ mode: 'serial' });

  const client = new SupabaseAdminClient();
  // Use an already-registered candidate from the default dataset
  const candidateEmail = defaultDataset.candidates[0].email;
  const originalPassword = TEST_CANDIDATE_PASSWORD;

  test('should complete forgot-password and reset flow via Inbucket email', async ({ page }) => {
    // CAND-08: Per locked decision, password reset reads the reset link from
    // Inbucket email (via emailHelper), NOT from the API response directly.

    // Count existing emails to skip stale ones from previous test runs
    const emailsBefore = await countEmailsForRecipient(candidateEmail);

    // Trigger forgot-password via Supabase auth (sends the reset email via Inbucket)
    await client.sendForgotPassword(candidateEmail);

    // Step 2: Poll Inbucket inbox for NEW password reset email
    await expect
      .poll(async () => await getLatestEmailHtml(candidateEmail, emailsBefore), {
        message: 'Waiting for password reset email',
        timeout: 15000,
        intervals: [1000, 2000, 3000]
      })
      .toBeTruthy();

    // Step 3: Extract the reset link from the NEW email
    const emailHtml = await getLatestEmailHtml(candidateEmail, emailsBefore);
    const resetLink = extractLinkFromHtml(emailHtml!);
    expect(resetLink).toBeTruthy();

    // Step 4: Navigate to the reset link
    await page.goto(resetLink!);

    // Step 5: Set new password on the password-reset page
    // The password-reset page uses PasswordSetter without explicit testIds on the
    // wrapper divs, so we target the PasswordField inputs directly by their common
    // data-testid="password-field". The first is the new password, second is confirmation.
    const newPassword = 'ResetPass1!';
    const passwordFields = page.getByTestId('password-field');
    await passwordFields.first().fill(newPassword);
    await passwordFields.nth(1).fill(newPassword);
    await page.getByTestId('password-reset-submit').click();

    // Step 6: After reset, the app redirects to the login page
    await expect(page).toHaveURL(/login/, { timeout: 10000 });

    // Step 7: Verify login with the new password
    await page.getByTestId('login-email').fill(candidateEmail);
    await page.getByTestId('password-field').fill(newPassword);
    await page.getByTestId('login-submit').click();

    // Expect to reach the candidate home page
    await expect(page).not.toHaveURL(/login/, { timeout: 10000 });
    await expect(page.getByTestId('candidate-home-status')).toBeVisible();

    // Step 9: RESTORE original password via API using setPassword
    // This is critical for subsequent test runs so auth-setup doesn't break
    await client.setPassword(candidateEmail, originalPassword);
  });
});
