import type { HasId } from '@openvaa/core';

/**
 * Creates a hash string from objects with IDs for comparing changes.
 * Useful as a difference checker for `parsimoniusDerived` stores to avoid unnecessary updates.
 * @param objects - Single object or array of objects with IDs
 * @returns A sorted, comma-separated string of IDs
 */
export function hashIds(objects: HasId | Array<HasId> | undefined): string {
  if (!objects) return '';
  return [objects]
    .flat()
    .map((o) => o.id)
    .toSorted()
    .join(',');
}
