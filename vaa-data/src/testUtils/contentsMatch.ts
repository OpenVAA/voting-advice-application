/**
 * Returns true if the `Array`s contain the same elements regardless of order.
 */
export function contentsMatch(a: Array<unknown>, b: Array<unknown>): boolean {
  b = [...b].sort();
  return [...a].sort().every((v, i) => v === b[i]);
}
