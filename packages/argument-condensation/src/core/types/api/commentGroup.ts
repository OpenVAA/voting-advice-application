import type { Id, Logger } from '@openvaa/core';
import type { Comment } from '../condensation/condensationInput';

/**
 * Comments are grouped based on their answer values and question type
 *
 * @example
 * For a boolean question, we have two groups:
 * - pros: comments that are given along with the answer "true"
 * - cons: comments that are given along with the answer "false"
 *
 * For a categorical question, an answer option is a group:
 * - ChoiceX: comments that are given along with the answer "ChoiceX"
 * - ChoiceY: comments that are given along with the answer "ChoiceY"
 */
export type CommentGroup = {
  comments: Array<Comment>;
} & (
  | {
      type: 'pro' | 'con';
      choiceId?: never;
    }
  | {
      type: 'categoricalChoice';
      choiceId: Id;
    }
);

/**
 * Options for comment grouping behavior
 */
export interface CommentGroupingOptions {
  /** We can invert the pro/con classification for questions with a semantic order (e.g. ordinal questions) */
  invertProsAndCons: boolean;
  /** Maximum number of comments from a single answer option to use for a single condensation run */
  maxCommentsPerGroup: number;
  /** Optional logger for warning messages during comment grouping */
  logger?: Logger;
}
