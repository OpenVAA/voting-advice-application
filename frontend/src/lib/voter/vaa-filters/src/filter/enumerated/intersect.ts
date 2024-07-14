/**
 * Check whether two arrays have any elements in common.
 * @param a Array of values.
 * @param b Array of values.
 * @returns true if one or more elements are in common.
 */

export function intersect(a: Array<unknown>, b: Array<unknown>): boolean {
  return a.some((v) => b.includes(v));
}
