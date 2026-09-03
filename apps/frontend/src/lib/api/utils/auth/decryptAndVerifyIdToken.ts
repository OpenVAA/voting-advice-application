/**
 * The single decrypt -> verify core for OIDC ID tokens.
 *
 * Both identity providers (`providers/idura.ts`, `providers/signicat.ts`) call this from their `getIdTokenClaims` method; the per-provider claim mapping stays in the providers, each of which declares its own (`SIGNICAT_AUTH_CONFIG` in `providers/signicat.ts`, `IDURA_AUTH_CONFIG` in `providers/idura.ts`). This module owns only the parts that are genuinely identical: the lazy env parse, the JWE decrypt, the JWT verify, and the five discriminating coded failures (`ERR_JWKS_MALFORMED`, `ERR_JWKS_EMPTY`, `ERR_JWK_KID_MISMATCH`, `ERR_AUDIENCE_UNCONFIGURED`, `ERR_ISSUER_UNCONFIGURED`).
 *
 * It THROWS rather than returning a result union: each provider's existing catch arm already maps a `code`-carrying `Error` to `{ success: false, error: { code } }`, so the collapse changes no public type.
 *
 * HARD RULE: this module reads `$lib/server/constants` -- a server-only secret. NEVER re-export it from `providers/index.ts`. That barrel is the one place a client-reachable import could be introduced by accident; SvelteKit's `$lib/server` guard is the build-time backstop, not the rule.
 */

import * as jose from 'jose';
import { constants } from '$lib/server/constants';
import { constants as publicConstants } from '$lib/utils/constants';

export interface DecryptAndVerifyOptions {
  privateEncryptionJWKSet: Array<jose.JWK>;
  publicSignatureJWKSetUri: string;
  audience?: string;
  issuer?: string;
}

export const defaultOptions: DecryptAndVerifyOptions = {
  /**
   * Parsed lazily, ON READ, rather than at module-evaluation time. A malformed `IDENTITY_PROVIDER_DECRYPTION_JWKS` used to throw a bare `SyntaxError` at IMPORT time, outside any `try`, so it could never reach `getIdTokenClaims`'s catch and could never carry a `code`. Every read happens inside that `try`, so the misconfiguration now surfaces as a coded failure like the other two.
   *
   * Do not simplify this back into a plain property: that reinstates an uncatchable import-time crash.
   */
  get privateEncryptionJWKSet(): Array<jose.JWK> {
    try {
      return JSON.parse(constants.IDENTITY_PROVIDER_DECRYPTION_JWKS || '[]');
    } catch {
      // Opaque identifier only -- the malformed value is NOT echoed.
      throw Object.assign(new Error('Cannot decode ID token: the configured decryption JWK set is not valid JSON.'), {
        code: 'ERR_JWKS_MALFORMED'
      });
    }
  },
  /**
   * A getter, not a plain property. The providers read this per call; a plain property would evaluate it once at module load.
   *
   * Do not simplify this back into a plain property: that converts a per-call read into an import-time snapshot, and the misconfiguration then surfaces frozen rather than as read.
   */
  get publicSignatureJWKSetUri(): string {
    return constants.IDENTITY_PROVIDER_JWKS_URI!;
  },
  /**
   * FAILS CLOSED when unset, and that is the whole point of this getter.
   *
   * `PUBLIC_IDENTITY_PROVIDER_CLIENT_ID` is `?? ''`-defaulted (`$lib/utils/constants`), so an unset env var yields `''`, NOT `undefined`. jose treats those two differently, and the difference is an authentication bypass: it pushes `aud` onto the presence check whenever the option is `!== undefined` (so `''` still REQUIRES the claim to exist), but it guards the VALUE comparison on truthiness (`if (audience && …)`), so `''` skips the comparison entirely. Measured: a token carrying `aud=some-other-clients-id` is ACCEPTED under `{ audience: '' }` and rejected once the audience is configured. A deployment that had not set the variable therefore accepted any token the IdP minted for any relying party, with no error, no warning and no log line.
   *
   * Do not "simplify" this back into a bare return: handing jose a falsy audience is indistinguishable, at the call site, from checking one.
   *
   * A getter rather than a plain property so the throw happens ON READ -- inside each provider's existing `try` -- and surfaces as a coded failure like the other four. A plain property would throw at module-evaluation time, outside any `try`, and could never carry a `code`. Same rationale as {@link privateEncryptionJWKSet}.
   */
  get audience(): string {
    const audience = publicConstants.PUBLIC_IDENTITY_PROVIDER_CLIENT_ID;
    if (!audience) {
      // Opaque identifier only -- per this module's standing bar the message names neither the configured audience nor the env var's value.
      throw Object.assign(new Error('Cannot verify ID token: no expected audience is configured.'), {
        code: 'ERR_AUDIENCE_UNCONFIGURED'
      });
    }
    return audience;
  },
  /**
   * FAILS CLOSED when unset, for exactly the reason spelled out on {@link audience} above: `IDENTITY_PROVIDER_ISSUER` is `?? ''`-defaulted, and jose's `if (issuer && …)` value comparison is skipped for `''` while the presence check still passes. Without this, an unset issuer meant any signature-valid token bound to no provider at all.
   *
   * A getter for the same reason as {@link audience}: the throw must land on read, inside the provider's `try`, so it carries a `code`.
   */
  get issuer(): string {
    const issuer = constants.IDENTITY_PROVIDER_ISSUER;
    if (!issuer) {
      // Opaque identifier only -- the configured issuer is NOT echoed.
      throw Object.assign(new Error('Cannot verify ID token: no expected issuer is configured.'), {
        code: 'ERR_ISSUER_UNCONFIGURED'
      });
    }
    return issuer;
  }
};

