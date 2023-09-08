/**
 * The direction into which the missing value is biased when the reference
 * value is neutral. I.e. if we use the RelativeMaximum method and the
 * reference value is neutral (3 on a 5-pt Likert scale) and the bias is
 * Positive, we impute the maximum value (5) for the missing value.
 */
export enum MissingValueBias {
  /** Biased toward the maximum value, e.g. 5 on a 5-pt scale. */
  Positive,
  /** Biased toward the minimum value, e.g. 1 on a 5-pt scale. */
  Negative
}