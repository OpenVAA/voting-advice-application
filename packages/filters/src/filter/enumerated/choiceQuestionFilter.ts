import { EnumeratedFilter } from './enumeratedFilter';
import { type MaybeMissing, MISSING_VALUE } from '../../missingValue';
import { type Choice, type ChoiceQuestion, KEY_PROP, KEY_TYPE, LABEL_PROP } from '../../question';
import type { EntityWithAnswers, MaybeWrapped } from '../../entity';
import type { FilterOptions } from '../base';

/**
 * A filter for single or multiple choice questions
 */
export class ChoiceQuestionFilter<TEntity extends MaybeWrapped<EntityWithAnswers>> extends EnumeratedFilter<
  TEntity,
  Choice[typeof KEY_PROP],
  Choice
> {
  declare readonly options: FilterOptions & {
    question: ChoiceQuestion;
    /** The type is always the type of the Choice key property */
    type: typeof KEY_TYPE;
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
      type: KEY_TYPE,
      multipleValues: question.type === 'multipleChoiceCategorical'
    });
  }

  /**
   * Compare to values for sorting. Note that missing values are always sorted to the end.
   */
  compareValues(a: Choice[typeof KEY_PROP], b: Choice[typeof KEY_PROP]) {
    return this.getChoice(a)[LABEL_PROP].localeCompare(this.getChoice(b)[LABEL_PROP], this.locale);
  }

  /**
   * Process a value and its count for display
   */
  processValueForDisplay(value: MaybeMissing<Choice[typeof KEY_PROP]>, count: number) {
    return {
      value,
      count,
      object: value === MISSING_VALUE ? undefined : this.getChoice(value as Choice[typeof KEY_PROP])
    };
  }

  /**
   * Utility for getting a value's associated choice object.
   */
  getChoice(value: Choice[typeof KEY_PROP]): Choice {
    const question = this.options.question;
    const choice = question.values.find((c) => c[KEY_PROP] === value);
    if (!choice)
      throw new Error(
        `Could not find choice ${value} for question with id '${'id' in question ? question.id : 'n/a'}'`
      );
    return choice;
  }
}
