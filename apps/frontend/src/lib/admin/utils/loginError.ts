import type { TranslationKey } from '$types';

/**
 * Get the translation key for the given error code.
 *
 * The code arrives on the address bar, so it is any text at all. Only a code the map holds as its own member has a message: a name every object inherits, such as `constructor`, has none.
 */
export function getErrorTranslationKey(error: LoginError | null): TranslationKey | undefined {
  if (error == null || !Object.hasOwn(LOGIN_ERROR, error)) return undefined;
  return LOGIN_ERROR[error];
}

/**
 * The message of each reason. None names a user name, an address, a password or the cause of the failure.
 *
 * - `loggedOutAutomatically` has `common.loggedOutAutomatically`, which says the logout the user started was not cancelled in time.
 * - `loggedOutElsewhere` has `common.loggedOutElsewhere`, which says the user was logged out in another tab or window.
 * - `authError` has `adminApp.login.errors.linkFailed`, which says that a link works once and only the newest one works, and asks for a new one.
 */
const LOGIN_ERROR: Record<LoginError, TranslationKey> = {
  loginFailed: 'error.loginFailed',
  userNotAuthorized: 'error.403',
  loggedOutAutomatically: 'common.loggedOutAutomatically',
  loggedOutElsewhere: 'common.loggedOutElsewhere',
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
