/**
 * Create batches from an array
 */
export function createBatches<TElement>(array: Array<TElement>, batchSize: number): Array<Array<TElement>> {
    const batches: Array<Array<TElement>> = [];
    for (let i = 0; i < array.length; i += batchSize) {
    batches.push(array.slice(i, i + batchSize));
  }
  return batches;
}
