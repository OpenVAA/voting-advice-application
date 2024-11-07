import { Id, type Image, MISSING_VALUE, type MissingValue } from '../internal';

/**
 * Contains functions used for ensureing answer value types.
 */

/**
 * Assert that a `string` value is valid.
 * @returns The value as a string, or `MISSING_VALUE` if the value is not valid.
 */
export function ensureString(value: unknown): string | MissingValue {
  return typeof value === 'string' ? value : typeof value === 'number' ? `${value}` : MISSING_VALUE;
}

/**
 * Assert that an `Id` value is valid.
 * @returns The value, or `MISSING_VALUE` if the value is not valid.
 */
export function ensureId(value: unknown): Id | MissingValue {
  return typeof value === 'string' && !value.match(/^\s*$/) ? value : MISSING_VALUE;
}

/**
 * Assert that a `number` value is valid.
 * @returns The value as a number, or `MISSING_VALUE` if the value is not valid.
 */
export function ensureNumber(value: unknown): number | MissingValue {
  if (typeof value === 'string') value = Number(value);
  return typeof value === 'number' && !isNaN(value) ? value : MISSING_VALUE;
}

/**
 * Assert that a `boolean` value is valid.
 * @returns The value as a boolean, or `MISSING_VALUE` if the value is not valid.
 */
export function ensureBoolean(value: unknown): boolean | MissingValue {
  if (typeof value === 'number' && [0, 1].includes(value)) return value === 1;
  return typeof value === 'boolean' ? value : MISSING_VALUE;
}

/**
 * Assert that a date `string` or `Date` value is valid.
 * @returns The value as a Date, or `MISSING_VALUE` if the value is not valid.
 */
export function ensureDate(value: unknown): Date | MissingValue {
  if (typeof value === 'string' || typeof value === 'number') value = new Date(value);
  return value instanceof Date && !isNaN(value.getTime()) ? value : MISSING_VALUE;
}

/**
 * Assert that an `Array` value is an array of valid values.
 * @param ensureItem - A function that ensures the validity of each item in the array.
 * @returns The value as an array of valid values, or `MISSING_VALUE` if the value is not an array or any of the values is not valid.
 */
export function ensureArray<TValue>(
  value: unknown,
  ensureItem: (value: unknown) => TValue | MissingValue
): Array<TValue> | MissingValue {
  if (!Array.isArray(value)) return MISSING_VALUE;
  const values = new Array<TValue>(value.length);
  for (let i = 0; i < value.length; i++) {
    const item = ensureItem(value[i]);
    if (item === MISSING_VALUE) return MISSING_VALUE;
    values[i] = item;
  }
  return values;
}

/**
 * Assert that an `Image` value is valid.
 * @returns The value or `MISSING_VALUE` if the value is not valid.
 */
export function ensureImage(value: unknown): Image | MissingValue {
  return isImage(value) ? value : MISSING_VALUE;
}

function isImage(value: unknown): value is Image {
  return value != null && typeof value === 'object' && 'url' in value && typeof value.url === 'string';
}

/**
 * Assert that the literal values in the array are unique.
 */
export function ensureUnique<TValue extends string | number | boolean | null | undefined>(
  values: Array<TValue>
): Array<TValue> | MissingValue {
  const seen = new Set<TValue>();
  for (const v of values) {
    if (seen.has(v)) return MISSING_VALUE;
    seen.add(v);
  }
  return values;
}
