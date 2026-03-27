/**
 * Idura provider interface compliance tests.
 *
 * Verifies that the Idura provider module implements the IdentityProvider
 * interface correctly and that getAuthorizeUrl produces a JAR-based
 * authorization URL with the expected structure (D-04 from 48-CONTEXT.md).
 *
 * @vitest-environment node
 */

import { describe, it, expect, vi, beforeAll, afterEach } from 'vitest';
import * as jose from 'jose';

// Use vi.hoisted to create shared state accessible from vi.mock factories.
// vi.mock factories are hoisted above all imports, so they cannot reference
// module-level variables. vi.hoisted runs at the same hoisted level.
const { mockConstants } = vi.hoisted(() => ({
  mockConstants: {
    IDURA_SIGNING_JWKS: '[]',
    IDURA_SIGNING_KEY_KID: 'test-idura-signing-kid',
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
  }
}));

// Mock env modules BEFORE importing modules that depend on them.
vi.mock('$env/dynamic/public', () => ({
  env: {
    PUBLIC_IDENTITY_PROVIDER_CLIENT_ID: 'test-idura-client',
    PUBLIC_IDENTITY_PROVIDER_TYPE: 'idura',
    PUBLIC_SUPABASE_URL: 'http://localhost:54321',
    PUBLIC_SUPABASE_ANON_KEY: 'test-anon-key'
  }
}));

vi.mock('$env/dynamic/private', () => ({
  env: {}
}));

// Mock $lib/server/constants directly to use dynamic values from mockConstants.
// This is necessary because constants.ts reads env at import time, but we
// need to inject the signing key generated in beforeAll.
vi.mock('$lib/server/constants', () => ({
  get constants() {
    return mockConstants;
  }
}));

import { iduraProvider } from './idura';

describe('Idura provider', () => {
  beforeAll(async () => {
    // Generate a real RS256 signing key pair for Idura JAR signing
    const { privateKey } = await jose.generateKeyPair('RS256', { extractable: true });
    const jwk = {
      ...(await jose.exportJWK(privateKey)),
      kid: 'test-idura-signing-kid',
      alg: 'RS256'
    };
    mockConstants.IDURA_SIGNING_JWKS = JSON.stringify([jwk]);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('interface compliance (D-04)', () => {
    it('has type property set to idura', () => {
      expect(iduraProvider.type).toBe('idura');
    });

    it('implements getAuthorizeUrl as a function', () => {
      expect(typeof iduraProvider.getAuthorizeUrl).toBe('function');
    });

    it('implements exchangeCodeForToken as a function', () => {
      expect(typeof iduraProvider.exchangeCodeForToken).toBe('function');
    });

    it('implements getIdTokenClaims as a function', () => {
      expect(typeof iduraProvider.getIdTokenClaims).toBe('function');
    });

    it('has authConfig with Idura claim mappings', () => {
      expect(iduraProvider.authConfig).toEqual({
        identityMatchProp: 'sub',
        extractClaims: ['birthdate', 'hetu', 'country'],
        firstNameProp: 'given_name',
        lastNameProp: 'family_name'
      });
    });
  });

  describe('getAuthorizeUrl (JAR-based)', () => {
    it('returns a URL pointing to the Idura authorize endpoint', async () => {
      const result = await iduraProvider.getAuthorizeUrl({
        redirectUri: 'http://localhost:5173/callback'
      });

      expect(result.authorizeUrl).toMatch(/^https:\/\/test\.idura\.broker\/oauth2\/authorize\?/);
    });

    it('returns clientSideRedirect=false (Idura uses server-side JAR)', async () => {
      const result = await iduraProvider.getAuthorizeUrl({
        redirectUri: 'http://localhost:5173/callback'
      });

      expect(result.clientSideRedirect).toBe(false);
    });

    it('includes a state parameter for CSRF protection', async () => {
      const result = await iduraProvider.getAuthorizeUrl({
        redirectUri: 'http://localhost:5173/callback'
      });

      expect(result.state).toBeDefined();
      expect(typeof result.state).toBe('string');
      expect(result.state!.length).toBeGreaterThan(0);
    });

    it('includes a nonce parameter for replay protection', async () => {
      const result = await iduraProvider.getAuthorizeUrl({
        redirectUri: 'http://localhost:5173/callback'
      });

      expect(result.nonce).toBeDefined();
      expect(typeof result.nonce).toBe('string');
    });

    it('includes a signed JWT request parameter in the URL', async () => {
      const result = await iduraProvider.getAuthorizeUrl({
        redirectUri: 'http://localhost:5173/callback'
      });

      // Extract the request parameter from the URL
      const url = new URL(result.authorizeUrl);
      const requestParam = url.searchParams.get('request');
      expect(requestParam).toBeDefined();

      // The request parameter should be a valid JWT (3 base64url segments)
      const parts = requestParam!.split('.');
      expect(parts).toHaveLength(3);
    });

    it('includes client_id in the URL query parameters', async () => {
      const result = await iduraProvider.getAuthorizeUrl({
        redirectUri: 'http://localhost:5173/callback'
      });

      const url = new URL(result.authorizeUrl);
      expect(url.searchParams.get('client_id')).toBe('test-idura-client');
    });

    it('does NOT call global fetch (JAR is built locally, not via server endpoint)', async () => {
      const fetchSpy = vi.spyOn(globalThis, 'fetch');

      await iduraProvider.getAuthorizeUrl({
        redirectUri: 'http://localhost:5173/callback'
      });

      expect(fetchSpy).not.toHaveBeenCalled();
    });

    it('signed request object contains correct claims', async () => {
      const result = await iduraProvider.getAuthorizeUrl({
        redirectUri: 'http://localhost:5173/callback'
      });

      // Extract and decode the JWT request object
      const url = new URL(result.authorizeUrl);
      const requestParam = url.searchParams.get('request')!;

      // Decode the payload without verification (we control the key)
      const payload = jose.decodeJwt(requestParam);

      expect(payload.client_id).toBe('test-idura-client');
      expect(payload.redirect_uri).toBe('http://localhost:5173/callback');
      expect(payload.response_type).toBe('code');
      expect(payload.scope).toBe('openid profile');
      expect(payload.state).toBe(result.state);
      expect(payload.nonce).toBe(result.nonce);
    });
  });
});
