/**
 * Idura provider interface compliance tests.
 *
 * Verifies that the Idura provider module implements the IdentityProvider interface correctly and that getAuthorizeUrl produces a JAR-based authorization URL with the expected structure (from).
 *
 * @vitest-environment node
 */

import * as jose from 'jose';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { createTestKeySet } from './__fixtures__/keys';
import { createTestJwe } from './__fixtures__/tokens';
import { iduraProvider } from './idura';
import type * as JoseType from 'jose';
import type { TestKeySet } from './__fixtures__/keys';

// Hoisted shared state, accessible from the `vi.mock` factories below. Those factories are hoisted above all imports, so they cannot reference module-level `const`s; the helper below runs at the same hoisted level -- and it must supply BOTH objects from ONE call, for the same reason.
const { mockConstants, localJwksState } = vi.hoisted(() => ({
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
  },
  localJwksState: {
    getKey: null as unknown as ReturnType<typeof JoseType.createLocalJWKSet>
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
// This is necessary because constants.ts reads env at import time, but we need to inject the signing key generated in beforeAll.
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

describe('Idura provider', () => {
  let keys: TestKeySet;
  let otherKeys: TestKeySet;
  let jwe: string;

  // The file's ONLY top-level setup hook: the JAR signing key and the ID-token fixtures are generated together here. Extend this block rather than opening a second one, and never move it to a per-test hook -- that regenerates three 2048-bit RSA pairs per test.
  beforeAll(async () => {
    // Generate a real RS256 signing key pair for Idura JAR signing
    const { privateKey } = await jose.generateKeyPair('RS256', { extractable: true });
    const jwk = {
      ...(await jose.exportJWK(privateKey)),
      kid: 'test-idura-signing-kid',
      alg: 'RS256'
    };
    mockConstants.IDURA_SIGNING_JWKS = JSON.stringify([jwk]);

    keys = await createTestKeySet({ encAlg: 'RSA-OAEP-256', kid: 'idura-enc-key' });
    // A second set whose kid deliberately differs, for the kid-mismatch case.
    otherKeys = await createTestKeySet({ encAlg: 'RSA-OAEP-256', kid: 'other-enc-key' });

    mockConstants.IDENTITY_PROVIDER_DECRYPTION_JWKS = JSON.stringify([keys.encryptionPrivateJWK]);
    localJwksState.getKey = jose.createLocalJWKSet({ keys: [keys.signingPublicJWK as jose.JWK] });

    // issuer and audience must match the MOCKED constants, not createTestJwe's 'test-issuer' / 'test-audience' defaults, or the token fails verification.
    //
    // `subject` is passed as an OPTION, never as a `sub` claim: createTestJwe calls .setSubject() AFTER the payload, so it overwrites any `sub` in `claims` and the deep-equal assertion below would red against 'test-subject' for the wrong reason.
    jwe = await createTestJwe(
      {
        given_name: 'Pekka',
        family_name: 'Lahtinen',
        birthdate: '1978-11-30',
        hetu: '301178-123X',
        country: 'FI'
      },
      keys,
      {
        encAlg: 'RSA-OAEP-256',
        issuer: 'https://test.idura.broker',
        audience: 'test-idura-client',
        subject: 'idura-subject-123'
      }
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('interface compliance', () => {
    it('has type property set to idura', () => {
      expect(iduraProvider.type).toBe('idura');
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

      // ONE non-blind assertion rather than a toBeDefined + typeof + length triple: a triple is null-blind, and a future edit dropping a follow-up line can silently restore that blindness.
      expect(result.state, 'getAuthorizeUrl returned no CSRF state').toEqual(expect.stringMatching(/.+/));
    });

    it('includes a nonce parameter for replay protection', async () => {
      const result = await iduraProvider.getAuthorizeUrl({
        redirectUri: 'http://localhost:5173/callback'
      });

      expect(result.nonce, 'getAuthorizeUrl returned no replay nonce').toEqual(expect.stringMatching(/.+/));
    });

    it('includes a signed JWT request parameter in the URL', async () => {
      const result = await iduraProvider.getAuthorizeUrl({
        redirectUri: 'http://localhost:5173/callback'
      });

      // Extract the request parameter from the URL
      const url = new URL(result.authorizeUrl);
      const requestParam = url.searchParams.get('request');
      expect(requestParam, "authorize URL is missing the 'request' (JAR) parameter").toEqual(
        expect.stringMatching(/^[\w-]+\.[\w-]+\.[\w-]+$/)
      );
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

  describe('getIdTokenClaims', () => {
    // Structural half of the leak-safety bar: `IdTokenClaimsResult`'s failure branch carries ONLY `{ code }` (see `providers/types.ts`), so the error MESSAGE never crosses this boundary and there is nothing about it to assert here. The leak-safety bar -- no configured kid, no issuer, no audience, and the incoming kid still present -- is a failing assertion on the core, in decryptAndVerifyIdToken.test.ts.

    it('returns the configured claim mapping for a valid Idura ID token', async () => {
      const result = await iduraProvider.getIdTokenClaims(jwe);

      // Deep equality on the WHOLE result object, never toContain / toHaveProperty: a superset, a dropped claim, or an `identifier` that stopped coming from `authConfig.identityMatchProp` must all red. `identifier` is the SUB here, NOT the birthdate, because IDURA_AUTH_CONFIG.identityMatchProp is 'sub' -- which is the whole point of keeping the mapping per-provider.
      // Do not weaken this to a per-field subset check: a subset cannot see a claim that silently disappeared from extractedClaims.
      expect(result).toEqual({
        success: true,
        data: {
          firstName: 'Pekka',
          lastName: 'Lahtinen',
          identifier: 'idura-subject-123',
          extractedClaims: { birthdate: '1978-11-30', hetu: '301178-123X', country: 'FI' }
        }
      });
    });

    it('returns ERR_JWKS_EMPTY when no decryption JWKs are configured', async () => {
      const configured = mockConstants.IDENTITY_PROVIDER_DECRYPTION_JWKS;
      mockConstants.IDENTITY_PROVIDER_DECRYPTION_JWKS = '[]';
      const result = await iduraProvider.getIdTokenClaims(jwe);
      // Restore BEFORE the expect, never after: a restore placed after a failing assertion never runs, and the leaked value then contaminates every later test.
      mockConstants.IDENTITY_PROVIDER_DECRYPTION_JWKS = configured;

      // Assert the CAUSE, not merely that it failed. `success: false` alone is satisfied by any rejection whatsoever, so it cannot distinguish this test from its two siblings below, whose titles name different causes.
      // Do not weaken this back to a bare `success` check.
      expect(result).toMatchObject({ success: false, error: { code: 'ERR_JWKS_EMPTY' } });
    });

    it('returns ERR_JWK_KID_MISMATCH when the configured set carries a different kid', async () => {
      const configured = mockConstants.IDENTITY_PROVIDER_DECRYPTION_JWKS;
      mockConstants.IDENTITY_PROVIDER_DECRYPTION_JWKS = JSON.stringify([otherKeys.encryptionPrivateJWK]);
      const result = await iduraProvider.getIdTokenClaims(jwe);
      mockConstants.IDENTITY_PROVIDER_DECRYPTION_JWKS = configured;

      // A DIFFERENT code from the sibling above: that fixture is a misconfiguration (no JWKs configured at all), this one is a key-rotation miss (a set that does not carry the token's kid). The two codes are what make the two titles differ observably. Do not weaken this back to a bare `success` check.
      expect(result).toMatchObject({ success: false, error: { code: 'ERR_JWK_KID_MISMATCH' } });
    });

    it('returns ERR_JWKS_MALFORMED when IDENTITY_PROVIDER_DECRYPTION_JWKS is not JSON', async () => {
      const configured = mockConstants.IDENTITY_PROVIDER_DECRYPTION_JWKS;
      mockConstants.IDENTITY_PROVIDER_DECRYPTION_JWKS = 'not-json{';
      const result = await iduraProvider.getIdTokenClaims(jwe);
      mockConstants.IDENTITY_PROVIDER_DECRYPTION_JWKS = configured;

      // This assertion is the ONLY thing in the repo that can see the lazy env parse.
      // If `defaultOptions.privateEncryptionJWKSet` is ever simplified from a getter back to a plain property, the parse moves to module-evaluation time, this test starts observing a frozen snapshot instead, and in production the malformed value throws an UNCATCHABLE import-time SyntaxError that no code can ever carry.
      // Do not weaken this to `success: false`, and do not weaken it to `error: { code: expect.any(String) }`: both are satisfied by ERR_JWKS_EMPTY, which is exactly what the regression produces.
      expect(result).toMatchObject({ success: false, error: { code: 'ERR_JWKS_MALFORMED' } });
    });
  });

  describe('exchangeCodeForToken', () => {
    // Stated so the overlap is not misread: these provider-level tests OVERLAP `__tests__/token-endpoint.test.ts`, which already asserts most of this contract through the POST handler (six Idura tests).
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

    it('posts grant_type, code, redirect_uri and a private_key_jwt client_assertion', async () => {
      const result = await iduraProvider.exchangeCodeForToken({
        authorizationCode: 'test-auth-code',
        redirectUri: 'http://localhost:5173/callback'
      });

      // Guard the dereference first: without this, an exchange that never issued the request fails with a TypeError on `capturedBody!.get(...)` -- a red on the wrong axis, which is not evidence about the request body's shape.
      expect(capturedBody, 'exchangeCodeForToken never issued the token request').not.toBeNull();
      expect(capturedUrl).toBe('https://test.idura.broker/oauth2/token');
      expect(capturedBody!.get('grant_type')).toBe('authorization_code');
      expect(capturedBody!.get('code')).toBe('test-auth-code');
      expect(capturedBody!.get('redirect_uri')).toBe('http://localhost:5173/callback');
      expect(capturedBody!.get('client_assertion_type')).toBe('urn:ietf:params:oauth:client-assertion-type:jwt-bearer');
      // Idura authenticates with private_key_jwt and must NOT send a client secret.
      expect(capturedBody!.has('client_secret')).toBe(false);

      // Assert the assertion's SHAPE, and deliberately do not re-verify its RS256 signature: getSigningKey() throws if the configured kid is absent from the signing JWKS, and SignJWT.sign() cannot produce a token from a key it never imported, so a three-segment JWS existing at all already proves the key round-tripped. A signature check would re-prove jose rather than this code, and would be a strictly WEAKER control -- it cannot see a mis-built assertion with a wrong aud or a missing jti.
      const assertion = capturedBody!.get('client_assertion');
      expect(assertion, "token request body is missing 'client_assertion'").toEqual(
        expect.stringMatching(/^[\w-]+\.[\w-]+\.[\w-]+$/)
      );
      expect(jose.decodeProtectedHeader(assertion!).alg).toBe('RS256');
      const assertionPayload = jose.decodeJwt(assertion!);
      expect(assertionPayload.iss).toBe('test-idura-client');
      expect(assertionPayload.sub).toBe('test-idura-client');
      expect(assertionPayload.aud).toBe('https://test.idura.broker/oauth2/token');
      expect(assertionPayload.exp, 'client assertion carries no exp').toEqual(expect.any(Number));
      expect(assertionPayload.jti, 'client assertion carries no jti').toEqual(expect.stringMatching(/.+/));

      expect(result.idToken).toBe('test.id.token');
    });

    it('throws naming the status when the token endpoint responds non-ok', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('nope', { status: 400 }));

      // A message matcher IS right here, unlike on the coded decrypt failures: this message is a product contract with no secret in it, and the status suffix is the discriminating information.
      await expect(
        iduraProvider.exchangeCodeForToken({
          authorizationCode: 'test-auth-code',
          redirectUri: 'http://localhost:5173/callback'
        })
      ).rejects.toThrow('Idura token exchange failed: 400');
    });
  });
});
