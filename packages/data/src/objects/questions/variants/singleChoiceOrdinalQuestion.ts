import {
  type AnswerValue,
  ChoiceQuestionData,
  type CoordinateOrMissing,
  DataProvisionError,
  DataRoot,
  isMissingValue,
  MISSING_VALUE,
  type MissingValue,
  normalizeCoordinate,
  QUESTION_TYPE,
  SingleChoiceQuestion
} from '../../../internal';

/**
 * Used for all questions which allow choosing a single enumerated answering choice and whose values can be [ordered numerically](https://en.wikipedia.org/wiki/Ordinal_data). This is the most common type of VAA questions and includes Likert questions of any scale.
 *
 * @example
 * ```ts
 * // A 5-point Likert question.
 * const likertQuestion = new SingleChoiceOrdinalQuestion(
 *   {
 *     id: 'q1',
 *     type: 'singleChoiceOrdinal',
 *     name: 'Shiba inu is the cutest dog breed in the world.',
 *     choices: [
 *       { id: '1', value: 1, label: 'Disagree strongly' },
 *       { id: '2', value: 2, label: 'Disagree somewhat' },
 *       { id: '3', value: 3, label: 'Neither agree nor disagree' },
 *       { id: '4', value: 4, label: 'Agree somewhat' },
 *       { id: '5', value: 5, label: 'Agree strongly' },
 *     ]
 *   },
 *   new DataRoot()
 * );
 * ```
 */
export class SingleChoiceOrdinalQuestion extends SingleChoiceQuestion<
  typeof QUESTION_TYPE.SingleChoiceOrdinal,
  number
> {
  // These should not be set manually and reading them is probably not useful either
  protected min: number;
  protected max: number;

  constructor({
    data,
    root
  }: {
    data: ChoiceQuestionData<typeof QUESTION_TYPE.SingleChoiceOrdinal, number>;
    root: DataRoot;
  }) {
    super({ data, root });
    const values = this.choices.map((v) => v.normalizableValue);
    this.min = Math.min(...values);
    this.max = Math.max(...values);
    if (this.min === this.max) throw new DataProvisionError('The value range of the choices must be greater than 0.');
  }

  get isMatchable(): boolean {
    return true;
  }

  /**
   * Normalize the values based on the minimum and maximum values of the choices.
   */
  protected _normalizeValue(
    value: AnswerValue[typeof QUESTION_TYPE.SingleChoiceOrdinal] | MissingValue
  ): CoordinateOrMissing {
    if (isMissingValue(value)) return MISSING_VALUE;
    // We know we have the choice, because `value` is ensureed before being passed to this method.
    const numeric = this.getChoice(value)!.normalizableValue;
    return normalizeCoordinate({ value: numeric, min: this.min, max: this.max });
  }
}
