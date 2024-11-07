import { NumericFilter } from './numericFilter';
import { type EntityWithAnswers,type MaybeWrapped } from '../../entity';
import { type NumericQuestion } from '../../question';

/**
 * A filter for numeric questions.
 */
export class NumericQuestionFilter<
  TEntity extends MaybeWrapped<EntityWithAnswers>
> extends NumericFilter<TEntity> {
  /**
   * Create a numeric question filter.
   * @param question The numeric question
   * @param name  Optional name for use when displaying the filter
   */
  constructor({ question, name }: { question: NumericQuestion; name?: string }) {
    super({ question, name });
  }
}
