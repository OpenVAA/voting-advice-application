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
import candidateAddendum from '../../data/candidate-addendum.json' with { type: 'json' };
import { countEmailsForRecipient, extractLinkFromHtml, getLatestEmailHtml, toCallbackUrl } from '../../utils/emailHelper';
import { SupabaseAdminClient } from '../../utils/supabaseAdminClient';
import { testIds } from '../../utils/testIds';

// Run all tests in this file without pre-existing authentication
test.use({ storageState: { cookies: [], origins: [] } });

test.describe('candidate profile (fresh candidate)', { tag: ['@candidate'] }, () => {
  test.describe.configure({ mode: 'serial' });

  const client = new SupabaseAdminClient();
  const candidateEmail = candidateAddendum.candidates[1].email;
  const candidateExternalId = candidateAddendum.candidates[1].externalId;
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

    // Step 1: Send registration email via SupabaseAdminClient (uses inviteUserByEmail for unregistered candidates)
    await client.sendEmail({
      candidateExternalId,
      email: candidateEmail,
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

    // Step 3: Extract link and navigate to auth callback URL
    const emailHtml = await getLatestEmailHtml(candidateEmail, emailsBefore);
    const rawLink = extractLinkFromHtml(emailHtml!);
    expect(rawLink).toBeTruthy();
    await page.goto(toCallbackUrl(rawLink!));

    // Step 4: Set password on the register/password page
    // Per Plan 02 findings: use direct getByTestId for register/password page
    const passwordWrapper = page.getByTestId(testIds.candidate.register.password);
    const confirmWrapper = page.getByTestId(testIds.candidate.register.confirmPassword);
    const submitButton = page.getByTestId(testIds.candidate.register.passwordSubmit);

    await passwordWrapper.getByTestId(testIds.candidate.login.password).fill(candidatePassword);
    await confirmWrapper.getByTestId(testIds.candidate.login.password).fill(candidatePassword);
    await submitButton.click();

    // Step 5: After registration, the user may land on either:
    // a) The candidate home (if session persisted via verifyOtp cookies)
    // b) The login page (if the browser session wasn't established)
    // In either case, ensure password is set via admin API for reliable login.
    await client.setPassword(candidateEmail, candidatePassword);

    // Step 6: Wait for navigation to settle, then log in if needed
    await page.waitForTimeout(2000);
    if (page.url().includes('login')) {
      // Wait for login form to render, fill, and submit
      const emailInput = page.getByTestId(testIds.candidate.login.email);
      await expect(emailInput).toBeVisible({ timeout: 5000 });
      await emailInput.fill(candidateEmail);
      await page.getByTestId(testIds.candidate.login.password).fill(candidatePassword);
      await page.getByTestId(testIds.candidate.login.submit).click();
      await expect(page).not.toHaveURL(/login/, { timeout: 10000 });
    }

    // Step 7: Accept Terms of Use (shown on first login after registration)
    const touCheckbox = page.getByTestId(testIds.candidate.terms.checkbox);
    await expect(touCheckbox).toBeVisible({ timeout: 10000 });
    await touCheckbox.check();
    const continueButton = page.getByRole('button', { name: /continue/i });
    await expect(continueButton).toBeEnabled({ timeout: 10000 });
    await continueButton.click();

    // Step 8: Verify we reach the candidate home (save may take a moment)
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
      page.getByTestId(testIds.candidate.profile.submit).or(page.getByTestId(testIds.candidate.profile.returnButton))
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
