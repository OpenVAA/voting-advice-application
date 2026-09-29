import type { LocalizedString } from './localized.type';

/**
 * Extract a locale-appropriate string from a JSONB locale object.
 * Follows the fallback order of the SQL get_localized() function in apps/supabase/supabase/schema/010-utility-functions.sql:
 *
 *   1. requested locale
 *   2. default locale
 *   3. first key holding a string
 *   4. null (if value is null/undefined, not an object, or holds no string)
 *
 * Unlike the SQL function, a tier counts only when its value is a string, so a non-string value falls through to the next tier.
 *
 * This utility is opt-in per field -- it does NOT automatically localize.
 * DataWriter methods that need raw JSONB (multilingual writes) skip this.
 */
export function getLocalized(
  value: LocalizedString | null | undefined,
  locale: string,
  defaultLocale: string = 'en'
): string | null {
  // The declared type is not enforced by the column, so a stored value can be a scalar, an array or an object whose values are not strings. Each of those degrades to `null` rather than throwing, because one malformed field must not fail the whole read that contains it.
  if (value == null || typeof value !== 'object' || Array.isArray(value)) return null;
  const record: Record<string, unknown> = value;

  const requested = record[locale];
  if (typeof requested === 'string') return requested;
  const fallback = record[defaultLocale];
  if (typeof fallback === 'string') return fallback;

  for (const key of Object.keys(record)) {
    const candidate = record[key];
    if (typeof candidate === 'string') return candidate;
  }

  return null;
}
