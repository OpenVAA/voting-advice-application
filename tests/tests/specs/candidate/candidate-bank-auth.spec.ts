/**
 * Candidate bank authentication E2E tests (Idura/Signicat identity provider flow).
 *
 * Tests the identity-callback Edge Function integration by:
 * 1. Generating a synthetic JWE-encrypted id_token (matching the provider's format)
 * 2. Calling the identity-callback Edge Function directly
 * 3. Verifying a candidate is created with correct metadata
 * 4. Verifying a session can be established via the returned magic link
 *
 * Prerequisites:
 *   1. Supabase running: yarn dev (or supabase start)
 *   2. Edge Functions served without JWT verify:
 *      cd apps/supabase && npx supabase functions serve --no-verify-jwt
 *
 * Run manually (disabled by default):
 *   PLAYWRIGHT_BANK_AUTH=1 FRONTEND_PORT=5174 npx playwright test --project=bank-auth -c tests/playwright.config.ts
 *
 * NOTE: These tests call the Edge Function directly — they do NOT redirect
 * to a real identity provider. They verify the backend integration, not the
 * full OIDC redirect flow.
 */

import { expect, test } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';
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
 * The token builder + fixed test key pair are now shared utils (D-03):
 *   - `buildTestIdToken` — tests/tests/utils/buildTestIdToken.ts
 *   - `getTestKeys`      — tests/tests/utils/testKeys.ts (fixed committed pair)
 * The EFLOW-10 retarget + deterministic-green gate (D-02) lands in plan 122-02;
 * this plan only de-duplicates so the spec compiles against the shared util.
 */

/**
 * Edge Function probe result captured once in beforeAll. The bank-auth project is
 * env-gated (PLAYWRIGHT_BANK_AUTH=1 selects the project per playwright.config.ts).
 * When the project runs, the Edge Function may or may not have decryption keys
 * configured (IDENTITY_PROVIDER_DECRYPTION_JWKS). The probe captures both modes
 * so per-test gating is precondition-not-met (not a race): each test uses
 * `test.skip(precondition, …)` with an inline `// reason:` justification.
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
    const errorMsg = keysConfigured ? null : (typeof candidateErrorValue === 'string' ? candidateErrorValue : null);

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

  test('should create candidate via identity-callback Edge Function (keys configured path)', async () => {
    // reason: bank-auth is opt-in via @bank-auth tag (env-gated; PLAYWRIGHT_BANK_AUTH=1
    //   selects the project per playwright.config.ts; disabled by default in CI). This skip
    //   is a precondition-gate for the Edge Function integration test, NOT a race —
    //   converting to expect.poll would mask "Edge Function keys not configured" → false-positive timeout.
    // eslint-disable-next-line playwright/no-skipped-test
    test.skip(!probe || !probe.keysConfigured, 'Edge Function keys not configured — keys-configured path skipped');

    // probe is guaranteed non-null + keysConfigured here by the skip above; assert for type narrowing.
    expect(probe).not.toBeNull();
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

    // Verify app_metadata contains identity provider info
    const {
      data: { user }
    } = await adminClient.auth.admin.getUserById(captured.body.user_id as string);
    expect(user?.app_metadata?.identity_provider).toBeTruthy();
    expect(user?.app_metadata?.identity_match_prop).toBeTruthy();
    expect(user?.app_metadata?.identity_match_value).toBeTruthy();
  });

  test('should return structured error from identity-callback when Edge Function keys are not configured', async () => {
    // reason: complementary precondition-gate to the keys-configured path above. bank-auth is
    //   opt-in via @bank-auth tag (env-gated; PLAYWRIGHT_BANK_AUTH=1 selects the project per
    //   playwright.config.ts; disabled by default in CI). This skip gates the inverse
    //   precondition (keys absent), NOT a race — converting to expect.poll would mask
    //   "keys ARE configured" → false-positive timeout.
    // eslint-disable-next-line playwright/no-skipped-test
    test.skip(!probe || probe.keysConfigured, 'Edge Function keys ARE configured — keys-not-configured path skipped');

    expect(probe).not.toBeNull();
    const captured = probe!;

    // Keys not configured — expected in default local setup (status 401/500)
    // Verify the Edge Function is reachable and returns structured JSON errors
    // Response may have `error` (our code) or `msg` (Supabase auth middleware)
    expect([401, 500]).toContain(captured.status);
    expect(captured.errorMsg).toBeTruthy();
    expect(typeof captured.errorMsg).toBe('string');
  });

  test('should return session with magic link when candidate is created', async () => {
    // reason: bank-auth is opt-in via @bank-auth tag (env-gated; PLAYWRIGHT_BANK_AUTH=1
    //   selects the project per playwright.config.ts; disabled by default in CI). This skip
    //   is a precondition-gate for the Edge Function integration test, NOT a race —
    //   converting to expect.poll would mask "Edge Function keys not configured" → false-positive timeout.
    // eslint-disable-next-line playwright/no-skipped-test
    test.skip(!probe?.createdUserId, 'Skipped: Edge Function keys not configured for full integration');

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
