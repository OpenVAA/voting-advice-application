import { MaybeWrappedEntity } from '@openvaa/core';
import { NumberQuestion } from '@openvaa/data';
import { NumericFilter } from './numericFilter';

/**
 * A filter for numeric questions.
 */
export class NumericQuestionFilter<TEntity extends MaybeWrappedEntity> extends NumericFilter<TEntity> {
  /**
   * Create a numeric question filter.
   * @param question The numeric question
   * @param name  Optional name for use when displaying the filter
   */
  constructor({ question, name }: { question: NumberQuestion; name?: string }) {
    super({ question, name });
  }
}
