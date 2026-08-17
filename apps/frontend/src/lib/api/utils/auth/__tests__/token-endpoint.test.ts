/**
 * OIDC Token exchange endpoint tests.
 *
 * Tests the POST handler that exchanges an authorization code for an id_token
 * via the active identity provider (from).
 *
 * For Idura: verifies that private_key_jwt client assertion is sent with
 * correct structure (iss, sub, aud, exp, jti).
 *
 * For Signicat: verifies that client_secret is sent (backward compat) and
 * no client_assertion is present.
 *
 * Strategy: Mock global fetch to intercept token endpoint calls and inspect
 * the request body.
 *
 * @vitest-environment node
 */

import * as jose from 'jose';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import type { POST as TokenPostHandler } from '../../../../../routes/api/oidc/token/+server';

// Use vi.hoisted at file level so both describe blocks can access the mock state
const { mockServerConstants, mockPublicConstants } = vi.hoisted(() => ({
  mockServerConstants: {
    IDURA_SIGNING_JWKS: '[]',
    IDURA_SIGNING_KEY_KID: 'test-signing-kid',
    IDURA_DOMAIN: 'test.idura.broker',
    IDENTITY_PROVIDER_DECRYPTION_JWKS: '[]',
    IDENTITY_PROVIDER_JWKS_URI: 'https://test.idura.broker/.well-known/jwks',
    IDENTITY_PROVIDER_ISSUER: 'https://test.idura.broker',
    IDENTITY_PROVIDER_TOKEN_ENDPOINT: 'https://test.idura.broker/oauth2/token',
    IDENTITY_PROVIDER_CLIENT_SECRET: '',
    BACKEND_API_TOKEN: '',
    LOCAL_DATA_DIR: '',
    CACHE_DIR: '',
    CACHE_TTL: '',
    CACHE_LRU_SIZE: '',
    CACHE_EXPIRATION_INTERVAL: '',
    LLM_OPENAI_API_KEY: ''
  },
  mockPublicConstants: {
    PUBLIC_IDENTITY_PROVIDER_CLIENT_ID: 'test-idura-client',
    PUBLIC_IDENTITY_PROVIDER_TYPE: 'idura',
    PUBLIC_IDENTITY_PROVIDER_AUTHORIZATION_ENDPOINT: '',
    PUBLIC_BROWSER_BACKEND_URL: '',
    PUBLIC_SERVER_BACKEND_URL: '',
    PUBLIC_BROWSER_FRONTEND_URL: '',
    PUBLIC_SERVER_FRONTEND_URL: '',
    PUBLIC_DEBUG: false,
    PUBLIC_CACHE_ENABLED: false,
    PUBLIC_SUPABASE_URL: 'http://localhost:54321',
    PUBLIC_SUPABASE_ANON_KEY: 'test-anon-key'
  }
}));

// Mock env modules before importing modules that depend on them
vi.mock('$env/dynamic/public', () => ({ env: {} }));
vi.mock('$env/dynamic/private', () => ({ env: {} }));

vi.mock('$lib/server/constants', () => ({
  get constants() {
    return mockServerConstants;
  }
}));

vi.mock('$lib/utils/constants', () => ({
  get constants() {
    return mockPublicConstants;
  }
}));

/**
 * The rejection every Idura test below asserts against (see phase 140 review IN-03).
 *
 * `POST` wraps its whole body in `try/catch` and re-raises every failure as
 * `error(401, { message: 'Unauthorized' })`, so the value it rejects with is a
 * SvelteKit `HttpError` — `{ status, body }`, NOT an `Error`, and with NO
 * `message` property. That rules out the obvious strengthening of a bare
 * `.rejects.toThrow()`: a message matcher (`.rejects.toThrow(/claims|jwt/i)`)
 * cannot pass here, because there is no message to match. Do not "fix" this
 * back to a message regex — verified 2026-08-16 against the running test:
 * `ctor=HttpError, isError=false, message=undefined, keys=['status','body']`.
 *
 * What the shape assertion buys over a bare `toThrow()`: the bare form is
 * satisfied by ANY throw, including one raised while constructing the request
 * — i.e. before `fetch` is ever called — while the test's own name claims the
 * handler got as far as exchanging the code. Pairing this matcher with the
 * `expect(capturedFetchBody).not.toBeNull()` guard that follows every call
 * site pins BOTH halves: the token request was actually issued, and the
 * handler then failed the documented way (`getIdTokenClaims` on the mock
 * token) rather than some other way that happens to also throw.
 */
