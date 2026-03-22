import { mapRow } from './mapRow';
import { localizeRow } from './localizeRow';

/**
 * Fields that are localized on every DataObject table.
 * These are JSONB locale-keyed objects in the database (e.g. `{"en": "Hello"}`).
 */
const STANDARD_LOCALIZED_FIELDS = ['name', 'short_name', 'info'];

/**
 * Transform a raw database row into a domain object by:
 *   1. Localizing standard fields (name, short_name, info) plus any additional
 *      fields — resolving JSONB locale objects to plain strings via 3-tier fallback.
 *   2. Mapping snake_case column names to camelCase properties via COLUMN_MAP.
 *
 * This is the shared pipeline used by all SupabaseDataProvider read methods.
 *
 * @param row - Raw database row from PostgREST/Supabase query
 * @param locale - Requested locale (e.g. "fi")
 * @param defaultLocale - Fallback locale (defaults to "en")
 * @param additionalLocalizedFields - Extra fields to localize beyond name/short_name/info,
 *   supports dot-notation for nested JSONB paths (e.g. "custom_data.fillingInfo")
 */
export function toDataObject(
  row: Record<string, unknown>,
  locale: string,
  defaultLocale: string = 'en',
  additionalLocalizedFields: string[] = []
): Record<string, unknown> {
  const localized = localizeRow(
    row,
    [...STANDARD_LOCALIZED_FIELDS, ...additionalLocalizedFields],
    locale,
    defaultLocale
  );
  return mapRow(localized);
}
