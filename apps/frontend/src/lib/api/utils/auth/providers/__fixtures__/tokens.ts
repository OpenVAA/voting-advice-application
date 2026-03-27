/**
 * JWE and JWT token builders using jose v6.
 *
 * Builds properly formatted test tokens using the same jose library as production.
 * JWE tokens wrap a signed JWT (inner layer) inside an encrypted JWE (outer layer),
 * matching the real id_token format from Signicat and Idura.
 *
 * NO Deno imports. NO SvelteKit imports. Pure jose v6 only.
 */

import { SignJWT, CompactEncrypt } from 'jose';
import type { TestKeySet } from './keys';

/**
 * Create a JWE-encrypted id_token for testing.
 *
 * Builds a signed JWT (inner) encrypted inside a JWE (outer), matching the format
 * returned by real OIDC identity providers:
 * - Inner JWT: RS256-signed with the test signing key
 * - Outer JWE: RSA-OAEP or RSA-OAEP-256 with A256GCM content encryption
 *
 * @param claims - JWT payload claims (e.g. given_name, family_name, birthdate)
 * @param keys - Test key set from createTestKeySet
 * @param opts.encAlg - JWE encryption algorithm (RSA-OAEP or RSA-OAEP-256)
 * @param opts.issuer - JWT issuer claim
 * @param opts.audience - JWT audience claim
 * @param opts.subject - JWT subject claim
 */
export async function createTestJwe(
  claims: Record<string, unknown>,
  keys: TestKeySet,
  opts?: {
    encAlg?: 'RSA-OAEP' | 'RSA-OAEP-256';
    issuer?: string;
    audience?: string;
    subject?: string;
  }
): Promise<string> {
  const encAlg = opts?.encAlg ?? 'RSA-OAEP';
  const kid = (keys.encryptionPrivateJWK as { kid?: string }).kid ?? 'test-enc-key';

  // Build inner signed JWT
  const jwt = await new SignJWT(claims)
    .setProtectedHeader({ alg: 'RS256' })
    .setIssuer(opts?.issuer ?? 'test-issuer')
    .setAudience(opts?.audience ?? 'test-audience')
    .setSubject(opts?.subject ?? 'test-subject')
    .setExpirationTime('5m')
    .setIssuedAt()
    .sign(keys.signingPrivateKey);

  // Encrypt JWT inside JWE
  return new CompactEncrypt(new TextEncoder().encode(jwt))
    .setProtectedHeader({ alg: encAlg, enc: 'A256GCM', kid })
    .encrypt(keys.encryptionPublicKey);
}

/**
 * Create a plain (non-encrypted) signed JWT for testing.
 *
 * Useful for testing code paths that handle plain JWTs without JWE wrapping.
 *
 * @param claims - JWT payload claims
 * @param signingPrivateKey - RS256 private key for signing
 * @param opts.issuer - JWT issuer claim
 * @param opts.audience - JWT audience claim
 * @param opts.subject - JWT subject claim
 */
export async function createTestJwt(
  claims: Record<string, unknown>,
  signingPrivateKey: CryptoKey,
  opts?: { issuer?: string; audience?: string; subject?: string }
): Promise<string> {
  return new SignJWT(claims)
    .setProtectedHeader({ alg: 'RS256' })
    .setIssuer(opts?.issuer ?? 'test-issuer')
    .setAudience(opts?.audience ?? 'test-audience')
    .setSubject(opts?.subject ?? 'test-subject')
    .setExpirationTime('5m')
    .setIssuedAt()
    .sign(signingPrivateKey);
}
