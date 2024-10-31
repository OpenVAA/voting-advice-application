import { Id } from '../id/id.type';

/**
 * Entities to be matched must implement this interface.
 */
export interface HasAnswers {
  answers: AnswerDict;
}

/**
 * A record of question id and answer value pairs.
 */
export type AnswerDict = {
  [questionId: Id]: Answer | null | undefined;
};

/**
 * The answer value is contained in a value property of the answer object so that arbitrary data may accompany it.
 */
export interface Answer<TValue = unknown> {
  value: TValue;
}
