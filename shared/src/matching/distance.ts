/**
 * Defines the length of the normalized value space used in matching.
 */
export const NORMALIZED_DISTANCE_EXTENT = 1;

/**
 * Used when an explicitly missing value is needed.
 */
export const MISSING_VALUE = undefined;

/**
 * A coordinate in the matching space.
 */
export type MatchingSpaceCoordinate = SignedNormalizedDistance | typeof MISSING_VALUE;

/**
 * Should be a number [-0.5, 0.5 (NORMALIZED_DISTANCE_EXTENT / 2)], but we cannot easily enforce this.
 */
export type SignedNormalizedDistance = number;

/**
 * Should be a number [0, 1 (NORMALIZED_DISTANCE_EXTENT)], but we cannot easily enforce this.
 */
export type UnsignedNormalizedDistance = number;