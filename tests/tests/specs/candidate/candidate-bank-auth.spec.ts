/**
 * Candidate bank authentication E2E tests — (Idura-only Edge-Function seam).
 *
 * Tests the identity-callback Edge Function integration by:
 * 1. Building a synthetic JWE-encrypted Idura id_token (fixed test keys, kid test-enc-1/test-sig-1)
 * 2. POSTing it directly to the identity-callback Edge Function (no browser, no live IdP)
 * 3. Verifying a candidate is created with the Idura `sub`-based identity match + claim flow-through
 * 4. Verifying a magic-link session (action_link) is returned
 *
 * This spec is Idura-only (the previous generic/legacy-provider assertions are dropped per
 * see phase 122). It asserts the
 * Idura claim model: `identity_provider='idura'`, `identity_match_prop='sub'`,
 * `identity_match_value=<sub>`, and the IDURA_AUTH_CONFIG.extractClaims flow-through
 * (`birthdate`, `hetu` — see apps/supabase/.../identity-callback/claimConfig.ts).
 *
 * DETERMINISTIC-GREEN GATE (122): the keys-configured create path runs on EVERY run
 * (never skipped). This requires the served Edge Function to read the FIXED test
 * decryption JWK (`IDENTITY_PROVIDER_DECRYPTION_JWKS` = `decryptionJwks` from
 * tests/tests/utils/testKeys.ts). A "did not run" counts as a CARDINAL failure.
 *
 * Run (see tests/IDURA-TEST-RUNBOOK.md → " deterministic E2E run"):
 *   # Terminal A — serve the Edge Function with the TEST decryption JWKS env file:
 *   cd apps/supabase/supabase && npx supabase functions serve identity-callback \
 *     --no-verify-jwt --env-file <tests/.eflow10.env from the runbook>
 *   # Terminal B — run the bank-auth project:
 *   PLAYWRIGHT_BANK_AUTH=1 FRONTEND_PORT=5174 npx playwright test --project=bank-auth -c tests/playwright.config.ts
 *
 * NOTE: These tests call the Edge Function directly — they do NOT redirect to a real
 * identity provider. They verify the backend integration, not the full OIDC redirect flow
 * (the full-browser journey is EFLOW-10b, candidate-bank-auth-journey.spec.ts).
 */

import { expect, test } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';
import * as jose from 'jose';
import { buildTestIdToken } from '../../utils/buildTestIdToken';
import { getTestKeys } from '../../utils/testKeys';

const SUPABASE_URL = process.env.SUPABASE_URL ?? 'http://localhost:54321';

// Throw on missing keys rather than falling back to hardcoded demo JWTs. A
// silent fallback masks misconfigured environments — tests would run against
// the demo keys and produce mysterious 401s from the Edge Function. Loud
// failure here surfaces the misconfiguration immediately.
if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('SUPABASE_SERVICE_ROLE_KEY required for candidate-bank-auth tests');
}
if (!process.env.SUPABASE_ANON_KEY) {
  throw new Error('SUPABASE_ANON_KEY required for candidate-bank-auth tests');
}
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

// Test identity claims for a synthetic bank auth user
const TEST_IDENTITY = {
  sub: 'test-bank-auth-sub-001',
  given_name: 'Testi',
  family_name: 'Tunnistautuja',
  birthdate: '1990-01-15',
  hetu: '150190-999X',
  country: 'FI',
  identityscheme: 'fitupas'
};

// Don't use stored auth — bank auth creates its own session
test.use({ storageState: { cookies: [], origins: [] } });

/**
 * The token builder + fixed test key pair are now shared utils:
 *   - `buildTestIdToken` — tests/tests/utils/buildTestIdToken.ts
 *   - `getTestKeys`      — tests/tests/utils/testKeys.ts (fixed committed pair)
 * The retarget + deterministic-green gate lands;
 * this plan only de-duplicates so the spec compiles against the shared util.
 */

/**
 * Edge Function probe result captured once in beforeAll. The bank-auth project is
 * env-gated (PLAYWRIGHT_BANK_AUTH=1 selects the project per playwright.config.ts).
 *
 * Under the deterministic-green gate the served Edge Function ALWAYS has the fixed
 * test decryption JWK wired (IDENTITY_PROVIDER_DECRYPTION_JWKS = decryptionJwks from
 * testKeys.ts), so `keysConfigured` is deterministically true and the create path runs
 * every run. The keys-configured test therefore asserts `keysConfigured === true` LOUDLY
 * (no skip) — a silent skip would be a cardinal "did not run" failure.
 */
type EdgeFunctionProbe = {
  status: number;
  body: Record<string, unknown>;
  /** True iff status===200 + body.success — keys configured, full integration path */
  keysConfigured: boolean;
  /** Captured user_id when keysConfigured (consumed by downstream tests) */
  createdUserId: string | null;
  /** Captured error message when !keysConfigured (string from body.error|msg|details) */
  errorMsg: string | null;
};

