import { SignedNormalizedDistance } from './distance.type';

/**
 * Defines the length of the normalized value space used in matching.
 */
export const NORMALIZED_DISTANCE_EXTENT = 1;

/**
 * A utility that will normalize the given value within the given range.
 * @param value The numeric value
 * @param min The minimum of the value range
 * @param max The maximum of the value range
 */
export function normalizeDistance({value, min, max}: {value: number, min: number, max: number}): SignedNormalizedDistance {
  if (min > max || min == max) throw new Error('Range is invalid');
  if (value < min || value > max) throw new Error('Value is out of range');
  return NORMALIZED_DISTANCE_EXTENT * ((value - min) / (max - min) - 0.5);
}