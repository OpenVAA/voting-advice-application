/**
 * Provider claim configuration and extraction logic.
 *
 * Pure functions of the identity-callback Edge Function, kept out of `index.ts` so they can be tested. This module has NO Deno imports (no Deno.env, no Deno.serve, no URL imports from deno.land) so it can be imported by both the Edge Function and vitest.
 */

/**
 * Provider configuration interface.
 * Maps provider-specific claim names to a common interface.
 */
export interface ProviderClaimConfig {
  /** Which id_token claim to use as the identity key. MUST be unique per person -- see PROVIDER_CONFIGS. */
  identityMatchProp: string;
  /** Which claim maps to first name */
  firstNameProp: string;
  /** Which claim maps to last name */
  lastNameProp: string;
  /** Additional claims to extract and store in app_metadata */
  extractClaims: Array<string>;
}

/** The `IDENTITY_PROVIDER_TYPE` keywords this function accepts. */
export type ProviderKeyword = 'signicat-ftn' | 'idura-ftn';

/**
 * Per-provider claim configurations, keyed by the `IDENTITY_PROVIDER_TYPE` keyword. Both are Finnish Trust Network mappings, hence the `-ftn` suffix.
 *
 * - `'signicat-ftn'`: Uses `sub` (stable OIDC subject) for identity matching. `birthdate` is
 *   captured as metadata only.
 * - `'idura-ftn'`: Uses `sub` (persistent pseudonym) for identity matching.
 *   Extracts `birthdate` and `hetu` (Finnish personal identity code) as metadata.
 *
 * `identityMatchProp` MUST name a claim that is unique per person. It is not merely a lookup hint: its value becomes `app_metadata.identity_match_value` (the key `findUserByIdentityMatch` matches on) AND the local part of the placeholder email the auth user is created with, so two people whose claim values collide resolve to ONE Supabase account -- the second to authenticate is silently logged in as the first.
 * `birthdate` is the worked counter-example: keying on it makes that collision a certainty for any realistic candidate population rather than a corner case. Never key on a claim that is not an identifier.
 *
 * Confirmed against the provider's documentation (retrieved 2026-08-29): Signicat's `sub` is the HASHED, PERSISTENT subject: the provider's Subject page lists Finnish Trust Network as returning a *transient* raw subject, and then states that for such an eID it substitutes a unique-and-consistent attribute -- the national identity number -- and hashes that instead, so the `sub` we receive is stable per person for a given Signicat organisation. Two consequences a change here must respect: the organisation identifier is an input to that hash, so moving to a different Signicat organisation re-keys every stored user, and the substitution is the provider's choice rather than an intrinsic property.
 * DO NOT substitute `ftn_sub` for `sub`. It looks like the more specific identifier and is not one: the provider's own note says "Do not use this attribute as a permanent identifier for the end-user, as it may be transient and is not guaranteed to be globally unique" -- switching to it would expose the identity-key collision described above.
 */
export const PROVIDER_CONFIGS = {
  'signicat-ftn': {
    identityMatchProp: 'sub',
    firstNameProp: 'given_name',
    lastNameProp: 'family_name',
    extractClaims: ['birthdate']
  },
  'idura-ftn': {
    identityMatchProp: 'sub',
    firstNameProp: 'given_name',
    lastNameProp: 'family_name',
    extractClaims: ['birthdate', 'hetu']
  }
} satisfies Record<ProviderKeyword, ProviderClaimConfig>;

/**
 * Whether a string is a key of `PROVIDER_CONFIGS`. Own keys only: a plain `in` or index would accept an inherited name such as `constructor` or `__proto__`.
 */
export function isProviderKeyword(value: string): value is ProviderKeyword {
  return Object.hasOwn(PROVIDER_CONFIGS, value);
}

/**
 * The claim configuration for an `IDENTITY_PROVIDER_TYPE` keyword, or `undefined` when the keyword is not a key of `PROVIDER_CONFIGS` -- which includes a keyword without its `-ftn` suffix.
 */
export function resolveProviderConfig(providerType: string): ProviderClaimConfig | undefined {
  return isProviderKeyword(providerType) ? PROVIDER_CONFIGS[providerType] : undefined;
}

/**
 * Extract identity claims from the JWT payload based on provider configuration.
 * Throws if required claims (identity match, first name, last name) are missing.
 *
 * @param payload - Decoded JWT payload as a record
 * @param config - Provider-specific claim configuration
 * @returns Extracted identity data with match value, names, and extra claims
 * @throws {Error} If any required claim (identity match, first name, last name) is missing
 */
export function extractIdentityClaims(
  payload: Record<string, unknown>,
  config: ProviderClaimConfig
): {
  matchValue: string;
  firstName: string;
  lastName: string;
  extraClaims: Record<string, unknown>;
} {
  const firstName = payload[config.firstNameProp] as string | undefined;
  const lastName = payload[config.lastNameProp] as string | undefined;
  const matchValue = payload[config.identityMatchProp] as string | undefined;

  if (!firstName || !lastName || !matchValue) {
    throw new Error(
      'Missing required identity claims. ' +
        `${config.firstNameProp}=${firstName ? 'present' : 'missing'}, ` +
        `${config.lastNameProp}=${lastName ? 'present' : 'missing'}, ` +
        `${config.identityMatchProp}=${matchValue ? 'present' : 'missing'}`
    );
  }

  const extraClaims: Record<string, unknown> = {};
  for (const claimName of config.extractClaims) {
    if (payload[claimName] !== undefined) {
      extraClaims[claimName] = payload[claimName];
    }
  }

  return { matchValue, firstName, lastName, extraClaims };
}
