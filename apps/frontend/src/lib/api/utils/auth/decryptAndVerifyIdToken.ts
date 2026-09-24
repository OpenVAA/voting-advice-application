/**
 * The single decrypt -> verify core for OIDC ID tokens.
 *
 * Both identity providers (`providers/idura.ts`, `providers/signicat.ts`) call this from their `getIdTokenClaims` method; the per-provider claim mapping stays in the providers, each of which declares its own (`SIGNICAT_AUTH_CONFIG` in `providers/signicat.ts`, `IDURA_AUTH_CONFIG` in `providers/idura.ts`). This module owns only the parts that are genuinely identical: the lazy env parse, the JWE decrypt, the JWT verify, and the discriminating coded failures -- which are declared once in `./oidcFailure.ts` and referenced from here as `OIDC_FAILURE.*` rather than spelled inline, so the thrower and the two routes that log them cannot drift.
 *
 * The failure classes are NOT a closed set, and it matters that this is said plainly: jose's own coded errors flow through these throw sites unchanged, because each provider's catch arm forwards `e.code` for any `Error` carrying one. `./oidcFailure.ts` maps both provenances -- ours and jose's -- to a stage and an operator hint. For a long time the two routes' comments claimed the set was exactly the five thrown here, and a live callback failing with jose's `ERR_JOSE_GENERIC` proved otherwise at the cost of a debug session.
 *
 * It THROWS rather than returning a result union: each provider's existing catch arm already maps a `code`-carrying `Error` to `{ success: false, error: { code } }`, so the collapse changes no public type.
 *
 * HARD RULE: this module reads `$lib/server/constants` -- a server-only secret. NEVER re-export it from `providers/index.ts`. That barrel is the one place a client-reachable import could be introduced by accident; SvelteKit's `$lib/server` guard is the build-time backstop, not the rule.
 */

import * as jose from 'jose';
import { constants } from '$lib/server/constants';
import { constants as publicConstants } from '$lib/utils/constants';
import { fetchJwksLeakSafe } from './fetchJwksLeakSafe';
import { OIDC_FAILURE } from './oidcFailure';

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
        code: OIDC_FAILURE.jwksMalformed
      });
    }
  },
  /**
   * A getter, not a plain property. The providers read this per call; a plain property would evaluate it once at module load.
   *
   * Do not simplify this back into a plain property: that converts a per-call read into an import-time snapshot, and the misconfiguration then surfaces frozen rather than as read.
   *
   * FAILS CLOSED when unset, like {@link audience} and {@link issuer} below, and for a related but distinct reason. This line used to read `constants.IDENTITY_PROVIDER_JWKS_URI!`, and that non-null assertion was simply FALSE: `$lib/server/constants` flattens the value with `?? ''`, so an unset variable is an empty string, not `undefined`, and the `!` silenced a check that would have caught it. The consequence was not a bypass but an illegible failure -- `new URL('')` throws Node's `TypeError` with `code: 'ERR_INVALID_URL'`, a code that names neither this variable nor the fact that it is a configuration fault, and which arrives at the callback's log indistinguishable from any other malformed url in the process.
   *
   * Whitespace counts as unset, matching `requireConfigured`: `IDENTITY_PROVIDER_JWKS_URI= ` in an env file is a mistake, not a value.
   */
  get publicSignatureJWKSetUri(): string {
    const uri = constants.IDENTITY_PROVIDER_JWKS_URI;
    if (!uri || uri.trim() === '') {
      // Opaque identifier only -- the message names the VARIABLE, never a value, per this module's standing bar.
      throw Object.assign(
        new Error('Cannot verify ID token: no signature key set is configured (IDENTITY_PROVIDER_JWKS_URI).'),
        { code: OIDC_FAILURE.jwksUriUnconfigured }
      );
    }
    return uri;
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
        code: OIDC_FAILURE.audienceUnconfigured
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
        code: OIDC_FAILURE.issuerUnconfigured
      });
    }
    return issuer;
  }
};

/**
 * Decrypt a JWE-wrapped OIDC ID token and verify the enclosed JWT.
 *
 * @throws {Error & { code: string }} One of this application's own classes -- `ERR_JWKS_MALFORMED`, `ERR_JWKS_EMPTY`, `ERR_JWK_KID_MISMATCH`, `ERR_AUDIENCE_UNCONFIGURED`, `ERR_ISSUER_UNCONFIGURED`, `ERR_JWKS_URI_UNCONFIGURED`, `ERR_JWKS_URI_HTTP_STATUS`, `ERR_JWKS_URI_NOT_JSON` or `ERR_JWKS_URI_UNREACHABLE` (all declared in `./oidcFailure.ts`) -- or one of jose's own coded errors, which flow through unchanged. Callers must therefore treat the code as an OPEN set; `describeOidcFailure` is total over it.
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
      code: OIDC_FAILURE.jwksEmpty
    });
  }

  const privateEncryptionJWK = privateEncryptionJWKSet.find((jwk) => jwk.kid === kid);

  if (!privateEncryptionJWK) {
    throw Object.assign(new Error(`Cannot decode ID token: JWK not found: kid=${kid}.`), {
      code: OIDC_FAILURE.jwkKidMismatch
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
      code: OIDC_FAILURE.audienceUnconfigured
    });
  }

  if (!issuer) {
    // Opaque identifier only -- the configured issuer is NOT echoed.
    throw Object.assign(new Error('Cannot verify ID token: no issuer is configured.'), {
      code: OIDC_FAILURE.issuerUnconfigured
    });
  }

  // Re-checked on the CALL PATH for the same structural reason as `audience`/`issuer` above: the getter in `defaultOptions` fires only for callers who take it, and `publicSignatureJWKSetUri` is required by the interface but can still be handed over blank. Without this, a blank value reaches `new URL('')` two statements below and throws Node's `ERR_INVALID_URL`, which names neither the variable nor the fact that it is a configuration fault.
  const publicSignatureJWKSetUri = options.publicSignatureJWKSetUri;

  if (!publicSignatureJWKSetUri || publicSignatureJWKSetUri.trim() === '') {
    // Opaque identifier only -- names the VARIABLE, never a value.
    throw Object.assign(
      new Error('Cannot verify ID token: no signature key set is configured (IDENTITY_PROVIDER_JWKS_URI).'),
      { code: OIDC_FAILURE.jwksUriUnconfigured }
    );
  }

  const { plaintext } = await jose.compactDecrypt(idToken, await jose.importJWK(privateEncryptionJWK));
  const { payload } = await jose.jwtVerify(
    new TextDecoder().decode(plaintext),
    // `[jose.customFetch]` is NOT an optimisation and must not be dropped as one. jose retrieves the key set through this hook, and its own retrieval failures carry `ERR_JOSE_GENERIC` -- the code of its BASE error class, which names no stage, no variable and no remedy. `fetchJwksLeakSafe` classifies the response before jose's two throw sites can, turning the one uncoded stage in this pipeline into `ERR_JWKS_URI_HTTP_STATUS` / `ERR_JWKS_URI_NOT_JSON` / `ERR_JWKS_URI_UNREACHABLE`, each naming `IDENTITY_PROVIDER_JWKS_URI`. Remove it and a wrong JWKS URI becomes a log line that says nothing again; see `fetchJwksLeakSafe.ts` for the session that cost.
    jose.createRemoteJWKSet(new URL(publicSignatureJWKSetUri), { [jose.customFetch]: fetchJwksLeakSafe }),
    { audience, issuer }
  );
  return payload;
}
