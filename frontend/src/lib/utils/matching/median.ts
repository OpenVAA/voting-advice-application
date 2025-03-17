/**
 * Calculates the median of a list of numbers.
 * @param - values - The list of numbers
 * @param returnFirstWhenTied - If true, return the first encountered value when the list has an even number of elements. If falsish, the average of the two middle values is returned.
 * Orig. author jdmdevdotnet: https://stackoverflow.com/questions/45309447/calculating-median-javascript
 * Modified to support returnFirstWhenTied
 */
export function median(
  values: Array<number>,
  {
    returnFirstWhenTied
  }: {
    returnFirstWhenTied?: boolean;
  } = {}
): number {
  if (values.length === 0) throw new Error('Cannot calculate median of an empty list.');
  const sorted = [...values].sort((a, b) => a - b);
  const half = Math.floor(sorted.length / 2);
  if (values.length % 2) return sorted[half];
  // Tie breaking
  const tied = [sorted[half - 1], sorted[half]];
  // Either return the first occuring tied median value in the original array
  if (returnFirstWhenTied) {
    for (const v of values) {
      if (tied.includes(v)) return v;
    }
  }
  // By default, return the average of the two middle values
  return (tied[0] + tied[1]) / 2;
}
