import { COLUMN_MAP, PROPERTY_MAP } from '@openvaa/supabase-types';

/**
 * Map a snake_case database row to a camelCase domain object.
 * Columns in COLUMN_MAP are renamed; unmapped columns pass through unchanged.
 *
 * Note: RLS is responsible for preventing sensitive data leakage, not the mapper.
 */
export function mapRow<TRow extends Record<string, unknown>>(row: TRow): Record<string, unknown> {
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
 *
 * NB. This function has NO production call site — the write path does not use it, and that is not an oversight to be fixed by wiring it in. `COLUMN_MAP` covers the `DataObject` content columns only, so the one write that would want it, `SupabaseAdminWriter.insertJobResult`, cannot: the `admin_jobs` operational columns (`job_id`, `job_type`, `end_status`, `start_time`, `end_time`) are absent from the map, so `mapRowToDb` would leave those keys camelCase and the insert would fail.
 * That writer therefore spells its snake_case keys out, deliberately. Before using this function for a new write, check that every property you pass is present in `COLUMN_MAP`; a property that is not passes through unchanged and silently reaches PostgREST under the wrong name.
 */
export function mapRowToDb<TObj extends Record<string, unknown>>(obj: TObj): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    const mappedKey = (PROPERTY_MAP as Record<string, string>)[key] ?? key;
    result[mappedKey] = value;
  }
  return result;
}

/**
 * Map an array of snake_case database rows to camelCase domain objects.
 *
 * NB. Also has no production call site: read mapping goes through `toDataObject`, which localizes first and then calls `mapRow` per row.
 */
export function mapRows<TRow extends Record<string, unknown>>(rows: Array<TRow>): Array<Record<string, unknown>> {
  return rows.map(mapRow);
}
