/**
 * Used when an explicitly missing value is needed.
 */
export const MISSING_VALUE = undefined;

/**
 * Checks if the value is explicitly missing.
 * NB. Use the `isEmptyValue` for a more relaxed check for empty or missing values.
 */
export function isMissingValue(value: unknown): value is typeof MISSING_VALUE {
  return value === MISSING_VALUE;
}

/**
 * Checks if the value is empty across different data types. Note that this is different from strictly checking for `MISSING_VALUE`.
 * NB. Will return `true` for strings containing only spaces, empty arrays and objects containing only empty properties.
 */
export function isEmptyValue(value: unknown | typeof MISSING_VALUE): boolean {
  if (value == null) return true;
  if (value instanceof Date) return isNaN(value.getTime());
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === 'object')
    return Object.keys(value).length === 0 || Object.values(value).every((v) => isEmptyValue(v));
  if (typeof value === 'string') return value.trim() === '';
  return false;
}
