import {
  NORMALIZED_DISTANCE_EXTENT,
  assertSignedNormalized,
  type SignedNormalizedDistance
} from '../distance';
import { MissingValueBias } from './bias';
import { MissingValueDistanceMethod } from './distanceMethod';

/**
 * Options passed to imputeMissingValues
 */
export interface MissingValueImputationOptions {
  /** The method used for imputing missing values. */
  missingValueMethod: MissingValueDistanceMethod;
  /** The direction of the bias used in imputing missing values,
   *  when the reference value is neutral. */
  missingValueBias?: MissingValueBias;
}

/**
 * Impute a value for a missing one. Note that also the referenceValue may
 * be affected, so both are returned.
 *
 * @param referenceValue The value used as reference, e.g. the voter's answer
 * @param method  The imputation method
 * @param bias The direction of the bias used in imputing missing values,
 * when the reference value is neutral
 * @returns Tuple of [imputed value for the reference, imputed value for
 * the missing one]. Note that the imputed reference value can only change
 * when using the `AbsoluteMaximum` method.
 */
export function imputeMissingValues(
  referenceValue: SignedNormalizedDistance,
  options: MissingValueImputationOptions
): [SignedNormalizedDistance, SignedNormalizedDistance] {
  // To be sure
  assertSignedNormalized(referenceValue);
  // For convenience
  const maxAbsDistance = NORMALIZED_DISTANCE_EXTENT / 2;
  const bias = options.missingValueBias ?? MissingValueBias.Positive;
  // This will hold the imputed value for the missing one
  let missingValue: SignedNormalizedDistance;
  switch (options.missingValueMethod) {
    case MissingValueDistanceMethod.Neutral:
      // Treat value b as neutral
      missingValue = 0;
      break;
    case MissingValueDistanceMethod.RelativeMaximum:
      // Treat value b as the opposite extreme of value a, i.e. on a 5-point scale
      // b is 5 if a is 1 or 2; 1 if a is 4 or 5; for 3, bias defines the direction
      if (referenceValue == 0)
        missingValue = bias === MissingValueBias.Positive ? maxAbsDistance : -maxAbsDistance;
      else missingValue = referenceValue < 0 ? maxAbsDistance : -maxAbsDistance;
      break;
    case MissingValueDistanceMethod.AbsoluteMaximum:
      // Treat the values as being at the opposite ends of the range
      // Note that the bias behaviour for valA is reversed, its direction is thought
      // to affect valB
      if (referenceValue == 0)
        referenceValue = bias === MissingValueBias.Positive ? -maxAbsDistance : maxAbsDistance;
      else referenceValue = referenceValue < 0 ? -maxAbsDistance : maxAbsDistance;
      missingValue = -referenceValue;
      break;
    default:
      throw new Error(`Unknown missing value method: ${options.missingValueMethod}`);
  }
  return [referenceValue, missingValue];
}
