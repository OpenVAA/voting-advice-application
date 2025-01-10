import type { HasAnswers } from './hasAnswers.type';

/**
 * Check whether target implements the `HasAnswers` interface.
 */
export function hasAnswers(target: object): target is HasAnswers {
  return 'answers' in target && typeof target.answers === 'object';
}
