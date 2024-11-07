import {
  type AnswerValue,
  type CoordinateOrMissing,
  type DataAccessor,
  DataTypeError,
  type MatchableQuestion,
  MISSING_VALUE,
  type MissingValue,
  QuestionAndCategoryBase,
  type QuestionCategory,
  type QuestionData,
  type QuestionType} from '../../../internal';

/**
 * An abstract base class for all questions. The non-abstract subclasses are contained in the `variants` directory. They implement the `_ensureValue` and `normalizeValue` methods and may override the `normalizedDimensions` and `isMatchable` getters. They may also accept more data properties.
 * Simple, non-enumerated questions inherit directly from this class, but enumerated questions inherit from `ChoiceQuestion` via either of its two subclasses `SingleChoiceQuestion` or `MultipleChoiceQuestion`.
 */
export abstract class Question<
    // We need to inelegantly provide `TType` twice because inferring it from `TData` leads to typing issues
    TType extends QuestionType,
    TData extends QuestionData<TType> = QuestionData<TType>
  >
  extends QuestionAndCategoryBase<TData>
  implements DataAccessor<QuestionData<TType>>, MatchableQuestion
{
  //////////////////////////////////////////////////////////////////////////////
  // Property getters
  //////////////////////////////////////////////////////////////////////////////

  /**
   * The type of the question.
   */
  get type(): TType {
    return this.data.type;
  }

  /**
   * A synonym for `name` for convenience.
   */
  get text(): string {
    return this.name;
  }

  /**
   * Get the `QuestionCategory` this question belongs to.
   */
  get category(): QuestionCategory {
    return this.root.getQuestionCategory(this.data.categoryId);
  }

  /**
   * Return `true` if the question is matchable. Override this in subclasses
   */
  get isMatchable(): boolean {
    return false;
  }

  /**
   * Normalizes the value for use by `@openvaa/matching`. Override this in subclasses.
   */
  get normalizedDimensions(): number | undefined {
    return 1;
  }

  //////////////////////////////////////////////////////////////////////////////
  // Answer value handling
  //////////////////////////////////////////////////////////////////////////////

  /**
   * Asserts that the value is of the correct type for this question and converts it to one if the conversion is unequivocal. If the value is of the wrong type, `MISSING_VALUE` is returned.
   * @param value - The answer value to the question.
   * @returns The value in a the canonical type for this question or `MISSING_VALUE` if the value is not of the correct type.
   */
  ensureValue(value: unknown): AnswerValue[TType] | MissingValue {
    if (value == null) return MISSING_VALUE;
    return this._ensureValue(value);
  }

  /**
   * Perform the actual ensureion for the (non-missing) value for this question.
   * Implement this in the subclasses.
   * @param value
   */
  protected abstract _ensureValue(value: NonNullable<unknown>): AnswerValue[TType] | MissingValue;

  /**
   * Normalizes the value for use by `@openvaa/matching`. Note that the value returned must adhere to the relevant types and ranges defined in `@openvaa/core.MatchableQuestion`.
   * @param value - A canonical or missing value for this question.
   * @returns The normalized value or an array of normalized values, conforming to `CoordinateOrMissing`
   */
  normalizeValue(
    value: AnswerValue[TType] | MissingValue
  ): CoordinateOrMissing | Array<CoordinateOrMissing> {
    return this._normalizeValue(this.ensureValue(value));
  }

  /**
   * Perform the actual normalization for the (non-missing) value for this question. Normalizes the value for use by `@openvaa/matching`. Note that the value returned must adhere to the relevant types and ranges defined in `@openvaa/core.MatchableQuestion`.
   * Implement this in the subclasses.
   * @param value - A canonical or missing value for this question.
   * @returns The normalized value or an array of normalized values, conforming to `CoordinateOrMissing`
   */
  protected _normalizeValue(
    value: AnswerValue[TType] | MissingValue
  ): CoordinateOrMissing | Array<CoordinateOrMissing> {
    throw new DataTypeError(
      `This Question type does not support value normalization for value ${value}`
    );
  }
}
