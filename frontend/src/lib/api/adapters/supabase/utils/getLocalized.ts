/**
 * Extract a locale-appropriate string from a JSONB locale object.
 * Implements 3-tier fallback matching the SQL get_localized() function
 * in apps/supabase/supabase/schema/000-functions.sql:
 *
 *   1. requested locale
 *   2. default locale
 *   3. first available key
 *   4. null (if value is null/undefined or empty object)
 *
 * This utility is opt-in per field -- it does NOT automatically localize.
 * DataWriter methods that need raw JSONB (multilingual writes) skip this.
 */
export function getLocalized(
  value: Record<string, string> | null | undefined,
  locale: string,
  defaultLocale: string = 'en'
): string | null {
  if (value == null) return null;

  if (locale in value) return value[locale];
  if (defaultLocale in value) return value[defaultLocale];

  const keys = Object.keys(value);
  if (keys.length > 0) return value[keys[0]];

  return null;
}