/**
 * Decrypt a JWE-wrapped OIDC ID token and verify the enclosed JWT.
 *
 * @throws {Error & { code: string }} `ERR_JWKS_MALFORMED`, `ERR_JWKS_EMPTY`,
 *   `ERR_JWK_KID_MISMATCH`, `ERR_AUDIENCE_UNCONFIGURED` or `ERR_ISSUER_UNCONFIGURED`; jose's own coded errors flow through unchanged.
 */
export async function decryptAndVerifyIdToken(
  idToken: string,
  options: DecryptAndVerifyOptions = defaultOptions
): Promise<jose.JWTPayload> {
  const { kid } = jose.decodeProtectedHeader(idToken);

  // Split from a single `!privateEncryptionJWK` branch so the two failure modes are distinguishable -- by an on-call engineer and by a test. An EMPTY set is a misconfiguration (the JWKs never parsed out of the environment); a kid MISS is a key-rotation incident. Both codes are opaque failure-class identifiers and must stay that way: no JWKS contents, no configured kids, no issuer and no audience may be added to either message. The kid-miss message carries only the incoming kid, which comes from the caller's own token and is an identifier, not a secret.
  // Do not merge these back into one branch -- the two are then indistinguishable.
  const privateEncryptionJWKSet = options.privateEncryptionJWKSet;

  if (privateEncryptionJWKSet.length === 0) {
    throw Object.assign(new Error('Cannot decode ID token: no decryption JWKs are configured.'), {
      code: 'ERR_JWKS_EMPTY'
    });
  }

  const privateEncryptionJWK = privateEncryptionJWKSet.find((jwk) => jwk.kid === kid);

  if (!privateEncryptionJWK) {
    throw Object.assign(new Error(`Cannot decode ID token: JWK not found: kid=${kid}.`), {
      code: 'ERR_JWK_KID_MISMATCH'
    });
  }

  // Re-check on the CALL PATH, not only in `defaultOptions`' getters. jose binds a token to a relying party only when these are TRUTHY: `jwt_claims_set.js` pushes a presence check when the option is `!== undefined`, but compares the VALUE only under `if (audience && …)` / `if (issuer && …)`. So `''` -- and `undefined` even more so -- accepts any token signed by a key in the configured JWK set, including one minted for a different relying party.
  //
  // The getters alone make that guard POSITIONAL: they fire only for callers who take `defaultOptions`. Both production callers do today, but `DecryptAndVerifyOptions` declares `audience?`/`issuer?` optional, so an explicit options object omitting them would silently buy no binding at all. Validating here makes the guard structural -- it holds for every caller, whatever options they pass.
  const audience = options.audience;
  const issuer = options.issuer;

  if (!audience) {
    // Opaque identifier only -- the configured audience is NOT echoed.
    throw Object.assign(new Error('Cannot verify ID token: no audience is configured.'), {
      code: 'ERR_AUDIENCE_UNCONFIGURED'
    });
  }

  if (!issuer) {
    // Opaque identifier only -- the configured issuer is NOT echoed.
    throw Object.assign(new Error('Cannot verify ID token: no issuer is configured.'), {
      code: 'ERR_ISSUER_UNCONFIGURED'
    });
  }

  const { plaintext } = await jose.compactDecrypt(idToken, await jose.importJWK(privateEncryptionJWK));
  const { payload } = await jose.jwtVerify(
    new TextDecoder().decode(plaintext),
    jose.createRemoteJWKSet(new URL(options.publicSignatureJWKSetUri)),
    { audience, issuer }
  );
  return payload;
}
