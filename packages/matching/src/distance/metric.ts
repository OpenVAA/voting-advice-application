import { COORDINATE, type Coordinate, isMissingValue, type NormalizedDistance } from '@openvaa/core';
import { flatten, type MatchingSpace, type Position } from '../space';

/**
 * References:
 * - Fernando Mendez (2017) Modeling proximity and directional decisional logic: What can we learn from applying statistical learning techniques to VAA-generated data?, Journal of Elections, Public Opinion and Parties, 27:1, 31-55, DOI: [10.1080/17457289.2016.1269113](https://doi.org/10.1080/17457289.2016.1269113).
 */

/**
 * Available distance measurement metrics. The  values contain both a function for measuring the distance using the metric as well as one for finding the maximum available distance for the metric.
 */
export const DISTANCE_METRIC: Record<string, MetricFunction> = {
  /**
   * Sum of the distances in each dimension. The most commonly used metric in VAAs.
   */
  Manhattan: manhattanDistance,
  /**
   * Sum of the products of the distances in each dimension. Note that this method assumes that a neutral stance means semantically being unsure about the statement. Thus, if either of the positions being compared has a neutral stance on an issue, agreement for that will be 50%.
   * Furthermore, the maximum available agreement will be less than 100% in all cases where the reference entity has any other answers than those at the extremes (i.e. 1 or 5 on a 5-pt Likert scale).
   * More confusingly, this means that if both the voter's and the candidate's answer to a statement is, e.g., 2/5, their agreement will be 25%, not 100% even though their answer are identical.
   * See Mendez (2017, p. 51).
   */
  Directional: directionalDistance,
  /**
   * An Euclidean distance is the square root of the sum of the squares of the distances in each dimension.
   */
  Euclidean: euclideanDistance
  // MendezHybrid, // This should be easy to implement, just take a 50/50 average of Manhattan and Directional
  // Mahalonobis
};

/**
 * Any available distance metric function.
 */
export type DistanceMetric = (typeof DISTANCE_METRIC)[keyof typeof DISTANCE_METRIC];

/**
 * The general shape for `DistanceMetric` functions.
 */
type MetricFunction = (params: {
  a: Position;
  b: Position;
  space?: MatchingSpace;
  allowMissing?: boolean;
}) => NormalizedDistance;

/**
 * Calculate the Manhattan distance between two `Position`s. See `distance` for more details.
 * @param a The first `Position`
 * @param b The second `Position`
 * @param space An optional separate `MatchingSpace` in which to measure the distance. @default a.space
 * @param allowMissing If `true` and dimensions with missing coordinates in either `Position` are ignored. Otherwise, an error will be thrown in such cases. @default false
 * @returns A normalized distance
 */
export function manhattanDistance({
  a,
  b,
  space,
  allowMissing
}: {
  a: Position;
  b: Position;
  space?: MatchingSpace;
  allowMissing?: boolean;
}): NormalizedDistance {
  return distance({
    a,
    b,
    space,
    allowMissing,
    kernel: absoluteKernel,
    sum: basicSum,
    subdimWeight: basicDivision
  });
}

/**
 * Calculate the Directional distance between two `Position`s. See `distance` for more details.
 * @param a The first `Position`
 * @param b The second `Position`
 * @param space An optional separate `MatchingSpace` in which to measure the distance. @default a.space
 * @param allowMissing If `true` and dimensions with missing coordinates in either `Position` are ignored. Otherwise, an error will be thrown in such cases. @default false
 * @returns A normalized distance
 */
export function directionalDistance({
  a,
  b,
  space,
  allowMissing
}: {
  a: Position;
  b: Position;
  space?: MatchingSpace;
  allowMissing?: boolean;
}): NormalizedDistance {
  return distance({
    a,
    b,
    space,
    allowMissing,
    kernel: directionalKernel,
    sum: basicSum,
    subdimWeight: basicDivision
  });
}

/**
 * Calculate the Euclidean distance between two `Position`s. See `distance` for more details.
 * @param a The first `Position`
 * @param b The second `Position`
 * @param space An optional separate `MatchingSpace` in which to measure the distance. @default a.space
 * @param allowMissing If `true` and dimensions with missing coordinates in either `Position` are ignored. Otherwise, an error will be thrown in such cases. @default false
 * @returns A normalized distance
 */
export function euclideanDistance({
  a,
  b,
  space,
  allowMissing
}: {
  a: Position;
  b: Position;
  space?: MatchingSpace;
  allowMissing?: boolean;
}): NormalizedDistance {
  return distance({
    a,
    b,
    space,
    allowMissing,
    kernel: absoluteKernel,
    sum: euclideanSum,
    subdimWeight: euclideanSubdimWeight
  });
}

/**
 * A kernel that calculates the absolute the difference between two coordinates.
 */
