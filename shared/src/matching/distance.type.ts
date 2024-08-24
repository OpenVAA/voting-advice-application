import type { MISSING_VALUE } from './missingValue';

/**
 * A coordinate in the matching space.
 */
export type CoordinateOrMissing = Coordinate | typeof MISSING_VALUE;

/**
 * Should be a number [COORDINATE.Min, COORDINATE.Max], but we cannot easily enforce this.
 */
export type Coordinate = number;

/**
 * Should be a number [0, COORDINATE.Extent], but we cannot easily enforce this.
 */
export type NormalizedDistance = number;
