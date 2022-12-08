/**
 * Defines the length of the normalized value space.
 */
export const NORMALIZED_DISTANCE_EXTENT = 1;

/**
 * Should be a number [0, 1 (NORMALIZED_DISTANCE_EXTENT)], but we cannot easily enforce this.
 */
export type UnsignedNormalizedDistance = number;
 
/**
 * Should be a number [-0.5, 0.5 (NORMALIZED_DISTANCE_EXTENT / 2)], but we cannot easily enforce this.
 */
export type SignedNormalizedDistance = number;
 
// function assertSignedNormalized(value: MatchingSpaceCoordinate): value is SignedNormalizedDistance {
//     if (value === MISSING_VALUE || 
//         (value < -NORMALIZED_DISTANCE_EXTENT / 2 || value > NORMALIZED_DISTANCE_EXTENT / 2))
//         throw new Error(`${value} is not a SignedNormalizedDistance!`);
//     return true;
// }