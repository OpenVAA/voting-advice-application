/**
 * Method for calculating the penalty applied to missing values by imputing
 * values for them
 */
export const MissingValueDistanceMethod = {
  /** Impute a neutral value, i.e. 0 in NormalizedDistance terms */
  Neutral: 0,
  /** Imputes the furthest possible answer from the reference value,
   *  i.e., voter answer */
  RelativeMaximum: 2,
  /** Treats both the reference value and the missing one as
   *  being at the opposite ends of the range */
  AbsoluteMaximum: 4
};

export type MissingValueDistanceMethod =
  (typeof MissingValueDistanceMethod)[keyof typeof MissingValueDistanceMethod];
