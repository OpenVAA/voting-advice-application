import { TextFilter } from './textFilter';
import { type EntityWithAnswers,type MaybeWrapped } from '../../entity';
import { type TextQuestion } from '../../question';

export class TextQuestionFilter<
  TEntity extends MaybeWrapped<EntityWithAnswers>
> extends TextFilter<TEntity> {
  /**
   * Create a filter for matching a text question.
   * @param question The text question
   * @param name  Optional name for use when displaying the filter
   * @param locale The locale is used for case-insensitive matching
   */
  constructor({ question, name }: { question: TextQuestion; name?: string }, locale: string) {
    super({ question, name }, locale);
  }
}
