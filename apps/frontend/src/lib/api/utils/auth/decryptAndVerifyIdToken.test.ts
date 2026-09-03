/**
 * JWE decryption tests for decryptAndVerifyIdToken.
 *
 * Tests that the shared core correctly decrypts JWE tokens encrypted with both RSA-OAEP (Signicat) and RSA-OAEP-256 (Idura) algorithms, returns the verified inner-JWT payload, binds `aud`/`iss`, and throws its discriminating coded errors.
 *
 * These are the only in-tree tests that exercise real JWE decryption end to end for both encryption algorithms. Most of them call the core with an EXPLICIT `options` object rather than `defaultOptions`, which is load-bearing: it keeps them independent of the module-level env parse. The two fail-closed tests in `claim binding` are the deliberate exception -- the `?? ''` env default they guard against exists ONLY on the `defaultOptions` path, so an explicit `options` object cannot see it.
 *
 * @vitest-environment node
 */

import * as jose from 'jose';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { decryptAndVerifyIdToken } from './decryptAndVerifyIdToken';
import { createTestJwe } from './providers/__fixtures__/tokens';
import type * as JoseType from 'jose';
import type { TestKeySet } from './providers/__fixtures__/keys';

// Use vi.hoisted to store the local JWKS getter that replaces createRemoteJWKSet.
// `createLocalJWKSet` returns the bare `JWTVerifyGetKey`-shaped function — a structural subset of `createRemoteJWKSet`'s return (which also exposes `coolingDown` / `reload` / `jwks`). Typing as the local return keeps the assignment in `beforeAll` direct, and the mock factory below widens via cast to satisfy the remote signature consumers expect.
//
// `mockConstants` / `mockPublicConstants` mock the CONSTANTS modules rather than the `$env` modules below, and both are needed: `constants.ts` / `utils/constants.ts` are eager object literals evaluated once at import, so mutating a `$env` mock after import is invisible. The `defaultOptions` tests are the only ones that read them -- every other test in this file passes an explicit `options` object -- and they must mutate the audience/issuer BETWEEN calls to drive the fail-closed branches. Same seam as `providers/signicat.test.ts`.
const { localJwksState, mockConstants, mockPublicConstants } = vi.hoisted(() => ({
  localJwksState: {
    getKey: null as unknown as ReturnType<typeof JoseType.createLocalJWKSet>
  },
  mockConstants: {
    BACKEND_API_TOKEN: '',
    IDENTITY_PROVIDER_CLIENT_SECRET: '',
    IDENTITY_PROVIDER_DECRYPTION_JWKS: '[]',
    IDENTITY_PROVIDER_JWKS_URI: 'https://test.example/.well-known/jwks',
    IDENTITY_PROVIDER_ISSUER: 'test-issuer',
    IDENTITY_PROVIDER_TOKEN_ENDPOINT: '',
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
  mockPublicConstants: {
    PUBLIC_BROWSER_BACKEND_URL: '',
    PUBLIC_SERVER_BACKEND_URL: '',
    PUBLIC_BROWSER_FRONTEND_URL: '',
    PUBLIC_SERVER_FRONTEND_URL: '',
    PUBLIC_IDENTITY_PROVIDER_CLIENT_ID: 'test-client',
    PUBLIC_IDENTITY_PROVIDER_AUTHORIZATION_ENDPOINT: '',
    PUBLIC_IDENTITY_PROVIDER_TYPE: 'signicat',
    PUBLIC_DEBUG: false,
    PUBLIC_CACHE_ENABLED: false,
    PUBLIC_SUPABASE_URL: 'http://localhost:54321',
    PUBLIC_SUPABASE_ANON_KEY: 'test-anon-key'
  }
}));

vi.mock('$lib/server/constants', () => ({ constants: mockConstants }));
vi.mock('$lib/utils/constants', () => ({ constants: mockPublicConstants }));

// Mock env modules before importing the module under test.
vi.mock('$env/dynamic/public', () => ({
  env: {
    PUBLIC_IDENTITY_PROVIDER_CLIENT_ID: 'test-client',
    PUBLIC_SUPABASE_URL: 'http://localhost:54321',
    PUBLIC_SUPABASE_ANON_KEY: 'test-anon-key'
  }
}));

vi.mock('$env/dynamic/private', () => ({
  env: {
    IDENTITY_PROVIDER_DECRYPTION_JWKS: '[]',
    IDENTITY_PROVIDER_JWKS_URI: 'https://test.example/.well-known/jwks',
    IDENTITY_PROVIDER_ISSUER: 'https://test.example'
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

describe('decryptAndVerifyIdToken', () => {
  // Shared signing key pair -- one pair for all tests.
  // Using a single signing key avoids JWKS ambiguity (ERR_JWKS_MULTIPLE_MATCHING_KEYS) since the inner JWT does not include a kid header.
  let signingPrivateKey: CryptoKey;
  let signingPublicKey: CryptoKey;
  let signingPublicJWK: jose.JWK;

  // Separate encryption key pairs for each algorithm
  let rsaOaepEncPub: CryptoKey;
  let rsaOaepEncPriv: CryptoKey;
  let rsaOaepEncPrivJwk: jose.JWK;
  let rsaOaep256EncPub: CryptoKey;
  let rsaOaep256EncPriv: CryptoKey;
  let rsaOaep256EncPrivJwk: jose.JWK;

  // `createTestJwe` takes a whole TestKeySet (no hand-rolled builder). Both sets deliberately carry the SAME signing key, so the single-key local JWKS above stays unambiguous while the two encryption algorithms differ.
  let rsaOaepKeys: TestKeySet;
  let rsaOaep256Keys: TestKeySet;

  beforeAll(async () => {
    // Generate a single signing key pair
    const sig = await jose.generateKeyPair('RS256', { extractable: true });
    signingPrivateKey = sig.privateKey;
    signingPublicKey = sig.publicKey;
    signingPublicJWK = { ...(await jose.exportJWK(sig.publicKey)), alg: 'RS256' };

    // Generate RSA-OAEP encryption key pair (Signicat-style)
    const oaep = await jose.generateKeyPair('RSA-OAEP', { extractable: true });
    rsaOaepEncPub = oaep.publicKey;
    rsaOaepEncPriv = oaep.privateKey;
    rsaOaepEncPrivJwk = { ...(await jose.exportJWK(oaep.privateKey)), kid: 'signicat-enc-key', alg: 'RSA-OAEP' };

    // Generate RSA-OAEP-256 encryption key pair (Idura-style)
    const oaep256 = await jose.generateKeyPair('RSA-OAEP-256', { extractable: true });
    rsaOaep256EncPub = oaep256.publicKey;
    rsaOaep256EncPriv = oaep256.privateKey;
    rsaOaep256EncPrivJwk = { ...(await jose.exportJWK(oaep256.privateKey)), kid: 'idura-enc-key', alg: 'RSA-OAEP-256' };

    // `TestKeySet` types its JWKs as `Record<string, unknown>` (keys.ts:19,25), and `jose.JWK` is an interface, so it carries no implicit index signature -- hence the widening casts. The inverse cast has in-tree precedent at fixtures.test.ts:56,79.
    rsaOaepKeys = {
      signingPrivateKey,
      signingPublicKey,
      signingPublicJWK: signingPublicJWK as Record<string, unknown>,
      encryptionPublicKey: rsaOaepEncPub,
      encryptionPrivateKey: rsaOaepEncPriv,
      encryptionPrivateJWK: rsaOaepEncPrivJwk as Record<string, unknown>
    };
    rsaOaep256Keys = {
      signingPrivateKey,
      signingPublicKey,
      signingPublicJWK: signingPublicJWK as Record<string, unknown>,
      encryptionPublicKey: rsaOaep256EncPub,
      encryptionPrivateKey: rsaOaep256EncPriv,
      encryptionPrivateJWK: rsaOaep256EncPrivJwk as Record<string, unknown>
    };

    // Build local JWKS with the single signing public key.
    localJwksState.getKey = jose.createLocalJWKSet({ keys: [signingPublicJWK] });
  });

  describe('RSA-OAEP decryption (Signicat-style)', () => {
    it('decrypts an RSA-OAEP JWE and returns a payload carrying birthdate', async () => {
      const jwe = await createTestJwe(
        { given_name: 'Matti', family_name: 'Virtanen', birthdate: '1985-06-15' },
        rsaOaepKeys,
        { encAlg: 'RSA-OAEP', issuer: 'test-issuer', audience: 'test-client' }
      );

      const payload = await decryptAndVerifyIdToken(jwe, {
        privateEncryptionJWKSet: [rsaOaepEncPrivJwk],
        publicSignatureJWKSetUri: 'https://test.example/.well-known/jwks',
        audience: 'test-client',
        issuer: 'test-issuer'
      });

      expect(payload.birthdate).toBe('1985-06-15');
      // Also assert a second claim, so the test proves the decrypt produced THIS token rather than merely producing some payload.
      expect(payload.given_name).toBe('Matti');
    });

    it('returns a payload carrying given_name and family_name', async () => {
      const jwe = await createTestJwe(
        { given_name: 'Liisa', family_name: 'Korhonen', birthdate: '1990-03-22' },
        rsaOaepKeys,
        { encAlg: 'RSA-OAEP', issuer: 'test-issuer', audience: 'test-client' }
      );

      const payload = await decryptAndVerifyIdToken(jwe, {
        privateEncryptionJWKSet: [rsaOaepEncPrivJwk],
        publicSignatureJWKSetUri: 'https://test.example/.well-known/jwks',
        audience: 'test-client',
        issuer: 'test-issuer'
      });

      expect(payload.given_name).toBe('Liisa');
      expect(payload.family_name).toBe('Korhonen');
    });
  });

  describe('RSA-OAEP-256 decryption (Idura-style)', () => {
    it('decrypts an RSA-OAEP-256 JWE successfully', async () => {
      const jwe = await createTestJwe(
        { given_name: 'Pekka', family_name: 'Lahtinen', birthdate: '1978-11-30' },
        rsaOaep256Keys,
        {
          encAlg: 'RSA-OAEP-256',
          issuer: 'test-issuer',
          audience: 'test-client',
          subject: 'idura-subject-123'
        }
      );

      const payload = await decryptAndVerifyIdToken(jwe, {
        privateEncryptionJWKSet: [rsaOaep256EncPrivJwk],
        publicSignatureJWKSetUri: 'https://test.example/.well-known/jwks',
        audience: 'test-client',
        issuer: 'test-issuer'
      });

      expect(payload.given_name).toBe('Pekka');
      expect(payload.family_name).toBe('Lahtinen');
      expect(payload.sub).toBe('idura-subject-123');
    });
  });

  describe('error handling', () => {
    it('throws ERR_JWKS_EMPTY when no decryption JWKs are configured', async () => {
      const jwe = await createTestJwe(
        { given_name: 'Test', family_name: 'User', birthdate: '2000-01-01' },
        rsaOaepKeys,
        { encAlg: 'RSA-OAEP', issuer: 'test-issuer', audience: 'test-client' }
      );

      // Assert the CAUSE, not just that it rejected. A bare rejection is satisfied by any failure whatsoever -- a bad signature, a wrong audience, or a function that has stopped succeeding altogether -- so it cannot distinguish this test from its sibling below, whose title names a different cause.
      // Do not weaken this back to a bare `toThrow` rejection matcher: `toThrow` matches the MESSAGE, and these messages are the leak-safe strings nothing is allowed to depend on, so pinning one makes the leak-safety comment's own advice unfollowable. Match the `code` property instead.
      await expect(
        decryptAndVerifyIdToken(jwe, {
          // Pass an empty JWK set so the empty-set branch fires
          privateEncryptionJWKSet: [],
          publicSignatureJWKSetUri: 'https://test.example/.well-known/jwks',
          audience: 'test-client',
          issuer: 'test-issuer'
        })
      ).rejects.toMatchObject({ code: 'ERR_JWKS_EMPTY' });
    });

    it('throws ERR_JWK_KID_MISMATCH when the configured set carries a different kid', async () => {
      const jwe = await createTestJwe(
        { given_name: 'Test', family_name: 'User', birthdate: '2000-01-01' },
        rsaOaepKeys,
        { encAlg: 'RSA-OAEP', issuer: 'test-issuer', audience: 'test-client' }
      );

      // A DIFFERENT code from the sibling above: that fixture is a misconfiguration (no JWKs configured at all), this one is a key-rotation miss (a JWK set that does not carry the token's kid). The two codes are what make the two titles differ observably. Do not weaken this back to a bare `toThrow` rejection matcher: `toThrow` matches the MESSAGE, and this message carries the incoming kid, which the sibling below asserts must stay present -- two matchers pinning the same string is how a leak-safety rule stops being changeable.
      await expect(
        decryptAndVerifyIdToken(jwe, {
          // Wrong key set: the Idura key won't match the Signicat kid
          privateEncryptionJWKSet: [rsaOaep256EncPrivJwk],
          publicSignatureJWKSetUri: 'https://test.example/.well-known/jwks',
          audience: 'test-client',
          issuer: 'test-issuer'
        })
      ).rejects.toMatchObject({ code: 'ERR_JWK_KID_MISMATCH' });

      // The leak-safety bar the core's own comment block states, asserted rather than claimed. The surfaced message must carry ONLY the INCOMING kid ('signicat-enc-key', which came from the caller's own token and is an identifier, not a secret); never the CONFIGURED kid ('idura-enc-key'), never the issuer, never the audience. The `includes` half is as load-bearing as the three `!includes` halves: it is what makes a future over-redaction red instead of silently passing. Do not weaken this to a bare code check -- the code is already asserted above, and a code check cannot see a message that started leaking.
      await expect(
        decryptAndVerifyIdToken(jwe, {
          privateEncryptionJWKSet: [rsaOaep256EncPrivJwk],
          publicSignatureJWKSetUri: 'https://test.example/.well-known/jwks',
          audience: 'test-client',
          issuer: 'test-issuer'
        })
      ).rejects.toSatisfy(
        (e: Error) =>
          !e.message.includes('idura-enc-key') &&
          !e.message.includes('test-issuer') &&
          !e.message.includes('test-client') &&
          e.message.includes('signicat-enc-key')
      );
    });
  });

  /**
   * The claim-binding half of verification, which had NO coverage before this block existed -- which is why the misconfiguration below survived three copies of this code.
   *
   * The first two cases prove the binding works when it is configured. The last two prove what happens when it is NOT, and they are the ones that matter: `PUBLIC_IDENTITY_PROVIDER_CLIENT_ID` and `IDENTITY_PROVIDER_ISSUER` are `?? ''`-defaulted, and jose SKIPS the value comparison for a falsy option while still passing the presence check -- so an unset variable used to mean "accept a token minted for anyone, by anyone with a key in the JWKS". Each of those two tests therefore feeds a token that an unbound verifier ACCEPTS (a foreign `aud`, a foreign `iss`) and asserts it is a coded failure here. Do not relax them into "rejects for some reason": the distinguishing property is that the token no longer gets through.
   */
  describe('claim binding', () => {
    const claimPayload = { given_name: 'Test', family_name: 'User', birthdate: '2000-01-01' };

    // These two use an EXPLICIT options object, unlike the `defaultOptions` tests below.
    // That is the point: `DecryptAndVerifyOptions` declares `audience?`/`issuer?` optional, so a guard living only in the `defaultOptions` getters would be positional -- it would protect today's two production callers and nobody else. Omitting each field here proves the check is enforced on the CALL PATH. Delete the call-path guard and these go green while the token is accepted with no relying-party binding at all.
    it('rejects an explicit options object that omits audience', async () => {
      const jwe = await createTestJwe(claimPayload, rsaOaepKeys, {
        encAlg: 'RSA-OAEP',
        issuer: 'test-issuer',
        audience: 'test-client'
      });

      await expect(
        decryptAndVerifyIdToken(jwe, {
          privateEncryptionJWKSet: [rsaOaepEncPrivJwk],
          publicSignatureJWKSetUri: 'https://test.example/.well-known/jwks',
          issuer: 'test-issuer'
        })
      ).rejects.toMatchObject({ code: 'ERR_AUDIENCE_UNCONFIGURED' });
    });

    it('rejects an explicit options object that omits issuer', async () => {
      const jwe = await createTestJwe(claimPayload, rsaOaepKeys, {
        encAlg: 'RSA-OAEP',
        issuer: 'test-issuer',
        audience: 'test-client'
      });

      await expect(
        decryptAndVerifyIdToken(jwe, {
          privateEncryptionJWKSet: [rsaOaepEncPrivJwk],
          publicSignatureJWKSetUri: 'https://test.example/.well-known/jwks',
          audience: 'test-client'
        })
      ).rejects.toMatchObject({ code: 'ERR_ISSUER_UNCONFIGURED' });
    });

    it('rejects a token whose aud names a different relying party', async () => {
      const jwe = await createTestJwe(claimPayload, rsaOaepKeys, {
        encAlg: 'RSA-OAEP',
        issuer: 'test-issuer',
        audience: 'some-other-clients-id'
      });

      // Assert the CLAIM as well as the code: `ERR_JWT_CLAIM_VALIDATION_FAILED` alone is shared with the issuer sibling below, so the code by itself cannot tell the two titles apart. `claim` is what makes each title observably true.
      await expect(
        decryptAndVerifyIdToken(jwe, {
          privateEncryptionJWKSet: [rsaOaepEncPrivJwk],
          publicSignatureJWKSetUri: 'https://test.example/.well-known/jwks',
          audience: 'test-client',
          issuer: 'test-issuer'
        })
      ).rejects.toMatchObject({ code: 'ERR_JWT_CLAIM_VALIDATION_FAILED', claim: 'aud' });
    });

    it('rejects a token minted by a different issuer', async () => {
      const jwe = await createTestJwe(claimPayload, rsaOaepKeys, {
        encAlg: 'RSA-OAEP',
        issuer: 'https://evil-idp.example',
        audience: 'test-client'
      });

      await expect(
        decryptAndVerifyIdToken(jwe, {
          privateEncryptionJWKSet: [rsaOaepEncPrivJwk],
          publicSignatureJWKSetUri: 'https://test.example/.well-known/jwks',
          audience: 'test-client',
          issuer: 'test-issuer'
        })
      ).rejects.toMatchObject({ code: 'ERR_JWT_CLAIM_VALIDATION_FAILED', claim: 'iss' });
    });

    it('fails closed with ERR_AUDIENCE_UNCONFIGURED rather than accepting a foreign-audience token', async () => {
      // These four tests are the only ones in the file that go through `defaultOptions` (no explicit `options` argument) -- that is the code path production uses, and the only one where the `?? ''` default can be observed at all.
      const jwe = await createTestJwe(claimPayload, rsaOaepKeys, {
        encAlg: 'RSA-OAEP',
        issuer: 'test-issuer',
        audience: 'some-other-clients-id'
      });
      const configuredJwks = mockConstants.IDENTITY_PROVIDER_DECRYPTION_JWKS;
      const configuredAudience = mockPublicConstants.PUBLIC_IDENTITY_PROVIDER_CLIENT_ID;
      mockConstants.IDENTITY_PROVIDER_DECRYPTION_JWKS = JSON.stringify([rsaOaepEncPrivJwk]);
      mockPublicConstants.PUBLIC_IDENTITY_PROVIDER_CLIENT_ID = '';

      let caught: unknown;
      try {
        await decryptAndVerifyIdToken(jwe);
      } catch (e) {
        caught = e;
      } finally {
        // Restored in `finally`, never after the assertion: a restore placed after a failing expect never runs, and the emptied audience would then contaminate every later test in the file.
        mockConstants.IDENTITY_PROVIDER_DECRYPTION_JWKS = configuredJwks;
        mockPublicConstants.PUBLIC_IDENTITY_PROVIDER_CLIENT_ID = configuredAudience;
      }

      expect(caught).toMatchObject({ code: 'ERR_AUDIENCE_UNCONFIGURED' });
      // Leak-safe, same bar as the kid-miss message: the token's own audience is a caller value, but the CONFIGURED issuer must never appear, and neither must the empty audience be described by echoing anything from the environment.
      expect((caught as Error).message).not.toContain('test-issuer');
    });

    it('fails closed with ERR_ISSUER_UNCONFIGURED rather than accepting a foreign-issuer token', async () => {
      const jwe = await createTestJwe(claimPayload, rsaOaepKeys, {
        encAlg: 'RSA-OAEP',
        issuer: 'https://evil-idp.example',
        audience: 'test-client'
      });
      const configuredJwks = mockConstants.IDENTITY_PROVIDER_DECRYPTION_JWKS;
      const configuredIssuer = mockConstants.IDENTITY_PROVIDER_ISSUER;
      mockConstants.IDENTITY_PROVIDER_DECRYPTION_JWKS = JSON.stringify([rsaOaepEncPrivJwk]);
      mockConstants.IDENTITY_PROVIDER_ISSUER = '';

      let caught: unknown;
      try {
        await decryptAndVerifyIdToken(jwe);
      } catch (e) {
        caught = e;
      } finally {
        mockConstants.IDENTITY_PROVIDER_DECRYPTION_JWKS = configuredJwks;
        mockConstants.IDENTITY_PROVIDER_ISSUER = configuredIssuer;
      }

      expect(caught).toMatchObject({ code: 'ERR_ISSUER_UNCONFIGURED' });
      expect((caught as Error).message).not.toContain('test-client');
    });
  });
});
