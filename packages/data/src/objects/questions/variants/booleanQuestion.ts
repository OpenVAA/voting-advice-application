import {
  type AnswerValue,
  COORDINATE,
  type CoordinateOrMissing,
  ensureBoolean,
  isMissingValue,
  MISSING_VALUE,
  type MissingValue,
  Question,
  QUESTION_TYPE
} from '../../../internal';

/**
 * A matchable simple question whose answer is a boolean.
 */
export class BooleanQuestion extends Question<typeof QUESTION_TYPE.Boolean> {
  get isMatchable(): boolean {
    return true;
  }

  /**
   * A boolean value is normalized into a single coordinate, where the `false` is mapped to the minimum value and `true` to the maximum value.
   */
  protected _normalizeValue(value: AnswerValue[typeof QUESTION_TYPE.Boolean] | MissingValue): CoordinateOrMissing {
    return isMissingValue(value) ? MISSING_VALUE : value ? COORDINATE.Max : COORDINATE.Min;
  }

  protected _ensureValue(value: NonNullable<unknown>) {
    return ensureBoolean(value);
  }
}
