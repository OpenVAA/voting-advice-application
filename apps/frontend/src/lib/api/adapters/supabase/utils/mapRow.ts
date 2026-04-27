import { COLUMN_MAP, PROPERTY_MAP } from '@openvaa/supabase-types';

/**
 * Map a snake_case database row to a camelCase domain object.
 * Columns in COLUMN_MAP are renamed; unmapped columns pass through unchanged.
 *
 * TODO: RLS is responsible for preventing sensitive data leakage, not the mapper.
 */
export function mapRow<T extends Record<string, unknown>>(row: T): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(row)) {
    const mappedKey = (COLUMN_MAP as Record<string, string>)[key] ?? key;
    result[mappedKey] = value;
  }
  return result;
}

/**
 * Map a camelCase domain object to a snake_case database row for writes.
 * Properties in PROPERTY_MAP are renamed; unmapped properties pass through unchanged.
 */
export function mapRowToDb<T extends Record<string, unknown>>(obj: T): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    const mappedKey = (PROPERTY_MAP as Record<string, string>)[key] ?? key;
    result[mappedKey] = value;
  }
  return result;
}

/**
 * Map an array of snake_case database rows to camelCase domain objects.
 */
export function mapRows<T extends Record<string, unknown>>(rows: T[]): Record<string, unknown>[] {
  return rows.map(mapRow);
}
