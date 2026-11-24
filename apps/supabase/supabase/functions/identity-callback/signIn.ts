/**
 * The sign-in of an identity's existing account, for a request whose intent is `sign_in`.
 *
 * This module reaches the Deno runtime global nowhere and imports from a remote origin nowhere, so it can be imported by both the Edge Function and vitest. It holds no client: the account look-up and the sign-in token are handed to it, so a sign-in can do nothing but read the account and mint that one token.
 *
 * Only an account that holds this identity's match value is signed in: one an earlier registration of the identity finished. No account, one no registration has finished yet and one of another identity are each answered `no_account`, and no token is minted for them.
 */

import { existingAccountSetup } from './placeholderAccount.ts';
import { IDENTITY_CALLBACK_RESULT } from './requestContract.ts';
import type { IdentityAccount } from './placeholderAccount.ts';

/** What a sign-in is given to reach the auth service. */
export interface SignInDependencies {
  /** The identity's account, by its match value or by its placeholder email, or null when it has none. */
  findAccount: (matchValue: string) => Promise<IdentityAccount | null>;
  /** The token of a sign-in link for the account. */
  signInToken: (userId: string) => Promise<string>;
}

/** What a sign-in comes to: the account signed in with its token, or no account to sign in to. */
export type SignInOutcome =
  | { result: typeof IDENTITY_CALLBACK_RESULT.signed_in; token: string }
  | { result: typeof IDENTITY_CALLBACK_RESULT.no_account };

/**
 * Sign in the identity's existing account.
 *
 * @param dependencies - The account look-up and the sign-in token.
 * @param matchValue - The identity's match value.
 * @returns `signed_in` with the sign-in token, or `no_account`.
 * @throws {Error & { code: string }} When the look-up or the sign-in token fails.
 */
export async function signInExistingAccount(
  { findAccount, signInToken }: SignInDependencies,
  matchValue: string
): Promise<SignInOutcome> {
  const existing = await findAccount(matchValue);
  if (!existing || existingAccountSetup(existing.appMetadata, matchValue).kind !== 'keep') {
    return { result: IDENTITY_CALLBACK_RESULT.no_account };
  }
  return { result: IDENTITY_CALLBACK_RESULT.signed_in, token: await signInToken(existing.id) };
}
