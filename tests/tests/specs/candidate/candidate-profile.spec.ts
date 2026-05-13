/**
 * Candidate profile E2E tests (fresh candidate registration flow).
 *
 * Covers:
 * - CAND-03: Profile setup with image upload and all info field types
 * - CAND-12 (partial): Data persistence after page reload
 * - A11Y-02: Reload-persistence extension for editable info questions
 *            (display name, bio, social link) — Phase 76 Plan 02
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
import { E2E_ADDENDUM_CANDIDATES } from '../../utils/e2eFixtureRefs';
import { countEmailsForRecipient, extractLinkFromHtml, getLatestEmailHtml, toCallbackUrl } from '../../utils/emailHelper';
import { SupabaseAdminClient } from '../../utils/supabaseAdminClient';
import { testIds } from '../../utils/testIds';
import type { Page } from '@playwright/test';

// Run all tests in this file without pre-existing authentication
test.use({ storageState: { cookies: [], origins: [] } });

/**
 * Module-level helper: log in if the page redirected to login after registration.
 *
 * Hoisted out of the test body per RESEARCH §"Pattern 4 canonical 3" so that
 * playwright/no-conditional-in-test holds — the rule fires on conditionals INSIDE
 * `test()` callbacks, not module-level helpers. The `if` here is legitimate
 * post-await dispatch on a known URL (we just synchronously read `page.url()`),
 * NOT a race-mask: by the time `waitForURL` returns, the URL is settled, and the
 * branch only chooses between two deterministic paths (already-on-home vs. land
 * on login due to session-not-established).
 *
 * Replaces the original race-tolerant `await page.waitForTimeout(2000); if
 * (page.url().includes('login'))` pattern in the registration test (which
 * triggered playwright/no-wait-for-timeout + 1 no-conditional-in-test +
 * 2 no-conditional-expect warnings).
 */
async function loginIfRedirectedToLoginPage(page: Page, email: string, password: string): Promise<void> {
  // Wait for the URL to settle on EITHER /candidate/login OR a /candidate/(protected) path,
  // NOT on the intermediate /candidate/register/password page where we just submitted.
  //
  // Per Phase 79 Plan 01 RCA (post-fix/rca-traces/RCA-FINDINGS.md): the previous predicate
  // `pathname.includes('/login') || pathname.includes('/candidate')` matched BOTH /candidate/login
  // AND /candidate/register/password (the latter contains '/candidate'), causing waitForURL
  // to exit immediately on the intermediate page. The `if (page.url().includes('login'))`
  // branch was then skipped, manual login never happened, and the test failed 10s later
  // when the ToU checkbox didn't render. The tightened predicate below excludes the
  // /candidate/{register,auth} intermediate paths, so we wait until the deliberate
  // post-setPassword /candidate/login redirect actually lands.
  await page.waitForURL(
    (url) =>
      url.pathname.includes('/candidate/login') ||
      url.pathname === '/candidate' ||
      /\/candidate\/(?!register|auth|login)/.test(url.pathname),
    {
      timeout: 15000
    }
  );
  if (page.url().includes('login')) {
    // Session wasn't established by verifyOtp — fall through to manual login
    const emailInput = page.getByTestId(testIds.candidate.login.email);
    await emailInput.waitFor({ state: 'visible', timeout: 5000 });
    await emailInput.fill(email);
    await page.getByTestId(testIds.candidate.login.password).fill(password);
    await page.getByTestId(testIds.candidate.login.submit).click();
    await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 10000 });
  }
}

