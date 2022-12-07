import { MISSING_VALUE } from "..";

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
 
/**
 * A coordinate in a space defined by SignedNormalizedDistances that may be missing
 */
export type SignedNormalizedCoordinate = SignedNormalizedDistance | typeof MISSING_VALUE;
 
/**
 * A vector of (possibly missing) coordinates in a space defined by SignedNormalizedDistances
 */
export  type SignedNormalizedPosition = SignedNormalizedCoordinate[];
 

 // function assertSignedNormalized(value: SignedNormalizedCoordinate): value is SignedNormalizedDistance {
 //     if (value === MISSING_VALUE || 
 //         (value < -NORMALIZED_DISTANCE_EXTENT / 2 || value > NORMALIZED_DISTANCE_EXTENT / 2))
 //         throw new Error(`${value} is not a SignedNormalizedDistance!`);
 //     return true;
 // }