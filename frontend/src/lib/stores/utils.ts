/**
 * @param values Any array
 * @returns Values with duplicates removed
 */
export function removeDuplicates<T>(values: T[]): T[] {
  return [...new Set(values)];
}
