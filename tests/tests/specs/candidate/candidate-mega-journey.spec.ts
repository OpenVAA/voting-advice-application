/**
 * Candidate mega-journey end-to-end spec — Phase 89 Plan 03.
 *
 * Authoritative design source: TEST-INVENTORY-REFACTOR-4.md lines 101-257.
 *
 * Structure: ONE serial-describe → ONE long test('full candidate journey
 * end-to-end', ...) → 22 named `test.step` segments mirroring TIR4:101-257.
 * The walk covers:
 *   1-2.  Public static pages (/candidate/help + /candidate/privacy) reachable
 *         while unauthenticated.
 *   3.    Trigger registration email via SupabaseAdminClient.sendEmail —
 *         polls Mailpit, extracts the verify link, transforms to the
 *         frontend auth callback URL.
 *   4.    Navigate to the callback URL + set initial password (PASSWORD_1).
 *   5.    Accept Terms of Use + advance.
 *   6.    Candidate home renders three tasks; profile-active.
 *   7.    Mid-flow logout exercises the TimedModal confirmation dialog
 *         (profile incomplete → modal opens), then re-attempted
 *         /candidate/profile navigation re-redirects to /candidate/login.
 *   8.    Forgot-password reset flow via Mailpit email → set PASSWORD_2.
 *   9.    Login with empty fields (submit disabled), wrong password
 *         (PASSWORD_1 → error), correct password (PASSWORD_2 → home).
 *   10.   Return from a static page (/candidate/help) via the return button.
 *   11.   Candidate home renders three tasks; profile-active (unchanged).
 *   12.   Profile renders static info + filtered questions partition +
 *         required badge on the required text question.
 *   13.   Portrait upload error paths (invalid file + oversize file) +
 *         valid upload + fill all info questions EXCEPT the required one
 *         and the first one + submit + assert home still profile-active
 *         (opinions still disabled because the required field is empty).
 *   14.   Revisit profile; fill the required field; submit → questions
 *         overview.
 *   15.   Questions overview shows intro message; clickStart → first
 *         opinion question.
 *   16.   First opinion question: hero emoji + continue-disabled +
 *         select choice + continue-enabled + enterInfo + clickContinue.
 *   17.   Return to overview: continue-prompt + Q1 answered (round-trip
 *         OPEN_ANSWER_1) + Q2 has answer button + category expander
 *         toggles.
 *   18.   Edit Q1: change choice + change info + clickContinue → overview
 *         shows updated values.
 *   19.   Walk remaining opinion questions (first choice, clickContinue)
 *         until home renders "completed" status + preview enabled.
 *   20.   Overview shows completion message + no continue prompt.
 *   21.   Preview renders all info answers + portrait + opinion answers +
 *         NO voter-comparison messaging.
 *   22.   Final logout without dialog (post-completion path) →
 *         /candidate/login.
 *
 * Rigidity contract per TIR4:8-12 + Phase 88 Plan 04 SCOPE acceptance #6:
 *   - 0 expect.soft
 *   - 0 try/catch wrapping expect()
 *   - 0 .catch(() => null) on assertion-bearing locator interactions
 *
 * UNAUTHENTICATED start per R13 (test.use storageState empty-cookies).
 *
 * Running:
 *   yarn test:e2e --project=candidate-mega-journey --reporter=list
 *
 * Runs under the `data-setup-candidate-mega → candidate-mega-journey →
 * data-teardown-candidate-mega` chain (appended to tests/playwright.config.ts;
 * sequenced AFTER voter-mega-journey via dependencies: ['voter-mega-journey']
 * per R3 shared 'test-' prefix race).
 */

import { expect, test } from '../../fixtures/candidate/candidate-mega';
import {
  PASSWORD_1,
  PASSWORD_2,
  REGISTRATION_EMAIL_SUBJECT_REGEX,
  RESET_EMAIL_SUBJECT_REGEX,
  UNREGISTERED_CANDIDATE_EMAIL,
  UNREGISTERED_CANDIDATE_EXTERNAL_ID
} from '../../utils/candidateMegaConstants';
import { toCallbackUrl } from '../../utils/emailHelper';
import { SupabaseAdminClient } from '../../utils/supabaseAdminClient';
import { testIds } from '../../utils/testIds';
import type { Page } from '@playwright/test';

// ====================================================================
// FILE-SCOPE CONSTANTS
//
// TIMEOUT consolidates the previously-inline `{ timeout: <num> }`
// literals into a semantic bucket — same pattern as voter-mega-journey.
// ====================================================================

const TIMEOUT = {
  element: 2_000,
  click: 2_000,
  page: 10_000,
  slowPage: 15_000,
  testMax: 180_000
} as const;

