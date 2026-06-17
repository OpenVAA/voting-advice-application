/**
 * EFLOW-10b — candidate bank-auth (Idura OIDC) full-browser self-registration
 * journey.
 *
 * This is the full-browser counterpart to the EFLOW-10 Edge-Function seam spec
 * (`candidate-bank-auth.spec.ts`). It walks the REAL OIDC redirect chain end to
 * end, faking ONLY the IdP at the env-pointed network seam (the mock OIDC issuer
 * auto-spawned by the Playwright `webServer` entry). The
 * authorize → callback → server-side exchange → JWE decrypt → claims → preregister
 * chain runs UNMODIFIED (D-01 Option B; no production-code change, no test-only
 * branch).
 *
 * Structure: ONE serial-describe → ONE long `test('full bank-auth ...')` →
 * named `test.step` segments. The walk covers:
 *   1. goto /candidate/preregister (UNAUTHENTICATED) → click preregister-start
 *      → fetch POST /api/oidc/authorize → browser follows the 302 to the mock
 *      issuer → mock 302s back to /api/oidc/callback?code&state → server
 *      exchanges + JWE-decrypts the id_token + verifies → sets the id_token
 *      cookie → 303 back to /candidate/preregister AUTHENTICATED. Asserts the
 *      authenticated success state renders (preregister-continue, which appears
 *      ONLY when idTokenClaims is populated post-callback).
 *   2. click preregister-continue → election selector → submitElection().
 *   3. constituency selector → submitConstituency().
 *   4. email + ToU → fillEmailAndAcceptToU(recipientEmail) → triggers
 *      preregister() → POST /api/candidate/preregister → identity-callback Edge
 *      Function creates the candidate + emits the preregistration email.
 *   5. Mailpit round-trip: expectEmail(<confirm-subject>) → getLinksInEmail →
 *      the email embeds the frontend registration URL carrying
 *      ?registrationKey=… (NOT a Supabase verify link → navigate it directly,
 *      no toCallbackUrl transform). The register page auto-validates the key on
 *      mount and redirects to the set-password page.
 *   6. candidatePasswordSetter.setPassword(<password>) → register() activates
 *      the user with the key + password → redirects to /candidate/login with the
 *      email pre-filled (newUserEmail).
 *   7. Log in (fill password + submit) → assert the logged-in candidate end
 *      state (candidate-home-status). Reaching the protected candidate home is
 *      itself the end-to-end proof: it is reachable only if register() activated
 *      the user and the login established an authenticated session.
 *
 * Rigidity contract: no soft assertions, no try/catch wrapping assertions, and
 * no swallowed-rejection fallbacks on assertion-bearing locator interactions —
 * every assertion is hard and every locator interaction propagates rejection.
 *
 * Starts UNAUTHENTICATED (test.use storageState empty-cookies) — the bank-auth
 * flow mints its own session. Runs on the /en locale-prefixed routes; asserts on
 * testIds, never localized strings (CLAUDE.md localization rule).
 *
 * ---------------------------------------------------------------------------
 * Running (see tests/IDURA-TEST-RUNBOOK.md §EFLOW-10b for the full procedure):
 *
 *   # Terminal 1 — SvelteKit server WITH the IdP env in its OWN process:
 *   yarn db:reset
 *   source /tmp/eflow10b.env          # IDURA_DOMAIN=127.0.0.1:9443, test JWKS,
 *                                     # IDENTITY_PROVIDER_ISSUER/_CLIENT_ID,
 *                                     # NODE_TLS_REJECT_UNAUTHORIZED=0 (test-only)
 *   yarn dev                          # :5173 inherits the IdP env
 *   #   + serve identity-callback with the test decryption JWKS (EFLOW-10 E-1..E-3)
 *
 *   # Terminal 2 — the journey run (the mock issuer auto-spawns via webServer):
 *   source /tmp/eflow10b.env
 *   PLAYWRIGHT_BANK_AUTH=1 npx playwright test --project=bank-auth-journey -c tests/playwright.config.ts
 * ---------------------------------------------------------------------------
 */

import { expect, test } from '../../fixtures/candidate/candidate-bank-auth-journey';
import { TIMEOUTS } from '../../helpers';
import { BANK_AUTH_JOURNEY_EMAIL } from '../../utils/bankAuthJourneyConstants';
import { testIds } from '../../utils/testIds';

// ====================================================================
// FILE-SCOPE CONSTANTS
// ====================================================================

/**
 * The password the journey sets for the freshly-created candidate. Meets the
 * candidate password policy (length + mixed character classes) so the
 * PasswordSetter validates and `register()` activates.
 */
const JOURNEY_PASSWORD = 'BankAuthJourney!2026';

/**
 * Loose subject match for the preregistration confirmation email (R14 — match
 * loosely on the subject, never assert exact localized copy). The en subject is
 * "Please confirm your email address".
 */
const CONFIRM_EMAIL_SUBJECT_REGEX = /confirm your email/i;

/**
 * Extract the `registrationKey` query param from the first link in the
 * preregistration email. The email template embeds the frontend registration
 * URL `${origin}${CandAppRegister}?registrationKey=<key>` (email/+page.svelte) —
 * this is a frontend URL, NOT a Supabase verify link, so it is navigated
 * directly (no `toCallbackUrl` transform).
 *
 * Hoisted to module scope so the (defensive) presence assertion runs outside the
 * test body's flow per playwright/no-conditional-in-test — the throw-on-absent
 * is a deterministic parse guard on a settled value, not a race mask.
 */
