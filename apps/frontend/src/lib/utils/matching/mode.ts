/**
 * Calculates the mode of a list of values.
 */
export function mode<TValue>(values: Array<TValue>): TValue {
  if (values.length === 0) throw new Error('Cannot calculate mode of an empty list.');
  const counts = new Map<TValue, number>();
  for (const value of values) {
    const current = counts.get(value) || 0;
    // Early stopping when anb absolute majority is reached
    if (current >= values.length / 2) return value;
    counts.set(value, current + 1);
  }
  let max: TValue;
  let maxCount = 0;
  for (const [value, count] of counts.entries()) {
    if (count > maxCount) {
      max = value;
      maxCount = count;
    }
  }
  return max!;
}
