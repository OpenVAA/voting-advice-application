/**
 * The account an identity's placeholder address names, when the invite of that address answers that it is taken.
 *
 * Pure functions with no Deno imports, no URL imports and no reference to the Deno global, so the module can be imported by both the Edge Function and vitest.
 *
 * WHEN THIS HAPPENS. The function looks the identity's account up by its match value first. It invites the placeholder address only when that finds nothing, and the auth service answers `email_exists` when an account already holds the address: another request for the same identity created it in the meantime, or an earlier request created it and stopped before writing the account's record.
 *
 * THE ADDRESS IS COMPARED WITHOUT CASE. The auth service stores an address lower-cased, and a placeholder keeps the case of the subject identifier it is built from, so an exact comparison would never find the account of an identifier with capitals.
 *
 * WHAT IS DONE WITH THE ACCOUNT FOUND. One that already carries this identity's match value was finished by another request: its record is kept, so the entity that request registered stays reachable. One that carries no match value is this identity's unfinished account, and its record is written afresh. One that carries another identity's match value is refused: two identifiers that differ only in case name one address, and the account is not handed to the second.
 */

/** What the setup of an account found on the placeholder address comes to. */
export type ExistingAccountSetup = { kind: 'keep'; appMetadata: unknown } | { kind: 'initialise' } | { kind: 'refuse' };

/**
 * Whether an account's address is an identity's placeholder address. Case and surrounding white space of either do not change the answer.
 *
 * @param account - The account, of which only `email` is read
 * @param placeholderAddress - The identity's placeholder address
 * @returns True only when both are non-empty strings that are equal once trimmed and lower-cased
 */
export function holdsPlaceholderAddress(account: { email?: unknown }, placeholderAddress: string): boolean {
  const wanted = placeholderAddress.trim().toLowerCase();
  const held = account.email;
  return wanted !== '' && typeof held === 'string' && held.trim().toLowerCase() === wanted;
}

/**
 * What to do with the account found on the identity's placeholder address.
 *
 * @param appMetadata - The found account's `app_metadata`, of any shape
 * @param matchValue - The identity's match value
 * @returns `keep`, with the metadata, when its own `identity_match_value` is this match value; `refuse` when it is another non-empty string; `initialise` otherwise
 */
export function existingAccountSetup(appMetadata: unknown, matchValue: string): ExistingAccountSetup {
  if (typeof appMetadata !== 'object' || appMetadata === null || Array.isArray(appMetadata))
    return { kind: 'initialise' };
  if (!Object.prototype.hasOwnProperty.call(appMetadata, 'identity_match_value')) return { kind: 'initialise' };
  const held = (appMetadata as { identity_match_value?: unknown }).identity_match_value;
  if (typeof held !== 'string' || held === '') return { kind: 'initialise' };
  return held === matchValue ? { kind: 'keep', appMetadata } : { kind: 'refuse' };
}
