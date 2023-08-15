import {NORMALIZED_DISTANCE_EXTENT} from '../core/distances';
import {MISSING_VALUE} from '../core/matchableValue';
import type {MatchableValue, NonmissingValue} from '../core/matchableValue';
import type {MatchingSpaceCoordinate} from '../core/matchingSpacePosition';
import type {MatchableQuestion} from './matchableQuestion';

/**
 * A value option in a matchable multiple choice question
 */
export interface MultipleChoiceOption {
  value: NonmissingValue;
}

/**
 * Consructor options for MultipleChoiceQuestion
 */
export interface MultipleChoiceQuestionOptions {
  id: string;
  values: readonly MultipleChoiceOption[];
}

/**
 * An example class for multiple choice questions, including Likert-scale ones
 */
export class MultipleChoiceQuestion implements MatchableQuestion {
  readonly id: string;
  readonly normalizedDimensions = 1;
  readonly values: readonly MultipleChoiceOption[];

  constructor({id, values}: MultipleChoiceQuestionOptions) {
    this.id = id;
    this.values = values;
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

  get valueRange(): number {
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

  /**
   * Utitility for creating Likert scale questions.
   * @param scale The number of options for the Likert scale
   * @returns A MultipleChoiceQuestion object
   */
  static fromLikertScale(id: string, scale: number): MultipleChoiceQuestion {
    if (!Number.isSafeInteger(scale)) throw new Error('Scale must be an integer.');
    const values: MultipleChoiceOption[] = Array.from({length: scale}, (_, i) => ({value: i + 1}));
    return new MultipleChoiceQuestion({id, values});
  }
}
