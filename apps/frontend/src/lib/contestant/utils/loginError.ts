import type { TranslationKey } from '$types';

/**
 * The reasons the login screen of the Contestant App shows a notice for, as the `errorMessage` search parameter names them:
 *
 * - `loginFailed`: a signed-in user was signed out because their account's information could not be read.
 * - `authError`: a mailed link could not be used.
 */
export type ContestantLoginError = 'loginFailed' | 'authError';

/** The message of each reason. Neither names a user name, a password or the cause of the failure. */
const CONTESTANT_LOGIN_ERROR: Record<ContestantLoginError, TranslationKey> = {
  loginFailed: 'contestantApp.login.signedOut',
  authError: 'contestantApp.login.linkFailed'
} as const;

/**
 * Get the translation key of the notice for a reason.
 *
 * The reason arrives on the address bar, so it is any text at all. Only a reason the map holds as its own member has a message: a name every object inherits, such as `constructor`, has none.
 * @param error - The value of the `errorMessage` search parameter, if any.
 * @returns The key of the message, or `undefined` when the value is not one of the reasons.
 */
export function getErrorTranslationKey(error: string | null | undefined): TranslationKey | undefined {
  if (error == null || !Object.hasOwn(CONTESTANT_LOGIN_ERROR, error)) return undefined;
  return CONTESTANT_LOGIN_ERROR[error as ContestantLoginError];
}
