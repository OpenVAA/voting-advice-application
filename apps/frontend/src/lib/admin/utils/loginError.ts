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

const LOGIN_ERROR: Record<LoginError, TranslationKey> = {
  loginFailed: 'error.loginFailed',
  userNotAuthorized: 'error.403'
} as const;

/**
 * The allowed error codes for the Admin App's login page. Each maps to a key of the `error` translations.
 */
export type LoginError = 'loginFailed' | 'userNotAuthorized';
