import type { MatchingSpaceCoordinate } from '../space';

/**
 * The interface for all question used for matching.
 */
export interface MatchableQuestion {
  /**
   * The entities' answers to questions are matched using the question id
   */
  id: string;
  /**
   * Set this to more than 1 for questions, such as preference order,
   * that produce multidimensional normalized values
   */
  normalizedDimensions?: number;
  /**
   * Preference order questions return a list of distances, but Likert questions just one number
   */
  normalizeValue(value: unknown): MatchingSpaceCoordinate | Array<MatchingSpaceCoordinate>;
}
