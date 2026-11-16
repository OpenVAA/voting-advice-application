/**
 * ID-token claim-binding configuration for the identity-callback Edge Function.
 *
 * Pure functions extracted from the identity-callback Edge Function for testability. This module has NO Deno imports (no Deno.env, no Deno.serve, no URL imports from deno.land) so it can be imported by both the Edge Function and vitest.
 *
 * Why this guard exists rather than a pair of optional verify options: jose performs a PRESENCE check on `aud` / `iss` whenever the option is not `undefined`, but compares the option's VALUE only under a truthiness test. An omitted option therefore buys no binding at all, and an empty-string option buys only the requirement that the claim exist. Either way the verifier accepts any token signed by a key in the configured JWK set, including one minted by a different issuer for a different relying party. Since identity-callback is served --no-verify-jwt, is publicly reachable and provisions Supabase auth users, an unbound verification is an open door rather than a degraded check.
 *
 * The throw messages are opaque by design: they name the failure class and never the configured audience or issuer, because the caller who triggers them is unauthenticated.
 */

/** The two claim bindings `jose.jwtVerify` must always receive. Both are non-optional on purpose. */
export interface VerifyClaimBinding {
  audience: string;
  issuer: string;
}

/**
 * Resolve the audience and issuer bindings, or throw.
 *
 * An absent value and an empty string are both treated as unconfigured. A deployment that has not configured either variable fails loudly at verification time instead of silently verifying signatures for anybody.
 *
 * @param clientId - The expected audience, normally IDENTITY_PROVIDER_CLIENT_ID
 * @param issuer - The expected issuer, normally IDENTITY_PROVIDER_ISSUER
 * @returns Both bindings, ready to spread into jose's verify options
 * @throws {Error & { code: string }} `ERR_AUDIENCE_UNCONFIGURED` or `ERR_ISSUER_UNCONFIGURED`
 */
export function requireVerifyClaimBinding(clientId?: string, issuer?: string): VerifyClaimBinding {
  if (!clientId) {
    // Opaque identifier only -- the configured audience is NOT echoed.
    throw Object.assign(new Error('Cannot verify ID token: no expected audience is configured.'), {
      code: 'ERR_AUDIENCE_UNCONFIGURED'
    });
  }

  if (!issuer) {
    // Opaque identifier only -- the configured issuer is NOT echoed.
    throw Object.assign(new Error('Cannot verify ID token: no expected issuer is configured.'), {
      code: 'ERR_ISSUER_UNCONFIGURED'
    });
  }

  return { audience: clientId, issuer };
}
