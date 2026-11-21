/**
 * The `app_metadata` the identity-callback function writes on an identity-provider account.
 *
 * Pure functions and constants with no Deno imports, no URL imports and no reference to the Deno global, so the module can be imported by both the Edge Function and vitest.
 *
 * WHAT THE TOKEN CARRIES. `app_metadata` rides in every access token the auth service issues for the account, and the auth cookies that hold the token are readable by script on the page. So the metadata carries what the function needs to find the account again and nothing more: the provider, the claim the account is matched on and that claim's value (the provider's persistent subject identifier). The record of the entities the identity registered is a table of its own, `private.identity_registrations`, and is never part of it.
 *
 * WHY THE PROVIDER'S OTHER CLAIMS NEVER DO. A provider's assertion may hold a personal identity code and a birth date. Neither is needed to match the account, and either one in a script-readable token is a disclosure, so {@link identityAppMetadata} builds its answer field by field and carries no claim the provider asserted beyond the match value. Each key of {@link REMOVED_CLAIM_KEYS} is also sent as null, which `public.identity_entity_find_or_create` reads as "remove this key", so an account whose metadata still holds one of them loses it on its next sign-in.
 */

/** The claim keys never kept in `app_metadata`: each is written as null, which removes it. */
export const REMOVED_CLAIM_KEYS = Object.freeze(['hetu', 'birthdate'] as const);

/** One of {@link REMOVED_CLAIM_KEYS}. */
export type RemovedClaimKey = (typeof REMOVED_CLAIM_KEYS)[number];

/** What {@link identityAppMetadata} is built from. */
export interface IdentityAppMetadataInput {
  /** The configured provider's keyword. */
  providerType: string;
  /** The name of the claim the account is matched on. */
  matchProp: string;
  /** That claim's value: the provider's persistent subject identifier. */
  matchValue: string;
}

/** The `app_metadata` an identity-provider account is written with. */
export type IdentityAppMetadata = {
  identity_provider: string;
  identity_match_prop: string;
  identity_match_value: string;
} & Record<RemovedClaimKey, null>;

/**
 * The account's `app_metadata`, built field by field.
 *
 * Only the three named inputs are read: any other property of the argument, a claim included, is never copied. `identity-callback` hands the answer to `public.identity_entity_find_or_create`, which writes it key by key under the lock it takes on the account.
 *
 * @param input - The provider, the match property and the match value.
 * @returns Exactly the provider, the match property, the match value and a null for each removed claim key.
 */
export function identityAppMetadata({
  providerType,
  matchProp,
  matchValue
}: IdentityAppMetadataInput): IdentityAppMetadata {
  const removed = Object.fromEntries(REMOVED_CLAIM_KEYS.map((key) => [key, null])) as Record<RemovedClaimKey, null>;

  return {
    identity_provider: providerType,
    identity_match_prop: matchProp,
    identity_match_value: matchValue,
    ...removed
  };
}
