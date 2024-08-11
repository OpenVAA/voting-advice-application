import type {HasId} from 'vaa-shared';
import type {MatchingSpaceCoordinate} from '../space';

/**
 * The interface for all question used for matching.
 */
export interface MatchableQuestion extends HasId {
  /**
   * Set this to more than 1 for questions, such as preference order,
   * that produce multidimensional normalized values
   */
  normalizedDimensions?: number;
  /**
   * Preference order questions return a list of distances, but Likert questions just one number
   */
  normalizeValue(value: unknown): MatchingSpaceCoordinate | MatchingSpaceCoordinate[];
}
