/**
 * The placeholder address an identity-provider account is created with, as this function tells it.
 *
 * Pure functions and constants with no Deno imports, no URL imports and no reference to the Deno global, so the module can be imported by both the Edge Function and vitest.
 *
 * An identity-provider account is created on an address on a domain nobody receives mail for, until its holder proves a real one. This function must never take such an address for one anybody owns.
 *
 * ONE DOMAIN, THREE COPIES. `identity-callback/placeholderAddress.ts`, which builds the address, and the frontend's `identityProviderAccount.ts` hold their own copy of the domain, because no runtime can import another's module. `identity-callback/placeholderAddress.test.ts` holds the three equal.
 */

/** The domain of every placeholder address. Nobody receives mail for it. */
export const PLACEHOLDER_EMAIL_DOMAIN = 'bank-auth.placeholder';

/**
 * Whether an address is on the placeholder domain. Case and surrounding white space do not change the answer.
 *
 * @param address - The address, of any type
 * @returns True only for a string with a non-empty part before its last `@` and the placeholder domain after it
 */
export function isPlaceholderAddress(address: unknown): boolean {
  if (typeof address !== 'string') return false;
  const normalised = address.trim().toLowerCase();
  const at = normalised.lastIndexOf('@');
  return at > 0 && normalised.slice(at + 1) === PLACEHOLDER_EMAIL_DOMAIN;
}
