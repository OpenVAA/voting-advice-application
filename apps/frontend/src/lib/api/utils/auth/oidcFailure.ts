/**
 * The closed set of ID-token failure classes, and the leak-safe description of each.
 *
 * WHY THIS MODULE EXISTS. `/api/oidc/callback` and `/api/oidc/token` both log the failure class returned by `IdentityProvider.getIdTokenClaims`, and both used to assert in a comment that "the set is exactly ERR_JWKS_MALFORMED, ERR_JWKS_EMPTY, ERR_JWK_KID_MISMATCH, ERR_AUDIENCE_UNCONFIGURED and ERR_ISSUER_UNCONFIGURED". That claim was FALSE, and its own dependency said so: `decryptAndVerifyIdToken`'s `@throws` tag lists those five and then adds "jose's own coded errors flow through unchanged", and both provider catch arms forward `e.code` verbatim for any `Error` carrying one. The set was therefore open, unpinned by any test, and a reader debugging the callback was actively misled about which codes were possible.
 *
 * It cost a debug session. A live Idura round trip logged `code= ERR_JOSE_GENERIC` -- jose's base `JOSEError` code, a member of neither the documented five nor the `'none'` placeholder -- and the log line said nothing more, so the failing stage had to be recovered by reading jose's source rather than the log. See `.planning/debug/resolved/idura-bank-auth-empty-client.md`, finding 2.
 *
 * So this module does three things the comment could not:
 *
 * 1. Declares the project's own codes ONCE ({@link OIDC_FAILURE}), so the thrower and the logger cannot drift.
 * 2. Maps every code -- ours and jose's -- to the STAGE it failed at and a static operator hint naming the environment variable behind it ({@link describeOidcFailure}), so a log line is actionable without a source dive.
 * 3. Stays honest about the open tail: an unrecognised code is reported as such rather than silently mis-attributed.
 *
 * LEAK SAFETY. Every hint in this module is a FIXED string. Nothing here interpolates a value, a URL, a host, a `kid`, a token, a claim or any key material, which is what makes the output of {@link formatOidcFailure} safe to write to a server log. That is a property of the data in this file, not of its callers, so keep it: a hint that interpolates is a hint that can leak. The separate and stricter rule -- that only the opaque failure CLASS crosses the redirect boundary to the browser, never a message -- continues to live at the two route call sites.
 *
 * This module is intentionally free of imports. It reads no environment and no secret, so it is safe to import from anywhere, including a client bundle, and needs no `$lib/server` guard.
 */

/**
 * The failure classes this application defines and throws itself.
 *
 * The first five predate this module and their spellings are a LOGGED CONTRACT -- they have appeared in operator-facing server logs and in the bank-authentication runbook, so renaming one is a documentation change, not a refactor. The four `JWKS_URI` members were added when finding 2 showed that the one stage jose leaves uncoded (fetching the remote signature key set) was exactly the stage that failed.
 *
 * Typed as a `Record` over the key union so that omitting a member is a compile error rather than a silently missing case -- the same shape, and for the same reason, as `OIDC_ERROR` in `$candidate/utils/oidcError`.
 */
