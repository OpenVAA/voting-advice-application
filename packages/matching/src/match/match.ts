import { MatchBase } from './matchBase';
import type { HasAnswers, MatchedEntity, NormalizedDistance } from '@openvaa/core';
import type { MatchableQuestionGroup } from '../question';
import type { SubMatch } from './subMatch';

/**
 * The class for an entity's matching result
 */
export class Match<
    TTarget extends HasAnswers = HasAnswers,
    TGroup extends MatchableQuestionGroup = MatchableQuestionGroup
  >
  extends MatchBase
  implements MatchedEntity
{
  readonly target: TTarget;
  readonly subMatches?: Array<SubMatch<TGroup>>;

  /**
   * Create a new `Match`.
   * @param distance The match distance as an unsigned normalized distance, e.g. [0, 1] (the range is defined by `COORDINATE.Extent`). Note that a large distance (e.g. 1) means a bad match and a low one (e.g. 0) a perfect one.
   * @param target The entity to which the match belongs.
   * @param subMatches Possible submatches for the target.
   */
  constructor({
    distance,
    target,
    subMatches
  }: {
    distance: NormalizedDistance;
    readonly target: TTarget;
    readonly subMatches?: Array<SubMatch<TGroup>>;
  }) {
    super(distance);
    this.target = target;
    this.subMatches = subMatches;
  }
}
