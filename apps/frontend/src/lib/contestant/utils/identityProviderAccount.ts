/**
 * The address state of a Contestant App account, told from the verified user alone.
 *
 * An account made by identifying with the identity provider is created on a placeholder address, on a domain nobody receives mail for, and its holder is then asked for a real address. Until that address is proved by the link mailed to it, the auth service holds it as the account's pending address. The state is therefore read from three facts of the verified user: the provider its app metadata names, its address and its pending address.
 *
 * Pure and synchronous, so a server load decides the state and no component needs to know the domain.
 *
 * THE IDENTITY'S OWN ORGANIZATION. `identity-callback` records in the account's `app_metadata`, under {@link REGISTERED_ENTITIES_KEY}, the entity the identity registered, per project and per entity type. {@link ownOrganizationId} reads the organization of one project from it, and {@link hasDefaultLocaleName} says whether a stored name has text in one locale, so the user-level read can tell whether that organization still needs a name. An organization the account edits by any other grant is never named by the record.
 *
 * ONE DOMAIN, THREE COPIES. The `identity-callback` and `account-access` Edge Functions hold their own copy of the domain, because no runtime can import another's module. `apps/supabase/supabase/functions/identity-callback/placeholderAddress.test.ts` holds the three equal.
 *
 * Tested in `identityProviderAccount.test.ts`.
 */

import { isBlankText } from '$lib/utils/localizedText';

/** The domain of every placeholder address. Nobody receives mail for it. */
export const PLACEHOLDER_EMAIL_DOMAIN = 'bank-auth.placeholder';

/**
 * The address state of an account.
 * - `none`: an identity-provider account that holds only its placeholder and has no address pending.
 * - `pending`: an identity-provider account that holds only its placeholder, with an address pending proof.
 * - `proved`: any other account, whose address is its holder's own.
 */
export type AddressState = 'none' | 'pending' | 'proved';

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

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim() !== '';
}

/**
 * The address state of an account.
 *
 * An account whose app metadata names no identity provider is `proved`, and so is an identity-provider account on an address that is not a placeholder. An identity-provider account on its placeholder, or on no address at all, is `pending` when an address is pending and `none` otherwise.
 * @param facts - The facts of the verified user.
 * @returns The account's address state.
 */
export function addressStateOf({ email, newEmail, identityProvider }: AddressFacts): AddressState {
  const holdsOnlyPlaceholder = !isNonEmptyString(email) || isPlaceholderAddress(email);
  if (!isNonEmptyString(identityProvider) || !holdsOnlyPlaceholder) return 'proved';
  return isNonEmptyString(newEmail) ? 'pending' : 'none';
}

/** The key of `app_metadata` under which `identity-callback` records the entity an identity registered, per project and per entity type. The test of this module holds it equal to the function's own. */
export const REGISTERED_ENTITIES_KEY = 'registered_entities';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * The value of an own member of an object, or `undefined` for anything else.
 * @param value - The object, of any type.
 * @param key - The member's name.
 * @returns The member's value when `value` is an object holding it as its own.
 */
function ownMember(value: unknown, key: string): unknown {
  return isRecord(value) && Object.hasOwn(value, key) ? value[key] : undefined;
}

/**
 * The organization the identity registered in a project, as the account's `app_metadata` records it.
 *
 * Only own members are read, and anything that is not a recorded uuid answers `null`: an unreadable record names no organization, so nothing is asked about one.
 * @param appMetadata - The verified user's `app_metadata`, of any type.
 * @param projectId - The project the application serves.
 * @returns The organization's id, or `null` when the record names none for the project.
 */
export function ownOrganizationId(appMetadata: unknown, projectId: string): string | null {
  const recorded = ownMember(ownMember(ownMember(appMetadata, REGISTERED_ENTITIES_KEY), projectId), 'organization');
  return typeof recorded === 'string' && UUID_PATTERN.test(recorded) ? recorded : null;
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