export const OIDC_FAILURE: Record<OidcFailureKey, string> = {
  /** `IDENTITY_PROVIDER_DECRYPTION_JWKS` is set but is not valid JSON. */
  jwksMalformed: 'ERR_JWKS_MALFORMED',
  /** `IDENTITY_PROVIDER_DECRYPTION_JWKS` parsed, but to an empty set -- nothing to decrypt with. */
  jwksEmpty: 'ERR_JWKS_EMPTY',
  /** No configured DECRYPTION JWK carries the `kid` the incoming token names. Distinct from {@link jwksEmpty} because an empty set is a misconfiguration while a `kid` miss is a key-rotation incident; merging them makes the two indistinguishable to an on-call engineer. */
  jwkKidMismatch: 'ERR_JWK_KID_MISMATCH',
  /** No expected `aud` is configured, so the token could not be bound to this relying party. Fails closed deliberately: jose skips the VALUE comparison for a falsy audience while still passing the presence check, which accepts a token minted for any other client. */
  audienceUnconfigured: 'ERR_AUDIENCE_UNCONFIGURED',
  /** No expected `iss` is configured. Fails closed for exactly the reason given on {@link audienceUnconfigured}. */
  issuerUnconfigured: 'ERR_ISSUER_UNCONFIGURED',
  /** `IDENTITY_PROVIDER_JWKS_URI` is unset or blank. Without this class the value reaches `new URL('')`, which throws Node's `ERR_INVALID_URL` -- a code that names neither the variable nor the fact that it is a configuration fault. */
  jwksUriUnconfigured: 'ERR_JWKS_URI_UNCONFIGURED',
  /** The JWKS endpoint answered with a status other than 200. Includes every 3xx: jose requests the key set with `redirect: 'manual'`, so a redirect is delivered as a non-200 response and is NOT followed. */
  jwksUriHttpStatus: 'ERR_JWKS_URI_HTTP_STATUS',
  /** The JWKS endpoint answered 200, but with a body that is not JSON -- typically an HTML error or login page served in place of the key set. */
  jwksUriNotJson: 'ERR_JWKS_URI_NOT_JSON',
  /** The JWKS endpoint could not be reached at all: DNS, TCP or TLS failed before any HTTP response existed. */
  jwksUriUnreachable: 'ERR_JWKS_URI_UNREACHABLE'
};

/**
 * The stage of the decrypt -> verify pipeline a failure belongs to.
 *
 * The value of naming the stage is that it partitions the remedy. `config` is a `.env` edit; `jwks-fetch` is a reachability or URL problem at the identity provider; `decrypt` and `verify` are key-registration problems; `claims` means the crypto was fine and the token simply is not for us.
 */
export type OidcFailureStage = 'config' | 'jwks-fetch' | 'decrypt' | 'verify' | 'claims' | 'unknown';

/** A failure class, resolved to the stage it failed at and a static, leak-safe operator hint. */
export interface OidcFailureDescription {
  /** The code as logged. `'none'` when the provider returned no code at all. */
  code: string;
  /** Which stage of the pipeline this class belongs to. */
  stage: OidcFailureStage;
  /** A fixed operator hint. Names environment variables, never values. */
  hint: string;
}

/**
 * The placeholder logged when a provider reports a failure carrying no code.
 *
 * Reached when the thrown value is not an `Error`, or is an `Error` without a `code` own-property -- Node's `TypeError: fetch failed` is the realistic case, since it carries its code on `.cause` rather than on itself. NOT a member of {@link OIDC_FAILURE}: it is the absence of a class, not a class.
 */
export const OIDC_FAILURE_NONE = 'none';

/**
 * Static hints for the codes this application throws itself.
 *
 * Kept separate from {@link JOSE_FAILURES} so the two provenances stay visibly distinct: these we can change by editing our own throw sites, those we cannot.
 */
