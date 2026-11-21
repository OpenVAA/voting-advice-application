/**
 * The canonical textual form of a uuid, the one test of it for the frontend.
 *
 * Tested in `uuid.test.ts`.
 */

/**
 * The canonical textual form of a uuid: five groups of 8, 4, 4, 4 and 12 hexadecimal digits joined by hyphens, in lower case, and nothing before or after. It is the form the database renders every id in, so an id that passes is compared exactly with the ids a query reads. An id with an upper-case digit does not pass; a caller that accepts one lower-cases it first.
 */
export const CANONICAL_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

/**
 * Whether a value is a uuid in its canonical, lower-case textual form.
 * @param value - The value, of any type.
 * @returns `true` only for a string matching {@link CANONICAL_UUID}.
 */
export function isCanonicalUuid(value: unknown): value is string {
  return typeof value === 'string' && CANONICAL_UUID.test(value);
}
