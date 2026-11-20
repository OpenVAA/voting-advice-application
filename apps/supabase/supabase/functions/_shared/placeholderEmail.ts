/**
 * The placeholder email an identity-provider account is created with.
 *
 * Pure functions and constants with no Deno imports, no URL imports and no reference to the Deno global, so the module can be imported by both the Edge Functions and vitest. `identity-callback` creates an account on it, and `account-access` refuses to take it for an email address anybody owns.
 *
 * The auth service requires an address or a phone number for every user, and an identification through the provider carries neither, so the account is created on an email address derived from the identity's persistent match value on a domain nobody receives mail for. The same email is used again for every sign-in of that identity, so the derivation must stay stable.
 *
 * ONE DOMAIN, TWO COPIES. This module and the frontend's `apps/frontend/src/lib/contestant/utils/identityProviderAccount.ts` each hold the domain, because the frontend cannot import an Edge Function module. `placeholderEmail.test.ts` beside this file holds the two equal.
 */

/** The domain of every placeholder email. Nobody receives mail for it. */
export const PLACEHOLDER_EMAIL_DOMAIN = 'bank-auth.placeholder';

/**
 * The placeholder email of an identity.
 *
 * The match value must be unique per person: two identities with one match value would share one email, and the second to sign in would be handed the first one's account.
 *
 * @param matchValue - The identity's persistent match value
 * @returns The email the identity's account is created on and signed in through
 */
export function placeholderEmailFor(matchValue: string): string {
  return `${matchValue}@${PLACEHOLDER_EMAIL_DOMAIN}`;
}

/**
 * Whether an email address is on the placeholder domain. Case and surrounding white space do not change the answer.
 *
 * @param address - The address, of any type
 * @returns True only for a string with a non-empty part before its last `@` and the placeholder domain after it
 */
export function isPlaceholderEmail(address: unknown): boolean {
  if (typeof address !== 'string') return false;
  const normalised = address.trim().toLowerCase();
  const at = normalised.lastIndexOf('@');
  return at > 0 && normalised.slice(at + 1) === PLACEHOLDER_EMAIL_DOMAIN;
}
