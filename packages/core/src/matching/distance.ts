import type { Coordinate, NormalizedDistance } from './distance.type';

/**
 * Defines the range of the normalized value space used in matching, i.e. the length of the space’s dimensions.
 */
const EXTENT = 1;

/**
 * Contains the minimum, maximum and neutral values as well as the extent length for the normalized distance space.
 */
export const COORDINATE = {
  /** The extent length of the distance */
  Extent: EXTENT,
  /** The minimum possible distance */
  Min: 0 - EXTENT / 2,
  /** The maximum possible distance */
  Max: 0 + EXTENT / 2,
  /** The center of the distance extent */
  Neutral: 0
};

/**
 * A utility that will normalize the given value within the given range.
 * @param value The numeric value
 * @param min The minimum of the value range
 * @param max The maximum of the value range
 */
export function normalizeCoordinate({ value, min, max }: { value: number; min: number; max: number }): Coordinate {
  if (min > max || min == max) throw new Error('Range is invalid');
  if (value < min || value > max) throw new Error('Value is out of range');
  return COORDINATE.Min + COORDINATE.Extent * ((value - min) / (max - min));
}

/**
 * Assert that `value` is a `Coordinate` within the correct range.
 * @param value The number to test
 * @returns True if the value is a `Coordinate`
 * @throws If the value is not a `Coordinate`
 */
export function assertCoordinate(value: Coordinate): value is Coordinate {
  if (isNaN(value) || value < COORDINATE.Min || value > COORDINATE.Max)
    throw new Error(`${value} is not a Coordinate!`);
  return true;
}

/**
 * Assert that `value` is a `NormalizedDistance` within the correct range.
 * @param value The number to test
 * @returns True if the value is a `NormalizedDistance`
 * @throws If the value is not a `NormalizedDistance`
 */
export function assertDistance(value: NormalizedDistance): value is NormalizedDistance {
  if (isNaN(value) || value < 0 || value > COORDINATE.Extent) throw new Error(`${value} is not a NormalizedDistance!`);
  return true;
}
