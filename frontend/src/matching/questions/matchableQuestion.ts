import type {MatchableValue} from '../core/matchableValue';
import type {MatchingSpaceCoordinate} from '../core/matchingSpacePosition';

/**
 * The base class for all question used for matching.
 */
export abstract class MatchableQuestion {
  /**
   * Override this in subclasses, such as preference order, that produce multidimensional
   * normalized values
   */
  public readonly normalizedDimensions = 1;

  /**
   * Preference order questions return a list of distances, but Likert questions just one number
   */
  abstract normalizeValue(
    value: MatchableValue
  ): MatchingSpaceCoordinate | MatchingSpaceCoordinate[];
}
