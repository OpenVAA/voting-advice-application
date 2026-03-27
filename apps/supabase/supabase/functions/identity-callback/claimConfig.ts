/**
 * Provider claim configuration and extraction logic.
 *
 * Pure functions extracted from the identity-callback Edge Function for
 * testability. This module has NO Deno imports (no Deno.env, no Deno.serve,
 * no URL imports from deno.land) so it can be imported by both the Edge
 * Function and vitest.
 */

/**
 * Provider configuration interface.
 * Maps provider-specific claim names to a common interface.
 */
export interface ProviderClaimConfig {
  /** Which id_token claim to use as the identity key (e.g., 'sub' for Idura, 'birthdate' for Signicat) */
  identityMatchProp: string;
  /** Which claim maps to first name */
  firstNameProp: string;
  /** Which claim maps to last name */
  lastNameProp: string;
  /** Additional claims to extract and store in app_metadata */
  extractClaims: string[];
}

/**
 * Per-provider claim configurations.
 *
 * - Signicat: Uses `birthdate` for identity matching (Finnish bank auth pattern).
 *   No extra claims extracted.
 * - Idura: Uses `sub` (persistent pseudonym) for identity matching.
 *   Extracts `birthdate` and `hetu` (Finnish personal identity code) as metadata.
 */
export const PROVIDER_CONFIGS: Record<string, ProviderClaimConfig> = {
  signicat: {
    identityMatchProp: 'birthdate',
    firstNameProp: 'given_name',
    lastNameProp: 'family_name',
    extractClaims: []
  },
  idura: {
    identityMatchProp: 'sub',
    firstNameProp: 'given_name',
    lastNameProp: 'family_name',
    extractClaims: ['birthdate', 'hetu']
  }
};

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
      `Missing required identity claims. ` +
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
