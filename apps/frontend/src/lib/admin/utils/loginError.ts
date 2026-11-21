import { loginErrorKey, SESSION_ENDED_MESSAGES } from '$lib/auth/loginError';
import type { TranslationKey } from '$types';

/**
 * Get the translation key for the given error code.
 *
 * The code arrives on the address bar, so it is any text at all: see `loginErrorKey`.
 */
export function getErrorTranslationKey(error: LoginError | null): TranslationKey | undefined {
  return loginErrorKey(LOGIN_ERROR, error);
}

/**
 * The message of each reason. None names a user name, an address, a password or the cause of the failure.
 *
 * - `loggedOutAutomatically` and `loggedOutElsewhere` have the shared `SESSION_ENDED_MESSAGES`.
 * - `authError` has `adminApp.login.errors.linkFailed`, which says that a link works once and only the newest one works, and asks for a new one.
 */
const LOGIN_ERROR: Record<LoginError, TranslationKey> = {
  loginFailed: 'error.loginFailed',
  userNotAuthorized: 'error.403',
  ...SESSION_ENDED_MESSAGES,
  authError: 'adminApp.login.errors.linkFailed'
} as const;

/**
 * The reasons the Admin App's login page shows a message for, as the `errorMessage` search parameter or the login page's load names them:
 *
 * - `loginFailed`: the session was not there, or the user's data could not be read.
 * - `userNotAuthorized`: the signed-in user may not use the Admin App.
 * - `loggedOutAutomatically`: a logout count ran out with no one to cancel it, and the session was ended.
 * - `loggedOutElsewhere`: the user logged out in another tab or window.
 * - `authError`: a mailed link the Admin App asked for could not be used.
 */
export type LoginError =
  'loginFailed' | 'userNotAuthorized' | 'loggedOutAutomatically' | 'loggedOutElsewhere' | 'authError';
