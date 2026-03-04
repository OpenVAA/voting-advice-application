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
 * Serial mode ensures registration happens before profile tests, and the
 * browser context retains the authenticated session across tests.
 */

import path from 'path';
import { fileURLToPath } from 'url';
import { test, expect } from '../../fixtures';
import { buildRoute } from '../../utils/buildRoute';
import { testIds } from '../../utils/testIds';
import { StrapiAdminClient } from '../../utils/strapiAdminClient';
import { getLatestEmailHtml, extractLinkFromHtml } from '../../utils/emailHelper';

// Run all tests in this file without pre-existing authentication
test.use({ storageState: { cookies: [], origins: [] } });

test.describe('candidate profile (fresh candidate)', () => {
  test.describe.configure({ mode: 'serial' });

  const client = new StrapiAdminClient();
  const candidateEmail = 'test.unregistered@openvaa.org';
  const candidatePassword = 'ProfileTestPass1!';

  test.beforeAll(async () => {
    await client.login();
  });

  test.afterAll(async () => {
    await client.dispose();
  });

  test('should register the fresh candidate via email link', async ({ page }) => {
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

    // Step 3: Poll SES for registration email arrival
    await expect
      .poll(async () => await getLatestEmailHtml(candidateEmail), {
        message: 'Waiting for registration email',
        timeout: 15000,
        intervals: [1000, 2000, 3000]
      })
      .toBeTruthy();

    // Step 4: Extract and navigate to registration link
    const emailHtml = await getLatestEmailHtml(candidateEmail);
    const link = extractLinkFromHtml(emailHtml!);
    expect(link).toBeTruthy();
    await page.goto(link!);

    // Step 5: Set password on the register/password page
    // Per Plan 02 findings: use direct getByTestId for register/password page
    const passwordWrapper = page.getByTestId('register-password');
    const confirmWrapper = page.getByTestId('register-confirm-password');
    const submitButton = page.getByTestId('register-password-submit');

    await passwordWrapper.getByTestId('password-field').fill(candidatePassword);
    await confirmWrapper.getByTestId('password-field').fill(candidatePassword);
    await submitButton.click();

    // Step 6: After registration, the app redirects to login page (not auto-login)
    await expect(page).toHaveURL(/login/, { timeout: 10000 });

    // Step 7: Login with the newly set password
    await page.getByTestId(testIds.candidate.login.email).fill(candidateEmail);
    await page.getByTestId(testIds.candidate.login.password).fill(candidatePassword);
    await page.getByTestId(testIds.candidate.login.submit).click();

    // Step 8: Verify we are authenticated and on the candidate home
    await expect(page).not.toHaveURL(/login/, { timeout: 10000 });
    await expect(page.getByTestId(testIds.candidate.home.statusMessage)).toBeVisible();
  });

  test('should upload a profile image (CAND-03)', async ({ page, profilePage }) => {
    // Navigate to profile page (authenticated from previous test in serial mode)
    await page.goto(buildRoute({ route: 'CandAppProfile', locale: 'en' }));

    // Resolve the test image path (ESM-compatible)
    const imagePath = path.resolve(
      path.dirname(fileURLToPath(import.meta.url)),
      '../../test_image_black.png'
    );

    // Upload image via the profile page object's file chooser pattern
    await profilePage.uploadImage(imagePath);

    // Save the profile to persist the image upload
    await profilePage.submit();

    // After save, the profile page navigates away (to questions or home).
    // Wait for navigation to complete, indicating the save succeeded.
    await expect(page).not.toHaveURL(/profile/, { timeout: 10000 });
  });

  test('should fill info question fields and save (CAND-03)', async ({ page, profilePage }) => {
    // Navigate to profile page
    await page.goto(buildRoute({ route: 'CandAppProfile', locale: 'en' }));

    // The profile page shows:
    // 1. Immutable data (first name, last name, locked info questions)
    // 2. Nominations
    // 3. Editable data: image (already uploaded) and editable info questions
    //
    // Info questions rendered via QuestionInput -> Input component.
    // They use standard HTML input types based on question type.
    // Since QuestionInput passes restProps to Input, and the profile page
    // doesn't add data-testid to individual QuestionInputs, we target
    // the inputs by their type within the editable section.

    // Fill a text input (if visible - text info question from dataset)
    const textInputs = page.locator('input[type="text"]:not([readonly]):not([disabled])');
    const textInputCount = await textInputs.count();
    if (textInputCount > 0) {
      await textInputs.first().fill('Test campaign slogan');
    }

    // Fill a number input (if visible - number info question from dataset)
    const numberInputs = page.locator('input[type="number"]:not([readonly]):not([disabled])');
    const numberInputCount = await numberInputs.count();
    if (numberInputCount > 0) {
      await numberInputs.first().fill('42');
    }

    // Fill a date input (if visible - date info question from dataset)
    const dateInputs = page.locator('input[type="date"]:not([readonly]):not([disabled])');
    const dateInputCount = await dateInputs.count();
    if (dateInputCount > 0) {
      await dateInputs.first().fill('1990-01-15');
    }

    // Toggle a boolean input (if visible - boolean info question from dataset)
    // Boolean inputs render as checkbox or toggle in the Input component
    const booleanInputs = page.locator('input[type="checkbox"]:not([readonly]):not([disabled])');
    const booleanInputCount = await booleanInputs.count();
    if (booleanInputCount > 0) {
      await booleanInputs.first().check();
    }

    // Save the profile
    await profilePage.submit();

    // After save, the profile page navigates away
    await expect(page).not.toHaveURL(/profile/, { timeout: 10000 });
  });

  test('should persist profile data after page reload (CAND-12)', async ({ page }) => {
    // Navigate back to profile page (data was saved in previous test)
    await page.goto(buildRoute({ route: 'CandAppProfile', locale: 'en' }));

    // Verify the profile page loaded
    await expect(page.getByTestId(testIds.candidate.profile.submit).or(page.getByTestId('profile-return'))).toBeVisible();

    // Verify previously uploaded image persists
    // The image Input component shows the uploaded image as an <img> element
    // when a value is present. Check within the image upload area.
    const imageArea = page.getByTestId(testIds.candidate.profile.imageUpload);
    await expect(imageArea).toBeVisible();

    // Check that the image was persisted (look for an img tag inside the upload area)
    const uploadedImage = imageArea.locator('img');
    await expect(uploadedImage).toBeVisible();

    // Verify previously filled fields retain their values after reload
    await page.reload();

    // After reload, verify the page still shows data
    await expect(page.getByTestId(testIds.candidate.profile.imageUpload)).toBeVisible();

    // The uploaded image should still be visible after reload
    await expect(page.getByTestId(testIds.candidate.profile.imageUpload).locator('img')).toBeVisible();

    // Verify a text field retains its value (if present)
    const textInputs = page.locator('input[type="text"]:not([readonly]):not([disabled])');
    const textInputCount = await textInputs.count();
    if (textInputCount > 0) {
      // The field should have a non-empty value from the previous save
      await expect(textInputs.first()).not.toHaveValue('');
    }
  });
});
