import type { Id } from '@openvaa/core';
import type { Choice } from './choice';

/**
 * Any filterable question.
 */
export type FilterableQuestion = TextQuestion | NumericQuestion | ChoiceQuestion;

/**
 * A question whose answers are string values.
 */
export interface TextQuestion extends QuestionBase {
  type: 'text';
}

/**
 * A question whose answers are number values.
 */
export interface NumericQuestion extends QuestionBase {
  type: 'number';
}

/**
 * A question whose answers are choices with a key and a label.
 */
export interface ChoiceQuestion extends QuestionBase {
  type: 'singleChoiceOrdinal' | 'singleChoiceCategorical' | 'multipleChoiceCategorical';
  values: Array<Choice>;
}

/**
 * All questions types must extend this interface.
 */
interface QuestionBase {
  /**
   * The entities' answers to questions are matched using the question id
   */
  id: Id;
}
