import type { TranslationKey } from '$types';

/**
 * Asserts blindly that key is `TranslationKey` for use with translation keys that are formed dynamically.
 * TODO: In the future, check that the key is a valid translation key.
 */
export function assertTranslationKey(key: string): TranslationKey {
  return key as TranslationKey;
}
