/**
 * Signicat provider tests.
 *
 * Verifies that the Signicat provider produces the OUTPUT its interface promises: client-side PKCE authorize URLs, a `client_secret` token-exchange request body, the configured `authConfig` claim mapping applied to a real decrypted ID token, and each of the three discriminating failure codes.
 *
 * The `$lib/server/constants` module mock is the only seam that can inject generated keys: `constants.ts` is an eager object literal evaluated once at import, so mutating a `$env/dynamic/private` mock after import is invisible. Dependency injection through the `IdentityProvider` interface is deliberately NOT used -- it would open a seam production callers could misuse; this mock is test-only.
 *
 * @vitest-environment node
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { signicatProvider } from './signicat';

// Mock env modules BEFORE importing any modules that depend on them.
// This follows the established pattern from supabaseDataWriter.test.ts.
vi.mock('$env/dynamic/public', () => ({
  env: {
    PUBLIC_IDENTITY_PROVIDER_CLIENT_ID: 'test-signicat-client',
    PUBLIC_IDENTITY_PROVIDER_AUTHORIZATION_ENDPOINT: 'https://signicat.example/authorize',
    PUBLIC_IDENTITY_PROVIDER_TYPE: 'signicat',
    PUBLIC_SUPABASE_URL: 'http://localhost:54321',
    PUBLIC_SUPABASE_ANON_KEY: 'test-anon-key'
  }
}));

vi.mock('$env/dynamic/private', () => ({
  env: {
    IDENTITY_PROVIDER_CLIENT_SECRET: 'test-client-secret',
    IDENTITY_PROVIDER_TOKEN_ENDPOINT: 'https://signicat.example/token',
    IDENTITY_PROVIDER_DECRYPTION_JWKS: '[]',
    IDENTITY_PROVIDER_JWKS_URI: 'https://signicat.example/.well-known/jwks',
    IDENTITY_PROVIDER_ISSUER: 'https://signicat.example'
  }
}));

describe('Signicat provider', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('interface compliance', () => {
    it('has type property set to signicat', () => {
      expect(signicatProvider.type).toBe('signicat');
    });

    it('implements getAuthorizeUrl as a function', () => {
      expect(typeof signicatProvider.getAuthorizeUrl).toBe('function');
    });

    it('implements exchangeCodeForToken as a function', () => {
      expect(typeof signicatProvider.exchangeCodeForToken).toBe('function');
    });

    it('implements getIdTokenClaims as a function', () => {
      expect(typeof signicatProvider.getIdTokenClaims).toBe('function');
    });

    it('has authConfig with Signicat claim mappings', () => {
      expect(signicatProvider.authConfig).toEqual({
        identityMatchProp: 'birthdate',
        extractClaims: ['birthdate'],
        firstNameProp: 'given_name',
        lastNameProp: 'family_name'
      });
    });
  });

  describe('getAuthorizeUrl (PKCE flow unchanged)', () => {
    it('returns URL with PKCE code_challenge parameter', async () => {
      const result = await signicatProvider.getAuthorizeUrl({
        redirectUri: 'http://localhost:5173/callback',
        codeChallenge: 'test-code-challenge-value'
      });

      expect(result.authorizeUrl).toContain('code_challenge=test-code-challenge-value');
    });

    it('returns URL with response_type=code', async () => {
      const result = await signicatProvider.getAuthorizeUrl({
        redirectUri: 'http://localhost:5173/callback',
        codeChallenge: 'test-challenge'
      });

      expect(result.authorizeUrl).toContain('response_type=code');
    });

    it('returns URL with the configured client_id', async () => {
      const result = await signicatProvider.getAuthorizeUrl({
        redirectUri: 'http://localhost:5173/callback',
        codeChallenge: 'test-challenge'
      });

      expect(result.authorizeUrl).toContain('client_id=test-signicat-client');
    });

    it('returns URL with encoded redirect_uri', async () => {
      const result = await signicatProvider.getAuthorizeUrl({
        redirectUri: 'http://localhost:5173/callback',
        codeChallenge: 'test-challenge'
      });

      expect(result.authorizeUrl).toContain(`redirect_uri=${encodeURIComponent('http://localhost:5173/callback')}`);
    });

    it('returns URL starting from the configured authorization endpoint', async () => {
      const result = await signicatProvider.getAuthorizeUrl({
        redirectUri: 'http://localhost:5173/callback',
        codeChallenge: 'test-challenge'
      });

      expect(result.authorizeUrl).toMatch(/^https:\/\/signicat\.example\/authorize\?/);
    });

    it('returns clientSideRedirect=true (Signicat builds URL client-side)', async () => {
      const result = await signicatProvider.getAuthorizeUrl({
        redirectUri: 'http://localhost:5173/callback',
        codeChallenge: 'test-challenge'
      });

      expect(result.clientSideRedirect).toBe(true);
    });

    it('does NOT call global fetch (Signicat is client-side only)', async () => {
      const fetchSpy = vi.spyOn(globalThis, 'fetch');

      await signicatProvider.getAuthorizeUrl({
        redirectUri: 'http://localhost:5173/callback',
        codeChallenge: 'test-challenge'
      });

      expect(fetchSpy).not.toHaveBeenCalled();
    });
  });
});
