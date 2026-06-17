/**
 * Shared synthetic JWE id_token builder for bank-auth (Idura/Signicat OIDC) E2E
 * tests (D-03). Extracted verbatim from the in-spec copy in
 * `candidate-bank-auth.spec.ts`, parameterized on `iss`/`aud` so ONE builder
 * serves both the Edge-Function spec (EFLOW-10) and the mock OIDC issuer
 * (EFLOW-10b) — the latter aligns `iss`/`aud` with `IDENTITY_PROVIDER_ISSUER` /
 * `PUBLIC_IDENTITY_PROVIDER_CLIENT_ID`.
 *
 * The output mirrors what Idura (or Signicat) returns: an RS256-signed inner JWT
 * wrapped in an RSA-OAEP-256 / A256GCM JWE. Kid contract: inner JWS `test-sig-1`,
 * outer JWE `test-enc-1` (must match the fixed test key pair in `testKeys.ts`).
 *
 * Pure transform — owns no key material; callers pass the fixed test keys.
 */
import * as jose from 'jose';
import type { JWK } from 'jose';

/** Default inner-JWT `iss`/`aud` (back-compat with the original in-spec builder). */
const DEFAULT_OPTS: { issuer: string; audience: string } = {
  issuer: 'https://test-idp.example.com',
  audience: 'test-client-id'
};

/**
 * Build a JWE-encrypted id_token carrying the given claims.
 *
 * @param claims - Inner-JWT claim set (e.g. `sub`, `given_name`, `family_name`).
 * @param sigPriv - RS256 signing key. jose v6 removed the `KeyLike` alias;
 *   `importJWK`/`generateKeyPair` now return a WebCrypto `CryptoKey`.
 * @param encPubJwk - Public encryption JWK (RSA-OAEP-256) the JWE is sealed to.
 * @param opts - `iss`/`aud` for the inner JWT; defaults to the back-compat test values.
 * @returns A compact JWE string.
 */
export async function buildTestIdToken(
  claims: Record<string, string>,
  sigPriv: CryptoKey,
  encPubJwk: JWK,
  opts: { issuer: string; audience: string } = DEFAULT_OPTS
): Promise<string> {
  // 1. Create signed inner JWT
  const innerJwt = await new jose.SignJWT(claims)
    .setProtectedHeader({ alg: 'RS256', kid: 'test-sig-1' })
    .setIssuer(opts.issuer)
    .setAudience(opts.audience)
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
