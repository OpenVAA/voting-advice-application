import type { CoreAnswer, Id, Image, MissingValue, QUESTION_TYPE } from '../../../internal';

/**
 * The type for an answer to a `Question`.
 * @typeParam TValue - The type of the answer value which we can't know ahead of time, but it should conform to the `AnswerValue` specific to the question. The actual value may also be of type `MissingValue` if the answer is missing.
 */
export type Answer<TValue extends AnswerValue | unknown = unknown> = CoreAnswer<TValue | MissingValue> & {
  /**
   * An optional open answer accompanying the answer.
   */
  info?: string | null;
};

/**
 * A collection of answers that an `Entity` has.
 */
export type Answers = Record<Id, Answer | null | undefined>;

/**
 * A mapping between question types and their corresponding answer values.
 */
export type AnswerValue = {
  [QUESTION_TYPE.Text]: string;
  [QUESTION_TYPE.Number]: number;
  [QUESTION_TYPE.Boolean]: boolean;
  [QUESTION_TYPE.Image]: Image;
  [QUESTION_TYPE.Date]: Date;
  [QUESTION_TYPE.MultipleText]: Array<string>;
  [QUESTION_TYPE.SingleChoiceOrdinal]: Id;
  [QUESTION_TYPE.SingleChoiceCategorical]: Id;
  [QUESTION_TYPE.MultipleChoiceCategorical]: Array<Id>;
  // [QUESTION_TYPE.PreferenceOrder]: Array<Id>; // TODO: Implement
};
