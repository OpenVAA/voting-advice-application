/**
 * The identity's existing account: the reading of `public.identity_account_find`'s answer, and what is done with the account it finds.
 *
 * Pure functions with no Deno imports, no URL imports and no reference to the Deno global, so the module can be imported by both the Edge Function and vitest.
 *
 * HOW THE ACCOUNT IS FOUND. `public.identity_account_find` answers the one account whose `app_metadata` holds the identity's match value, or whose address is the identity's placeholder email compared without case. The function asks it first, and again when the invite of the placeholder email fails: another request for the same identity created the account in the meantime, or an earlier request created it and stopped before finishing it.
 *
 * THE ADDRESS IS COMPARED WITHOUT CASE. The auth service stores an address lower-cased, and a placeholder keeps the case of the subject identifier it is built from, so an exact comparison would never find the account of an identifier with capitals.
 *
 * WHAT IS DONE WITH THE ACCOUNT FOUND. One that already carries this identity's match value was finished by an earlier request and is kept. One that carries no match value is this identity's unfinished account, and is finished by this request. One that carries another identity's match value is refused: two identifiers that differ only in case name one placeholder email, and the account is not handed to the second.
 */

import { isPlainObject, isUuid } from '../_shared/guards.ts';

/** The account fields the function reads. */
export interface IdentityAccount {
  id: string;
  email: string | null;
  appMetadata: Record<string, unknown> | null;
}

/** What the setup of an account found for the identity comes to. */
export type ExistingAccountSetup = { kind: 'keep'; appMetadata: unknown } | { kind: 'initialise' } | { kind: 'refuse' };

/**
 * Read the answer of `public.identity_account_find`, which answers `{ id, email, raw_app_meta_data }` or null.
 *
 * @param answer - The function's answer, of any type
 * @returns The account, or null when the function found none
 * @throws {Error & { code: string }} `ERR_ACCOUNT_LOOKUP_FAILED` for any other shape. The message names no id and no address.
 */
export function identityAccountOf(answer: unknown): IdentityAccount | null {
  if (answer === null) return null;
  if (!isPlainObject(answer) || !isUuid(answer.id)) throw unexpectedAccount();
  const { email, raw_app_meta_data: appMetadata } = answer;
  if (email !== null && email !== undefined && typeof email !== 'string') throw unexpectedAccount();
  if (appMetadata !== null && appMetadata !== undefined && !isPlainObject(appMetadata)) throw unexpectedAccount();
  return { id: answer.id, email: email ?? null, appMetadata: appMetadata ?? null };
}

function unexpectedAccount(): Error & { code: string } {
  return Object.assign(new Error('The account look-up answered an unexpected shape.'), {
    code: 'ERR_ACCOUNT_LOOKUP_FAILED'
  });
}

/**
 * What to do with the account found for the identity.
 *
 * @param appMetadata - The found account's `app_metadata`, of any shape
 * @param matchValue - The identity's match value
 * @returns `keep`, with the metadata, when its own `identity_match_value` is this match value; `refuse` when it is another non-empty string; `initialise` otherwise
 */
export function existingAccountSetup(appMetadata: unknown, matchValue: string): ExistingAccountSetup {
  if (!isPlainObject(appMetadata)) return { kind: 'initialise' };
  if (!Object.prototype.hasOwnProperty.call(appMetadata, 'identity_match_value')) return { kind: 'initialise' };
  const held = appMetadata.identity_match_value;
  if (typeof held !== 'string' || held === '') return { kind: 'initialise' };
  return held === matchValue ? { kind: 'keep', appMetadata } : { kind: 'refuse' };
}
