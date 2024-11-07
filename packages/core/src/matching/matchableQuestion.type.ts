import type { HasId } from '../id/id.type';
import type { CoordinateOrMissing } from './distance.type';

/**
 * The interface for all question used for matching.
 */
export interface MatchableQuestion extends HasId {
  /**
   * Set this to more than 1 for questions, such as preference order, that produce multidimensional normalized values. Note that this number should match the length of the array returned by normalizeValue or be `undefined` or 1 if only a single coordinate is returned.
   */
  normalizedDimensions?: number;
  /**
   * Most questions return only a single, normalized and possibly missing value. Some, e.g. preference order questions, require splitting into multiple subdimensions, in which case an array of normalized values should be returned. Its length must match the value for `normalizedDimensions`.
   */
  normalizeValue(value: unknown): CoordinateOrMissing | Array<CoordinateOrMissing>;
}
