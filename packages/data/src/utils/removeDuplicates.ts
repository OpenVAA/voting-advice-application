/**
 * Removes duplicates from an `Array`.
 * @param items - The list of items to remove duplicates from
 * @returns The list of unique items
 */
export function removeDuplicates<TItem>(items: Array<TItem>): Array<TItem> {
  const seen = new Set<TItem>();
  return items.filter((item) => {
    if (seen.has(item)) return false;
    seen.add(item);
    return true;
  });
}