test.describe('candidate profile (fresh candidate)', { tag: ['@candidate'] }, () => {
  test.describe.configure({ mode: 'serial' });

  const client = new SupabaseAdminClient();
  const candidateEmail = E2E_ADDENDUM_CANDIDATES[1].email!;
  const candidateExternalId = E2E_ADDENDUM_CANDIDATES[1].external_id;
  const candidatePassword = 'ProfileTestPass1!';

  /**
   * Log in as the freshly registered candidate.
   * Serial mode does NOT share browser contexts, so each test after
   * registration must authenticate independently.
   */
  async function loginAsCandidate(page: Page): Promise<void> {
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

    // Step 6: Wait for navigation to settle on either home or login, and log in
    // if redirected. Hoisted to module-level `loginIfRedirectedToLoginPage` helper
    // so the conditional dispatch lives outside the test body (Pattern 4 canonical 3
    // — the lint rule allows conditionals in helpers; only test() bodies are flagged).
    await loginIfRedirectedToLoginPage(page, candidateEmail, candidatePassword);

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

    // Phase 83 DETERM-06 follow-on fix (Rule 2 deviation): Phase 82's
    // `canSubmit && allRequiredFilled` save-gate at
    // apps/frontend/src/routes/candidate/(protected)/profile/+page.svelte:103
    // now correctly disables the submit button when any required-info question
    // is empty. The fresh candidate has not answered the required
    // `test-question-required-empty-1` (Phase 82 fixture row, sort 24,
    // custom_data.required:true) — without satisfying that gate the submit
    // click below would TIMEOUT against a permanently-disabled button. Fill
    // it with a Phase 83 sentinel string + blur before submit. Pre-Phase 82
    // this step was unnecessary because no info question carried
    // `required:true` in the base e2e seed; the cascade-unblock from
    // DETERM-06's ladder exposed this Phase 82 implicit-coupling regression.
    //
    // The question renders as `text-multilingual` (type=text + no
    // disableMultilingual on profile route, per QuestionInput.svelte:72-77);
    // multiple <input>s share the accessible name via aria-labelledby. .first()
    // disambiguates to the EN input (mirrors the canonical pattern at
    // candidate-profile-validation.spec.ts:358). isEmptyValue treats the
    // object value `{en: 'value', fi: '', ...}` as non-empty as long as ONE
    // locale is filled (packages/data/src/utils/answer.ts:15-23).
    const requiredEmptyInput = page.getByLabel(/Required-empty \(Phase 82 A11Y-07 anchor\)/i).first();
    await expect(requiredEmptyInput).toBeVisible({ timeout: 5000 });
    await requiredEmptyInput.fill('Sentinel 83 DETERM-06 required-empty');
    await requiredEmptyInput.blur();
    // Wait for the submit button to enable in reaction to the fill — the
    // `allRequiredFilled` $derived re-evaluates on userData.answers update.
    await expect(page.getByTestId(testIds.candidate.profile.submit)).toBeEnabled({ timeout: 5000 });

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
    const main = page.getByRole('main');
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

    // Verify previously uploaded image persists (saved in image upload test).
    // <img> has implicit role="img" — getByRole('img') is the semantic equivalent
    // of locator('img') and matches the rendered avatar element.
    const imageArea = page.getByTestId(testIds.candidate.profile.imageUpload);
    await expect(imageArea).toBeVisible();
    await expect(imageArea.getByRole('img')).toBeVisible();

    // Reload and verify image still persists
    await page.reload();
    await expect(page.getByTestId(testIds.candidate.profile.imageUpload)).toBeVisible();
    await expect(page.getByTestId(testIds.candidate.profile.imageUpload).getByRole('img')).toBeVisible();
  });

  test('A11Y-02 should persist display name after page reload', async ({ page }) => {
    // In serial mode, this test is skipped automatically if registration failed.
    await loginAsCandidate(page);
    await page.goto(buildRoute({ route: 'CandAppProfile', locale: 'en' }));

    // Wait for profile to render (mirror CAND-12 anchor).
    await expect(
      page.getByTestId(testIds.candidate.profile.submit).or(page.getByTestId(testIds.candidate.profile.returnButton))
    ).toBeVisible({ timeout: 10000 });

    // Resolve the display-name input via the seeded question label (Plan 01 fixture anchor).
    // The label string MUST match the seed exactly: 'Display name (Phase 76 anchor)'.
    const displayNameInput = page.getByLabel('Display name (Phase 76 anchor)');
    await expect(displayNameInput).toBeVisible({ timeout: 5000 });

    // Overwrite any pre-existing value with a new test-anchored value to prove the
    // round-trip persists THIS edit. Value is disjoint from the substring 'Alpha' per
    // the value-disjointness invariant codified in packages/dev-seed/src/templates/e2e.ts
    // (CAND-06 strict-mode 'Alpha' substring lookup hazard — see Plan 01 SUMMARY §Deviations #2).
    const NEW_DISPLAY_NAME = 'Sentinel 76 P02 displayName';
    await displayNameInput.fill(NEW_DISPLAY_NAME);

    // Save the profile to persist the edit.
    await page.getByTestId(testIds.candidate.profile.submit).click();

    // After save, the profile may navigate away (matches CAND-03 pattern at line 164).
    // Re-navigate to the profile page to assert post-reload state.
    await page.goto(buildRoute({ route: 'CandAppProfile', locale: 'en' }));

    // Reload to assert persistence across a hard page reload (CAND-12 shape).
    await page.reload();

    // Assert the new value persisted. Race-tolerant timeout absorbs post-reload async data-load.
    const reloadedInput = page.getByLabel('Display name (Phase 76 anchor)');
    await expect(reloadedInput).toHaveValue(NEW_DISPLAY_NAME, { timeout: 10000 });
  });

  test('A11Y-02 should persist bio after page reload', async ({ page }) => {
    // In serial mode, this test is skipped automatically if registration failed.
    await loginAsCandidate(page);
    await page.goto(buildRoute({ route: 'CandAppProfile', locale: 'en' }));

    await expect(
      page.getByTestId(testIds.candidate.profile.submit).or(page.getByTestId(testIds.candidate.profile.returnButton))
    ).toBeVisible({ timeout: 10000 });

    // Bio renders as <textarea> per QuestionInput.svelte (customData.longText=true).
    // getByLabel resolves correctly because the label-for / aria-labelledby bridge
    // works for both <input> and <textarea>.
    const bioInput = page.getByLabel('Biography (Phase 76 anchor)');
    await expect(bioInput).toBeVisible({ timeout: 5000 });

    const NEW_BIO = 'Sentinel 76 P02 biography — multi-line\nedit verifies textarea round-trip.';
    await bioInput.fill(NEW_BIO);

    await page.getByTestId(testIds.candidate.profile.submit).click();
    await page.goto(buildRoute({ route: 'CandAppProfile', locale: 'en' }));
    await page.reload();

    const reloadedBio = page.getByLabel('Biography (Phase 76 anchor)');
    await expect(reloadedBio).toHaveValue(NEW_BIO, { timeout: 10000 });
  });

  test('A11Y-02 should persist social link after page reload', async ({ page }) => {
    // In serial mode, this test is skipped automatically if registration failed.
    await loginAsCandidate(page);
    await page.goto(buildRoute({ route: 'CandAppProfile', locale: 'en' }));

    await expect(
      page.getByTestId(testIds.candidate.profile.submit).or(page.getByTestId(testIds.candidate.profile.returnButton))
    ).toBeVisible({ timeout: 10000 });

    const socialInput = page.getByLabel('Social link (Phase 76 anchor)');
    await expect(socialInput).toBeVisible({ timeout: 5000 });

    // PRODUCT-GAP-PARTIAL: url-format validation deferred (see
    // .planning/todos/pending/2026-05-12-a11y-01-product-gap-cells.md).
    // This block exercises persistence ONLY — the saved string round-trips
    // identically across reload, regardless of url-format validity.
    const NEW_SOCIAL = 'https://github.com/openvaa/sentinel-76-p02';
    await socialInput.fill(NEW_SOCIAL);

    await page.getByTestId(testIds.candidate.profile.submit).click();
    await page.goto(buildRoute({ route: 'CandAppProfile', locale: 'en' }));
    await page.reload();

    const reloadedSocial = page.getByLabel('Social link (Phase 76 anchor)');
    await expect(reloadedSocial).toHaveValue(NEW_SOCIAL, { timeout: 10000 });
  });
});
