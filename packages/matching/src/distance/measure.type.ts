import type { NormalizedDistance } from '@openvaa/core';
import type { MissingValueImputationOptions } from '../missingValue';
import type { DistanceMetric } from './metric';

/**
 * Options passed to measureDistance.
 */
export type DistanceMeasurementOptions = {
  /** The distance metric to use. */
  metric: DistanceMetric;
  /** Options passed to imputeMissingValue */
  missingValueOptions: MissingValueImputationOptions;
  /** Whether to allow misssing reference values. If `true` and dimensions with missing coordinates in either `Position` are ignored. Otherwise, an error will be thrown in such cases. */
  allowMissingReference?: boolean;
};

/**
 * A return type for the measureDistance function that includes both the global and subspace distances. The latter are used for SubMatches.
 */
export type GlobalAndSubspaceDistances = {
  global: NormalizedDistance;
  subspaces: Array<NormalizedDistance>;
};
