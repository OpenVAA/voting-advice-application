import { MaybeWrappedEntity } from '@openvaa/core';
import { Choice } from '@openvaa/data';
import { EnumeratedFilter } from './enumeratedFilter';
import { type MaybeMissing, MISSING_VALUE } from '../../missingValue';
import type { ChoiceQuestion, FilterOptions } from '../base';

/**
 * A filter for single or multiple choice questions
 */
export class ChoiceQuestionFilter<TEntity extends MaybeWrappedEntity> extends EnumeratedFilter<
  TEntity,
  Choice['id'],
  Choice<undefined> | Choice<number>
> {
  declare readonly options: FilterOptions & {
    question: ChoiceQuestion;
    /** The type is always the type of the Choice id */
    type: 'string';
    multipleValues?: boolean;
  };

  /**
   * Create a filter for single or multiple choice questions
   * @param question The single or multiple choice question
   * @param locale The locale is used for value sorting
   * @param name  Optional name for use when displaying the filter
   */
  constructor(
    { question, name }: { question: ChoiceQuestion; name?: string },
    public locale: string
  ) {
    super({
      question,
      name,
      type: 'string',
      multipleValues: question.type === 'multipleChoiceCategorical'
    });
  }

  /**
   * Compare to values for sorting. Note that missing values are always sorted to the end.
   */
  compareValues(a: Choice['id'], b: Choice['id']): number {
    return this.getChoice(a)['label'].localeCompare(this.getChoice(b)['label'], this.locale);
  }

  /**
   * Process a value and its count for display
   */
  processValueForDisplay(
    value: MaybeMissing<Choice['id']>,
    count: number
  ): {
    value: MaybeMissing<Choice['id']>;
    count: number;
    object?: Choice<undefined> | Choice<number>;
  } {
    return {
      value,
      count,
      object: value === MISSING_VALUE ? undefined : this.getChoice(value as Choice['id'])
    };
  }

  /**
   * Utility for getting a value's associated choice object.
   */
  getChoice(value: Choice['id']): Choice<undefined> | Choice<number> {
    const question = this.options.question;
    const choice = question.choices.find((c) => c['id'] === value);
    if (!choice)
      throw new Error(
        `Could not find choice ${value} for question with id '${'id' in question ? question.id : 'n/a'}'`
      );
    return choice;
  }
}
