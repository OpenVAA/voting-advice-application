import type { MISSING_VALUE } from './missingValue';

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
