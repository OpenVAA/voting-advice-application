import { haveSameId } from '@openvaa/core';
import {
  DataTypeError,
  intersectFilters,
  isMissingValue,
  MISSING_VALUE,
  QuestionAndCategoryBase
} from '../../../internal';
import type {
  Answer,
  AnswerFormatterParams,
  AnswerValue,
  ArrayAnswerFormatterOptions,
  Constituency,
  CoordinateOrMissing,
  DataAccessor,
  Election,
  EntityType,
  FILTER_NONE_APPLICABLE,
  FilterTargets,
  MatchableQuestion,
  MissingValue,
  QuestionCategory,
  QuestionData,
  QuestionType,
  QuestionVariant
} from '../../../internal';

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
   * Asserts that the `Answer` object is of the correct type for this question and converts it to one if the conversion is unequivocal. If the is of the wrong type, `undefined` is returned.
   * @param answer - The `Answer` to check.
   * @returns The `Answer` object or `undefined` if the answer is missing or its `value` is invalid for the question type.
   */
  ensureAnswer(answer?: Answer<unknown> | null): Answer<AnswerValue[TType]> | undefined {
    if (!answer) return undefined;
    // AssertValue ensures that the answer value is of the correct type for the question
    const value = this.ensureValue(answer.value);
    return isMissingValue(value) ? undefined : { ...answer, value };
  }

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
   * Perform the actual ensuring for the (non-missing) value for this question.
   * Implement this in the subclasses.
   * @param value
   */
  protected abstract _ensureValue(value: NonNullable<unknown>): AnswerValue[TType] | MissingValue;

  /**
   * Normalizes the value for use by `@openvaa/matching`. Note that the value returned must adhere to the relevant types and ranges defined in `@openvaa/core.MatchableQuestion`.
   * @param value - A canonical or missing value for this question.
   * @returns The normalized value or an array of normalized values, conforming to `CoordinateOrMissing`
   */
  normalizeValue(value: AnswerValue[TType] | MissingValue): CoordinateOrMissing | Array<CoordinateOrMissing> {
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
    throw new DataTypeError(`This Question type does not support value normalization for value ${value}`);
  }

  /**
   * A utility for showing the `Answer.value` to a question as a string. The formatting is controlled by the formatters defined in the `DataRoot`.
   * @param answer - The `Question` to get the answer for.
   * @param rest - Additional arguments for the `DataRoot.formatAnswer` method.
   * @returns A string.
   */
  formatAnswer({ answer, ...rest }: { answer?: Answer<unknown> | null } & ArrayAnswerFormatterOptions = {}): string {
    return this.root.formatAnswer({
      question: this,
      answer: this.ensureAnswer(answer),
      ...rest
    } as unknown as AnswerFormatterParams<QuestionVariant[TType]>);
  }

  //////////////////////////////////////////////////////////////////////////////
  // Filtering
  //////////////////////////////////////////////////////////////////////////////

  /**
   * Get the effective elections for this question, combining the question's elections with its category's elections.
   * If either array is empty, include all items from the other.
   * @returns Array of Elections that apply to both the question and its category, or FILTER_NONE_APPLICABLE if they conflict
   */
  get effectiveElections(): Array<Election> | typeof FILTER_NONE_APPLICABLE {
    return intersectFilters(this.category.elections, this.elections, haveSameId);
  }

  /**
   * Get the effective election rounds for this question, combining the question's rounds with its category's rounds.
   * If either value is null/empty, include values from the other.
   * @returns Array of election rounds that apply to both the question and its category, or FILTER_NONE_APPLICABLE if they conflict
   */
  get effectiveElectionRounds(): Array<number> | typeof FILTER_NONE_APPLICABLE {
    return intersectFilters(this.category.electionRounds, this.electionRounds);
  }

  /**
   * Get the effective entity types for this question, combining the question's types with its category's types.
   * If either value is null/empty, include values from the other.
   * @returns Array of entity types that apply to both the question and its category, or FILTER_NONE_APPLICABLE if they conflict
   */
  get effectiveEntityType(): Array<EntityType> | typeof FILTER_NONE_APPLICABLE {
    return intersectFilters(this.category.entityType, this.entityType);
  }

  /**
   * Get the effective constituencies for this question, combining the question's constituencies with its category's constituencies.
   * If either array is empty, include all items from the other.
   * @returns Array of Constituencies that apply to both the question and its category, or FILTER_NONE_APPLICABLE if they conflict
   */
  get effectiveConstituencies(): Array<Constituency> | typeof FILTER_NONE_APPLICABLE {
    return intersectFilters(this.category.constituencies, this.constituencies, haveSameId);
  }

  /**
   * We override the `appliesTo` method to also check for the `category`'s applicability.
   * @param targets - The targets to check for
   * @param options - Optional parameters
   * @param options.dontInherit - If true, only check the question's own filters, not the category's
   * @returns True if the question and its category apply
   */
  appliesTo(targets: FilterTargets, options?: { dontInherit?: boolean }): boolean {
    const dontInherit = options?.dontInherit ?? false;
    if (dontInherit) {
      return super.appliesTo(targets);
    }
    return this.category.appliesTo(targets) && super.appliesTo(targets);
  }
}
