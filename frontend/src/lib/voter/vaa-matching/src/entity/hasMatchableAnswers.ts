import type { MatchableQuestion } from '../question';

/**
 * Entities to be matched must implement this interface.
 */
export interface HasMatchableAnswers {
  answers: AnswerDict;
}

/**
 * A record of question id and answer value pairs.
 */
export type AnswerDict = {
  [questionId: MatchableQuestion['id']]: AnswerValue;
};

/**
 * The answer value is contained in a value property of the answer object so that arbitrary data may accompany it.
 */
export interface AnswerValue {
  value: unknown;
}
