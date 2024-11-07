import { imputeMissingPosition } from '../missingValue';
import { MatchingSpace, type Position } from '../space';
import type { NormalizedDistance } from '@openvaa/core';
import type { DistanceMeasurementOptions, GlobalAndSubspaceDistances } from './measure.type';

export function measureDistance(params: {
  reference: Position;
  target: Position;
  options: DistanceMeasurementOptions;
}): NormalizedDistance;

export function measureDistance(params: {
  reference: Position;
  target: Position;
  options: DistanceMeasurementOptions;
  subspaces: ReadonlyArray<MatchingSpace>;
}): GlobalAndSubspaceDistances;

/**
 * Measure the distance between to positions in a `MatchingSpace` and possible subspaces. The process follows these steps:
 * 1. Impute values for missing values if necessary.
 * 2. Measure the distances using the provided distance metric in the global space and all subspaces.
 * NB. The reference position `reference` is treated differently from `target` when dealing with missing values. Thus, switching them will in general yield a different result.
 * @param reference The reference position to measure against.
 * @param target The other position
 * @param options See the `DistanceMeasurementOptions` type
 * @param subspaces A list of subspaces in which distances are also measured. Used to compute, e.g., matches within question categories, in which case pass a llist of `MatchingSpaces`, where the weights of irrelevant questions are zero. It's a bit clunky to deal with subspaces here and not on a higher level, but this way we can avoid duplicate missing value imputations and distance calculations.
 * @returns A normalized distance, e.g. [0, 1] (the range is defined by `[0, COORDINATE.Extent]`) or both a global distance and a list of distances in `subspaces` if they are provided.
 */
export function measureDistance({
  reference,
  target,
  options,
  subspaces
}: {
  reference: Position;
  target: Position;
  options: DistanceMeasurementOptions;
  subspaces?: ReadonlyArray<MatchingSpace>;
}): NormalizedDistance | GlobalAndSubspaceDistances {
  // Check that all relevant spaces are compatible
  const space = reference.space;
  if (space.shape.length === 0) throw new Error('The matching space doesn’t have any dimensions.');
  if (space !== target.space) throw new Error('a and b are in different spaces.');
  if (subspaces) {
    for (const subspace of subspaces) {
      if (!space.isCompatible(subspace))
        throw new Error('a and at least one subspace have different number of dimensions.');
    }
  }
  // Impute missing values for `target`
  const imputed = imputeMissingPosition({
    reference,
    target,
    options: options.missingValueOptions
  });
  // Calculate global distance
  const global = options.metric({
    a: reference,
    b: imputed,
    allowMissing: options.allowMissingReference
  });
  if (!subspaces) return global;
  return {
    global,
    subspaces: subspaces.map((s) =>
      options.metric({
        a: reference,
        b: imputed,
        space: s,
        allowMissing: options.allowMissingReference
      })
    )
  };
}
