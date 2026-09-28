/**
 * Candidate bank-auth (Idura OIDC) full-browser self-registration journey.
 *
 * This is the full-browser counterpart to the Edge-Function seam spec (`candidate-bank-auth.spec.ts`). It walks the REAL OIDC redirect chain end to end, faking ONLY the IdP at the env-pointed network seam (the mock OIDC issuer auto-spawned by the Playwright `webServer` entry). The authorize → callback → server-side exchange → JWE decrypt → claims → preregister chain runs UNMODIFIED (no production-code change, no test-only branch).
 *
 * Structure: ONE serial-describe → ONE long `test('full bank-auth ...')` → named `test.step` segments. The walk covers:
 *   1. goto /candidate/preregister (UNAUTHENTICATED) → click preregister-start
 *      → fetch POST /api/oidc/authorize → browser follows the 302 to the mock
 *      issuer → mock 302s back to /api/oidc/callback?code&state → server
 *      exchanges + JWE-decrypts the id_token + verifies → sets the id_token
 *      cookie → 303 back to /candidate/preregister AUTHENTICATED. Asserts the
 *      authenticated success state renders (preregister-continue, which appears ONLY when idTokenClaims is populated post-callback).
 *   2. click preregister-continue → election selector → submitElection().
 *   3. constituency selector → submitConstituency().
 *   4. email + ToU → fillEmailAndAcceptToU(recipientEmail) → triggers
 *      preregister() → POST /api/candidate/preregister → identity-callback Edge
 *      Function (JWE-decrypt → verify → extract claims → create auth user +
 *      candidate + grant → generate magic link) → the server route verifyOtp's
 *      the magic link to ESTABLISH THE SESSION INLINE, then redirects to /candidate/preregister/status?code=success.
 *   5. Assert the success status page (`preregister-status-return`). For the Supabase bank-auth adapter this IS the authenticated end state: the candidate's `auth.users` + `candidates` + `grants` cascade was created server-side by the Edge Function and the session was established by the route's verifyOtp — there is NO confirmation-email / registration-key / set-password leg (the Supabase id_token-callback path creates the user under an identity-derived placeholder email and logs in immediately).
 *   6. End-to-end DB proof: assert via SupabaseAdminClient that the bank-auth identity now resolves to a real `auth.users` row carrying the expected `identity_provider='idura-ftn'` + `identity_match_value=<sub>` app_metadata AND a linked `candidates` row + candidate entity `grants` row — the only way these exist is if the REAL authorize→callback→exchange→decrypt→ claims→create chain ran end to end (unmodified production auth code).
 *
 * Rigidity contract: no soft assertions, no try/catch wrapping assertions, and no swallowed-rejection fallbacks on assertion-bearing locator interactions — every assertion is hard and every locator interaction propagates rejection.
 *
 * Starts UNAUTHENTICATED (test.use storageState empty-cookies) — the bank-auth flow mints its own session. Runs on the /en locale-prefixed routes; asserts on testIds, never localized strings (CLAUDE.md localization rule).
 *
 * ---------------------------------------------------------------------------
 * Running (see tests/IDURA-TEST-RUNBOOK.md, "Full-browser journey", for the full procedure):
 *
 *   # Terminal 1 — SvelteKit server WITH the IdP env in its OWN process:
 *   export PUBLIC_PROJECT_ID=00000000-0000-0000-0000-0000000000e2   # the project the suite seeds
 *   source /tmp/bank-auth-journey.env   # IDURA_DOMAIN=127.0.0.1:9443, test JWKS,
 *                                       # IDENTITY_PROVIDER_ISSUER/_CLIENT_ID,
 *                                       # NODE_TLS_REJECT_UNAUTHORIZED=0 (test-only)
 *   yarn dev                            # :5173 inherits the IdP env
 *   #   + serve identity-callback with the test decryption JWKS (E-1..E-3)
 *
 *   # Terminal 2 — the journey run (the mock issuer auto-spawns via webServer):
 *   source /tmp/bank-auth-journey.env
 *   PLAYWRIGHT_BANK_AUTH=1 npx playwright test --project=bank-auth-journey -c tests/playwright.config.ts
 * ---------------------------------------------------------------------------
 */

