/**
 * Method for calculating the penalty applied to missing values by imputing values for them
 */
export const MISSING_VALUE_METHOD = {
  /** Impute a neutral value, i.e. 0 in NormalizedDistance terms */
  Neutral: 'neutral',
  /** Imputes the furthest possible answer from the reference value, i.e., voter answer */
  RelativeMaximum: 'relativeMaximum'
} as const;

export type MissingValueMethod = (typeof MISSING_VALUE_METHOD)[keyof typeof MISSING_VALUE_METHOD];
