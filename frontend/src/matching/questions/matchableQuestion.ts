import type {MatchableValue} from '../core/matchableValue';
import type {MatchingSpaceCoordinate} from '../core/matchingSpacePosition';

/**
 * The interface for all question used for matching.
 */
export interface MatchableQuestion {
  id: string;
  /**
   * Set this to more than 1 for questions, such as preference order,
   * that produce multidimensional normalized values
   */
  normalizedDimensions?: number;
  /**
   * Preference order questions return a list of distances, but Likert questions just one number
   */
  normalizeValue(value: MatchableValue): MatchingSpaceCoordinate | MatchingSpaceCoordinate[];
}