const EXPECTED_REJECTION = { status: 401, body: { message: 'Unauthorized' } };

/**
 * Helper to build a mock RequestEvent for the POST handler.
 */
function createMockRequestEvent(body: Record<string, unknown>) {
  const cookieStore = new Map<string, string>();
  return {
    request: new Request('http://localhost/api/oidc/token', {
      method: 'POST',
      body: JSON.stringify(body),
      headers: { 'Content-Type': 'application/json' }
    }),
    cookies: {
      set: vi.fn((name: string, value: string) => cookieStore.set(name, value)),
      get: vi.fn((name: string) => cookieStore.get(name)),
      delete: vi.fn(),
      getAll: vi.fn(() => []),
      serialize: vi.fn()
    }
  } as unknown as Parameters<typeof TokenPostHandler>[0];
}

// ── Idura test suite ──

describe('POST /api/oidc/token (Idura - private_key_jwt)', () => {
  let capturedFetchBody: URLSearchParams | null = null;

  beforeAll(async () => {
    // Generate signing key for private_key_jwt assertion
    const { privateKey } = await jose.generateKeyPair('RS256', { extractable: true });
    const jwk = {
      ...(await jose.exportJWK(privateKey)),
      kid: 'test-signing-kid',
      alg: 'RS256'
    };
    mockServerConstants.IDURA_SIGNING_JWKS = JSON.stringify([jwk]);
  });

  beforeEach(() => {
    capturedFetchBody = null;
    mockPublicConstants.PUBLIC_IDENTITY_PROVIDER_TYPE = 'idura';

    // Mock global fetch to intercept the token endpoint POST
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (_input, init) => {
      const body = init?.body as string;
      capturedFetchBody = new URLSearchParams(body);

      return new Response(JSON.stringify({ id_token: 'mock.jwe.token.for.testing' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('sends client_assertion_type=jwt-bearer to the token endpoint', async () => {
    const { POST } = await import('../../../../../routes/api/oidc/token/+server');

    const event = createMockRequestEvent({
      authorizationCode: 'test-auth-code',
      redirectUri: 'http://localhost:5173/callback'
    });

    await expect(
      POST(event),
      'POST should reject with the documented 401 HttpError, not merely throw something'
    ).rejects.toMatchObject(EXPECTED_REJECTION);

    expect(capturedFetchBody).not.toBeNull();
    expect(capturedFetchBody!.get('client_assertion_type')).toBe(
      'urn:ietf:params:oauth:client-assertion-type:jwt-bearer'
    );
  });

  it('sends a valid JWT as client_assertion', async () => {
    const { POST } = await import('../../../../../routes/api/oidc/token/+server');

    const event = createMockRequestEvent({
      authorizationCode: 'test-auth-code',
      redirectUri: 'http://localhost:5173/callback'
    });

    await expect(
      POST(event),
      'POST should reject with the documented 401 HttpError, not merely throw something'
    ).rejects.toMatchObject(EXPECTED_REJECTION);

    expect(capturedFetchBody).not.toBeNull();
    const assertion = capturedFetchBody!.get('client_assertion');
    expect(assertion, "token request body is missing 'client_assertion'").toEqual(
      expect.stringMatching(/^[\w-]+\.[\w-]+\.[\w-]+$/)
    );
  });

  it('client assertion has RS256 algorithm in header', async () => {
    const { POST } = await import('../../../../../routes/api/oidc/token/+server');

    const event = createMockRequestEvent({
      authorizationCode: 'test-auth-code',
      redirectUri: 'http://localhost:5173/callback'
    });

    await expect(
      POST(event),
      'POST should reject with the documented 401 HttpError, not merely throw something'
    ).rejects.toMatchObject(EXPECTED_REJECTION);

    expect(
      capturedFetchBody,
      'POST rejected before reaching fetch — the token request was never issued'
    ).not.toBeNull();
    const assertion = capturedFetchBody!.get('client_assertion')!;
    const header = jose.decodeProtectedHeader(assertion);
    expect(header.alg).toBe('RS256');
  });

  it('client assertion has correct iss, sub, aud claims', async () => {
    const { POST } = await import('../../../../../routes/api/oidc/token/+server');

    const event = createMockRequestEvent({
      authorizationCode: 'test-auth-code',
      redirectUri: 'http://localhost:5173/callback'
    });

    await expect(
      POST(event),
      'POST should reject with the documented 401 HttpError, not merely throw something'
    ).rejects.toMatchObject(EXPECTED_REJECTION);

    expect(
      capturedFetchBody,
      'POST rejected before reaching fetch — the token request was never issued'
    ).not.toBeNull();
    const assertion = capturedFetchBody!.get('client_assertion')!;
    const payload = jose.decodeJwt(assertion);

    expect(payload.iss).toBe('test-idura-client');
    expect(payload.sub).toBe('test-idura-client');
    expect(payload.aud).toBe('https://test.idura.broker/oauth2/token');
  });

  it('client assertion has exp within 5 minutes and a jti', async () => {
    const { POST } = await import('../../../../../routes/api/oidc/token/+server');

    const event = createMockRequestEvent({
      authorizationCode: 'test-auth-code',
      redirectUri: 'http://localhost:5173/callback'
    });

    await expect(
      POST(event),
      'POST should reject with the documented 401 HttpError, not merely throw something'
    ).rejects.toMatchObject(EXPECTED_REJECTION);

    expect(
      capturedFetchBody,
      'POST rejected before reaching fetch — the token request was never issued'
    ).not.toBeNull();
    const assertion = capturedFetchBody!.get('client_assertion')!;
    const payload = jose.decodeJwt(assertion);

    // exp should be set and within 5 minutes from now
    expect(payload.exp).toBeDefined();
    const now = Math.floor(Date.now() / 1000);
    expect(payload.exp!).toBeGreaterThan(now);
    expect(payload.exp!).toBeLessThanOrEqual(now + 300 + 5); // 5min + 5sec tolerance

    // jti should be present (unique identifier)
    expect(payload.jti).toBeDefined();
    expect(typeof payload.jti).toBe('string');
    expect(payload.jti!.length).toBeGreaterThan(0);
  });

  it('does NOT include client_secret in the token request', async () => {
    const { POST } = await import('../../../../../routes/api/oidc/token/+server');

    const event = createMockRequestEvent({
      authorizationCode: 'test-auth-code',
      redirectUri: 'http://localhost:5173/callback'
    });

    await expect(
      POST(event),
      'POST should reject with the documented 401 HttpError, not merely throw something'
    ).rejects.toMatchObject(EXPECTED_REJECTION);

    expect(capturedFetchBody).not.toBeNull();
    expect(capturedFetchBody!.has('client_secret')).toBe(false);
  });
});

// ── Signicat test suite (backward compatibility) ──

// see phase 140 review WR-04 — DELIBERATELY OUT OF SCOPE, not an oversight.
//
// The four `try { await POST(event) } catch {}` blocks below are structurally
// identical to the six in the Idura describe above, which see phase 140 converted
// to `await expect(POST(event)).rejects.toMatchObject(EXPECTED_REJECTION)`.
// They were NOT converted,
// and that asymmetry is a scoping decision recorded here so the file does not
// read as half-migrated:
//
//   see phase 140's remit is the Idura (private_key_jwt) bank-auth path. Signicat
//   (client_secret) is a separate provider whose own coverage phase has not
//   run; converting its assertions here would change what this describe proves
//   without any Signicat-side gate to catch a regression in the conversion.
//
// The gap is real and unchanged: each block discards every rejection from the
// call under test, so it cannot distinguish "the handler threw at
// getIdTokenClaims as intended" from "the handler threw during argument
// construction before fetch was reached". Do NOT copy this pattern into new
// tests — the converted Idura blocks above are the convention. Apply the same
// `.rejects.toMatchObject(EXPECTED_REJECTION)` conversion, plus the
// reached-`fetch` guard, when Signicat coverage is next touched.
describe('POST /api/oidc/token (Signicat - client_secret)', () => {
  let capturedFetchBody: URLSearchParams | null = null;

  beforeEach(() => {
    capturedFetchBody = null;

    // Switch to Signicat provider for these tests
    mockPublicConstants.PUBLIC_IDENTITY_PROVIDER_TYPE = 'signicat';
    mockServerConstants.IDENTITY_PROVIDER_CLIENT_SECRET = 'test-signicat-secret';
    mockServerConstants.IDENTITY_PROVIDER_TOKEN_ENDPOINT = 'https://signicat.example/token';

    // Mock global fetch to intercept the token endpoint POST
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (_input, init) => {
      const body = init?.body as string;
      capturedFetchBody = new URLSearchParams(body);

      return new Response(JSON.stringify({ id_token: 'mock.jwe.token.for.testing' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    });
  });

  afterEach(() => {
    // Restore to Idura defaults for other test suites
    mockPublicConstants.PUBLIC_IDENTITY_PROVIDER_TYPE = 'idura';
    mockServerConstants.IDENTITY_PROVIDER_CLIENT_SECRET = '';
    mockServerConstants.IDENTITY_PROVIDER_TOKEN_ENDPOINT = 'https://test.idura.broker/oauth2/token';
    vi.restoreAllMocks();
  });

  it('sends client_secret in the token request body', async () => {
    const { POST } = await import('../../../../../routes/api/oidc/token/+server');

    const event = createMockRequestEvent({
      authorizationCode: 'test-auth-code',
      codeVerifier: 'test-code-verifier',
      redirectUri: 'http://localhost:5173/callback'
    });

    try {
      await POST(event);
    } catch {
      // Expected: getIdTokenClaims fails on mock token
    }

    expect(capturedFetchBody).not.toBeNull();
    expect(capturedFetchBody!.get('client_secret')).toBe('test-signicat-secret');
  });

  it('sends client_id in the token request body', async () => {
    const { POST } = await import('../../../../../routes/api/oidc/token/+server');

    const event = createMockRequestEvent({
      authorizationCode: 'test-auth-code',
      codeVerifier: 'test-code-verifier',
      redirectUri: 'http://localhost:5173/callback'
    });

    try {
      await POST(event);
    } catch {
      // Expected
    }

    expect(capturedFetchBody).not.toBeNull();
    expect(capturedFetchBody!.get('client_id')).toBe('test-idura-client');
  });

  it('sends code_verifier in the token request body (PKCE)', async () => {
    const { POST } = await import('../../../../../routes/api/oidc/token/+server');

    const event = createMockRequestEvent({
      authorizationCode: 'test-auth-code',
      codeVerifier: 'test-code-verifier',
      redirectUri: 'http://localhost:5173/callback'
    });

    try {
      await POST(event);
    } catch {
      // Expected
    }

    expect(capturedFetchBody).not.toBeNull();
    expect(capturedFetchBody!.get('code_verifier')).toBe('test-code-verifier');
  });

  it('does NOT include client_assertion in the token request', async () => {
    const { POST } = await import('../../../../../routes/api/oidc/token/+server');

    const event = createMockRequestEvent({
      authorizationCode: 'test-auth-code',
      codeVerifier: 'test-code-verifier',
      redirectUri: 'http://localhost:5173/callback'
    });

    try {
      await POST(event);
    } catch {
      // Expected
    }

    expect(capturedFetchBody).not.toBeNull();
    expect(capturedFetchBody!.has('client_assertion')).toBe(false);
    expect(capturedFetchBody!.has('client_assertion_type')).toBe(false);
  });
});
