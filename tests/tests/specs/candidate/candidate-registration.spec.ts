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

import { expect,test } from '../../fixtures';
import { E2E_ADDENDUM_CANDIDATES, TEST_CANDIDATE_ALPHA_EMAIL } from '../../utils/e2eFixtureRefs';
import { countEmailsForRecipient, extractLinkFromHtml, getLatestEmailHtml, toCallbackUrl } from '../../utils/emailHelper';
import { SupabaseAdminClient } from '../../utils/supabaseAdminClient';
import { TEST_CANDIDATE_PASSWORD } from '../../utils/testCredentials';
import { testIds } from '../../utils/testIds';
import type { Page } from '@playwright/test';

// Run all tests in this file without authentication
test.use({ storageState: { cookies: [], origins: [] } });

/**
 * After the PasswordSetter form submits, the page lands on EITHER
 *   (a) `/candidate/login` (the unconditional `goto` in PasswordSetter
 *       +page.svelte:93), if the post-setPassword session was dropped/expired;
 *   (b) a `/candidate(/…)` protected route directly, if the post-setPassword
 *       session is still valid and the login page auto-redirected
 *       authenticated users onward (the candidate context's `isAuthenticated`
 *       guard).
 *
 * Hoisted out of the test body (RESEARCH Pattern 4 canonical 3) so
 * `playwright/no-conditional-in-test` holds for the test itself. The `if`
 * inside is a deterministic post-await dispatch on a settled URL, not a race
 * mask — `waitForURL` resolves only after the predicate matches, so by the
 * time we branch, the URL has settled and the path is known.
 *
 * Mirrors `candidate-profile.spec.ts:loginIfRedirectedToLoginPage` (with the
 * same predicate that excludes the `/candidate/{register,auth,login}`
 * intermediate paths per Phase 79 Plan 01 RCA: a looser predicate would exit
 * on the in-flight `/candidate/register/password` URL and skip the form
 * login).
 */
async function loginIfRedirectedToLoginPage(page: Page, email: string, password: string): Promise<void> {
  await page.waitForURL(
    (url) => {
      // Strip the optional 2-letter locale prefix (paraglideHandle routes
      // `/en`, `/fi`, `/sv`, etc.) so the predicate doesn't have to enumerate
      // every supported locale. Without this, a `/en/candidate` URL fails
      // the `pathname === '/candidate'` branch and the predicate misses the
      // settled ToU/home target entirely.
      const path = url.pathname.replace(/^\/[a-z]{2}(?=\/|$)/, '');
      return (
        path === '/candidate/login' ||
        path === '/candidate' ||
        /^\/candidate\/(?!register|auth|login)/.test(path)
      );
    },
    { timeout: 15000 }
  );
  if (page.url().includes('/candidate/login')) {
    // Clear browser-side auth state from the invited-flow session before the
    // form login establishes a fresh one. Belt-and-suspenders against any
    // stale JWT held by the singleton browser Supabase client.
    await page.context().clearCookies();
    const emailInput = page.getByTestId(testIds.candidate.login.email);
    await emailInput.waitFor({ state: 'visible', timeout: 5000 });
    await emailInput.fill(email);
    await page.getByTestId(testIds.candidate.login.password).fill(password);
    await page.getByTestId(testIds.candidate.login.submit).click();
    await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 10000 });
  }
}

