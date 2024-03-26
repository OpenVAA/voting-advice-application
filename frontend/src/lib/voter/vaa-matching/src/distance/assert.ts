import {
  NORMALIZED_DISTANCE_EXTENT,
  type SignedNormalizedDistance,
  type UnsignedNormalizedDistance
} from './distance';

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
  if (
    isNaN(value) ||
    value < -NORMALIZED_DISTANCE_EXTENT / 2 ||
    value > NORMALIZED_DISTANCE_EXTENT / 2
  )
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
