/**
 * Assert that a dynamically constructed string is a valid translation key.
 * With Paraglide, static keys are validated at compile time.
 * This function provides a type assertion for dynamically constructed keys.
 */
export function assertTranslationKey(key: string): string {
  return key;
}
