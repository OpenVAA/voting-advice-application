import { NumberFilter } from './numberFilter';
import type { MaybeWrappedEntity } from '@openvaa/core';
import type { NumberQuestion } from '@openvaa/data';

/**
 * A filter for number questions.
 */
export class NumberQuestionFilter<TEntity extends MaybeWrappedEntity> extends NumberFilter<TEntity> {
  /**
   * Create a number question filter.
   * @param question The number question
   * @param name  Optional name for use when displaying the filter
   */
  constructor({ question, name }: { question: NumberQuestion; name?: string }) {
    super({ question, name });
  }
}
