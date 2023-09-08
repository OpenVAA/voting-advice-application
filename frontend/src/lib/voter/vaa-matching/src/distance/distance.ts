/**
 * Defines the length of the normalized value space.
 */
export const NORMALIZED_DISTANCE_EXTENT = 1;

/**
 * Should be a number [-0.5, 0.5 (NORMALIZED_DISTANCE_EXTENT / 2)], but we cannot easily enforce this.
 */
export type SignedNormalizedDistance = number;

/**
 * Should be a number [0, 1 (NORMALIZED_DISTANCE_EXTENT)], but we cannot easily enforce this.
 */
export type UnsignedNormalizedDistance = number;