const OWN_FAILURES: Record<string, OidcFailureDescription> = {
  [OIDC_FAILURE.jwksMalformed]: {
    code: OIDC_FAILURE.jwksMalformed,
    stage: 'config',
    hint: 'IDENTITY_PROVIDER_DECRYPTION_JWKS is set but is not valid JSON. It must be a JSON ARRAY of JWK objects, quoted as a single env value.'
  },
  [OIDC_FAILURE.jwksEmpty]: {
    code: OIDC_FAILURE.jwksEmpty,
    stage: 'config',
    hint: 'IDENTITY_PROVIDER_DECRYPTION_JWKS parsed to an empty array, so there is no key to decrypt the id_token with. See docs/key-generation.md.'
  },
  [OIDC_FAILURE.jwkKidMismatch]: {
    code: OIDC_FAILURE.jwkKidMismatch,
    stage: 'decrypt',
    hint: 'No JWK in IDENTITY_PROVIDER_DECRYPTION_JWKS matches the kid the identity provider encrypted this token to. Either the provider holds a different public key than the private key configured here, or the key was rotated on one side only.'
  },
  [OIDC_FAILURE.audienceUnconfigured]: {
    code: OIDC_FAILURE.audienceUnconfigured,
    stage: 'config',
    hint: 'PUBLIC_IDENTITY_PROVIDER_CLIENT_ID is unset or blank, so the token cannot be bound to this relying party. This check fails closed on purpose -- an unset audience would accept a token minted for any other client.'
  },
  [OIDC_FAILURE.issuerUnconfigured]: {
    code: OIDC_FAILURE.issuerUnconfigured,
    stage: 'config',
    hint: 'IDENTITY_PROVIDER_ISSUER is unset or blank. This check fails closed on purpose -- an unset issuer would accept a signature-valid token bound to no provider at all.'
  },
  [OIDC_FAILURE.jwksUriUnconfigured]: {
    code: OIDC_FAILURE.jwksUriUnconfigured,
    stage: 'config',
    hint: 'IDENTITY_PROVIDER_JWKS_URI is unset or blank, so there is no key set to verify the id_token signature against.'
  },
  [OIDC_FAILURE.jwksUriHttpStatus]: {
    code: OIDC_FAILURE.jwksUriHttpStatus,
    stage: 'jwks-fetch',
    hint: 'The endpoint named by IDENTITY_PROVIDER_JWKS_URI answered, but not with 200. Read the ACTIVE provider live .well-known/openid-configuration and copy its jwks_uri field verbatim -- do not assemble the path by hand. Measured shapes, as a sanity check only: Idura serves https://{IDURA_DOMAIN}/.well-known/jwks (NOT .../openid-configuration/jwks, which 404s -- this hint itself said the wrong one until it was measured against a live tenant); Signicat serves .../auth/open/.well-known/openid-configuration/jwks. A 3xx also lands here: the key set is requested with redirect:manual and redirects are NOT followed, so the variable must name the URL that serves the JWK set DIRECTLY rather than one that redirects to it.'
  },
  [OIDC_FAILURE.jwksUriNotJson]: {
    code: OIDC_FAILURE.jwksUriNotJson,
    stage: 'jwks-fetch',
    hint: 'The endpoint named by IDENTITY_PROVIDER_JWKS_URI answered 200 but the body is not JSON -- usually an HTML error or sign-in page served where the key set was expected. Check the path.'
  },
  [OIDC_FAILURE.jwksUriUnreachable]: {
    code: OIDC_FAILURE.jwksUriUnreachable,
    stage: 'jwks-fetch',
    hint: 'The host in IDENTITY_PROVIDER_JWKS_URI could not be reached: DNS, TCP or TLS failed before any HTTP response existed. Check the hostname, and whether this network can reach the identity provider at all.'
  }
};

/**
 * Static hints for jose's own codes, which reach the log UNCHANGED.
 *
 * This table is the honest half of the contract the old comment denied. jose 6.2.1 defines fifteen codes; every one that this pipeline can produce is mapped here, because a code without a stage is the exact condition that made finding 2 expensive.
 *
 * `ERR_JOSE_GENERIC` earns its unusually specific hint. It is the code of jose's BASE error class, and in jose 6.2.1 a bare `JOSEError` is constructed at exactly two sites in the entire library -- both inside `fetchJwks` in `jwks/remote.js`, on a non-200 status and on a body that will not parse as JSON. So observing it means the remote key-set fetch failed AND `fetchJwksLeakSafe` did not get to classify it first, which is either a bypassed wrapper or a jose upgrade that added a third site. Either is worth knowing from the log rather than from a bisect.
 */
