/**
 * Type guards for values read from a request body, a database answer or stored metadata.
 *
 * Pure functions with no Deno imports, no URL imports and no reference to the Deno global, so the module can be imported by both the Edge Functions and vitest.
 *
 * SHARED. The module lives in `functions/_shared/`, the directory for modules more than one function uses. Each function imports it by relative path (`../_shared/guards.ts`).
 */

/** A uuid in its canonical textual form, of any case. */
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Whether a value is a uuid string: 32 hexadecimal digits in the groups 8-4-4-4-12, of any case.
 *
 * @param value - The value, of any type
 * @returns True only for a string of exactly that shape
 */
export function isUuid(value: unknown): value is string {
  return typeof value === 'string' && UUID_PATTERN.test(value);
}

/**
 * Whether a value is an object that is neither null nor an array.
 *
 * @param value - The value, of any type
 * @returns True for any non-null, non-array object
 */
export function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