import { expect, test } from '../../fixtures/candidate/candidate-bank-auth-journey';
import { TIMEOUTS } from '../../helpers';
import {
  BANK_AUTH_JOURNEY_EMAIL,
  BANK_AUTH_JOURNEY_PLACEHOLDER_EMAIL,
  BANK_AUTH_JOURNEY_SUB
} from '../../utils/bankAuthJourneyConstants';
import { SupabaseAdminClient } from '../../utils/supabaseAdminClient';
import { testIds } from '../../utils/testIds';

// ====================================================================
// FILE-SCOPE CONSTANTS
// ====================================================================

/**
 * Shape of an auth user as returned by the admin list API, narrowed to the fields the end-state DB assertion reads. `app_metadata` carries the bank-auth identity claims the identity-callback Edge Function stamped at create time.
 */
interface BankAuthUserRow {
  id: string;
  email?: string;
  app_metadata?: {
    identity_provider?: string;
    identity_match_prop?: string;
    identity_match_value?: string;
  };
}

// Start UNAUTHENTICATED — the bank-auth flow mints its own session.
test.use({ storageState: { cookies: [], origins: [] } });
test.use({ recipientEmail: BANK_AUTH_JOURNEY_EMAIL });

test.describe('candidate bank-auth journey', { tag: ['@bank-auth'] }, () => {
  test.describe.configure({ mode: 'serial' });

  test('full bank-auth self-registration journey through to authenticated candidate', async ({
    page,
    candidatePreregisterPage
  }) => {
    test.setTimeout(TIMEOUTS.testMax);

    // ============== Step 1: preregister-start → mock IdP → callback → auth ===

    await test.step('1. preregister-start → OIDC redirect chain → authenticated success state', async () => {
      await page.goto('/en/candidate/preregister');
      // The pre-auth landing renders the preregister-start CTA.
      await expect(page.getByTestId(testIds.candidate.preregister.start)).toBeVisible({
        timeout: TIMEOUTS.slowPage
      });
      // Click start → fetch POST /api/oidc/authorize → window.location = authorizeUrl → mock issuer 302 → /api/oidc/callback (server exchange + decrypt + verify) → 303 back to /candidate/preregister AUTHENTICATED.
      await candidatePreregisterPage.clickStart();
      // preregister-continue renders ONLY when idTokenClaims is populated (the post-callback authenticated success state) — its visibility proves the full authorize→callback→exchange→decrypt→claims chain ran end to end.
      await expect(page.getByTestId(testIds.candidate.preregister.continue)).toBeVisible({
        timeout: TIMEOUTS.slowPage
      });
    });

    // ============== Step 2: continue → election selector ===================

    await test.step('2. continue → select election + advance', async () => {
      await page.getByTestId(testIds.candidate.preregister.continue).click();
      // Land on the election selector (perm-bankauth-notloc seeds 2 elections).
      const electionsList = page.getByTestId(testIds.candidate.preregister.electionsList);
      await expect(electionsList).toBeVisible({
        timeout: TIMEOUTS.slowPage
      });
      // Select the perm-bankauth-notloc election BY IDENTITY, never by position: a positional `.first()` pick can silently preregister into a foreign election, and a presence check on the label only proves the dataset is in the list, not that the fixture checked it.
      // submitElection's `toHaveCount(1)` subsumes the presence assertion.
      //
      // `BA-`: `[EL1]` alone is a perm-family shape convention emitted by twelve templates, so it matches more than one election while the perm datasets are live. `[BA-EL1]` is this dataset's own label namespace — see `perm-bankauth-notloc.ts`.
      await candidatePreregisterPage.submitElection('[BA-EL1]');
    });

    // ============== Step 3: constituency selector ==========================

    await test.step('3. select constituency + advance', async () => {
      await expect(page.getByTestId(testIds.candidate.preregister.constituenciesList)).toBeVisible({
        timeout: TIMEOUTS.slowPage
      });
      // Identity-scoped for the same reason as step 2: '[BA-CO1' matches only this dataset's Region constituencies (BA-CO1A / BA-CO1B), never base's and never a perm dataset's bare `[CO1A]`.
      await candidatePreregisterPage.submitConstituency('[BA-CO1');
    });

    // ============== Step 4: email + ToU → preregister() ====================

    await test.step('4. fill email + accept ToU → trigger preregister()', async () => {
      await expect(page.getByTestId(testIds.candidate.preregister.emailInput)).toBeVisible({
        timeout: TIMEOUTS.slowPage
      });
      await candidatePreregisterPage.fillEmailAndAcceptToU(BANK_AUTH_JOURNEY_EMAIL);
    });

    // ============== Step 5: preregister() success status page ==============

    await test.step('5. preregister() establishes session → success status page', async () => {
      // The Supabase bank-auth flow: preregister() POSTs /api/candidate/preregister, which invokes the identity-callback Edge Function (decrypt → verify → claims → create auth user + candidate + grant → magic link), then the route verifyOtp's the magic link to ESTABLISH THE SESSION INLINE and redirects to /candidate/preregister/status?code=success. There is NO confirmation-email / registration-key / set-password leg in this adapter.
      await page.waitForURL(/\/candidate\/preregister\/status/, { timeout: TIMEOUTS.slowPage });
      // The success status page renders the Return CTA ONLY for code=success — its visibility proves the full chain ran end to end (any failure code renders the retry/help variant instead).
      await expect(page.getByTestId(testIds.candidate.preregister.statusReturn)).toBeVisible({
        timeout: TIMEOUTS.slowPage
      });
    });

    // ============== Step 6: end-to-end DB proof of the created identity =====

    await test.step('6. assert the bank-auth identity + candidate + role were created', async () => {
      // The ONLY way these rows exist is if the REAL authorize→callback→ exchange→decrypt→claims→create chain ran UNMODIFIED end to end: the Edge Function created the auth user under the identity-derived placeholder email, stamped the idura identity claims into app_metadata, and created the linked candidate + grant.
      const client = new SupabaseAdminClient();

      // 6a. The auth user exists under the placeholder email with the expected
      //     bank-auth identity app_metadata (read via the admin API — auth.users lives in the `auth` schema, not the PostgREST-exposed `public` one).
      const authUser: BankAuthUserRow | undefined = await client.getAuthUserByEmail(
        BANK_AUTH_JOURNEY_PLACEHOLDER_EMAIL
      );
      expect(authUser, `bank-auth auth user (${BANK_AUTH_JOURNEY_PLACEHOLDER_EMAIL}) should exist`).toBeTruthy();
      const authUserId = authUserIdOrThrow(authUser);
      expect(authUser!.app_metadata?.identity_provider, 'identity_provider claim').toBe('idura-ftn');
      expect(authUser!.app_metadata?.identity_match_value, 'identity_match_value claim').toBe(BANK_AUTH_JOURNEY_SUB);

      // 6b. The linked candidate row exists (public.candidates via PostgREST).
      const candidateResult = await client.findData('candidates', { auth_user_id: authUserId });
      expect(candidateResult.type, 'candidate lookup should succeed').toBe('success');
      // reason: discriminated-union data-extraction narrowing (not a branch on test outcome); the line above already asserts `.type === 'success'`. The downstream expect(candidateRows.length, ...) assertion does the checking.
      // eslint-disable-next-line playwright/no-conditional-in-test
      const candidateRows = (candidateResult.type === 'success' ? candidateResult.data : undefined) ?? [];
      expect(candidateRows.length, 'a candidate row should be linked to the bank-auth user').toBe(1);

      // 6c. The candidate authority row exists (public.grants via PostgREST); the identity-callback function writes it through `entityGrant.ts`.
      const roleResult = await client.findData('grants', {
        user_id: authUserId,
        scope: 'entity',
        target_type: 'candidate'
      });
      expect(roleResult.type, 'grants lookup should succeed').toBe('success');
      // reason: discriminated-union data-extraction narrowing (not a branch on test outcome); the line above already asserts `.type === 'success'`. The downstream expect(roleRows.length, ...) assertion does the checking.
      // eslint-disable-next-line playwright/no-conditional-in-test
      const roleRows = (roleResult.type === 'success' ? roleResult.data : undefined) ?? [];
      expect(roleRows.length, 'a candidate entity grant should be held by the bank-auth user').toBeGreaterThan(0);
    });
  });
});

/**
 * Narrow `authUser` to a guaranteed non-empty id, throwing a clear error when absent. Hoisted to module scope so the presence guard runs as a plain helper (not inline conditional flow) per playwright/no-conditional-in-test — the companion `toBeTruthy()` assertion already fails the test first; this only narrows the type for the subsequent `findData` calls.
 */
function authUserIdOrThrow(authUser: BankAuthUserRow | undefined): string {
  if (!authUser) {
    throw new Error('bank-auth auth user was not created — the OIDC create chain did not complete');
  }
  return authUser.id;
}
