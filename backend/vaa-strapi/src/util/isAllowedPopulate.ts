/**
 * Checks a `populate` object recursively for fordidden items.
 *
 * @param target - The object to be checked.
 * @param relations - An array of the names of forbidden relations, e.g. `['user']`.
 * @param allowStar - Whether to allow the '*' wildcard relation. Default is `false`.
 * @returns `true` if the object contains none of the fordidden relations, `false` otherwise.
 */
export function isAllowedPopulate(target: unknown, relations: ReadonlyArray<string> = [], allowStar = false): boolean {
  const effectiveRelations = allowStar ? relations : [...relations, '*'];
  if (relations.length === 0) return true;
  // Nullish is okay
  if (target == null) return true;
  // Recursively check objects
  if (typeof target === 'object') {
    // Check each item in an array separately
    if (Array.isArray(target)) return target.every((item) => isAllowedPopulate(item, relations, allowStar));
    // Disallow any non-plain objects
    if (target.constructor !== Object) return false;
    // Check each key and value recursively
    return Object.entries(target).every(
      ([key, value]) => !effectiveRelations.includes(key) && isAllowedPopulate(value, relations, allowStar)
    );
  }
  // Only boolean and string scalar values are allowed
  if (typeof target === 'string') return !effectiveRelations.includes(target);
  if (typeof target === 'boolean') return true;
  return false;
}
