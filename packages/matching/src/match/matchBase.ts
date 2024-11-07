import { assertDistance, COORDINATE, type NormalizedDistance } from '@openvaa/core';

/**
 * The base class for a matching result. In most cases, the subclass `Match` will be used.
 */
export class MatchBase {
  /**
   * Used in converting the distance to a score value, typically between 0 and 100. This is a static value of the class, so change with `MatchBase.multiplier = numberVal`.
   */
  static multiplier = 100;
  /**
   * Used in converting the score to a string representation with toString(). This is a static value of the class, so change with `MatchBase.unitString = stringVal`.
   */
  static unitString = '%'; // "&#8201;%";

  /** Used for to get/set `distance`. */
  private _distance: NormalizedDistance = 0;

  /**
   * Create a new MatchBase.
   * @param distance The match distance as an unsigned normalized distance, e.g. [0, 1] (the range is defined by `COORDINATE.Extent`). Note that 1 means a bad match and 0 a perfect one.
   */
  constructor(distance: NormalizedDistance) {
    this.distance = distance;
  }

  /**
   * Get the match distance as an unsigned normalized distance.
   */
  get distance(): NormalizedDistance {
    return this._distance;
  }

  /**
   * Set the match distance as an unsigned normalized distance.
   * @param value The match distance as an unsigned normalized distance, e.g. [0, 1] (the range is defined by `COORDINATE.Extent`). Note that 1 means a bad match and 0 a perfect one.
   */
  set distance(value: NormalizedDistance) {
    assertDistance(value);
    this._distance = value;
  }

  /**
   * Convert the distance to a fraction [0, 1], regardless of the value of `COORDINATE.Extent`. Note that 0 means a bad match and 1 a perfect one.
   */
  get matchFraction(): number {
    return (COORDINATE.Extent - this.distance) / COORDINATE.Extent;
  }

  /**
   * Convert the distance to a percentage [0, 100], regardless of the value of `COORDINATE.Extent`. Note that 0 means a bad match and 100 a perfect one.
   */
  get score(): number {
    return Math.round(this.matchFraction * MatchBase.multiplier);
  }

  /**
   * Convert to an understandable form, e.g. a percentage string. Override in subclasses.
   */
  toString(): string {
    return `${this.score}${MatchBase.unitString}`;
  }
}
