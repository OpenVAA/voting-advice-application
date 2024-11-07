import { MultipleChoiceQuestion, QUESTION_TYPE } from '../../../internal';

/**
 * Used for all questions which allow choosing multiple answering choices and whose values [cannot be ordered numerically](https://en.wikipedia.org/wiki/Nominal_category), i.e. the data is categorical or nominal. The answers selected may form an ordered or unordered list.
 * NB. The current implementation does not yet support matching.
 *
 * @example
 * ```ts
 * // National language one speaks
 * const multiCategoricalQuestion = new MultipleChoiceCategoricalQuestion(
 *   {
 *     id: 'q1',
 *     type: 'multipleChoiceCategorical',
 *     name: 'National language you speak',
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
  // TODO: Implement for matching: _normalizeValue, get isMatchable, get normalizedDimensions
}
