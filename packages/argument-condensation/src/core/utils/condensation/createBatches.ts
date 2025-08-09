/**
 * Create batches from an array
 *
 * @param array - The array to create batches from
 * @param batchSize - The size of each batch
 * @returns An array of batches
 */
export function createBatches<TElement>({
  array,
  batchSize
}: {
  array: Array<TElement>;
  batchSize: number;
}): Array<Array<TElement>> {
  const batches: Array<Array<TElement>> = [];
  for (let i = 0; i < array.length; i += batchSize) {
    batches.push(array.slice(i, i + batchSize));
  }
  return batches;
}
