/**
 * Signicat provider tests.
 *
 * Verifies that the Signicat provider produces the OUTPUT its interface promises: client-side PKCE authorize URLs, a `client_secret` token-exchange request body, the configured `authConfig` claim mapping applied to a real decrypted ID token, and each of the three discriminating failure codes.
 *
 * The `$lib/server/constants` module mock is the only seam that can inject generated keys: `constants.ts` is an eager object literal evaluated once at import, so mutating a `$env/dynamic/private` mock after import is invisible. Dependency injection through the `IdentityProvider` interface is deliberately NOT used -- it would open a seam production callers could misuse; this mock is test-only.
 *
 * @vitest-environment node
 */

import * as jose from 'jose';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { createTestKeySet } from './__fixtures__/keys';
import { createTestJwe } from './__fixtures__/tokens';
import { signicatProvider } from './signicat';
import type * as JoseType from 'jose';
import type { TestKeySet } from './__fixtures__/keys';

// Hoisted shared state, accessible from the `vi.mock` factories below. Those factories are hoisted above all imports, so they cannot reference module-level `const`s; the helper below runs at the same hoisted level -- and it must supply BOTH objects from ONE call, for the same reason.
//
// `mockConstants` declares the full `constants` shape rather than the subset this file reads: a partial object typechecks under vitest (which does not typecheck) and then drifts silently from the real module.
const { mockConstants, localJwksState } = vi.hoisted(() => ({
  mockConstants: {
    BACKEND_API_TOKEN: '',
    IDENTITY_PROVIDER_CLIENT_SECRET: 'test-client-secret',
    IDENTITY_PROVIDER_DECRYPTION_JWKS: '[]',
    IDENTITY_PROVIDER_JWKS_URI: 'https://signicat.example/.well-known/jwks',
    IDENTITY_PROVIDER_ISSUER: 'https://signicat.example',
    IDENTITY_PROVIDER_TOKEN_ENDPOINT: 'https://signicat.example/token',
    IDURA_SIGNING_JWKS: '[]',
    IDURA_SIGNING_KEY_KID: '',
    IDURA_DOMAIN: '',
    LOCAL_DATA_DIR: '',
    CACHE_DIR: '',
    CACHE_TTL: '',
    CACHE_LRU_SIZE: '',
    CACHE_EXPIRATION_INTERVAL: '',
    LLM_OPENAI_API_KEY: ''
  },
  localJwksState: {
    getKey: null as unknown as ReturnType<typeof JoseType.createLocalJWKSet>
  }
}));

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
  env: {}
}));

// Mock $lib/server/constants directly to use dynamic values from mockConstants.
// This is necessary because constants.ts reads env at import time, but we need to inject the decryption keys generated in beforeAll.
vi.mock('$lib/server/constants', () => ({
  get constants() {
    return mockConstants;
  }
}));

// Mock jose to replace createRemoteJWKSet with our local JWKS.
// ESM exports are not configurable, so vi.spyOn won't work.
//
// Mock factory signature mirrors `jose.createRemoteJWKSet(url, options?)` exactly, returning the same `JWTVerifyGetKey`-shaped function that `createLocalJWKSet` produces. Keeps incorrect test usage (e.g. forgetting to call the factory) a type error rather than a silent runtime mismatch.
vi.mock('jose', async (importOriginal) => {
  const actual = await importOriginal<typeof JoseType>();
  return {
    ...actual,
    createRemoteJWKSet: (
      _url: URL,
      _options?: Parameters<typeof JoseType.createRemoteJWKSet>[1]
    ): ReturnType<typeof JoseType.createRemoteJWKSet> =>
      // Cast through unknown: the remote signature exposes coolingDown/reload/jwks members the local JWKS does not provide, but production code under test only uses the function-call form, so the additional members are unused at the seam.
      localJwksState.getKey as unknown as ReturnType<typeof JoseType.createRemoteJWKSet>
  };
});

