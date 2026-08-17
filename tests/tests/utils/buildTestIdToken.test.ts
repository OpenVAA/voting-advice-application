/**
 * Unit tests for the shared `buildTestIdToken` synthetic JWE id_token builder.
 *
 * Exercises the pure transform end-to-end against the fixed test key pair: build a
 * JWE, decrypt it with the private encryption key, verify the inner JWS with the
 * public signing key, and assert the claims + iss/aud parameterization contract.
 *
 * Run: cd tests && npx vitest run --config vitest.config.ts
 */
import * as jose from 'jose';
import { describe, expect, it } from 'vitest';
import { buildTestIdToken } from './buildTestIdToken';
import { encPrivJwk, getTestKeys, sigPubJwk } from './testKeys';

const CLAIMS = {
  sub: 'test-sub-001',
  given_name: 'Testi',
  family_name: 'Tunnistautuja'
};

/** Decrypt the JWE, verify the inner JWS, and return the protected headers + payload. */
async function decryptAndVerify(jwe: string) {
  const decKey = await jose.importJWK(encPrivJwk, 'RSA-OAEP-256');
  const { plaintext, protectedHeader: jweHeader } = await jose.compactDecrypt(jwe, decKey);
  const innerJwt = new TextDecoder().decode(plaintext);
  const sigKey = await jose.importJWK(sigPubJwk, 'RS256');
  const { payload, protectedHeader: jwsHeader } = await jose.jwtVerify(innerJwt, sigKey);
  return { jweHeader, jwsHeader, payload };
}

describe('buildTestIdToken', () => {
  it('produces a JWE that decrypts + verifies and carries the claims', async () => {
    const { sigPriv, encPubJwk } = await getTestKeys();
    const jwe = await buildTestIdToken(CLAIMS, sigPriv, encPubJwk);

    const { payload } = await decryptAndVerify(jwe);
    expect(payload.sub).toBe(CLAIMS.sub);
    expect(payload.given_name).toBe(CLAIMS.given_name);
    expect(payload.family_name).toBe(CLAIMS.family_name);
  });

  it('defaults iss/aud to the back-compat test values', async () => {
    const { sigPriv, encPubJwk } = await getTestKeys();
    const jwe = await buildTestIdToken(CLAIMS, sigPriv, encPubJwk);

    const { payload } = await decryptAndVerify(jwe);
    expect(payload.iss).toBe('https://test-idp.example.com');
    expect(payload.aud).toBe('test-client-id');
  });

  it('honours explicit opts.issuer/opts.audience', async () => {
    const { sigPriv, encPubJwk } = await getTestKeys();
    const jwe = await buildTestIdToken(CLAIMS, sigPriv, encPubJwk, {
      issuer: 'https://idura.example/oidc',
      audience: 'real-client-id'
    });

    const { payload } = await decryptAndVerify(jwe);
    expect(payload.iss).toBe('https://idura.example/oidc');
    expect(payload.aud).toBe('real-client-id');
  });

  it('stamps the kid contract on both the JWE and inner JWS headers', async () => {
    const { sigPriv, encPubJwk } = await getTestKeys();
    const jwe = await buildTestIdToken(CLAIMS, sigPriv, encPubJwk);

    const { jweHeader, jwsHeader } = await decryptAndVerify(jwe);
    expect(jweHeader.kid).toBe('test-enc-1');
    expect(jweHeader.alg).toBe('RSA-OAEP-256');
    expect(jweHeader.enc).toBe('A256GCM');
    expect(jwsHeader.kid).toBe('test-sig-1');
    expect(jwsHeader.alg).toBe('RS256');
  });
});
