import type {SignedNormalizedDistance, UnsignedNormalizedDistance} from '../core/distances';
import {NORMALIZED_DISTANCE_EXTENT} from '../core/distances';
import {MISSING_VALUE} from '../core/matchableValue';
import type {MatchingSpace} from '../core/matchingSpace';
import type {MatchingSpacePosition} from '../core/matchingSpacePosition';
import {imputeMissingValues} from './imputeMissingValues';
import type {MissingValueImputationOptions} from './imputeMissingValues';

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
 * Options passed to measureDistance.
 */
export interface DistanceMeasurementOptions {
  /** The distance metric to use. */
  metric: DistanceMetric;
  /** Options passed to imputeMissingValues */
  missingValueOptions: MissingValueImputationOptions;
}

export type GlobalAndSubspaceDistances = {
  global: UnsignedNormalizedDistance;
  subspaces: UnsignedNormalizedDistance[];
};

export function measureDistance(
  a: MatchingSpacePosition,
  b: MatchingSpacePosition,
  options: DistanceMeasurementOptions
): UnsignedNormalizedDistance;

export function measureDistance(
  a: MatchingSpacePosition,
  b: MatchingSpacePosition,
  options: DistanceMeasurementOptions,
  subspaces: MatchingSpace[]
): GlobalAndSubspaceDistances;

/**
 * Measure the distance between to positions in a `MatchingSpace`.
 *
 * @param a The reference position to measure against (cannot be missing)
 * @param b The other position
 * @param options See the interface `DistanceMeasurementOptions`
 * @param subspaces A list of subspaces in which distances are also measured.
 * Used to compute, e.g., matches within question categories, in which case
 * pass a llist of `MatchingSpaces`, where the weights of irrelevant questions
 * are zero. It's a bit clunky to deal with subspaces here and not on a higher
 * level, but this way we can avoid duplicate missing value imputations and
 * distance calculations.
 * @returns An unsigned normalized distance, e.g. [0, 1] (the range is defined
 * by `NORMALIZED_DISTANCE_EXTENT`) or a list of such distances if `subspaces`
 * is provided.
 */
export function measureDistance(
  a: MatchingSpacePosition,
  b: MatchingSpacePosition,
  options: DistanceMeasurementOptions,
  subspaces?: MatchingSpace[]
): UnsignedNormalizedDistance | GlobalAndSubspaceDistances {
  if (a.dimensions === 0) throw new Error("a doesn't have any elements!");
  if (a.dimensions !== b.dimensions) throw new Error('a and b have different number of elements!');
  const space = a.space;
  if (space && space.dimensions !== a.dimensions)
    throw new Error('a and space have different number of dimensions!');
  if (subspaces) {
    for (const subspace of subspaces) {
      if (subspace.dimensions !== a.dimensions)
        throw new Error('a and at least one subspace have different number of dimensions!');
    }
  }
  const sums = {
    global: 0,
    subspaces: subspaces == null ? [] : subspaces.map(() => 0)
  };
  for (let i = 0; i < a.dimensions; i++) {
    // We might have to alter these values, if there are missing ones, hence the vars
    let valA = a.coordinates[i],
      valB = b.coordinates[i];
    // First, handle missing values
    if (valA === MISSING_VALUE)
      throw new Error('The first position cannot contain missing values!');
    if (valB === MISSING_VALUE)
      [valA, valB] = imputeMissingValues(valA, options.missingValueOptions);
    // Calculate distance
    let dist: number;
    switch (options.metric) {
      case DistanceMetric.Manhattan:
        dist = manhattanDistance(valA, valB);
        break;
      case DistanceMetric.Directional:
        dist = directionalDistance(valA, valB);
        break;
      default:
        throw new Error(`Unknown distance metric: ${options.metric}`);
    }
    // Apply to totals
    sums.global += dist * (space ? space.weights[i] : 1);
    if (subspaces) {
      subspaces.forEach((subspace, k) => (sums.subspaces[k] += dist * subspace.weights[i]));
    }
  }
  // Normalize total distances
  sums.global /= space ? space.maxDistance : a.dimensions;
  if (subspaces) {
    subspaces.forEach((subspace, k) => (sums.subspaces[k] /= subspace.maxDistance));
  }
  return subspaces == null ? sums.global : sums;
}
