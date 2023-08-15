/**
 * Answers are objects held by Entities to Questions
 */

import type {MatchableAnswer} from '$lib/vaa-matching';
import type {Id, RichText, SerializableValue} from '../../data.types';
import {MatchableQuestionBase, type Question} from '../questions';
import type {EntityType} from './entity';

/**
 * Properties of an answer
 */
export interface AnswerProperties {
  value: SerializableValue;
  info?: RichText;
}

/**
 * An answer to a question. A superclass of MatchableAnswer.
 */
export interface Answer extends AnswerProperties {
  question: Question;
}

/**
 * The format for storing Answers within Entities.
 */
export type AnswerDict = Record<Id, AnswerProperties>;

/**
 * A supplementary format for provideing Answers if supplied directly to
 * the DataRoot
 */
export interface FullySpecifiedAnswerData extends AnswerProperties {
  entityType: EntityType;
  entityId: Id;
  questionId: Id;
}

/**
 * A utility for asserting that a generic answer is a MatchableAnswer.
 * @param answer The answer to check.
 * @returns True if answer is matchable.
 */
export function isMatchableAnswer(answer: Answer | MatchableAnswer): answer is MatchableAnswer {
  return answer.question instanceof MatchableQuestionBase;
}
