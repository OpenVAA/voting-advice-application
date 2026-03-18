/**
 * Candidate registration and password reset E2E tests.
 *
 * Covers:
 * - CAND-07: Registration via email link (send email, extract link from SES, set password)
 * - CAND-08: Password reset (trigger forgot-password, read reset link from SES email, reset, verify login, restore)
 *
 * Uses unauthenticated browser context since registration and reset flows
 * are for users who are not yet logged in.
 */

import candidateAddendum from '../../data/candidate-addendum.json' with { type: 'json' };
import defaultDataset from '../../data/default-dataset.json' with { type: 'json' };
import { expect, test } from '../../fixtures';
import { countEmailsForRecipient, extractLinkFromHtml, getLatestEmailHtml } from '../../utils/emailHelper';
import { StrapiAdminClient } from '../../utils/strapiAdminClient';
import { TEST_CANDIDATE_PASSWORD } from '../../utils/testCredentials';
import { testIds } from '../../utils/testIds';

// Run all tests in this file without authentication
test.use({ storageState: { cookies: [], origins: [] } });

test.describe('candidate registration via email', { tag: ['@candidate'] }, () => {
  test.describe.configure({ mode: 'serial' });

  const client = new StrapiAdminClient();
  const candidateEmail = candidateAddendum.candidates[0].email;
  let registrationLink: string;

  test.beforeAll(async () => {
    await client.login();
  });

  test.afterAll(async () => {
    await client.dispose();
  });

  test('should send registration email and extract link', async () => {
    // Count existing emails to skip stale ones from previous test runs
    const emailsBefore = await countEmailsForRecipient(candidateEmail);

    // Step 1: Find the unregistered candidate's documentId
    const findResult = await client.findData('candidates', {
      email: { $eq: candidateEmail }
    });
    const candidateDocumentId = findResult.data?.[0]?.documentId as string | undefined;
    expect(candidateDocumentId).toBeTruthy();

    // Step 2: Send registration email via Admin Tools
    await client.sendEmail({
      candidateId: candidateDocumentId!,
      subject: 'Registration',
      content: 'Click here to register: {LINK}',
      requireRegistrationKey: true
    });

    // Step 3: Poll for NEW email arrival (skip stale emails from previous runs)
    await expect
      .poll(async () => await getLatestEmailHtml(candidateEmail, emailsBefore), {
        message: 'Waiting for registration email',
        timeout: 15000,
        intervals: [1000, 2000, 3000]
      })
      .toBeTruthy();

    // Step 4: Extract registration link from the NEW email
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
    const passwordWrapper = page.getByTestId(testIds.candidate.register.password);
    const confirmWrapper = page.getByTestId(testIds.candidate.register.confirmPassword);
    const submitButton = page.getByTestId(testIds.candidate.register.passwordSubmit);

    // Fill the password input within the wrapper div
    await passwordWrapper.getByTestId(testIds.candidate.login.password).fill('RegisteredPass1!');
    await confirmWrapper.getByTestId(testIds.candidate.login.password).fill('RegisteredPass1!');
    await submitButton.click();

    // Step 3: After registration, the app redirects to the login page (not auto-login)
    await expect(page).toHaveURL(/login/, { timeout: 10000 });

    // Step 4: Verify we can login with the newly set password
    await page.getByTestId(testIds.candidate.login.email).fill(candidateEmail);
    await page.getByTestId(testIds.candidate.login.password).fill('RegisteredPass1!');
    await page.getByTestId(testIds.candidate.login.submit).click();

    // Expect navigation away from login
    await expect(page).not.toHaveURL(/login/, { timeout: 10000 });

    // Step 5: Accept Terms of Use (shown on first login after registration)
    const touCheckbox = page.getByTestId(testIds.candidate.terms.checkbox);
    await expect(touCheckbox).toBeVisible({ timeout: 10000 });
    await touCheckbox.check();
    // Wait for the continue button to be enabled (not in loading state)
    const continueButton = page.getByRole('button', { name: /continue/i });
    await expect(continueButton).toBeEnabled({ timeout: 10000 });
    await continueButton.click();

    // Step 6: Verify we reach the candidate home (save may take a moment)
    await expect(page.getByTestId(testIds.candidate.home.statusMessage)).toBeVisible({ timeout: 15000 });
  });
});

test.describe('candidate password reset', { tag: ['@candidate'] }, () => {
  test.describe.configure({ mode: 'serial' });

  const client = new StrapiAdminClient();
  // Use an already-registered candidate from the default dataset
  const candidateEmail = defaultDataset.candidates[0].email;
  const originalPassword = TEST_CANDIDATE_PASSWORD;

  test.beforeAll(async () => {
    await client.login();
  });

  test.afterAll(async () => {
    await client.dispose();
  });

  test('should complete forgot-password and reset flow via SES email', async ({ page }) => {
    // CAND-08: Per locked decision, password reset reads the reset link from
    // SES email (via emailHelper), NOT from the API response directly.

    // Count existing emails to skip stale ones from previous test runs
    const emailsBefore = await countEmailsForRecipient(candidateEmail);

    // Step 1: Find the candidate's documentId
    const findResult = await client.findData('candidates', {
      email: { $eq: candidateEmail }
    });
    const candidateDocumentId = findResult.data?.[0]?.documentId as string | undefined;
    expect(candidateDocumentId).toBeTruthy();

    // Step 2: Trigger forgot-password via API (sends the reset email)
    await client.sendForgotPassword({ documentId: candidateDocumentId! });

    // Step 3: Poll SES inbox for NEW password reset email
    await expect
      .poll(async () => await getLatestEmailHtml(candidateEmail, emailsBefore), {
        message: 'Waiting for password reset email',
        timeout: 15000,
        intervals: [1000, 2000, 3000]
      })
      .toBeTruthy();

    // Step 4: Extract the reset link from the NEW email
    const emailHtml = await getLatestEmailHtml(candidateEmail, emailsBefore);
    const resetLink = extractLinkFromHtml(emailHtml!);
    expect(resetLink).toBeTruthy();

    // Step 5: Navigate to the reset link
    await page.goto(resetLink!);

    // Step 6: Set new password on the password-reset page
    // The password-reset page uses PasswordSetter without explicit testIds on the
    // wrapper divs, so we target the PasswordField inputs directly by their common
    // data-testid="password-field". The first is the new password, second is confirmation.
    const newPassword = 'ResetPass1!';
    const passwordFields = page.getByTestId(testIds.candidate.login.password);
    await passwordFields.first().fill(newPassword);
    await passwordFields.nth(1).fill(newPassword);
    await page.getByTestId(testIds.candidate.passwordReset.submit).click();

    // Step 7: After reset, the app redirects to the login page
    await expect(page).toHaveURL(/login/, { timeout: 10000 });

    // Step 8: Verify login with the new password
    await page.getByTestId(testIds.candidate.login.email).fill(candidateEmail);
    await page.getByTestId(testIds.candidate.login.password).fill(newPassword);
    await page.getByTestId(testIds.candidate.login.submit).click();

    // Expect to reach the candidate home page
    await expect(page).not.toHaveURL(/login/, { timeout: 10000 });
    await expect(page.getByTestId(testIds.candidate.home.statusMessage)).toBeVisible();

    // Step 9: RESTORE original password via API using setPassword
    // This is critical for subsequent test runs so auth-setup doesn't break
    const restoreResult = await client.setPassword({
      documentId: candidateDocumentId!,
      password: originalPassword
    });
    expect(restoreResult.type, `Failed to restore password: ${restoreResult.cause}`).toBe('success');
  });
});
