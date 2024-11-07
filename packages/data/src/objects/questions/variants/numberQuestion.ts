import {
  type AnswerValue,
  type CoordinateOrMissing,
  type DataAccessor,
  DataProvisionError,
  DataRoot,
  DataTypeError,
  ensureNumber,
  isMissingValue,
  MISSING_VALUE,
  type MissingValue,
  normalizeCoordinate,
  type NumberQuestionData,
  Question,
  QUESTION_TYPE
} from '../../../internal';

/**
 * A possibly matchable simple question whose answer is a number. The question is matchable if it has a defined `min` and `max` range.
 */
export class NumberQuestion
  extends Question<typeof QUESTION_TYPE.Number, NumberQuestionData>
  implements DataAccessor<NumberQuestionData>
{
  constructor({ data, root }: { data: NumberQuestionData; root: DataRoot }) {
    super({ data, root });
    if (this.range === 0) throw new DataProvisionError('If defined, the min-max range must be greater than zero.');
  }

  protected _ensureValue(value: NonNullable<unknown>) {
    return ensureNumber(value);
  }

  /**
   * Optional formatting options for the `number`.
   */
  get format(): Intl.NumberFormatOptions | null {
    return this.data.format ?? null;
  }

  /**
   * Optional minimum value for the number question. If both `min` and `max` are provided, the question can be used in matching.
   */
  get min(): number | null {
    return this.data.min ?? null;
  }

  /**
   * Optional maximum value for the number question. If both `min` and `max` are provided, the question can be used in matching.
   */
  get max(): number | null {
    return this.data.max ?? null;
  }

  /**
   * The range length of possible values for the number question.
   */
  get range(): number | null {
    return this.min != null && this.max != null ? Math.abs(this.max - this.min) : null;
  }

  /**
   * The question is matchable if both `min` and `max` are provided.
   */
  get isMatchable(): boolean {
    return this.range != null;
  }

  /**
   * Normalizes the value within the min–max range.
   */
  protected _normalizeValue(value: AnswerValue[typeof QUESTION_TYPE.Number] | MissingValue): CoordinateOrMissing {
    const min = this.min;
    const max = this.max;
    if (min == null || max == null)
      throw new DataTypeError(
        'This Question does not support value normalization because it does not have a defined range.'
      );
    return isMissingValue(value) ? MISSING_VALUE : normalizeCoordinate({ value, min, max });
  }
}
