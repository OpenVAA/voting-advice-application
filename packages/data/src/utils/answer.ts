import type { Answer, MissingValue } from '../internal';

/**
 * Checks if the answer value is empty across different data types. Note that this is different from strictly checking for `MISSING_VALUE`.
 * NB. See `isEmptyValue` for notes.
 */
export function isEmptyAnswer(answer: Answer): boolean {
  return isEmptyValue(answer.value);
}

/**
 * Checks if the value is empty across different data types. Note that this is different from strictly checking for `MISSING_VALUE`.
 * NB. Will return `true` for strings containing only spaces, empty arrays and objects containing only empty properties.
 */
export function isEmptyValue(value: unknown | MissingValue): boolean {
  if (value == null) return true;
  if (value instanceof Date) return isNaN(value.getTime());
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === 'object')
    return Object.keys(value).length === 0 || Object.values(value).every((v) => isEmptyValue(v));
  if (typeof value === 'string') return value.trim() === '';
  return false;
}
