import type {UnsignedNormalizedDistance} from 'vaa-shared';
import type {MissingValueImputationOptions} from '../missingValue';
import type {DistanceMetric} from './metric';

/**
 * Options passed to measureDistance.
 */
export interface DistanceMeasurementOptions {
  /** The distance metric to use. */
  metric: DistanceMetric;
  /** Options passed to imputeMissingValues */
  missingValueOptions: MissingValueImputationOptions;
}

/**
 * A return type for the measureDistance function that includes both
 * the global and subspace distances. The latter are used for SubMatches.
 */
export type GlobalAndSubspaceDistances = {
  global: UnsignedNormalizedDistance;
  subspaces: UnsignedNormalizedDistance[];
};
