import { isObjectType, OBJECT_TYPE } from '@openvaa/data';
import { TextFilter } from './textFilter';
import { FILTER_TYPE } from '../base';
import type { Entity, MaybeWrappedEntity } from '@openvaa/core';
import type { MultipleTextQuestion, TextQuestion } from '@openvaa/data';

export class TextQuestionFilter<TEntity extends MaybeWrappedEntity = MaybeWrappedEntity> extends TextFilter<TEntity> {
  readonly filterType = FILTER_TYPE.TextQuestionFilter;

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
        multipleValues: isObjectType(options.question, OBJECT_TYPE.MultipleTextQuestion)
      },
      locale
    );
  }
}
