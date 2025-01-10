import { Entity, MaybeWrappedEntity } from '@openvaa/core';
import { MultipleTextQuestion, TextQuestion } from '@openvaa/data';
import { TextFilter } from './textFilter';

export class TextQuestionFilter<TEntity extends MaybeWrappedEntity> extends TextFilter<TEntity> {
  /**
   * Create a filter for matching a text question.
   * @param question The text question
   * @param name  Optional name for use when displaying the filter
   * @param locale The locale is used for case-insensitive matching
   */
  constructor(
    options: {
      question: TextQuestion | MultipleTextQuestion;
      name?: string;
      entityGetter?: (target: TEntity) => Entity;
    },
    locale: string
  ) {
    super(
      {
        ...options,
        multipleValues: options.question instanceof MultipleTextQuestion
      },
      locale
    );
  }
}