describe('Signicat provider', () => {
  let keys: TestKeySet;
  let otherKeys: TestKeySet;
  let jwe: string;
  let jweBirthdateTwin: string;

  // beforeAll, NEVER beforeEach: a beforeEach would regenerate two 2048-bit RSA pairs for every test in the file.
  beforeAll(async () => {
    keys = await createTestKeySet({ encAlg: 'RSA-OAEP', kid: 'signicat-enc-key' });
    // A second set whose kid deliberately differs, for the kid-mismatch case.
    otherKeys = await createTestKeySet({ encAlg: 'RSA-OAEP', kid: 'other-enc-key' });

    mockConstants.IDENTITY_PROVIDER_DECRYPTION_JWKS = JSON.stringify([keys.encryptionPrivateJWK]);
    localJwksState.getKey = jose.createLocalJWKSet({ keys: [keys.signingPublicJWK as jose.JWK] });

    // issuer and audience must match the MOCKED constants, not createTestJwe's 'test-issuer' / 'test-audience' defaults, or jwtVerify rejects the token.
    jwe = await createTestJwe({ given_name: 'Matti', family_name: 'Virtanen', birthdate: '1985-06-15' }, keys, {
      encAlg: 'RSA-OAEP',
      issuer: 'https://signicat.example',
      audience: 'test-signicat-client',
      subject: 'signicat-subject-aaaa'
    });

    // A second token for a DIFFERENT person who shares this one's birthdate, differing in `sub` alone. Drives the identity-key collision test at the bottom of the file.
    jweBirthdateTwin = await createTestJwe(
      { given_name: 'Liisa', family_name: 'Korhonen', birthdate: '1985-06-15' },
      keys,
      {
        encAlg: 'RSA-OAEP',
        issuer: 'https://signicat.example',
        audience: 'test-signicat-client',
        subject: 'signicat-subject-bbbb'
      }
    );
  });

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('interface compliance', () => {
    it('has type property set to signicat', () => {
      expect(signicatProvider.type).toBe('signicat');
    });

    it('has authConfig with Signicat claim mappings', () => {
      expect(signicatProvider.authConfig).toEqual({
        identityMatchProp: 'sub',
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

  describe('getIdTokenClaims', () => {
    // Structural half of the leak-safety bar: `IdTokenClaimsResult`'s failure branch carries ONLY `{ code }` (see `providers/types.ts`), so the error MESSAGE never crosses this boundary and there is nothing about it to assert here. The leak-safety bar -- no configured kid, no issuer, no audience, and the incoming kid still present -- is a failing assertion on the core, in decryptAndVerifyIdToken.test.ts.

    it('returns the configured claim mapping for a valid Signicat ID token', async () => {
      const result = await signicatProvider.getIdTokenClaims(jwe);

      // Deep equality on the WHOLE result object, never toContain / toHaveProperty: a superset, a dropped claim, or an `identifier` that stopped coming from `authConfig.identityMatchProp` must all red. `identifier` is the SUBJECT here because SIGNICAT_AUTH_CONFIG.identityMatchProp is 'sub' -- keying it on 'birthdate' would not be an identifier; the birthdate is still present, as an extracted claim. The payload carries both, so this assertion can see a regression back to birthdate keying rather than merely a missing field.
      // Do not weaken this to a per-field subset check: a subset cannot see a claim that silently disappeared from extractedClaims.
      expect(result).toEqual({
        success: true,
        data: {
          firstName: 'Matti',
          lastName: 'Virtanen',
          identifier: 'signicat-subject-aaaa',
          extractedClaims: { birthdate: '1985-06-15' }
        }
      });
    });

    it('returns ERR_JWKS_EMPTY when no decryption JWKs are configured', async () => {
      const configured = mockConstants.IDENTITY_PROVIDER_DECRYPTION_JWKS;
      mockConstants.IDENTITY_PROVIDER_DECRYPTION_JWKS = '[]';
      const result = await signicatProvider.getIdTokenClaims(jwe);
      // Restore BEFORE the expect, never after: a restore placed after a failing assertion never runs, and the leaked value then contaminates every later test.
      mockConstants.IDENTITY_PROVIDER_DECRYPTION_JWKS = configured;

      // Assert the CAUSE, not merely that it failed. `success: false` alone is satisfied by any rejection whatsoever, so it cannot distinguish this test from its two siblings below, whose titles name different causes.
      // Do not weaken this back to a bare `success` check.
      expect(result).toMatchObject({ success: false, error: { code: 'ERR_JWKS_EMPTY' } });
    });

    it('returns ERR_JWK_KID_MISMATCH when the configured set carries a different kid', async () => {
      const configured = mockConstants.IDENTITY_PROVIDER_DECRYPTION_JWKS;
      mockConstants.IDENTITY_PROVIDER_DECRYPTION_JWKS = JSON.stringify([otherKeys.encryptionPrivateJWK]);
      const result = await signicatProvider.getIdTokenClaims(jwe);
      mockConstants.IDENTITY_PROVIDER_DECRYPTION_JWKS = configured;

      // A DIFFERENT code from the sibling above: that fixture is a misconfiguration (no JWKs configured at all), this one is a key-rotation miss (a set that does not carry the token's kid). The two codes are what make the two titles differ observably. Do not weaken this back to a bare `success` check.
      expect(result).toMatchObject({ success: false, error: { code: 'ERR_JWK_KID_MISMATCH' } });
    });

    it('returns ERR_JWKS_MALFORMED when IDENTITY_PROVIDER_DECRYPTION_JWKS is not JSON', async () => {
      const configured = mockConstants.IDENTITY_PROVIDER_DECRYPTION_JWKS;
      mockConstants.IDENTITY_PROVIDER_DECRYPTION_JWKS = 'not-json{';
      const result = await signicatProvider.getIdTokenClaims(jwe);
      mockConstants.IDENTITY_PROVIDER_DECRYPTION_JWKS = configured;

      // This assertion is the ONLY thing in the repo that can see the lazy env parse.
      // If `defaultOptions.privateEncryptionJWKSet` is ever simplified from a getter back to a plain property, the parse moves to module-evaluation time, this test starts observing a frozen snapshot instead, and in production the malformed value throws an UNCATCHABLE import-time SyntaxError that no code can ever carry.
      // Do not weaken this to `success: false`, and do not weaken it to `error: { code: expect.any(String) }`: both are satisfied by ERR_JWKS_EMPTY, which is exactly what the regression produces.
      expect(result).toMatchObject({ success: false, error: { code: 'ERR_JWKS_MALFORMED' } });
    });
  });

  describe('exchangeCodeForToken', () => {
    // Stated so the overlap is not misread: these provider-level tests OVERLAP `__tests__/token-endpoint.test.ts`, which already asserts most of this contract through the POST handler (four Signicat tests).
    // The overlap is deliberate — an endpoint-level red is never evidence about this file, so these assertions are not redundant with it.
    let capturedBody: URLSearchParams | null = null;
    let capturedUrl: string | null = null;

    beforeEach(() => {
      capturedBody = null;
      capturedUrl = null;
      vi.spyOn(globalThis, 'fetch').mockImplementation(async (input, init) => {
        capturedUrl = String(input);
        capturedBody = new URLSearchParams(init?.body as string);
        return new Response(JSON.stringify({ id_token: 'test.id.token' }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      });
    });

    it('posts grant_type, code, code_verifier, client_id and client_secret', async () => {
      const result = await signicatProvider.exchangeCodeForToken({
        authorizationCode: 'test-auth-code',
        redirectUri: 'http://localhost:5173/callback',
        codeVerifier: 'test-code-verifier'
      });

      // Guard the dereference first: without this, an exchange that never issued the request fails with a TypeError on `capturedBody!.get(...)` -- a red on the wrong axis, which is not evidence about the request body's shape.
      expect(capturedBody, 'exchangeCodeForToken never issued the token request').not.toBeNull();
      expect(capturedUrl).toBe('https://signicat.example/token');
      expect(capturedBody!.get('grant_type')).toBe('authorization_code');
      expect(capturedBody!.get('code')).toBe('test-auth-code');
      expect(capturedBody!.get('code_verifier')).toBe('test-code-verifier');
      expect(capturedBody!.get('redirect_uri')).toBe('http://localhost:5173/callback');
      expect(capturedBody!.get('client_id')).toBe('test-signicat-client');
      expect(capturedBody!.get('client_secret')).toBe('test-client-secret');
      // Signicat authenticates with a client_secret and must NOT send a client assertion.
      expect(capturedBody!.has('client_assertion')).toBe(false);
      expect(result.idToken).toBe('test.id.token');
    });

    it('throws when the token endpoint responds non-ok', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('nope', { status: 400 }));

      // A message matcher IS right here, unlike on the coded decrypt failures: this message is a product contract with no secret in it.
      await expect(
        signicatProvider.exchangeCodeForToken({
          authorizationCode: 'test-auth-code',
          redirectUri: 'http://localhost:5173/callback',
          codeVerifier: 'test-code-verifier'
        })
      ).rejects.toThrow('Token exchange failed');
    });
  });

  /**
   * The frontend half of the identity-key uniqueness guarantee. `identifier` is derived from `SIGNICAT_AUTH_CONFIG.identityMatchProp`, and the Edge Function's twin of that config turns the same claim into the Supabase account key -- so a claim that is not unique per person merges two candidates into one auth user. Asserting DISTINCTNESS across two real tokens is what a single-token assertion cannot do: a config keyed on `birthdate` satisfies "identifier is 1985-06-15" for both of these people at once.
   */
  describe('identity key uniqueness', () => {
    it('gives two candidates sharing a birthdate different identifiers', async () => {
      const a = await signicatProvider.getIdTokenClaims(jwe);
      const b = await signicatProvider.getIdTokenClaims(jweBirthdateTwin);

      // Guard the premise before comparing: if either token failed to decrypt there is no `identifier` to compare, and an inequality between two absent values would pass for the wrong reason. The `throw` is unreachable -- it exists only to narrow the discriminated union for the typechecker.
      expect(a).toMatchObject({ success: true });
      expect(b).toMatchObject({ success: true });
      if (!a.success || !b.success) throw new Error('unreachable: both results asserted successful above');

      // The premise that makes this a test about KEYING rather than about two unrelated tokens: the birthdate really is shared between these two people.
      expect(a.data.extractedClaims.birthdate).toBe(b.data.extractedClaims.birthdate);
      expect(a.data.identifier).not.toBe(b.data.identifier);
    });
  });
});