test.describe('candidate bank authentication', { tag: ['@bank-auth'] }, () => {
  test.describe.configure({ mode: 'serial' });

  const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  let testKeys: Awaited<ReturnType<typeof getTestKeys>>;
  let probe: EdgeFunctionProbe | null = null;

  test.beforeAll(async () => {
    testKeys = await getTestKeys();

    // Probe the Edge Function exactly once. The single call captures BOTH the
    // keys-configured (200 + success) and keys-not-configured (401/500) cases,
    // so per-test bodies can assert each path unconditionally — gated by the
    // probe state, not by in-test branching.
    //
    // For a full integration test, set these Supabase secrets:
    //   supabase secrets set IDENTITY_PROVIDER_DECRYPTION_JWKS='[{...test encPrivJwk...}]'
    //   supabase secrets set IDENTITY_PROVIDER_JWKS_URI='...' (or mock)
    //   supabase secrets set IDENTITY_PROVIDER_CLIENT_ID='test-client-id'
    const idToken = await buildTestIdToken(TEST_IDENTITY, testKeys.sigPriv, testKeys.encPubJwk);
    const response = await fetch(`${SUPABASE_URL}/functions/v1/identity-callback`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        apikey: SUPABASE_ANON_KEY
      },
      body: JSON.stringify({ id_token: idToken })
    });
    const status = response.status;
    const body = (await response.json()) as Record<string, unknown>;

    const keysConfigured = status === 200 && body.success === true;
    if (!keysConfigured && status !== 401 && status !== 500) {
      throw new Error(`Unexpected probe response ${status}: ${JSON.stringify(body)}`);
    }

    // The `body.error ?? body.msg ?? body.details` precedence chain is guarded
    // by an explicit `typeof === 'string'` check so non-string values (e.g.
    // `{ error: { code: 401 } }`) are not misrepresented as a string. The
    // typeof check returns null when none of the candidate properties is a string.
    const candidateErrorValue = body.error ?? body.msg ?? body.details;
    const errorMsg = keysConfigured ? null : typeof candidateErrorValue === 'string' ? candidateErrorValue : null;

    probe = {
      status,
      body,
      keysConfigured,
      createdUserId: keysConfigured ? ((body.user_id as string) ?? null) : null,
      errorMsg
    };
  });

  test.afterAll(async () => {
    // Cleanup: remove the test user if created during the probe
    if (probe?.createdUserId) {
      // Delete candidate record first (FK constraint)
      await adminClient.from('user_roles').delete().eq('user_id', probe.createdUserId);
      await adminClient.from('candidates').delete().eq('auth_user_id', probe.createdUserId);
      await adminClient.auth.admin.deleteUser(probe.createdUserId);
    }
  });

  test('should create candidate via identity-callback Edge Function (Idura sub-based identity)', async () => {
    // deterministic-green gate: the keys-configured create path MUST run every run.
    // Instead of skipping (a silent "did not run" = cardinal failure), assert LOUDLY that
    // the served Edge Function had the fixed test decryption JWK wired. If this fails, the
    // run procedure in tests/IDURA-TEST-RUNBOOK.md was not followed.
    expect(
      probe,
      'EFLOW-10 keys-configured path did not run — the served identity-callback Edge Function ' +
        'is missing IDENTITY_PROVIDER_DECRYPTION_JWKS. See tests/IDURA-TEST-RUNBOOK.md.'
    ).not.toBeNull();
    expect(
      probe!.keysConfigured,
      'keys-configured branch not taken — the served Edge Function is missing the fixed test ' +
        'decryption JWK (IDENTITY_PROVIDER_DECRYPTION_JWKS = decryptionJwks from testKeys.ts).'
    ).toBe(true);

    const captured = probe!;

    // Keys are configured — full integration path: capture user_id, candidate_id + name claims
    expect(captured.body.user_id).toBeTruthy();
    expect(captured.body.candidate_id).toBeTruthy();
    expect(captured.body.given_name).toBe(TEST_IDENTITY.given_name);
    expect(captured.body.family_name).toBe(TEST_IDENTITY.family_name);

    // Verify candidate record was created with correct names
    const { data: candidate } = await adminClient
      .from('candidates')
      .select('first_name, last_name, auth_user_id')
      .eq('id', captured.body.candidate_id as string)
      .single();
    expect(candidate?.first_name).toBe(TEST_IDENTITY.given_name);
    expect(candidate?.last_name).toBe(TEST_IDENTITY.family_name);

    // Verify app_metadata carries the Idura sub-based identity model (Idura-only retarget).
    const {
      data: { user }
    } = await adminClient.auth.admin.getUserById(captured.body.user_id as string);
    expect(user?.app_metadata?.identity_provider).toBe('idura');
    expect(user?.app_metadata?.identity_match_prop).toBe('sub');
    expect(user?.app_metadata?.identity_match_value).toBe(TEST_IDENTITY.sub);
    // Idura extra-claim flow-through. The Edge Function's IDURA config extracts ['birthdate', 'hetu']
    // (apps/supabase/.../identity-callback/claimConfig.ts:40-45) — assert exactly those. `country` is
    // NOT in the production extractClaims set, so it is intentionally not asserted (see SUMMARY deviation).
    expect(user?.app_metadata?.hetu).toBe(TEST_IDENTITY.hetu);
    expect(user?.app_metadata?.birthdate).toBe(TEST_IDENTITY.birthdate);
  });

  test('should reject an id_token encrypted with a mismatched (wrong) decryption key', async () => {
    // the inverse "keys-NOT-configured" skip is replaced by a NEGATIVE-PATH test that RUNS
    // every run. With the fixed test keys wired, the create path is always reachable — so instead
    // we prove the reject path by encrypting under a DELIBERATELY wrong enc key (kid the served
    // function has no private half for) → the function returns a structured decryption-failure 401.
    expect(probe, 'probe must have run (beforeAll)').not.toBeNull();

    // Build a JWE under a fresh, unrelated RSA-OAEP-256 key the served function cannot decrypt.
    const { publicKey: wrongEncPub } = await jose.generateKeyPair('RSA-OAEP-256', { extractable: true });
    const wrongEncJwk = await jose.exportJWK(wrongEncPub);
    wrongEncJwk.kid = 'wrong-enc-1';
    wrongEncJwk.alg = 'RSA-OAEP-256';
    wrongEncJwk.use = 'enc';

    const mismatchedToken = await buildTestIdToken(TEST_IDENTITY, testKeys.sigPriv, wrongEncJwk);
    const response = await fetch(`${SUPABASE_URL}/functions/v1/identity-callback`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        apikey: SUPABASE_ANON_KEY
      },
      body: JSON.stringify({ id_token: mismatchedToken })
    });
    // The served function has no matching decryption key for kid=wrong-enc-1 → structured 401.
    expect(response.status).toBe(401);
    const body = (await response.json()) as Record<string, unknown>;
    expect(body.error).toBeTruthy();
    expect(typeof body.error).toBe('string');
  });

  test('should return session with magic link when candidate is created', async () => {
    // no skip — the create path is guaranteed by the keys-configured gate above, so the
    // action_link is asserted UNCONDITIONALLY (a silent skip here would be a cardinal "did not run").
    expect(probe, 'probe must have created a user (keys-configured path)').not.toBeNull();
    expect(probe!.createdUserId, 'createdUserId must be present — keys-configured create path').toBeTruthy();

    const captured = probe!;

    // Call again with same identity — should find existing user
    const idToken = await buildTestIdToken(TEST_IDENTITY, testKeys.sigPriv, testKeys.encPubJwk);

    const response = await fetch(`${SUPABASE_URL}/functions/v1/identity-callback`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        apikey: SUPABASE_ANON_KEY
      },
      body: JSON.stringify({ id_token: idToken })
    });

    const body = (await response.json()) as Record<string, unknown>;
    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.is_new_user).toBe(false); // Should find existing user
    expect(body.user_id).toBe(captured.createdUserId);

    // Verify session data is returned with a magic-link action_link containing a token.
    // Both `session` and `session.action_link` are part of the Supabase magic-link contract
    // (admin.generateLink response shape) — they MUST be present together when keys are
    // configured, so the test asserts them unconditionally.
    const session = body.session as { action_link?: string } | null;
    expect(session).toBeTruthy();
    expect(session?.action_link).toBeTruthy();
    expect(session!.action_link).toContain('token=');
  });

  test('should handle CORS preflight correctly', async () => {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/identity-callback`, {
      method: 'OPTIONS',
      headers: {
        Origin: 'http://localhost:5174',
        'Access-Control-Request-Method': 'POST'
      }
    });
    expect(response.status).toBe(200);
    expect(response.headers.get('access-control-allow-origin')).toBe('*');
    expect(response.headers.get('access-control-allow-methods')).toContain('POST');
  });

  test('should reject requests without id_token', async () => {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/identity-callback`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        apikey: SUPABASE_ANON_KEY
      },
      body: JSON.stringify({})
    });
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toContain('id_token');
  });

  test('should reject invalid tokens', async () => {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/identity-callback`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        apikey: SUPABASE_ANON_KEY
      },
      body: JSON.stringify({ id_token: 'not.a.valid.jwt.token' })
    });
    // Should fail with 401 (decryption/verification failure)
    expect(response.status).toBe(401);
    const body = await response.json();
    expect(body.error).toBeTruthy();
  });
});
