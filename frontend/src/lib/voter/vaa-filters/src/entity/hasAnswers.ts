import type { FilterableQuestion } from '../question/filterableQuestion';
import type { WrappedEntity, FilterableEntity } from './filterableEntity';

/**
 * Either a wrapped or a naked entity that has answers.
 */
export type HasAnswers = EntityWithAnswers | WrappedEntity<EntityWithAnswers>;

/**
 * An entity that has answers and ca be filred with the question filters, e.g. a candidate.
 * NB. This interface should align with the `HasMatchableAnswers` interface of the `vaa-matching` module.
 */
export type EntityWithAnswers = FilterableEntity & {
  answers: AnswerDict;
};

/**
 * A record of question id and answer value pairs.
 */
export type AnswerDict = {
  [questionId: FilterableQuestion['id']]: AnswerValue;
};

/**
 * The answer value is contained in a value property of the answer object so that arbitrary data may accompany it.
 */
export interface AnswerValue {
  value: unknown;
}

/**
 * Check whether entity implements the `HasAnswers` interface.
 * @param entity An entity.
 * @returns true if entity implements `HasAnswers`
 */
export function hasAnswers(entity: object): entity is EntityWithAnswers {
  return 'answers' in entity && typeof entity.answers === 'object';
}
