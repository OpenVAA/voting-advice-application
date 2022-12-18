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

/**
 * Assert that `value` is a `SignedNormalizedDistance` within the correct range.
 * 
 * @param value The number to test
 * @returns True if the value is a `SignedNormalizedDistance`
 * @throws If the value is not a `SignedNormalizedDistance`
 */
export function assertSignedNormalized(
    value: SignedNormalizedDistance
): value is SignedNormalizedDistance {
    if (isNaN(value) || value < -NORMALIZED_DISTANCE_EXTENT / 2 || value > NORMALIZED_DISTANCE_EXTENT / 2)
        throw new Error(`${value} is not a SignedNormalizedDistance!`);
    return true;
}

/**
 * Assert that `value` is a `UnsignedNormalizedDistance` within the correct range.
 * 
 * @param value The number to test
 * @returns True if the value is a `UnsignedNormalizedDistance`
 * @throws If the value is not a `UnsignedNormalizedDistance`
 */
export function assertUnsignedNormalized(
    value: UnsignedNormalizedDistance
): value is UnsignedNormalizedDistance {
    if (isNaN(value) || value < 0 || value > NORMALIZED_DISTANCE_EXTENT)
        throw new Error(`${value} is not a UnsignedNormalizedDistance!`);
    return true;
}
