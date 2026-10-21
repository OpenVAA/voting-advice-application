import type { TranslationKey } from '$types';

/**
 * Get the translation key for the given error code.
 */
export function getErrorTranslationKey(error: LoginError | null): TranslationKey | undefined {
  if (error == null || !(error in LOGIN_ERROR)) return undefined;
  return LOGIN_ERROR[error];
}

const LOGIN_ERROR: Record<LoginError, TranslationKey> = {
  loginFailed: 'error.loginFailed',
  userNotAuthorized: 'error.403'
} as const;

/**
 * The allowed error codes for candidate login to be displayed on the login page. These are subkeys of `error` translations.
 */
export type LoginError = 'loginFailed' | 'userNotAuthorized';