/**
 * After the PasswordSetter form submits the page lands on EITHER
 *   (a) `/candidate/login` (the unconditional `goto` in PasswordSetter
 *       +page.svelte), if the post-setPassword session was dropped/expired;
 *   (b) a protected `/candidate(/...)` route, if the post-setPassword
 *       session is still valid and the login page auto-redirected
 *       authenticated users onward (the candidate context's
 *       `isAuthenticated` guard).
 *
 * Branch (a) requires us to fill the login form. Branch (b) lands us at
 * the ToU acceptance form directly. Hoisted out of the test body to
 * satisfy `playwright/no-conditional-in-test` — the `if` inside is a
 * deterministic post-await dispatch on a settled URL, not a race mask.
 *
 * Mirrors the canonical pattern at
 * `candidate-registration.spec.ts:45-74`.
 */
async function loginIfRedirectedToLoginPage(
  page: Page,
  email: string,
  password: string,
  timeoutMs: number
): Promise<void> {
  await page.waitForURL(
    (url) => {
      const stripped = url.pathname.replace(/^\/[a-z]{2}(?=\/|$)/, '');
      return (
        stripped === '/candidate/login' ||
        stripped === '/candidate' ||
        /^\/candidate\/(?!register|auth|login)/.test(stripped)
      );
    },
    { timeout: timeoutMs }
  );
  if (page.url().includes('/candidate/login')) {
    await page.context().clearCookies();
    const emailInput = page.getByTestId(testIds.candidate.login.email);
    await emailInput.waitFor({ state: 'visible', timeout: timeoutMs });
    await emailInput.fill(email);
    await page.getByTestId(testIds.candidate.login.password).fill(password);
    await page.getByTestId(testIds.candidate.login.submit).click();
    await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: timeoutMs });
  }
}

// Start every test in this file UNAUTHENTICATED per R13 +
// candidate-registration.spec.ts:22 precedent.
test.use({ storageState: { cookies: [], origins: [] } });