test.describe('candidate registration via email', { tag: ['@candidate'] }, () => {
  test.describe.configure({ mode: 'serial' });

  const client = new SupabaseAdminClient();
  const candidateEmail = E2E_ADDENDUM_CANDIDATES[0].email!;
  const candidateExternalId = E2E_ADDENDUM_CANDIDATES[0].external_id;
  let registrationLink: string;

  test('should send registration email and extract link', async () => {
    // Count existing emails to skip stale ones from previous test runs
    const emailsBefore = await countEmailsForRecipient(candidateEmail);

    // Send registration email via SupabaseAdminClient (uses inviteUserByEmail for unregistered candidates)
    await client.sendEmail({
      candidateExternalId,
      email: candidateEmail,
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

    // Step 3: Extract registration link and transform to auth callback URL.
    // The email link points to Supabase Auth verify endpoint which redirects
    // via hash fragment (implicit flow). We bypass this by calling the
    // auth callback directly with the token_hash for server-side verifyOtp.
    const emailHtml = await getLatestEmailHtml(candidateEmail, emailsBefore);
    const rawLink = extractLinkFromHtml(emailHtml!);
    expect(rawLink).toBeTruthy();
    registrationLink = toCallbackUrl(rawLink!);
    console.log('[REG] Callback URL:', registrationLink);
  });

  test('should complete registration via email link', async ({ page }) => {
    // This test covers registration, login, and ToU acceptance — needs extra time
    test.setTimeout(60000);

    const password = 'RegisteredPass1!';

    // Step 1: Navigate to the registration link extracted from the email
    await page.goto(registrationLink);

    // Step 2: Set password on the register/password page.
    // The PasswordSetter form submits to Supabase auth.updateUser (via the
    // candidate context's setPassword); the page then redirects to
    // /candidate/login. We wait for that redirect to settle *before*
    // touching the login form so the PasswordSetter's setPassword call
    // has fully landed in auth.users (no concurrent admin-API write to
    // race against it — the prior `client.setPassword` admin call was
    // removed because `auth.admin.updateUserById` revokes all refresh
    // tokens for the user, which could leave the browser-side Supabase
    // client holding a revoked JWT while the SSR form-action established
    // a fresh server-side session — that mismatch surfaced as a 406
    // "Cannot coerce" on the subsequent client-side UPDATE in
    // _updateEntityProperties during ToU acceptance).
    const passwordWrapper = page.getByTestId(testIds.candidate.register.password);
    const confirmWrapper = page.getByTestId(testIds.candidate.register.confirmPassword);
    const submitButton = page.getByTestId(testIds.candidate.register.passwordSubmit);

    await passwordWrapper.getByTestId(testIds.candidate.login.password).fill(password);
    await confirmWrapper.getByTestId(testIds.candidate.login.password).fill(password);
    await submitButton.click();

    // Step 3: Wait for the post-password URL to settle on EITHER the login
    // page or a protected /candidate route. PasswordSetter unconditionally
    // navigates to /candidate/login, but if the post-setPassword session is
    // still valid, the login page auto-redirects authenticated users to
    // /candidate — so we can't assume we'll observe the /login URL. The
    // helper picks the right branch deterministically once the URL settles.
    await loginIfRedirectedToLoginPage(page, candidateEmail, password);

    // Step 6: Accept Terms of Use (shown on first login after registration)
    const touCheckbox = page.getByTestId(testIds.candidate.terms.checkbox);
    await touCheckbox.check();
    // Wait for the continue button to be enabled (not in loading state)
    const continueButton = page.getByRole('button', { name: /continue/i });
    await expect(continueButton).toBeEnabled({ timeout: 10000 });
    await continueButton.click();

    // Step 7: Verify we reach the candidate home (save may take a moment)
    await expect(page.getByTestId(testIds.candidate.home.statusMessage)).toBeVisible({ timeout: 10000 });
  });
});

test.describe('candidate password reset', { tag: ['@candidate'] }, () => {
  test.describe.configure({ mode: 'serial' });

  const client = new SupabaseAdminClient();
  // Use an already-registered candidate from the default dataset (alpha candidate)
  const candidateEmail = TEST_CANDIDATE_ALPHA_EMAIL;
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

    // Step 3: Extract reset link and transform to auth callback URL
    const emailHtml = await getLatestEmailHtml(candidateEmail, emailsBefore);
    const rawResetLink = extractLinkFromHtml(emailHtml!);
    expect(rawResetLink).toBeTruthy();

    // Step 4: Navigate to auth callback (verifyOtp + redirect to password-reset page)
    await page.goto(toCallbackUrl(rawResetLink!));

    // Step 5: Set new password on the password-reset page
    // The password-reset page uses PasswordSetter without explicit testIds on the
    // wrapper divs, so we target the PasswordField inputs directly by their common
    // data-testid="password-field". The first is the new password, second is confirmation.
    const newPassword = 'ResetPass1!';
    const passwordFields = page.getByTestId('password-field');
    await passwordFields.first().fill(newPassword);
    await passwordFields.nth(1).fill(newPassword);
    await page.getByTestId(testIds.candidate.passwordReset.submit).click();

    // Step 6: After password reset with Supabase recovery flow, the user is already
    // authenticated (session established by verifyOtp). The app redirects to the
    // candidate home page, not the login page.
    await expect(page).toHaveURL(/\/candidate(?!.*login|.*password)/, { timeout: 10000 });
    await expect(page.getByTestId(testIds.candidate.home.statusMessage)).toBeVisible();

    // Step 9: RESTORE original password via API using setPassword
    // This is critical for subsequent test runs so auth-setup doesn't break
    await client.setPassword(candidateEmail, originalPassword);
  });
});
