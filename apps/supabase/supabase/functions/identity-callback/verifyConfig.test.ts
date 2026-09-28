/**
 * Edge Function ID-token claim-binding tests.
 *
 * Two layers, in that order of authority. Layer 1 exercises `requireVerifyClaimBinding` directly: it is pure, it is the guard the Edge Function calls on every verification path, and it holds whichever `jose` is installed. Layer 2 mints a real RS256 token for the wrong relying party and the wrong issuer, then shows that token ACCEPTED under the options object the pre-fix code built when the environment was unset and REJECTED under the options object the guard returns.
 *
 * No mocks and no network -- the layer-2 key pair is generated locally and the token is verified against its own public half.
 */

import { describe, it, expect } from 'vitest';
import * as jose from 'jose';
import { requireVerifyClaimBinding } from './verifyConfig';

const EXPECTED_AUDIENCE = 'our-client-id';
const EXPECTED_ISSUER = 'https://good-idp.example';
const WRONG_AUDIENCE = 'some-other-clients-id';
const WRONG_ISSUER = 'https://evil-idp.example';

/** Run `fn`, return the Error it threw, and fail loudly if it did not throw at all. */
function captureError(fn: () => unknown): Error {
  try {
    fn();
  } catch (error) {
    return error as Error;
  }
  throw new Error('Expected the call to throw, but it returned normally.');
}

describe('requireVerifyClaimBinding', () => {
  it('throws ERR_AUDIENCE_UNCONFIGURED when neither value is configured', () => {
    expect(() => requireVerifyClaimBinding(undefined, undefined)).toThrow(
      expect.objectContaining({ code: 'ERR_AUDIENCE_UNCONFIGURED' })
    );
  });

  it('throws ERR_ISSUER_UNCONFIGURED when only the audience is configured', () => {
    expect(() => requireVerifyClaimBinding(EXPECTED_AUDIENCE, undefined)).toThrow(
      expect.objectContaining({ code: 'ERR_ISSUER_UNCONFIGURED' })
    );
  });

  it('treats an empty string as unconfigured rather than as configured-to-empty', () => {
    // This case is the defect in miniature. jose pushes a PRESENCE check when the option is not `undefined` but compares the VALUE only under a truthiness test, so an empty audience requires the claim to exist and then never looks at it -- strictly weaker than the omitted option it resembles, and indistinguishable from it in a log.
    expect(() => requireVerifyClaimBinding('', EXPECTED_ISSUER)).toThrow(
      expect.objectContaining({ code: 'ERR_AUDIENCE_UNCONFIGURED' })
    );
  });

  it('returns both bindings when both are configured', () => {
    expect(requireVerifyClaimBinding(EXPECTED_AUDIENCE, EXPECTED_ISSUER)).toEqual({
      audience: EXPECTED_AUDIENCE,
      issuer: EXPECTED_ISSUER
    });
  });

  it('never echoes a configured value in either throw message', () => {
    // The function this guard protects is served --no-verify-jwt and is publicly reachable, so a message naming the configured issuer would hand an unauthenticated caller the relying-party configuration.
    const audienceError = captureError(() => requireVerifyClaimBinding('', EXPECTED_ISSUER));
    expect(audienceError.message).toBe('Cannot verify ID token: no expected audience is configured.');
    expect(audienceError.message).not.toContain(EXPECTED_ISSUER);

    const issuerError = captureError(() => requireVerifyClaimBinding(EXPECTED_AUDIENCE, ''));
    expect(issuerError.message).toBe('Cannot verify ID token: no expected issuer is configured.');
    expect(issuerError.message).not.toContain(EXPECTED_AUDIENCE);
  });
});

describe('a wrong-audience, wrong-issuer token under the two options shapes', () => {
  it('is accepted under the pre-fix empty options object and rejected under the guard output', async () => {
    // Version skew, stated rather than elided: this file runs jose@6.2.1 from node_modules while the Edge Function runs jose@v5.9.6 from deno.land. The two majors were measured to agree on the presence-versus-value semantics this test turns on, and layer 1 above -- the pure guard -- is the version-independent primary proof. This layer corroborates that the guard's OUTPUT is the shape that actually rejects.
    const { publicKey, privateKey } = await jose.generateKeyPair('RS256');
    const jwt = await new jose.SignJWT({ sub: 'test-subject' })
      .setProtectedHeader({ alg: 'RS256' })
      .setIssuer(WRONG_ISSUER)
      .setAudience(WRONG_AUDIENCE)
      .setExpirationTime('1h')
      .sign(privateKey);

    // Premise guard. Without it the demonstration silently degrades into a tautology the moment the fixture stops carrying claims that differ from the expected ones.
    const claims = jose.decodeJwt(jwt);
    expect(claims.iss).toBe(WRONG_ISSUER);
    expect(claims.iss).not.toBe(EXPECTED_ISSUER);
    expect(claims.aud).toBe(WRONG_AUDIENCE);
    expect(claims.aud).not.toBe(EXPECTED_AUDIENCE);

    // NEGATIVE CONTROL, and it is permanent rather than a one-off measurement. `{}` is the options object the pre-fix verifyJwt built when both environment variables were unset, and this assertion states that a token minted by an attacker-controlled issuer for a different relying party RESOLVES under it. That acceptance is the defect. Keeping it here is what stops the rejection below from going green against a token nothing ever accepted.
    await expect(jose.jwtVerify(jwt, publicKey, {})).resolves.toBeDefined();

    const options = requireVerifyClaimBinding(EXPECTED_AUDIENCE, EXPECTED_ISSUER);
    await expect(jose.jwtVerify(jwt, publicKey, options)).rejects.toThrow(
      expect.objectContaining({ code: 'ERR_JWT_CLAIM_VALIDATION_FAILED' })
    );
  });
});