const JOSE_FAILURES: Record<string, OidcFailureDescription> = {
  ERR_JOSE_GENERIC: {
    code: 'ERR_JOSE_GENERIC',
    stage: 'jwks-fetch',
    hint: "jose's uncoded base error. In jose 6.x it is thrown from exactly two places, both fetching the remote key set (non-200 status, or a body that is not JSON) -- so treat this as a problem with IDENTITY_PROVIDER_JWKS_URI. Seeing it at all means fetchJwksLeakSafe did not classify the response first: either createRemoteJWKSet was called without it, or a jose upgrade moved the throw."
  },
  ERR_JWKS_TIMEOUT: {
    code: 'ERR_JWKS_TIMEOUT',
    stage: 'jwks-fetch',
    hint: 'The endpoint named by IDENTITY_PROVIDER_JWKS_URI did not answer within jose’s 5s timeout. Reachability or provider latency, not configuration.'
  },
  ERR_JWKS_INVALID: {
    code: 'ERR_JWKS_INVALID',
    stage: 'jwks-fetch',
    hint: 'The body fetched from IDENTITY_PROVIDER_JWKS_URI is JSON but is not a JWK Set -- it has no usable `keys` array. The variable is probably pointing at the .well-known discovery document rather than at the jwks_uri it advertises.'
  },
  ERR_JWKS_NO_MATCHING_KEY: {
    code: 'ERR_JWKS_NO_MATCHING_KEY',
    stage: 'verify',
    hint: 'The key set WAS fetched successfully, but contains no key matching the kid that signed this id_token. Usually a provider-side signing-key rotation, or IDENTITY_PROVIDER_JWKS_URI pointing at a different tenant than the one that issued the token.'
  },
  ERR_JWKS_MULTIPLE_MATCHING_KEYS: {
    code: 'ERR_JWKS_MULTIPLE_MATCHING_KEYS',
    stage: 'verify',
    hint: 'The fetched key set contains more than one key matching this token’s header, so the right one is ambiguous. A provider-side key-set problem.'
  },
  ERR_JWS_SIGNATURE_VERIFICATION_FAILED: {
    code: 'ERR_JWS_SIGNATURE_VERIFICATION_FAILED',
    stage: 'verify',
    hint: 'A key was found for the token’s kid but the signature does not verify under it. IDENTITY_PROVIDER_JWKS_URI may name a key set belonging to a different provider or environment than the one that issued the token.'
  },
  ERR_JWE_DECRYPTION_FAILED: {
    code: 'ERR_JWE_DECRYPTION_FAILED',
    stage: 'decrypt',
    hint: 'A JWK with a matching kid was found, but it did not decrypt the token. The private key in IDENTITY_PROVIDER_DECRYPTION_JWKS is not the counterpart of the public key the provider encrypted to, even though their kids agree.'
  },
  ERR_JWE_INVALID: {
    code: 'ERR_JWE_INVALID',
    stage: 'decrypt',
    hint: 'The id_token is not a compact JWE. The provider is very likely returning a signed-but-unencrypted id_token, while this pipeline requires encryption; check the client’s id_token_encrypted_response_alg registration at the provider.'
  },
  ERR_JWK_INVALID: {
    code: 'ERR_JWK_INVALID',
    stage: 'config',
    hint: 'A JWK object in IDENTITY_PROVIDER_DECRYPTION_JWKS is structurally invalid -- present and JSON, but not a usable key.'
  },
  ERR_JOSE_NOT_SUPPORTED: {
    code: 'ERR_JOSE_NOT_SUPPORTED',
    stage: 'config',
    hint: 'A key type or algorithm in play is not supported by this runtime’s jose build. Check the `alg` and `kty` on the JWKs in IDENTITY_PROVIDER_DECRYPTION_JWKS.'
  },
  ERR_JOSE_ALG_NOT_ALLOWED: {
    code: 'ERR_JOSE_ALG_NOT_ALLOWED',
    stage: 'verify',
    hint: 'The token’s algorithm is not in the allowed list for this operation.'
  },
  ERR_JWS_INVALID: {
    code: 'ERR_JWS_INVALID',
    stage: 'verify',
    hint: 'The token decrypted, but its payload is not a well-formed JWS. The provider returned something other than a signed JWT inside the JWE.'
  },
  ERR_JWT_INVALID: {
    code: 'ERR_JWT_INVALID',
    stage: 'verify',
    hint: 'The signed payload is not a well-formed JWT -- it verified as a JWS but its claims set is not a JSON object.'
  },
  ERR_JWT_CLAIM_VALIDATION_FAILED: {
    code: 'ERR_JWT_CLAIM_VALIDATION_FAILED',
    stage: 'claims',
    hint: 'Decryption and signature verification both SUCCEEDED; a claim did not match. The two claims checked here are `aud` against PUBLIC_IDENTITY_PROVIDER_CLIENT_ID and `iss` against IDENTITY_PROVIDER_ISSUER, so compare those two variables with what the provider actually issues. Note PUBLIC_IDENTITY_PROVIDER_CLIENT_ID and its un-prefixed twin IDENTITY_PROVIDER_CLIENT_ID must hold the SAME value -- run `yarn check:env-pairs-agree` (it prints names only).'
  },
  ERR_JWT_EXPIRED: {
    code: 'ERR_JWT_EXPIRED',
    stage: 'claims',
    hint: 'The id_token is past its `exp`. Either the sign-in took longer than the token’s lifetime, or this host’s clock has drifted from the provider’s.'
  },
  ERR_INVALID_URL: {
    code: 'ERR_INVALID_URL',
    stage: 'config',
    hint: 'A configured URL will not parse. On this path that is IDENTITY_PROVIDER_JWKS_URI -- it must be an ABSOLUTE url including the scheme.'
  }
};

