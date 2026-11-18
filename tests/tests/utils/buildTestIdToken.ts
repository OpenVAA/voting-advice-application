/**
 * The synthetic JWE id_token builder of the identity-provider E2E tests. The suite has one issuer: a token built with the defaults carries the issuer and the audience of the mock OIDC issuer (`tests/tests/support/mockOidcIssuer.ts`), so a token a test builds and a token the mock mints are accepted by the same `identity-callback` environment.
 *
 * The output mirrors what Idura (or Signicat) returns: an RS256-signed inner JWT wrapped in an RSA-OAEP-256 / A256GCM JWE. Kid contract: inner JWS `test-sig-1`, outer JWE `test-enc-1` (must match the fixed test key pair in `testKeys.ts`).
 *
 * Pure transform — owns no key material; callers pass the fixed test keys.
 */
import * as jose from 'jose';
import { MOCK_AUDIENCE, MOCK_ISSUER } from '../support/mockOidcIssuer';
import type { JWK } from 'jose';

/**
 * Default inner-JWT `iss`/`aud`: {@link MOCK_ISSUER} and {@link MOCK_AUDIENCE}.
 *
 * Exported because `identity-callback` binds both claims, so whoever configures `IDENTITY_PROVIDER_CLIENT_ID` / `IDENTITY_PROVIDER_ISSUER` for a run must configure exactly these values or every token is refused. `tests/IDURA-TEST-RUNBOOK.md` Step E-1 reads them from here rather than retyping them, so the two cannot drift apart.
 *
 * The values are read through getters because the mock issuer module imports this one: a getter reads the binding when it is used, not while the two modules are still loading.
 */
export const DEFAULT_TOKEN_OPTS: { readonly issuer: string; readonly audience: string } = {
  get issuer(): string {
    return MOCK_ISSUER;
  },
  get audience(): string {
    return MOCK_AUDIENCE;
  }
};

/**
 * Build a JWE-encrypted id_token carrying the given claims.
 *
 * @param claims - Inner-JWT claim set (e.g. `sub`, `given_name`, `family_name`).
 * @param sigPriv - RS256 signing key. jose v6 removed the `KeyLike` alias;
 *   `importJWK`/`generateKeyPair` now return a WebCrypto `CryptoKey`.
 * @param encPubJwk - Public encryption JWK (RSA-OAEP-256) the JWE is sealed to.
 * @param opts - `iss`/`aud` for the inner JWT; {@link DEFAULT_TOKEN_OPTS} when absent.
 * @returns A compact JWE string.
 */
export async function buildTestIdToken(
  claims: Record<string, string>,
  sigPriv: CryptoKey,
  encPubJwk: JWK,
  opts: { issuer: string; audience: string } = DEFAULT_TOKEN_OPTS
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
