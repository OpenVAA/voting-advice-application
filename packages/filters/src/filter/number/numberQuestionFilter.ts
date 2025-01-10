import { MaybeWrappedEntity } from '@openvaa/core';
import { NumberQuestion } from '@openvaa/data';
import { NumberFilter } from './numberFilter';

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
