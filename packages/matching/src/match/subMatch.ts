import { MatchBase } from './matchBase';
import type { NormalizedDistance } from '@openvaa/core';
import type { MatchableQuestionGroup } from '../question';

/**
 * The class for question-group-specific submatches within a Match.
 */
export class SubMatch<TGroup extends MatchableQuestionGroup = MatchableQuestionGroup> extends MatchBase {
  readonly questionGroup: TGroup;
  /**
   * Create a new `SubMatch`.
   * @param distance The match distance as an unsigned normalized distance, e.g. [0, 1] (the range is defined by `COORDINATE.Extent`). Note that a large distance (e.g. 1) means a bad match and a low one (e.g. 0) a perfect one.
   * @param questionGroup The subgroup of questions for which the match is computed.
   */
  constructor({ distance, questionGroup }: { distance: NormalizedDistance; questionGroup: TGroup }) {
    super(distance);
    this.questionGroup = questionGroup;
  }
}
