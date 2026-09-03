import type { LocalizedString } from './localized.type';

/**
 * Extract a locale-appropriate string from a JSONB locale object.
 * Implements 3-tier fallback matching the SQL get_localized() function in apps/supabase/supabase/schema/000-functions.sql:
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
  value: LocalizedString | null | undefined,
  locale: string,
  defaultLocale: string = 'en'
): string | null {
  // The declared parameter type is an ASSERTION at every call site, not a guarantee. `localizeRow` hands over a raw `jsonb` column behind a `as Record<string, string> | null | undefined` cast, and no column it localizes carries a constraint: `name` / `short_name` / `info` are declared as bare `jsonb` (`apps/supabase/supabase/schema/102-entities.sql`, `103-questions.sql`), and `is_localized_string` is defined but referenced by ZERO constraints — its only caller is `validate_answer_value`. So `UPDATE candidates SET name = '"Ada"'::jsonb` is accepted today, and a scalar or an array reaching the `in` operator below raises a TypeError.
  //
  // That must degrade to `null`, never throw: `localizeRow` runs from `toDataObject` over every row of the entity, question and constituency reads, so a throw here fails the whole page load rather than dropping one field — against this phase's stated posture that one malformed row must not fail the read that contains it (T-157-06, `parseJsonbColumn.ts:42`). Arrays are excluded for the same reason the SQL counterpart raises on a non-object: they are objects, so they would otherwise pass the `in` tests and return their first element.
  if (value == null || typeof value !== 'object' || Array.isArray(value)) return null;

  if (locale in value) return value[locale];
  if (defaultLocale in value) return value[defaultLocale];

  const keys = Object.keys(value);
  if (keys.length > 0) return value[keys[0]];

  return null;
}
