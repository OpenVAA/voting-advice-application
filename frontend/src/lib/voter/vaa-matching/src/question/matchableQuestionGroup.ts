import type {MatchableQuestion} from 'vaa-shared';

/**
 * Question groups are used for subcategory matches in matching algorithm. They must have questions, but may also have other properties, such as a label or link to a question category.
 */
export interface MatchableQuestionGroup {
  matchableQuestions: Array<MatchableQuestion>;
}
