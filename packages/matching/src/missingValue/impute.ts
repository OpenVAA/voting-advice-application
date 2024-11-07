import { assertCoordinate, COORDINATE, type Coordinate, isMissingValue } from '@openvaa/core';
import { MISSING_VALUE_BIAS, type MissingValueBias } from './bias';
import { MISSING_VALUE_METHOD, type MissingValueMethod } from './missingValueMethod';
import { flatten, Position, reshape } from '../space';

/**
 * Options passed to imputeMissingValue
 */
export interface MissingValueImputationOptions {
  /** The method used for imputing missing values. */
  method: MissingValueMethod;
  /** The direction of the bias used in imputing missing values, when the reference value is neutral. */
  bias?: MissingValueBias;
}

/**
 * Impute a value for a missing one.
 * @param reference The value used as reference, e.g. the voter's answer
 * @param method The imputation method
 * @param bias The direction of the bias used in imputing missing values, when the reference value is neutral
 * @returns The imputed coordinate.
 */
export function imputeMissingValue({
  reference,
  options
}: {
  reference: Coordinate;
  options: MissingValueImputationOptions;
}): Coordinate {
  // To be sure
  assertCoordinate(reference);
  const bias = options.bias ?? MISSING_VALUE_BIAS.Positive;
  switch (options.method) {
    case MISSING_VALUE_METHOD.Neutral:
      return COORDINATE.Neutral;
    case MISSING_VALUE_METHOD.RelativeMaximum:
      // Treat value b as the opposite extreme of value a, i.e. on a 5-point scale b is 5 if a is 1 or 2; 1 if a is 4 or 5; for 3, bias defines the direction
      if (reference == COORDINATE.Neutral)
        return bias === MISSING_VALUE_BIAS.Positive ? COORDINATE.Max : COORDINATE.Min;
      return reference < COORDINATE.Neutral ? COORDINATE.Max : COORDINATE.Min;
    default:
      throw new Error(`Unknown missing value method: ${options.method}`);
  }
}

/**
 * Impute a `Position` for where coordinates missing in `target` are imputed based on `reference`.
 * NB. If a coordinate is missing in `target`, the neutral coordinate is imputed.
 * @param reference The `Position` used as reference, e.g. the voter's answers
 * @param target The `Position` for which to impute missing coordinates
 * @param options Options passed to `imputeMissingValue`
 * @returns The imputed position.
 */
export function imputeMissingPosition({
  reference,
  target,
  options
}: {
  reference: Position;
  target: Position;
  options: MissingValueImputationOptions;
}): Position {
  // Flatten both positions for easier mapping
  const flatRef = flatten(reference.coordinates);
  const flatCoordinates = flatten(target.coordinates).map((c, i) => {
    if (!isMissingValue(c)) return c;
    const ref = flatRef[i];
    if (isMissingValue(ref)) return COORDINATE.Neutral;
    return imputeMissingValue({ reference: ref!, options });
  });
  const coordinates = reshape({ flat: flatCoordinates, shape: target.shape });
  return new Position({ coordinates, space: target.space });
}