function registrationUrlFromLinks(links: ReadonlyArray<string>): string {
  const match = links.find((href) => href.includes('registrationKey='));
  if (match === undefined) {
    throw new Error(
      `preregistration email contained no registrationKey link (links: ${JSON.stringify(links)})`
    );
  }
  return match;
}

// Start UNAUTHENTICATED — the bank-auth flow mints its own session.
test.use({ storageState: { cookies: [], origins: [] } });
test.use({ recipientEmail: BANK_AUTH_JOURNEY_EMAIL });

test.describe('candidate bank-auth journey', { tag: ['@bank-auth'] }, () => {
  test.describe.configure({ mode: 'serial' });

  test('full bank-auth self-registration journey through to logged-in candidate', async ({
    page,
    candidatePreregisterPage,
    emailBucket,
    candidatePasswordSetter
  }) => {
    test.setTimeout(TIMEOUTS.testMax);

    // ============== Step 1: preregister-start → mock IdP → callback → auth ===

    await test.step('1. preregister-start → OIDC redirect chain → authenticated success state', async () => {
      await page.goto('/en/candidate/preregister');
      // The pre-auth landing renders the preregister-start CTA.
      await expect(page.getByTestId(testIds.candidate.preregister.start)).toBeVisible({
        timeout: TIMEOUTS.slowPage
      });
      // Click start → fetch POST /api/oidc/authorize → window.location =
      // authorizeUrl → mock issuer 302 → /api/oidc/callback (server exchange +
      // decrypt + verify) → 303 back to /candidate/preregister AUTHENTICATED.
      await candidatePreregisterPage.clickStart();
      // preregister-continue renders ONLY when idTokenClaims is populated (the
      // post-callback authenticated success state) — its visibility proves the
      // full authorize→callback→exchange→decrypt→claims chain ran end to end.
      await expect(page.getByTestId(testIds.candidate.preregister.continue)).toBeVisible({
        timeout: TIMEOUTS.slowPage
      });
    });

    // ============== Step 2: continue → election selector ===================

    await test.step('2. continue → select election + advance', async () => {
      await page.getByTestId(testIds.candidate.preregister.continue).click();
      // Land on the election selector (perm-not-located-2e2cg seeds 2 elections).
      await expect(page.getByTestId(testIds.candidate.preregister.electionsList)).toBeVisible({
        timeout: TIMEOUTS.slowPage
      });
      await candidatePreregisterPage.submitElection();
    });

    // ============== Step 3: constituency selector ==========================

    await test.step('3. select constituency + advance', async () => {
      await expect(page.getByTestId(testIds.candidate.preregister.constituenciesList)).toBeVisible({
        timeout: TIMEOUTS.slowPage
      });
      await candidatePreregisterPage.submitConstituency();
    });

    // ============== Step 4: email + ToU → preregister() ====================

    await test.step('4. fill email + accept ToU → trigger preregister()', async () => {
      await expect(page.getByTestId(testIds.candidate.preregister.emailInput)).toBeVisible({
        timeout: TIMEOUTS.slowPage
      });
      await candidatePreregisterPage.fillEmailAndAcceptToU(BANK_AUTH_JOURNEY_EMAIL);
    });

    // ============== Step 5: registration email → navigate registration URL ==

    await test.step('5. preregistration email → extract registrationKey → register page', async () => {
      await emailBucket.expectEmail(CONFIRM_EMAIL_SUBJECT_REGEX);
      const links = await emailBucket.getLinksInEmail(CONFIRM_EMAIL_SUBJECT_REGEX);
      expect(links.length, 'preregistration email should contain at least one link').toBeGreaterThan(0);
      // The link is the frontend registration URL carrying ?registrationKey=… —
      // navigate it directly (NOT a Supabase verify link → no toCallbackUrl).
      const registrationUrl = registrationUrlFromLinks(links);
      await page.goto(registrationUrl);
      // The register page auto-validates the key on mount and redirects to the
      // set-password page; the PasswordSetter renders there.
      await expect(page.getByTestId(testIds.candidate.passwordSetter.password)).toBeVisible({
        timeout: TIMEOUTS.slowPage
      });
    });

    // ============== Step 6: set password → register() → login page =========

    await test.step('6. set password → register() activates user → /candidate/login', async () => {
      await candidatePasswordSetter.setPassword(JOURNEY_PASSWORD);
      // register() activates the candidate then redirects to /candidate/login
      // with the email pre-filled (newUserEmail). Wait for the login form.
      await page.waitForURL(/\/candidate\/login/, { timeout: TIMEOUTS.slowPage });
      await expect(page.getByTestId(testIds.candidate.login.email)).toBeVisible({
        timeout: TIMEOUTS.slowPage
      });
    });

    // ============== Step 7: log in → logged-in candidate end state ==========

    await test.step('7. log in → logged-in candidate home (authenticated end state)', async () => {
      // The email is pre-filled from newUserEmail; fill it explicitly for
      // robustness, then fill the password and submit.
      await page.getByTestId(testIds.candidate.login.email).fill(BANK_AUTH_JOURNEY_EMAIL);
      await page.getByTestId(testIds.candidate.password.field).fill(JOURNEY_PASSWORD);
      await page.getByTestId(testIds.candidate.login.submit).click();
      // Logged-in end state: the candidate home status message renders. The
      // protected home is reachable ONLY if register() activated the user and
      // the login established an authenticated session — the end-to-end proof.
      await expect(page.getByTestId(testIds.candidate.home.statusMessage)).toBeVisible({
        timeout: TIMEOUTS.slowPage
      });
    });
  });
});
