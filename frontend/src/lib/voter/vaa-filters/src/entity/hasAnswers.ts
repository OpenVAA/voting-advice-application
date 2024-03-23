import type {WrappedEntity, FilterableEntity} from './filterableEntity';
import type {FilterableQuestion} from '../question/filterableQuestion';

/**
 * Either a wrapped or a naked entity that has answers.
 */
export type HasAnswers = EntityWithAnswers | WrappedEntity<EntityWithAnswers>;

/**
 * An entity that has answers and ca be filred with the question filters, e.g. a candidate.
 */
export type EntityWithAnswers = FilterableEntity & {
  getAnswerValue: <T extends FilterableQuestion>(question: T) => unknown;
};

/**
 * Check whether entity implements the `HasAnswers` interface.
 * @param entity An entity.
 * @returns true if entity implements `HasAnswers`
 */
export function hasAnswers(entity: object): entity is EntityWithAnswers {
  return 'getAnswerValue' in entity && typeof entity.getAnswerValue === 'function';
}
