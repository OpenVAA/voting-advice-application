import type {HasAnswers, NormalizedDistance} from 'vaa-shared';
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
  readonly entity: TEntity;
  readonly subMatches?: Array<SubMatch<TGroup>>;

  /**
   * Create a new `Match`.
   * @param distance The match distance as an unsigned normalized distance, e.g. [0, 1] (the range is defined by `COORDINATE.Extent`). Note that a large distance (e.g. 1) means a bad match and a low one (e.g. 0) a perfect one.
   * @param entity The entity to which the match belongs.
   * @param subMatches Possible submatches for the entity.
   */
  constructor({
    distance,
    entity,
    subMatches
  }: {
    distance: NormalizedDistance;
    readonly entity: TEntity;
    readonly subMatches?: Array<SubMatch<TGroup>>;
  }) {
    super(distance);
    this.entity = entity;
    this.subMatches = subMatches;
  }
}
