/**
 * Per-provider claim mapping configuration.
 *
 * Each identity provider returns different claims in the id_token and uses
 * different claims for user identity matching. These configurations tell the
 * system which claims to extract and how to map them to application concepts.
 *
 * The `identityMatchProp` is the claim used to match a returning user to
 * their existing candidate record. The `extractClaims` are additional claims
 * stored in user metadata for audit and verification purposes.
 */

import type { AuthConfig } from './types';

/**
 * Signicat claim mapping configuration.
 *
 * Signicat Finnish bank authentication returns `birthdate` as the primary
 * identity claim. This is the existing behavior prior to provider abstraction.
 *
 * - Identity matching: `birthdate` (Finnish date of birth)
 * - Name claims: Standard OIDC `given_name` and `family_name`
 */
export const SIGNICAT_AUTH_CONFIG: AuthConfig = {
  identityMatchProp: 'birthdate',
  extractClaims: ['birthdate'],
  firstNameProp: 'given_name',
  lastNameProp: 'family_name'
};

/**
 * Idura claim mapping configuration.
 *
 * Idura Finnish Trust Network authentication returns a stable `sub` claim
 * as the primary identifier. Additional Finnish-specific claims (`birthdate`,
 * `hetu`, `country`) are extracted for metadata storage.
 *
 * - Identity matching: `sub` (stable OIDC subject identifier)
 * - Name claims: Standard OIDC `given_name` and `family_name`
 * - Extra claims: `birthdate`, `hetu` (Finnish personal identity code), `country`
 */
export const IDURA_AUTH_CONFIG: AuthConfig = {
  identityMatchProp: 'sub',
  extractClaims: ['birthdate', 'hetu', 'country'],
  firstNameProp: 'given_name',
  lastNameProp: 'family_name'
};
