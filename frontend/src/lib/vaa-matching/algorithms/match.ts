import {assertUnsignedNormalized, NORMALIZED_DISTANCE_EXTENT} from '../core/distances';
import type {UnsignedNormalizedDistance} from '../core/distances';
import type {HasMatchableAnswers} from '../core/hasMatchableAnswers';
import type {HasMatchableQuestions} from '../questions/hasMatchableQuestions';

/**
 * The base class for a matching result. In most cases, the subclass
 * Match will be used.
 */
export class MatchBase {
  /** Used for to get/set `distance`. */
  private _distance: UnsignedNormalizedDistance = 0;
  /**
   * Used in converting the distance to a score value, typically
   * between 0 and 100. This is a static value of the class, so
   * change with `MatchBase.multiplier = numberVal`.
   * */
  static multiplier = 100;
  /**
   * Used in converting the score to a string representation with
   * toString(). This is a static value of the class, so change
   * with `MatchBase.unitString = stringVal`.
   */
  static unitString = '%'; // "&#8201;%";

  /**
   * Create a new MatchBase.
   *
   * @param distance The match distance as an unsigned normalized distance,
   * e.g. [0, 1] (the range is defined by `NORMALIZED_DISTANCE_EXTENT`).
   * Note that 1 means a bad match and 0 a perfect one.
   */
  constructor(distance: UnsignedNormalizedDistance) {
    this.distance = distance;
  }

  /**
   * Get the match distance as an unsigned normalized distance.
   */
  get distance(): UnsignedNormalizedDistance {
    return this._distance;
  }

  /**
   * Set the match distance as an unsigned normalized distance.
   *
   * @param value The match distance as an unsigned normalized distance,
   * e.g. [0, 1] (the range is defined by `NORMALIZED_DISTANCE_EXTENT`).
   * Note that 1 means a bad match and 0 a perfect one.
   */
  set distance(value: UnsignedNormalizedDistance) {
    assertUnsignedNormalized(value);
    this._distance = value;
  }

  /**
   * Convert the distance to a fraction [0, 1], regardless of the value of
   * `NORMALIZED_DISTANCE_EXTENT`. Note that 0 means a bad match and 1 a perfect one.
   */
  get matchFraction(): number {
    return (NORMALIZED_DISTANCE_EXTENT - this.distance) / NORMALIZED_DISTANCE_EXTENT;
  }

  /**
   * Convert the distance to a percentage [0, 100], regardless of the value of
   * `NORMALIZED_DISTANCE_EXTENT`. Note that 0 means a bad match and 100 a perfect one.
   */
  get score(): number {
    return Math.round(this.matchFraction * MatchBase.multiplier);
  }

  /**
   * Convert to an understandable form, e.g. a percentage string.
   * Override in subclasses.
   */
  toString(): string {
    return `${this.score}${MatchBase.unitString}`;
  }
}

/**
 * The class for question-group-specific submatches within a Match.
 */
export class SubMatch extends MatchBase {
  /**
   * Create a new SubMatch.
   *
   * @param distance The match distance as an unsigned normalized distance,
   * e.g. [0, 1] (the range is defined by `NORMALIZED_DISTANCE_EXTENT`).
   * Note that 1 means a bad match and 0 a perfect one.
   * @param questionGroup The subgroup of questions for which the match is
   * computed.
   */
  constructor(distance: UnsignedNormalizedDistance, public questionGroup: HasMatchableQuestions) {
    super(distance);
  }
}

/**
 * The class for an entity's matching result
 */
export class Match extends MatchBase {
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
    public entity: HasMatchableAnswers,
    public subMatches?: SubMatch[]
  ) {
    super(distance);
  }
}
