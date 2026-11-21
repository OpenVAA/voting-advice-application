/**
 * The address state of a Contestant App account, told from the verified user alone.
 *
 * An account made by identifying with the identity provider is created on a placeholder address, on a domain nobody receives mail for, and its holder is then asked for a real address. Until that address is proved by the link mailed to it, the auth service holds it as the account's pending address. The state is therefore read from three facts of the verified user: the provider its app metadata names, its address and its pending address.
 *
 * Pure and synchronous, so a server load decides the state and no component needs to know the domain.
 *
 * THE IDENTITY'S OWN ORGANIZATION. The user-level read is told by the database which organization the identity registered in the project, and {@link hasDefaultLocaleName} says whether a stored name has text in one locale, so that read can tell whether that organization still needs a name.
 *
 * ONE DOMAIN, TWO COPIES. The Edge Functions' module `apps/supabase/supabase/functions/_shared/placeholderEmail.ts` holds its own copy of the domain, because the frontend cannot import an Edge Function module. `apps/supabase/supabase/functions/_shared/placeholderEmail.test.ts` holds the two equal.
 *
 * Tested in `identityProviderAccount.test.ts`.
 */

import { isPlainObject } from '@openvaa/app-shared';
import { isBlankText } from '$lib/utils/localizedText';

/** The domain of every placeholder address. Nobody receives mail for it. */
export const PLACEHOLDER_EMAIL_DOMAIN = 'bank-auth.placeholder';

/**
 * The address state of an account, with what each state carries.
 * - `proved`: any account whose address is its holder's own, which is every account an identity provider did not make.
 * - `pending`: an identity-provider account that holds only its placeholder, with `email` pending proof by the link mailed to it.
 * - `none`: an identity-provider account that holds only its placeholder and has no address it can still prove. `pendingTaken` is `true` when it was waiting to prove an address that has since become another account's.
 */
export type AddressState =
  { state: 'proved' } | { state: 'pending'; email: string } | { state: 'none'; pendingTaken: boolean };

/** The name of an address state, as {@link addressStateOf} tells it from the verified user alone. */
export type AddressStateName = AddressState['state'];

/** The facts of the verified user the address state is told from. */
export interface AddressFacts {
  /** The account's address. */
  email: string | null | undefined;
  /** The address pending proof, as the auth service reports it. */
  newEmail: string | null | undefined;
  /** The identity provider the account's app metadata names, of any type. */
  identityProvider: unknown;
}

/**
 * Whether an address is on the placeholder domain. Case and surrounding white space do not change the answer.
 * @param address - The address, of any type.
 * @returns True only for a string with a non-empty part before its last `@` and the placeholder domain after it.
 */
export function isPlaceholderAddress(address: unknown): boolean {
  if (typeof address !== 'string') return false;
  const normalised = address.trim().toLowerCase();
  const at = normalised.lastIndexOf('@');
  return at > 0 && normalised.slice(at + 1) === PLACEHOLDER_EMAIL_DOMAIN;
}

/**
 * The name of an account's address state.
 *
 * An account whose app metadata names no identity provider is `proved`, and so is an identity-provider account on an address that is not a placeholder. An identity-provider account on its placeholder, or on no address at all, is `pending` when an address is pending and `none` otherwise.
 * @param facts - The facts of the verified user.
 * @returns The name of the account's address state.
 */
export function addressStateOf({ email, newEmail, identityProvider }: AddressFacts): AddressStateName {
  const holdsOnlyPlaceholder = !isNonEmptyString(email) || isPlaceholderAddress(email);
  if (!isNonEmptyString(identityProvider) || !holdsOnlyPlaceholder) return 'proved';
  return isNonEmptyString(newEmail) ? 'pending' : 'none';
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && !isBlankText(value);
}

/**
 * Whether a stored locale-keyed name has text in one locale.
 * @param name - The stored name, of any type.
 * @param locale - The locale whose entry is judged.
 * @returns `true` only when the name is an object whose own entry for `locale` is a string with something other than white space.
 */
export function hasDefaultLocaleName(name: unknown, locale: string): boolean {
  return !isBlankText(ownMember(name, locale));
}

/**
 * The value of an own member of an object, or `undefined` for anything else.
 * @param value - The object, of any type.
 * @param key - The member's name.
 * @returns The member's value when `value` is an object holding it as its own.
 */
function ownMember(value: unknown, key: string): unknown {
  return isPlainObject(value) && Object.hasOwn(value, key) ? value[key] : undefined;
}
