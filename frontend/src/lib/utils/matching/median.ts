import {error} from '@sveltejs/kit';

/**
 * Calculates the median of a list of numbers.
 * Orig. author jdmdevdotnet: https://stackoverflow.com/questions/45309447/calculating-median-javascript
 */

export function median(values: number[]) {
  if (values.length === 0) error(500, 'Cannot calculate median of an empty list.');
  values = [...values].sort((a, b) => a - b);
  const half = Math.floor(values.length / 2);
  return values.length % 2 ? values[half] : (values[half - 1] + values[half]) / 2;
}