/**
 * Resolve a failure class to its stage and operator hint.
 *
 * Total by construction: an unrecognised code is reported as `unknown` with a hint that says so, rather than being mapped to a plausible-looking stage it may not belong to. That openness is deliberate -- jose's code set can grow across versions, and a wrong stage is worse than an admitted gap.
 *
 * @param code - The failure class, as returned in `IdTokenClaimsResult.error.code`. `undefined` resolves to {@link OIDC_FAILURE_NONE}.
 * @returns The code, its stage and a FIXED hint. Never interpolates any value, so the result is safe to log verbatim.
 */
export function describeOidcFailure(code: string | undefined): OidcFailureDescription {
  if (code === undefined || code === '') {
    return {
      code: OIDC_FAILURE_NONE,
      stage: 'unknown',
      hint: 'The failure carried no code. The thrown value was not an Error, or was an Error with no `code` own-property -- Node’s `TypeError: fetch failed` is the realistic case, since it carries its code on `.cause`. Check the preceding server log lines for the token-exchange leg.'
    };
  }

  return (
    OWN_FAILURES[code] ??
    JOSE_FAILURES[code] ?? {
      code,
      stage: 'unknown',
      hint: 'Unrecognised failure class -- neither one this application throws nor one of jose 6.x’s own. Most likely a jose upgrade added a code; add it to JOSE_FAILURES in `oidcFailure.ts` with its stage so the next reader is not sent to the library source.'
    }
  );
}

/**
 * Render a failure as the one-line server-log form.
 *
 * Deliberately one line and `key=value` shaped so it greps and so a pasted log line carries its own remedy. The stage is what makes it triageable at a glance; the hint is what makes it actionable without a source dive.
 *
 * SAFE TO LOG. Every component is either a code, a stage, a provider type or a fixed hint from this module. This function has no parameter through which a value, URL, host, `kid` or token could enter.
 *
 * @param code - The failure class from `IdTokenClaimsResult.error.code`.
 * @param providerType - The active provider (`'idura'` / `'signicat'`). Included because selecting the WRONG provider was the entire content of finding 1 of the bank-auth debug session, and a log line that names it makes that class of fault self-evident instead of invisible.
 * @returns A single line, no trailing newline.
 */
export function formatOidcFailure(code: string | undefined, providerType: string): string {
  const { code: resolved, stage, hint } = describeOidcFailure(code);
  return `code=${resolved} stage=${stage} provider=${providerType} — ${hint}`;
}

/**
 * The keys call sites use to reach an {@link OIDC_FAILURE} value.
 *
 * Exported, unlike `OidcErrorKey` in `$candidate/utils/oidcError`, because the colocated test enumerates the union to prove every member is mapped -- which is the assertion that keeps this module's promise from rotting.
 */
export type OidcFailureKey =
  | 'jwksMalformed'
  | 'jwksEmpty'
  | 'jwkKidMismatch'
  | 'audienceUnconfigured'
  | 'issuerUnconfigured'
  | 'jwksUriUnconfigured'
  | 'jwksUriHttpStatus'
  | 'jwksUriNotJson'
  | 'jwksUriUnreachable';
