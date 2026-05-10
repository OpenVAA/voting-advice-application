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

import { createClient } from '@supabase/supabase-js';
import * as jose from 'jose';
import { expect,test } from '../../fixtures';

const SUPABASE_URL = process.env.SUPABASE_URL ?? 'http://localhost:54321';
const SUPABASE_SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ??
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';
const SUPABASE_ANON_KEY =
  process.env.SUPABASE_ANON_KEY ??
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WO_o0BopYEtxYdNlHfxNto_8VH1W-nHhQcyo';

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
 * Generate RSA key pairs for test JWE/JWT token construction.
 * Creates encryption (RSA-OAEP-256) and signing (RS256) key pairs.
 */
async function generateTestKeys() {
  const { publicKey: encPub, privateKey: encPriv } = await jose.generateKeyPair('RSA-OAEP-256', {
    extractable: true
  });
  const encPubJwk = await jose.exportJWK(encPub);
  const encPrivJwk = await jose.exportJWK(encPriv);
  encPubJwk.kid = 'test-enc-1';
  encPubJwk.use = 'enc';
  encPubJwk.alg = 'RSA-OAEP-256';
  encPrivJwk.kid = 'test-enc-1';
  encPrivJwk.use = 'enc';
  encPrivJwk.alg = 'RSA-OAEP-256';

  const { publicKey: sigPub, privateKey: sigPriv } = await jose.generateKeyPair('RS256', {
    extractable: true
  });
  const sigPubJwk = await jose.exportJWK(sigPub);
  sigPubJwk.kid = 'test-sig-1';
  sigPubJwk.use = 'sig';
  sigPubJwk.alg = 'RS256';

  return { encPubJwk, encPrivJwk, sigPub, sigPriv, sigPubJwk };
}

/**
 * Build a JWE-encrypted id_token containing the test identity claims.
 * Mirrors the format that Idura (or Signicat) would return.
 */
async function buildTestIdToken(
  claims: Record<string, string>,
  sigPriv: jose.KeyLike,
  encPubJwk: jose.JWK
) {
  // 1. Create signed inner JWT
  const innerJwt = await new jose.SignJWT(claims)
    .setProtectedHeader({ alg: 'RS256', kid: 'test-sig-1' })
    .setIssuer('https://test-idp.example.com')
    .setAudience('test-client-id')
    .setExpirationTime('5m')
    .setIssuedAt()
    .sign(sigPriv);

  // 2. Encrypt as JWE
  const encKey = await jose.importJWK(encPubJwk, 'RSA-OAEP-256');
  const jwe = await new jose.CompactEncrypt(new TextEncoder().encode(innerJwt))
    .setProtectedHeader({ alg: 'RSA-OAEP-256', enc: 'A256GCM', kid: 'test-enc-1' })
    .encrypt(encKey);

  return jwe;
}

/**
 * Edge Function probe result captured once in beforeAll. The bank-auth project is
 * env-gated (PLAYWRIGHT_BANK_AUTH=1 selects the project per playwright.config.ts).
 * When the project runs, the Edge Function may or may not have decryption keys
 * configured (IDENTITY_PROVIDER_DECRYPTION_JWKS). The probe captures both modes
 * so per-test gating is precondition-not-met (not a race) — the Type A pattern
 * defined in 73-04-PLAN.md uses `test.skip(precondition, …)` with inline
 * `// reason:` justification matching the v2.8 P70 Cat A "Option A inline
 * ignore-with-rationale preamble" pattern.
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
  let testKeys: Awaited<ReturnType<typeof generateTestKeys>>;
  let probe: EdgeFunctionProbe | null = null;

  test.beforeAll(async () => {
    testKeys = await generateTestKeys();

    // Probe the Edge Function exactly once. The single call captures BOTH the
    // keys-configured (200 + success) and keys-not-configured (401/500) cases,
    // so per-test bodies can assert each path unconditionally — gated by the
    // probe state, not by in-test branching. This is the cardinal rewrite for
    // 73-04 Task 1 Phase B: replaces 12 no-conditional-expect + 4 no-conditional-in-test
    // sites in the original test 1 with one probe + two unconditional path-tests.
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

    probe = {
      status,
      body,
      keysConfigured,
      createdUserId: keysConfigured ? ((body.user_id as string) ?? null) : null,
      errorMsg: keysConfigured ? null : ((body.error ?? body.msg ?? body.details) as string | null) ?? null
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
    // configured. The original `if (body.session?.action_link) { expect(...) }` guard masked
    // that contract; replaced with unconditional path-asserts.
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
