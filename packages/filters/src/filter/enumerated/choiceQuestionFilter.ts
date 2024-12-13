import { Entity, MaybeWrappedEntity } from '@openvaa/core';
import { type AnyChoice, MultipleChoiceCategoricalQuestion } from '@openvaa/data';
import { EnumeratedFilter } from './enumeratedFilter';
import { type MaybeMissing, MISSING_VALUE } from '../../missingValue';
import type { ChoiceQuestion, FilterOptions } from '../base';

/**
 * A filter for single or multiple choice questions
 */
export class ChoiceQuestionFilter<TEntity extends MaybeWrappedEntity> extends EnumeratedFilter<
  TEntity,
  AnyChoice['id'],
  AnyChoice
> {
  declare readonly options: FilterOptions<TEntity> & {
    question: ChoiceQuestion;
    /** The type is always the type of the AnyChoice id */
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
    {
      question,
      name,
      entityGetter
    }: { question: ChoiceQuestion; name?: string; entityGetter?: (target: TEntity) => Entity },
    public locale: string
  ) {
    super({
      question,
      name,
      entityGetter,
      type: 'string',
      multipleValues: question instanceof MultipleChoiceCategoricalQuestion
    });
  }

  /**
   * Compare to values for sorting. Note that missing values are always sorted to the end.
   */
  compareValues(a: AnyChoice['id'], b: AnyChoice['id']): number {
    return this.getChoice(a)['label'].localeCompare(this.getChoice(b)['label'], this.locale);
  }

  /**
   * Process a value and its count for display
   */
  processValueForDisplay(
    value: MaybeMissing<AnyChoice['id']>,
    count: number
  ): {
    value: MaybeMissing<AnyChoice['id']>;
    count: number;
    object?: AnyChoice;
  } {
    return {
      value,
      count,
      object: value === MISSING_VALUE ? undefined : this.getChoice(value as AnyChoice['id'])
    };
  }

  /**
   * Utility for getting a value's associated choice object.
   */
  getChoice(value: AnyChoice['id']): AnyChoice {
    const question = this.options.question;
    const choice = question.choices.find((c) => c['id'] === value);
    if (!choice)
      throw new Error(
        `Could not find choice ${value} for question with id '${'id' in question ? question.id : 'n/a'}'`
      );
    return choice;
  }
}
