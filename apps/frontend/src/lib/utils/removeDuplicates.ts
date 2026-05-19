/**
 * Remove any duplicate items from an array.
 */
export function removeDuplicates<TItem>(items: Array<TItem>): Array<TItem> {
  return [...new Set(items)];
}
