/**
 * JWE decryption tests for getIdTokenClaims.
 *
 * Tests that getIdTokenClaims correctly decrypts JWE tokens encrypted with
 * both RSA-OAEP (Signicat) and RSA-OAEP-256 (Idura) algorithms, and extracts
 * identity claims from the inner JWT (D-08 from 48-CONTEXT.md).
 *
 * @vitest-environment node
 */

import { describe, it, expect, vi, beforeAll } from 'vitest';

// Use vi.hoisted to store the local JWKS getter that replaces createRemoteJWKSet.
const { localJwksState } = vi.hoisted(() => ({
  localJwksState: {
    getKey: null as unknown
  }
}));

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
vi.mock('jose', async (importOriginal) => {
  const actual = await importOriginal<typeof import('jose')>();
  return {
    ...actual,
    createRemoteJWKSet: (..._args: unknown[]) => localJwksState.getKey
  };
});

import * as jose from 'jose';
import { getIdTokenClaims } from './getIdTokenClaims';

describe('getIdTokenClaims', () => {
  // Shared signing key pair -- one pair for all tests.
  // Using a single signing key avoids JWKS ambiguity (ERR_JWKS_MULTIPLE_MATCHING_KEYS)
  // since the inner JWT does not include a kid header.
  let signingPrivateKey: CryptoKey;
  let signingPublicJWK: jose.JWK;

  // Separate encryption key pairs for each algorithm
  let rsaOaepEncPub: CryptoKey;
  let rsaOaepEncPrivJwk: jose.JWK;
  let rsaOaep256EncPub: CryptoKey;
  let rsaOaep256EncPrivJwk: jose.JWK;

  beforeAll(async () => {
    // Generate a single signing key pair
    const sig = await jose.generateKeyPair('RS256', { extractable: true });
    signingPrivateKey = sig.privateKey;
    signingPublicJWK = { ...(await jose.exportJWK(sig.publicKey)), alg: 'RS256' };

    // Generate RSA-OAEP encryption key pair (Signicat-style)
    const oaep = await jose.generateKeyPair('RSA-OAEP', { extractable: true });
    rsaOaepEncPub = oaep.publicKey;
    rsaOaepEncPrivJwk = { ...(await jose.exportJWK(oaep.privateKey)), kid: 'signicat-enc-key', alg: 'RSA-OAEP' };

    // Generate RSA-OAEP-256 encryption key pair (Idura-style)
    const oaep256 = await jose.generateKeyPair('RSA-OAEP-256', { extractable: true });
    rsaOaep256EncPub = oaep256.publicKey;
    rsaOaep256EncPrivJwk = { ...(await jose.exportJWK(oaep256.privateKey)), kid: 'idura-enc-key', alg: 'RSA-OAEP-256' };

    // Build local JWKS with the single signing public key.
    localJwksState.getKey = jose.createLocalJWKSet({ keys: [signingPublicJWK] });
  });

  /**
   * Helper to build a JWE token (signed JWT inside encrypted JWE).
   */
  async function buildJwe(
    claims: Record<string, unknown>,
    opts: {
      encAlg: 'RSA-OAEP' | 'RSA-OAEP-256';
      encPublicKey: CryptoKey;
      encKid: string;
      issuer: string;
      audience: string;
      subject?: string;
    }
  ): Promise<string> {
    const jwt = await new jose.SignJWT(claims)
      .setProtectedHeader({ alg: 'RS256' })
      .setIssuer(opts.issuer)
      .setAudience(opts.audience)
      .setSubject(opts.subject ?? 'test-subject')
      .setExpirationTime('5m')
      .setIssuedAt()
      .sign(signingPrivateKey);

    return new jose.CompactEncrypt(new TextEncoder().encode(jwt))
      .setProtectedHeader({ alg: opts.encAlg, enc: 'A256GCM', kid: opts.encKid })
      .encrypt(opts.encPublicKey);
  }

  describe('RSA-OAEP decryption (Signicat-style)', () => {
    it('decrypts RSA-OAEP JWE and returns identifier from birthdate', async () => {
      const jwe = await buildJwe(
        { given_name: 'Matti', family_name: 'Virtanen', birthdate: '1985-06-15' },
        {
          encAlg: 'RSA-OAEP',
          encPublicKey: rsaOaepEncPub,
          encKid: 'signicat-enc-key',
          issuer: 'test-issuer',
          audience: 'test-client'
        }
      );

      const result = await getIdTokenClaims(jwe, {
        privateEncryptionJWKSet: [rsaOaepEncPrivJwk],
        publicSignatureJWKSetUri: 'https://test.example/.well-known/jwks',
        audience: 'test-client',
        issuer: 'test-issuer'
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.firstName).toBe('Matti');
        expect(result.data.lastName).toBe('Virtanen');
        expect(result.data.identifier).toBe('1985-06-15');
      }
    });

    it('returns correct names from OIDC claims', async () => {
      const jwe = await buildJwe(
        { given_name: 'Liisa', family_name: 'Korhonen', birthdate: '1990-03-22' },
        {
          encAlg: 'RSA-OAEP',
          encPublicKey: rsaOaepEncPub,
          encKid: 'signicat-enc-key',
          issuer: 'test-issuer',
          audience: 'test-client'
        }
      );

      const result = await getIdTokenClaims(jwe, {
        privateEncryptionJWKSet: [rsaOaepEncPrivJwk],
        publicSignatureJWKSetUri: 'https://test.example/.well-known/jwks',
        audience: 'test-client',
        issuer: 'test-issuer'
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.firstName).toBe('Liisa');
        expect(result.data.lastName).toBe('Korhonen');
      }
    });
  });

  describe('RSA-OAEP-256 decryption (Idura-style)', () => {
    it('decrypts RSA-OAEP-256 JWE successfully', async () => {
      const jwe = await buildJwe(
        { given_name: 'Pekka', family_name: 'Lahtinen', birthdate: '1978-11-30' },
        {
          encAlg: 'RSA-OAEP-256',
          encPublicKey: rsaOaep256EncPub,
          encKid: 'idura-enc-key',
          issuer: 'test-issuer',
          audience: 'test-client',
          subject: 'idura-subject-123'
        }
      );

      const result = await getIdTokenClaims(jwe, {
        privateEncryptionJWKSet: [rsaOaep256EncPrivJwk],
        publicSignatureJWKSetUri: 'https://test.example/.well-known/jwks',
        audience: 'test-client',
        issuer: 'test-issuer'
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.firstName).toBe('Pekka');
        expect(result.data.lastName).toBe('Lahtinen');
        // NOTE: getIdTokenClaims uses hardcoded 'birthdate' for identifier
        // (it predates the provider abstraction layer). The provider modules
        // use their own authConfig.identityMatchProp for extraction.
        expect(result.data.identifier).toBe('1978-11-30');
      }
    });
  });

  describe('error handling', () => {
    it('returns success=false when kid not in JWKS', async () => {
      const jwe = await buildJwe(
        { given_name: 'Test', family_name: 'User', birthdate: '2000-01-01' },
        {
          encAlg: 'RSA-OAEP',
          encPublicKey: rsaOaepEncPub,
          encKid: 'signicat-enc-key',
          issuer: 'test-issuer',
          audience: 'test-client'
        }
      );

      // Pass empty JWKS so the kid won't be found
      const result = await getIdTokenClaims(jwe, {
        privateEncryptionJWKSet: [],
        publicSignatureJWKSetUri: 'https://test.example/.well-known/jwks',
        audience: 'test-client',
        issuer: 'test-issuer'
      });

      expect(result.success).toBe(false);
    });

    it('returns success=false when kid does not match available keys', async () => {
      const jwe = await buildJwe(
        { given_name: 'Test', family_name: 'User', birthdate: '2000-01-01' },
        {
          encAlg: 'RSA-OAEP',
          encPublicKey: rsaOaepEncPub,
          encKid: 'signicat-enc-key',
          issuer: 'test-issuer',
          audience: 'test-client'
        }
      );

      // Wrong key set: Idura key won't match Signicat kid
      const result = await getIdTokenClaims(jwe, {
        privateEncryptionJWKSet: [rsaOaep256EncPrivJwk],
        publicSignatureJWKSetUri: 'https://test.example/.well-known/jwks',
        audience: 'test-client',
        issuer: 'test-issuer'
      });

      expect(result.success).toBe(false);
    });
  });
});
