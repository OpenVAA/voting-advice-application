import type {UnsignedNormalizedDistance} from '../distance';
import type {MatchableQuestionGroup} from '../question';
import {MatchBase} from './matchBase';

/**
 * The class for question-group-specific submatches within a Match.
 */
export class SubMatch<T extends MatchableQuestionGroup = MatchableQuestionGroup> extends MatchBase {
  /**
   * Create a new SubMatch.
   *
   * @param distance The match distance as an unsigned normalized distance,
   * e.g. [0, 1] (the range is defined by `NORMALIZED_DISTANCE_EXTENT`).
   * Note that 1 means a bad match and 0 a perfect one.
   * @param questionGroup The subgroup of questions for which the match is
   * computed.
   */
  constructor(
    distance: UnsignedNormalizedDistance,
    readonly questionGroup: T
  ) {
    super(distance);
  }
}