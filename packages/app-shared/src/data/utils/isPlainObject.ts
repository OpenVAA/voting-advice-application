/**
 * A utility function to check if a value is a plain object.
 */
export function isPlainObject(value: unknown): value is Record<string, unknown> {
  return (
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value) &&
    !Object.keys(value).some((k) => typeof k !== 'string')
  );
}