test.describe('candidate mega-journey', { tag: ['@candidate'] }, () => {
  test.describe.configure({ mode: 'serial' });

  // Task 3b will add `test.beforeAll(buildOversizedPng)` + `test.afterAll`
  // cleanup once the portrait-upload step (13) lands.

  test('full candidate journey end-to-end', async ({
    page,
    emailBucket,
    candidateLoginPage,
    candidateTermsOfUsePage,
    candidateHomePage,
    candidateForgotPasswordPage,
    candidatePasswordSetter,
    candidateLogoutButton
  }) => {
    test.setTimeout(TIMEOUT.testMax);

    const client = new SupabaseAdminClient();

    // ============== Steps 1-2: public static pages =========================

    await test.step('1. static: /candidate/help reachable while unauthenticated', async () => {
      await page.goto('/en/candidate/help');
      // The help page renders a return-home button with testid
      // `candidate-help-home`. Visibility proves the page rendered without
      // the auth gate redirecting to /candidate/login.
      await expect(page.getByTestId(testIds.candidate.help.home)).toBeVisible({
        timeout: TIMEOUT.slowPage
      });
    });

    await test.step('2. static: /candidate/privacy reachable while unauthenticated', async () => {
      await page.goto('/en/candidate/privacy');
      await expect(page.getByTestId(testIds.candidate.privacy.home)).toBeVisible({
        timeout: TIMEOUT.slowPage
      });
    });

    // ============== Step 3: send registration email + extract link ========

    let registrationCallbackUrl = '';

    await test.step('3. registration: send invite email + extract link', async () => {
      // Trigger the registration / invite email via the Supabase admin API.
      // SupabaseAdminClient.sendEmail (since the candidate has no
      // auth_user_id yet) invokes inviteUserByEmail under the hood.
      await client.sendEmail({
        candidateExternalId: UNREGISTERED_CANDIDATE_EXTERNAL_ID,
        email: UNREGISTERED_CANDIDATE_EMAIL,
        subject: 'Registration',
        content: 'Click here to register: {LINK}'
      });

      // Poll Mailpit for the registration email (loose subject regex per R14).
      await emailBucket.expectEmail(REGISTRATION_EMAIL_SUBJECT_REGEX);
      const links = await emailBucket.getLinksInEmail(REGISTRATION_EMAIL_SUBJECT_REGEX);
      expect(links.length, 'registration email should contain at least one link').toBeGreaterThan(0);
      // The first link is the Supabase verify URL — transform to the
      // frontend auth callback URL so verifyOtp runs server-side.
      registrationCallbackUrl = toCallbackUrl(links[0]);
    });

    // ============== Step 4: set initial password ===========================

    await test.step('4. registration: navigate to callback + set initial password', async () => {
      await page.goto(registrationCallbackUrl);
      // PasswordSetter renders on /candidate/register/password.
      await candidatePasswordSetter.setPassword(PASSWORD_1);
    });

    // ============== Step 5: accept Terms of Use ===========================

    await test.step('5. ToU: accept and advance', async () => {
      // The PasswordSetter navigates to /candidate/login post-submit. The
      // helper dispatches deterministically on the settled URL: if /login,
      // fill the form; otherwise we've already auto-redirected onward.
      // The post-helper landing is the ToU form (terms_of_use_accepted is
      // null on the unregistered candidate so the protected layout shows
      // the ToU form before any other content).
      await loginIfRedirectedToLoginPage(
        page,
        UNREGISTERED_CANDIDATE_EMAIL,
        PASSWORD_1,
        TIMEOUT.slowPage
      );
      const touCheckbox = page.getByTestId(testIds.candidate.terms.checkbox);
      await touCheckbox.waitFor({ state: 'visible', timeout: TIMEOUT.slowPage });
      await candidateTermsOfUsePage.acceptAndAdvance();
      // Settle on the candidate home (status message visible).
      await expect(page.getByTestId(testIds.candidate.home.statusMessage)).toBeVisible({
        timeout: TIMEOUT.slowPage
      });
    });

    // ============== Step 6: home renders three tasks =====================

    await test.step('6. home: three tasks with profile-active', async () => {
      // Profile is enabled (the candidate has just landed and needs to
      // fill it). Opinions + preview are disabled until profile completes.
      await candidateHomePage.expectTasks({
        enabled: ['profile'],
        disabled: ['opinions', 'preview']
      });
    });

    // ============== Step 7: mid-flow logout with dialog ==================

    await test.step('7. logout: mid-flow with TimedModal dialog + re-attempted nav redirects to login', async () => {
      // Profile is incomplete (no answers + no portrait yet) so the
      // logout button opens the TimedModal confirmation dialog.
      await candidateLogoutButton.clickWithDialog();
      // Post-logout lands at /candidate/login.
      await expect(page).toHaveURL(/\/candidate\/login/, { timeout: TIMEOUT.slowPage });
      // Navigate directly to /candidate/profile while unauthenticated —
      // protected layout redirects back to /candidate/login.
      await page.goto('/en/candidate/profile');
      await expect(page).toHaveURL(/\/candidate\/login/, { timeout: TIMEOUT.slowPage });
    });

    // ============== Step 8: forgot-password reset flow ====================

    let resetCallbackUrl = '';

    await test.step('8. forgot-password: send reset email + follow link + set PASSWORD_2', async () => {
      await page.goto('/en/candidate/forgot-password');
      await candidateForgotPasswordPage.fillEmailAndAdvance(UNREGISTERED_CANDIDATE_EMAIL);
      // Poll Mailpit for the reset email.
      await emailBucket.expectEmail(RESET_EMAIL_SUBJECT_REGEX);
      const links = await emailBucket.getLinksInEmail(RESET_EMAIL_SUBJECT_REGEX);
      expect(links.length, 'reset email should contain at least one link').toBeGreaterThan(0);
      resetCallbackUrl = toCallbackUrl(links[0]);
      await page.goto(resetCallbackUrl);
      // Password reset uses the same PasswordSetter component as
      // registration — fill the new password.
      await candidatePasswordSetter.setPassword(PASSWORD_2);
      // Post-reset the user is authenticated (verifyOtp established a
      // session). ToU was already accepted in step 5, so we land on
      // /candidate home directly.
      await expect(page.getByTestId(testIds.candidate.home.statusMessage)).toBeVisible({
        timeout: TIMEOUT.slowPage
      });
    });

    // ============== Step 9: login flow with submit-disabled + wrong-pw ===

    await test.step('9. login: submit-disabled empty + wrong password + correct password', async () => {
      // First log out so the login form is reachable.
      await candidateLogoutButton.clickWithoutDialog();
      // Empty fields → submit disabled.
      await expect(candidateLoginPage.getSubmitButton()).toBeDisabled();
      // Login with PASSWORD_1 (old, now wrong) → error message.
      await candidateLoginPage.login(UNREGISTERED_CANDIDATE_EMAIL, PASSWORD_1);
      await candidateLoginPage.expectErrorMessage();
      // Login with PASSWORD_2 (correct) → home (ToU already accepted, no
      // re-acceptance prompt expected).
      await candidateLoginPage.enterPassword(PASSWORD_2);
      await candidateLoginPage.submit();
      await expect(page.getByTestId(testIds.candidate.home.statusMessage)).toBeVisible({
        timeout: TIMEOUT.slowPage
      });
    });

    // ============== Step 10: return-from-static page =====================

    await test.step('10. static: navigate to /candidate/help + return to home via button', async () => {
      await page.goto('/en/candidate/help');
      await page.getByTestId(testIds.candidate.help.home).click();
      await expect(page.getByTestId(testIds.candidate.home.statusMessage)).toBeVisible({
        timeout: TIMEOUT.slowPage
      });
    });

    // ============== Step 11: home still three-task profile-active ========

    await test.step('11. home: three tasks profile-active (unchanged after re-login)', async () => {
      await candidateHomePage.expectTasks({
        enabled: ['profile'],
        disabled: ['opinions', 'preview']
      });
    });

    // ============== Steps 12-22: appended in Task 3b =====================
    // Task 3b appends steps 12-22 (profile fill + opinion walk + preview +
    // final logout) to this same test() block per TIR4:166-257.
  });
});
