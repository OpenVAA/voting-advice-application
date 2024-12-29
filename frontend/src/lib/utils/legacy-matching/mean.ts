import { error } from '@sveltejs/kit';

/**
 * Calculates the mean of a list of numbers.
 */

export function mean(values: Array<number>) {
  if (values.length === 0) error(500, 'Cannot calculate mean of an empty list.');
  return values.reduce((a, b) => a + b, 0) / values.length;
}
