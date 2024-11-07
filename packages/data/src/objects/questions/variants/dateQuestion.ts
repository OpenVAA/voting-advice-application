import {
  type AnswerValue,
  type CoordinateOrMissing,
  type DataAccessor,
  DataRoot,
  DataTypeError,
  type DateQuestionData,
  ensureDate,
  isMissingValue,
  MISSING_VALUE,
  type MissingValue,
  normalizeCoordinate,
  Question,
  QUESTION_TYPE
} from '../../../internal';

/**
 * A possibly matchable simple question whose answer is a date.
 * NB. An `Entity`’s `Answer.value` to a `DateQuestion` is stored as a `string` because of JSON-serialization requirements, but the `Entity.getAnswer` accessor converts these to a `Date` object. If the `string` is not a valid date string, a `MISSING_VALUE` is returned.
 */
export class DateQuestion
  extends Question<typeof QUESTION_TYPE.Date, DateQuestionData>
  implements DataAccessor<DateQuestionData>
{
  min: Date | null;
  max: Date | null;

  constructor({ data, root }: { data: DateQuestionData; root: DataRoot }) {
    super({ data, root });
    const min = ensureDate(this.data.min);
    const max = ensureDate(this.data.max);
    this.min = isMissingValue(min) ? null : min;
    this.max = isMissingValue(max) ? null : max;
  }

  /**
   * Optional formatting options for the `Date`.@default null
   */
  get format(): Intl.DateTimeFormatOptions | null {
    return this.data.format ?? null;
  }

  /**
   * The question is matchable if both `min` and `max` are provided.
   */
  get isMatchable(): boolean {
    return this.min != null && this.max != null;
  }

  protected _ensureValue(value: NonNullable<unknown>) {
    return ensureDate(value);
  }

  /**
   * Normalizes the value within the min–max range.
   */
  protected _normalizeValue(value: AnswerValue[typeof QUESTION_TYPE.Date] | MissingValue): CoordinateOrMissing {
    const min = this.min?.getTime();
    const max = this.max?.getTime();
    if (min == null || max == null)
      throw new DataTypeError(
        'This Question does not support value normalization because it does not have a defined range.'
      );
    return isMissingValue(value) ? MISSING_VALUE : normalizeCoordinate({ value: value.getTime(), min, max });
  }
}
