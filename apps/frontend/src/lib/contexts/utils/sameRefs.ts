/**
 * Shallow reference equality for two arrays: same length and the same element at every index.
 */
export function sameRefs<TItem>(a: ReadonlyArray<TItem>, b: ReadonlyArray<TItem>): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
  return true;
}
