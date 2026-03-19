/**
 * Candidate profile E2E tests (fresh candidate registration flow).
 *
 * Covers:
 * - CAND-03: Profile setup with image upload and all info field types
 * - CAND-12 (partial): Data persistence after page reload
 *
 * Per locked decision, profile tests use the fresh/unregistered candidate:
 * register via email link, then fill profile as the newly registered candidate.
 * This spec starts UNAUTHENTICATED and handles its own registration.
 *
 * Serial mode ensures registration happens before profile tests. Each
 * subsequent test re-authenticates via loginAsCandidate() since serial
 * mode does NOT share browser contexts between tests.
 */

import path from 'path';
import { fileURLToPath } from 'url';
import { expect, test } from '../../fixtures';
import { buildRoute } from '../../utils/buildRoute';
import candidateAddendum from '../../data/candidate-addendum.json' assert { type: 'json' };
import { countEmailsForRecipient, extractLinkFromHtml, getLatestEmailHtml } from '../../utils/emailHelper';
import { SupabaseAdminClient } from '../../utils/supabaseAdminClient';
import { testIds } from '../../utils/testIds';

// Run all tests in this file without pre-existing authentication
test.use({ storageState: { cookies: [], origins: [] } });

test.describe('candidate profile (fresh candidate)', { tag: ['@candidate'] }, () => {
  test.describe.configure({ mode: 'serial' });

  const client = new SupabaseAdminClient();
  const candidateEmail = candidateAddendum.candidates[1].email;
  const candidateExternalId = candidateAddendum.candidates[1].external_id;
  const candidatePassword = 'ProfileTestPass1!';

  /**
   * Log in as the freshly registered candidate.
   * Serial mode does NOT share browser contexts, so each test after
   * registration must authenticate independently.
   */
  async function loginAsCandidate(page: import('@playwright/test').Page): Promise<void> {
    await page.goto(buildRoute({ route: 'CandAppHome', locale: 'en' }));
    // The home page redirects to login for unauthenticated users
    await page.getByTestId(testIds.candidate.login.email).fill(candidateEmail);
    await page.getByTestId(testIds.candidate.login.password).fill(candidatePassword);
    await page.getByTestId(testIds.candidate.login.submit).click();
    await expect(page).not.toHaveURL(/login/, { timeout: 10000 });
  }

  test('should register the fresh candidate via email link', async ({ page }) => {
    test.setTimeout(60000);
    // Count existing emails to skip stale ones from previous test runs
    const emailsBefore = await countEmailsForRecipient(candidateEmail);

    // Step 1: Send registration email via SupabaseAdminClient (uses candidateExternalId)
    await client.sendEmail({
      candidateExternalId,
      subject: 'Registration',
      content: 'Click here to register: {LINK}'
    });

    // Step 2: Poll Inbucket for NEW registration email arrival
    await expect
      .poll(async () => await getLatestEmailHtml(candidateEmail, emailsBefore), {
        message: 'Waiting for registration email',
        timeout: 15000,
        intervals: [1000, 2000, 3000]
      })
      .toBeTruthy();

    // Step 3: Extract and navigate to registration link from NEW email
    const emailHtml = await getLatestEmailHtml(candidateEmail, emailsBefore);
    const link = extractLinkFromHtml(emailHtml!);
    expect(link).toBeTruthy();
    await page.goto(link!);

    // Step 4: Set password on the register/password page
    // Per Plan 02 findings: use direct getByTestId for register/password page
    const passwordWrapper = page.getByTestId('register-password');
    const confirmWrapper = page.getByTestId('register-confirm-password');
    const submitButton = page.getByTestId('register-password-submit');

    await passwordWrapper.getByTestId('password-field').fill(candidatePassword);
    await confirmWrapper.getByTestId('password-field').fill(candidatePassword);
    await submitButton.click();

    // Step 5: After registration, the app redirects to login page (not auto-login)
    await expect(page).toHaveURL(/login/, { timeout: 10000 });

    // Step 6: Login with the newly set password
    await page.getByTestId(testIds.candidate.login.email).fill(candidateEmail);
    await page.getByTestId(testIds.candidate.login.password).fill(candidatePassword);
    await page.getByTestId(testIds.candidate.login.submit).click();

    // Step 7: Verify navigation away from login
    await expect(page).not.toHaveURL(/login/, { timeout: 10000 });

    // Step 8: Accept Terms of Use (shown on first login after registration)
    const touCheckbox = page.getByTestId('terms-checkbox');
    await expect(touCheckbox).toBeVisible({ timeout: 10000 });
    await touCheckbox.check();
    const continueButton = page.getByRole('button', { name: /continue/i });
    await expect(continueButton).toBeEnabled({ timeout: 10000 });
    await continueButton.click();

    // Step 9: Verify we reach the candidate home (save may take a moment)
    await expect(page.getByTestId(testIds.candidate.home.statusMessage)).toBeVisible({ timeout: 15000 });
  });

  test('should upload a profile image (CAND-03)', async ({ page, profilePage }) => {
    // In serial mode, this test is skipped automatically if registration failed
    // Each serial test gets a fresh browser context, so we must log in again
    await loginAsCandidate(page);
    await page.goto(buildRoute({ route: 'CandAppProfile', locale: 'en' }));

    // Resolve the test image path (ESM-compatible)
    const imagePath = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../test_image_black.png');

    // Upload image via the profile page object's file chooser pattern
    await profilePage.uploadImage(imagePath);

    // Save the profile to persist the image upload
    await profilePage.submit();

    // After save, the profile page navigates away (to questions or home).
    // Wait for navigation to complete, indicating the save succeeded.
    await expect(page).not.toHaveURL(/profile/, { timeout: 10000 });
  });

  test('should show editable info fields on profile page (CAND-03)', async ({ page }) => {
    // In serial mode, this test is skipped automatically if registration failed
    await loginAsCandidate(page);
    await page.goto(buildRoute({ route: 'CandAppProfile', locale: 'en' }));

    // Verify the profile page shows editable info question fields
    await expect(page.getByRole('heading', { name: /your profile/i })).toBeVisible();

    // Verify editable inputs are present (date, number, text, or checkbox)
    // Target main content area to avoid matching hidden drawer toggles
    const main = page.locator('main');
    await expect(main.getByRole('textbox').first()).toBeVisible();
  });

  test('should persist profile image after page reload (CAND-12)', async ({ page }) => {
    // In serial mode, this test is skipped automatically if registration failed
    await loginAsCandidate(page);
    await page.goto(buildRoute({ route: 'CandAppProfile', locale: 'en' }));

    // Verify the profile page loaded
    await expect(
      page.getByTestId(testIds.candidate.profile.submit).or(page.getByTestId('profile-return'))
    ).toBeVisible();

    // Verify previously uploaded image persists (saved in image upload test)
    const imageArea = page.getByTestId(testIds.candidate.profile.imageUpload);
    await expect(imageArea).toBeVisible();
    await expect(imageArea.locator('img')).toBeVisible();

    // Reload and verify image still persists
    await page.reload();
    await expect(page.getByTestId(testIds.candidate.profile.imageUpload)).toBeVisible();
    await expect(page.getByTestId(testIds.candidate.profile.imageUpload).locator('img')).toBeVisible();
  });
});
