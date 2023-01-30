/**
 * We use this to mark any missing values, i.e. ones not answered by the entity.
 * It is also used for normalized distances derived from such answers.
 * We do not allow for implicitly missing values, such as null.
 */
export const MISSING_VALUE = "**MISSING**";

/**
 * A value that can be used in matching can be either specified or missing.
 */
export type MatchableValue = MissingValue | NonmissingValue;

/**
 * A missing MatchableValue
 */
export type MissingValue = typeof MISSING_VALUE;

/**
 * An explicitly set MatchableValue
 */
export type NonmissingValue = number;