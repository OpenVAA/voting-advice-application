import { Entity, MaybeWrappedEntity } from '@openvaa/core';
import { TextQuestion } from '@openvaa/data';
import { TextFilter } from './textFilter';

export class TextQuestionFilter<TEntity extends MaybeWrappedEntity> extends TextFilter<TEntity> {
  /**
   * Create a filter for matching a text question.
   * @param question The text question
   * @param name  Optional name for use when displaying the filter
   * @param locale The locale is used for case-insensitive matching
   */
  constructor(
    {
      question,
      name,
      entityGetter
    }: { question: TextQuestion; name?: string; entityGetter?: (target: TEntity) => Entity },
    locale: string
  ) {
    super({ question, name, entityGetter }, locale);
  }
}
