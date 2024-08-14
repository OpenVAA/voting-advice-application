import type {UnsignedNormalizedDistance} from 'vaa-shared';
import type {HasAnswers} from '../entity';
import type {MatchableQuestionGroup} from '../question';
import {MatchBase} from './matchBase';
import type {SubMatch} from './subMatch';

/**
 * The class for an entity's matching result
 */
export class Match<
  TEntity extends HasAnswers = HasAnswers,
  TGroup extends MatchableQuestionGroup = MatchableQuestionGroup
> extends MatchBase {
  /**
   * Create a new Match.
   *
   * @param distance The match distance as an unsigned normalized distance,
   * e.g. [0, 1] (the range is defined by `NORMALIZED_DISTANCE_EXTENT`).
   * Note that 1 means a bad match and 0 a perfect one.
   * @param entity The entity to which the match belongs.
   * @param subMatches Possible submatches for the entity.
   */
  constructor(
    distance: UnsignedNormalizedDistance,
    readonly entity: TEntity,
    readonly subMatches?: Array<SubMatch<TGroup>>
  ) {
    super(distance);
  }
}
