/*
 * Class for multiple choice questions, where the values have an order.
 */

import {MISSING_VALUE, NORMALIZED_DISTANCE_EXTENT} from '$lib/vaa-matching';
import type {
  MatchingSpaceCoordinate,
  MatchableValue,
  NonmissingValue,
  MatchableQuestion
} from '$lib/vaa-matching';

import type {QuestionCategory} from '../questionCategory';
import {MatchableQuestionBase} from './matchableQuestionBase';
import type {QuestionTemplate} from './questionTemplate';
import type {TemplateQuestionData} from './templateQuestion';

/** This might change later */
export type MultipleChoiceQuestionData = TemplateQuestionData;

/**
 * A class for multiple choice questions, which include Likert questions.
 */
export class OrdinalQuestion extends MatchableQuestionBase {
  constructor(
    public data: MultipleChoiceQuestionData,
    public parent: QuestionCategory,
    public template: QuestionTemplate
  ) {
    super(data, parent, template);
  }

  get neutralValue(): NonmissingValue {
    return this.minValue + this.valueRange / 2;
  }

  get maxValue(): NonmissingValue {
    return this.values[this.values.length - 1].value;
  }

  get minValue(): NonmissingValue {
    return this.values[0].value;
  }

  get valueRange() {
    return this.maxValue - this.minValue;
  }

  /**
   * Used to convert a question's values into normalized distances for used
   * in matching.
   * @param value A question's native value
   * @returns The value in the signed normalized range (e.g. [-.5, .5])
   */
  normalizeValue(value: MatchableValue): MatchingSpaceCoordinate {
    if (value === MISSING_VALUE) return value;
    return NORMALIZED_DISTANCE_EXTENT * ((value - this.minValue) / this.valueRange - 0.5);
  }
}
