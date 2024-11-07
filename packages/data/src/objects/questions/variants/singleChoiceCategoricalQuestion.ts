import {
  type AnswerValue,
  COORDINATE,
  type CoordinateOrMissing,
  isMissingValue,
  MISSING_VALUE,
  type MissingValue,
  QUESTION_TYPE,
  SingleChoiceQuestion
} from '../../../internal';

/**
 * Used for all questions which allow choosing a single enumerated answering choice and whose values [cannot be ordered numerically](https://en.wikipedia.org/wiki/Nominal_category), i.e. the data is categorical or nominal.
 *
 * @example
 * ```ts
 * // Favourite color
 * const categoricalQuestion = new SingleChoiceCategoricalQuestion(
 *   {
 *     id: 'q1',
 *     type: 'singleChoiceCategorical',
 *     name: 'Favourite color',
 *     choices: [
 *       { id: '1', label: 'Red' },
 *       { id: '2', label: 'Green' },
 *       { id: '3', label: 'Blue' },
 *     ]
 *   },
 *   new DataRoot()
 * );
 * ```
 */
export class SingleChoiceCategoricalQuestion extends SingleChoiceQuestion<
  typeof QUESTION_TYPE.SingleChoiceCategorical,
  undefined
> {
  get isMatchable(): boolean {
    return true;
  }

  /**
   * Binary questions are treated as one-dimensional, but others need multiple dimensions.
   */
  get normalizedDimensions(): number {
    return this.choices.length === 2 ? 1 : this.choices.length;
  }

  /**
   * Normalizes the value by splitting the value space into combination of `n` binary choices or dimensions where `n` is the number of choices, unless `n` is 2, in which case a single dimension suffices. Because of this, categorical questions will **only yield distances of `[0, 2/n]` where `n` is the number of choices**, i.e., for the favourite color example, the match score can only be 100% in case of agreement or ~33% for disagreement. For binary questions, the range is 0–100%.
   * This behavior is semantically motivated by the treatment of the questions as binary choices. In the example, this would map to in case of A answering "red" and B, "blue":
   * - Red is favored?:   A yes, B no  => disagree
   * - Blue is favored?:  A no,  B yes => disagree
   * - Green is favored?: A no,  B no  => agree
   * Thus, the respondents disagree on two counts but agree on one. In contrast, had they given the same answer, agreement would be perfect regardless of the number of choices.
   * If such behavior limited in the level of disagreement is not what you want, this can be partially remedied by increasing the question weight to `n/2`. Note, however, that this will correct its weighting compared to other questions, but it will not yield full disagreement when looking at the question in isolation because the matching algorithm will normalise the distance using the maximum possible distance after computing it.
   */
  protected _normalizeValue(
    value: AnswerValue[typeof QUESTION_TYPE.SingleChoiceOrdinal] | MissingValue
  ): CoordinateOrMissing | Array<CoordinateOrMissing> {
    const choices = this.choices;
    if (isMissingValue(value)) return choices.length === 2 ? MISSING_VALUE : choices.map(() => MISSING_VALUE);
    // We can be sure the choice exists, because `value` is ensureed before being passed to this method.
    const index = this.getChoiceIndex(value)!;
    // For 2 choices a single dimension suffices and the question works, in effect, like a `BooleanQuestion`.
    if (choices.length === 2) return index === 0 ? COORDINATE.Min : COORDINATE.Max;
    // Otherwise, create subdmensions where we assign the max value to the selected choice and min to others
    return Array.from({ length: choices.length }, (_, i) => (i === index ? COORDINATE.Max : COORDINATE.Min));
  }
}
