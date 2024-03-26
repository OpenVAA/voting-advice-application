import {
  NORMALIZED_DISTANCE_EXTENT,
  type SignedNormalizedDistance,
  type UnsignedNormalizedDistance
} from './distance';

/**
 * Available distance measurement metrics
 */
export enum DistanceMetric {
  /** Sum of the distances in each dimension */
  Manhattan,
  /**
   *  Sum of the products of the distances in each dimension. Note that
   *  this method assumes a neutral stance semantically meaning being
   *  unsure about the statement. Thus, if either of the positions being
   *  compared has a neutral stance on an issue, agreement for that will
   *  be 50%.
   *
   *  Furthermore, the maximum available agreement will be less than
   *  100% in all cases where the reference entity has any other answers
   *  than those at the extremes (i.e. 1 or 5 on a 5-pt Likert scale).
   *
   *  More confusingly, this means that if both the voter's and the
   *  candidate's answer to a statement is, e.g., 2/5, their agreement
   *  will be 25%, not 100% even though their answer are identical.
   */
  Directional
  // MendezHybrid, // This should be easy to implement, just take a 50/50
  // average of Manhattan and Directional
  // Euclidean,
  // Mahalonobis
}

/**
 * Calculate the Manhattan distance between two distances.
 *
 * @param a Signed distance
 * @param b Signed distance
 * @returns Unsigned distance
 */
export function manhattanDistance(
  a: SignedNormalizedDistance,
  b: SignedNormalizedDistance
): UnsignedNormalizedDistance {
  return Math.abs(a - b);
}

/**
 * Calculate the directional distance between two positions.
 *
 * @param a Signed distance
 * @param b Signed distance
 * @returns Unsigned distance
 */
export function directionalDistance(
  a: SignedNormalizedDistance,
  b: SignedNormalizedDistance
): UnsignedNormalizedDistance {
  return 0.5 * NORMALIZED_DISTANCE_EXTENT - (2 * a * b) / NORMALIZED_DISTANCE_EXTENT;
}
