import type { Id } from '@openvaa/core';
import type { VAAComment } from '../condensation/condensationInput';

/**
 * Comments are grouped based on their answer values and question type.
 */
export type CommentGroup = {
  comments: Array<VAAComment>;
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
 * Options for comment grouping behavior.
 * @param invertProsAndCons - For ordinal questions invert the pro/con classification.
 * @param maxCommentsPerGroup - Maximum number of comments from a single answer option to use for a single condensation run 
 * 
 */
export interface CommentGroupingOptions {
  invertProsAndCons?: boolean;
  maxCommentsPerGroup?: number;
}