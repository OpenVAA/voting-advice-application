/**
 * OIDC Authorize endpoint tests.
 *
 * Tests the POST handler that constructs an authorization URL via the active
 * identity provider and manages state/nonce cookies for CSRF and replay
 * protection (D-05, D-06 from 48-CONTEXT.md).
 *
 * For Idura: verifies the JAR (JWT Authorization Request) is correctly signed
 * with RS256, contains the required payload fields, and is verifiable with
 * the signing public key.
 *
 * @vitest-environment node
 */

import { describe, it, expect, vi, beforeAll, afterEach } from 'vitest';
import * as jose from 'jose';

// Use vi.hoisted for dynamic mock state (signing keys injected in beforeAll)
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
    PUBLIC_IDENTITY_PROVIDER_CLIENT_ID: 'test-client-id',
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

// Mock constants modules directly for dynamic value injection
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

import { POST } from '../../../../../routes/api/oidc/authorize/+server';

describe('POST /api/oidc/authorize', () => {
  let signingPublicKey: CryptoKey;

  beforeAll(async () => {
    // Generate RS256 signing key pair for Idura JAR construction
    const { privateKey, publicKey } = await jose.generateKeyPair('RS256', { extractable: true });
    signingPublicKey = publicKey;

    const jwk = {
      ...(await jose.exportJWK(privateKey)),
      kid: 'test-signing-kid',
      alg: 'RS256'
    };
    mockServerConstants.IDURA_SIGNING_JWKS = JSON.stringify([jwk]);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  /**
   * Helper to build a mock RequestEvent for the POST handler.
   */
  function createMockRequestEvent(body: Record<string, unknown>) {
    const cookieStore = new Map<string, { value: string; options: Record<string, unknown> }>();

    return {
      request: new Request('http://localhost/api/oidc/authorize', {
        method: 'POST',
        body: JSON.stringify(body),
        headers: { 'Content-Type': 'application/json' }
      }),
      cookies: {
        set: vi.fn((name: string, value: string, options: Record<string, unknown>) => {
          cookieStore.set(name, { value, options });
        }),
        get: vi.fn((name: string) => cookieStore.get(name)),
        delete: vi.fn(),
        getAll: vi.fn(() => []),
        serialize: vi.fn()
      },
      _cookieStore: cookieStore
    } as unknown as Parameters<typeof POST>[0] & { _cookieStore: Map<string, { value: string; options: Record<string, unknown> }> };
  }

  it('returns 200 with an authorizeUrl in the response', async () => {
    const event = createMockRequestEvent({ redirectUri: 'http://localhost:5173/callback' });
    const response = await POST(event);

    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data.authorizeUrl).toBeDefined();
    expect(typeof data.authorizeUrl).toBe('string');
  });

  it('authorizeUrl contains client_id query parameter', async () => {
    const event = createMockRequestEvent({ redirectUri: 'http://localhost:5173/callback' });
    const response = await POST(event);
    const { authorizeUrl } = await response.json();

    expect(authorizeUrl).toContain('client_id=test-client-id');
  });

  it('authorizeUrl contains a signed JWT request parameter', async () => {
    const event = createMockRequestEvent({ redirectUri: 'http://localhost:5173/callback' });
    const response = await POST(event);
    const { authorizeUrl } = await response.json();

    // Extract the request param from the URL
    const url = new URL(authorizeUrl);
    const requestParam = url.searchParams.get('request');
    expect(requestParam).toBeDefined();

    // JWT has 3 dot-separated segments
    const parts = requestParam!.split('.');
    expect(parts).toHaveLength(3);
  });

  it('JAR is signed with RS256 algorithm', async () => {
    const event = createMockRequestEvent({ redirectUri: 'http://localhost:5173/callback' });
    const response = await POST(event);
    const { authorizeUrl } = await response.json();

    const url = new URL(authorizeUrl);
    const requestParam = url.searchParams.get('request')!;

    const header = jose.decodeProtectedHeader(requestParam);
    expect(header.alg).toBe('RS256');
  });

  it('JAR payload contains required OIDC fields', async () => {
    const event = createMockRequestEvent({ redirectUri: 'http://localhost:5173/callback' });
    const response = await POST(event);
    const { authorizeUrl } = await response.json();

    const url = new URL(authorizeUrl);
    const requestParam = url.searchParams.get('request')!;

    const payload = jose.decodeJwt(requestParam);
    expect(payload.response_type).toBe('code');
    expect(payload.response_mode).toBe('query');
    expect(payload.client_id).toBe('test-client-id');
    expect(payload.redirect_uri).toBe('http://localhost:5173/callback');
    expect(payload.scope).toBe('openid profile');
    expect(payload.iss).toBe('test-client-id');
    expect(payload.aud).toBe('https://test.idura.broker');
    expect(payload.state).toBeDefined();
    expect(payload.nonce).toBeDefined();
  });

  it('JAR signature is verifiable with the signing public key', async () => {
    const event = createMockRequestEvent({ redirectUri: 'http://localhost:5173/callback' });
    const response = await POST(event);
    const { authorizeUrl } = await response.json();

    const url = new URL(authorizeUrl);
    const requestParam = url.searchParams.get('request')!;

    // Should not throw -- signature is valid
    const { payload } = await jose.jwtVerify(requestParam, signingPublicKey);
    expect(payload.client_id).toBe('test-client-id');
  });

  it('sets oidc_state cookie when provider returns state', async () => {
    const event = createMockRequestEvent({ redirectUri: 'http://localhost:5173/callback' });
    await POST(event);

    expect(event.cookies.set).toHaveBeenCalledWith(
      'oidc_state',
      expect.any(String),
      expect.objectContaining({
        httpOnly: true,
        secure: true,
        sameSite: 'lax',
        path: '/',
        maxAge: 600
      })
    );
  });

  it('sets oidc_nonce cookie when provider returns nonce', async () => {
    const event = createMockRequestEvent({ redirectUri: 'http://localhost:5173/callback' });
    await POST(event);

    expect(event.cookies.set).toHaveBeenCalledWith(
      'oidc_nonce',
      expect.any(String),
      expect.objectContaining({
        httpOnly: true,
        secure: true,
        sameSite: 'lax'
      })
    );
  });

  it('returns 400 when redirectUri is missing', async () => {
    const event = createMockRequestEvent({});

    // The error() function from @sveltejs/kit throws -- we need to handle this
    // The handler calls error(400, ...) which throws an HttpError
    await expect(POST(event)).rejects.toThrow();
  });
});
