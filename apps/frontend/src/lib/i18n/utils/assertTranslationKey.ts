import type { TranslationKey } from '$lib/types/generated/translationKey';

/**
 * Assert that a dynamically constructed string is a valid translation key.
 *
 * With Paraglide + the post-Phase-78 tightened `t()` signature, static keys are
 * validated against the `TranslationKey` union at compile time. This function is
 * the explicit, documented escape hatch for cases where the key is built at
 * runtime (e.g., ``assertTranslationKey(`error.${status}`)``) and the caller
 * accepts responsibility for asserting the key exists in the message catalog.
 *
 * The runtime fallback at `wrapper.ts` (`return key` when the message function
 * is not found) catches mistakes at render time; this assertion only widens the
 * type, it does not validate the key at runtime.
 */
export function assertTranslationKey(key: string): TranslationKey {
  return key as TranslationKey;
}
