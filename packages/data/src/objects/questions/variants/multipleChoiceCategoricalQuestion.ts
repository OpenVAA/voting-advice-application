import { COORDINATE, isMissingValue, MISSING_VALUE, MultipleChoiceQuestion, OBJECT_TYPE } from '../../../internal';
import type { AnswerValue, CoordinateOrMissing, MissingValue, QUESTION_TYPE } from '../../../internal';

/**
 * Used for all questions which allow choosing multiple answering choices and whose values [cannot be ordered numerically](https://en.wikipedia.org/wiki/Nominal_category), i.e. the data is categorical or nominal. The answers selected may form an ordered or unordered list.
 * NB. Matching is supported by treating each choice as an independent binary subdimension (selected vs. not selected) per D-06.
 *
 * @example
 * ```ts
 * // National languages one speaks
 * const multiCategoricalQuestion = new MultipleChoiceCategoricalQuestion(
 *   {
 *     id: 'q1',
 *     type: 'multipleChoiceCategorical',
 *     name: 'National languages you speak',
 *     ordered: false,
 *     choices: [
 *       { id: 'ct', label: 'Common tongue' },
 *       { id: 'dw', label: 'Dwarven' },
 *       { id: 'ev', label: 'Elvish' },
 *       { id: 'or', label: 'Orcish' },
 *     ]
 *   },
 *   new DataRoot()
 * );
 * ```
 */
export class MultipleChoiceCategoricalQuestion extends MultipleChoiceQuestion<
  typeof QUESTION_TYPE.MultipleChoiceCategorical,
  undefined
> {
  readonly objectType = OBJECT_TYPE.MultipleChoiceCategoricalQuestion;

  get isMatchable(): boolean {
    return true;
  }

  /**
   * Each choice is an independent binary subdimension (selected vs. not selected). Unlike `SingleChoiceCategoricalQuestion`, there is **no 2-choice single-dimension shortcut**: because a multi-select question can have several choices selected simultaneously, a 2-choice question still yields 2 dimensions (D-06).
   */
  get normalizedDimensions(): number {
    return this.choices.length;
  }

  /**
   * Normalizes the value by treating each choice as an independent binary subdimension: a selected choice maps to `COORDINATE.Max` and an unselected choice to `COORDINATE.Min`, in the order of `choices` (D-06). A missing value or an empty selection (zero selections = unanswered, D-07) normalizes to an all-`MISSING_VALUE` subdimension array so it contributes no distance.
   */
  protected _normalizeValue(
    value: AnswerValue[typeof QUESTION_TYPE.MultipleChoiceCategorical] | MissingValue
  ): CoordinateOrMissing | Array<CoordinateOrMissing> {
    const choices = this.choices;
    // Missing value or zero selections => unanswered on every subdimension (D-07).
    if (isMissingValue(value) || value.length === 0) return choices.map(() => MISSING_VALUE);
    // `value` is ensured before reaching this method, so the ids are valid choice ids. String-normalize for safe comparison.
    const selected = new Set(value.map((id) => String(id)));
    return choices.map((choice) => (selected.has(String(choice.id)) ? COORDINATE.Max : COORDINATE.Min));
  }
}