export function absoluteKernel(a: Coordinate, b: Coordinate): number {
  return Math.abs(a - b);
}

/**
 * A kernel that calculates the directional difference between two coordinates. Adapted from the definition in (Mendez, 2021, p. 51).
 */
export function directionalKernel(a: Coordinate, b: Coordinate): number {
  // If the coordinates were bound at [min, max] the formula below would do:
  return 0.5 * COORDINATE.Extent - (2 * (a - COORDINATE.Neutral) * (b - COORDINATE.Neutral)) / COORDINATE.Extent;
}

/**
 * A basic sum of `values`.
 */
export function basicSum(values: Array<number>): number {
  return values.reduce((acc, val) => acc + val, 0);
}

/**
 * Calculates the Euclidean distance from an array of distances in dimensions
 */
export function euclideanSum(values: Array<number>): number {
  return Math.sqrt(values.reduce((acc, val) => acc + val ** 2, 0));
}

/**
 * A basic division 1 by `values`.
 */
export function basicDivision(numDimensions: number): number {
  return 1 / numDimensions;
}

/**
 * Calculates the weight for each subdimension for the Euclidean metric. We need to take the square root of the number of dimensions so that the (maximum) distances in spaces with shapes of, e.g., [1, 1] and [1, 3] are equal.
 */
export function euclideanSubdimWeight(numDimensions: number): number {
  return 1 / Math.sqrt(numDimensions);
}

/**
 * Used internally to construct different distance metrics.
 * NB. The spaces of both positions and that defined by the possible `space` parameter must be compatible.
 * NB. In the rare case that the all of the dimensions speficied for both `Position`s have zero length, a distance of 50% will be returned.
 * The process follows these steps:
 * 1. Flatten the possible subdimensions of both positions
 * 2. Create the effective weights for the flat dimensions from the weights of the `MatchingSpace` divided by `subdimWeight(numDimensions)` for possible subdimensions
 * 3. Compute the distances between `Position`s for each (flattened) dimension using `kernel(a, b)`
 * 4. Sum the distances for each dimension using `sum(distances)`
 * 5. Divided the sum by a similar sum computed over the maximum possible distances
 * @param a The first `Position`
 * @param b The second `Position`
 * @param kernel A kernel function to compute the distance between a pair of coordinates in one dimension.
 * @param sum A function to compute the sum of the dimensions’ distances.
 * @param subdimWeight A function to compute the relative weight of each subdimension. The function is passed the number of subdimensions and it should return the relative weight of one subdimension (the same is used for all). In most circumstances, this should be the inverse of `sum`.
 * @param space An optional separate `MatchingSpace` in which to measure the distance. @default a.space
 * @param allowMissing If `true` and dimensions with missing coordinates in either `Position` are ignored. Otherwise, an error will be thrown in such cases. @default false
 * @returns A normalized distance
 */
export function distance({
  a,
  b,
  kernel,
  sum,
  subdimWeight,
  space,
  allowMissing
}: {
  a: Position;
  b: Position;
  kernel: (a: Coordinate, b: Coordinate) => number;
  sum: (values: Array<number>) => number;
  subdimWeight: (numDimensions: number) => number;
  space?: MatchingSpace;
  allowMissing?: boolean;
}): NormalizedDistance {
  space ??= a.space;
  if (!space.isCompatible(b.space)) throw new Error('The shapes of the parameters are incompatible.');
  // TODO: In theory, we could precompute `aFlat` and `weights` for the entire run of the matching algorithm, but it seems it would not provide much of a speed benefit because the operations involved are simple
  // Flatten the positions for easier mapping
  const aFlat = flatten(a.coordinates);
  const bFlat = flatten(b.coordinates);
  // Compute weights
  const weights: Array<number> = space.shape
    .map((d, i) => {
      let weight = space.weights[i];
      if (d === 1) return weight;
      weight *= subdimWeight(d);
      return Array.from({ length: d }, () => weight);
    })
    .flat();
  if (weights.length !== aFlat.length || weights.length !== bFlat.length)
    throw new Error('The shapes of the parameters are incompatible after weigthing.');
  // Compute the distances and maximum weights for each dimension
  // Ignore dimensions with missing coordinates if `allowMissing` is false
  const distances = new Array<number>();
  const maxima = new Array<number>();
  for (let i = 0; i < weights.length; i++) {
    if (isMissingValue(aFlat[i]) || isMissingValue(bFlat[i])) {
      if (!allowMissing) throw new Error('Missing coordinates in Positions are not allowed.');
      continue;
    }
    distances.push(weights[i] * kernel(aFlat[i]!, bFlat[i]!));
    maxima.push(weights[i]);
  }
  const distance = sum(distances);
  const maximum = sum(maxima);
  return maximum === 0 ? COORDINATE.Extent / 2 : (COORDINATE.Extent * distance) / maximum;
}
