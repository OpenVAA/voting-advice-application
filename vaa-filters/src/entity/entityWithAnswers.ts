import type {HasAnswers} from 'vaa-core';
import type {FilterableEntity} from './filterableEntity';

/**
 * An entity that has answers and ca be filred with the question filters, e.g. a candidate.
 * NB. This interface should align with the `HasAnswers` interface of the `vaa-matching` module.
 */
export type EntityWithAnswers = FilterableEntity & HasAnswers;

/**
 * Check whether entity implements the `HasAnswers` interface.
 * @param entity An entity.
 * @returns true if entity implements `HasAnswers`
 */
export function isEntityWithAnswers(entity: object): entity is EntityWithAnswers {
  return 'answers' in entity && typeof entity.answers === 'object';
}
