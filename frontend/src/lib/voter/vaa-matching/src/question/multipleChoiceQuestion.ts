import {NORMALIZED_DISTANCE_EXTENT} from '../distance';
import {MISSING_VALUE} from '../missingValue';
import type {MatchingSpaceCoordinate} from '../space';
import type {MatchableQuestion} from './matchableQuestion';

interface MultipleChoiceValue {
  value: number;
}

/**
 * An example implementation for multiple choice questions, including
 * Likert questions
 */
export class MultipleChoiceQuestion implements MatchableQuestion {
  readonly maxValue: number;
  readonly minValue: number;
  readonly normalizedDimensions = 1;
  [key: string]: unknown;

  /**
   * @param id Unique id
   * @param values Array of objects with a value property
   */
  constructor(
    readonly id: string,
    readonly values: MultipleChoiceValue[]
  ) {
    this.id = id;
    this.values = values;
    this.minValue = Math.min(...this.values.map((v) => v.value));
    this.maxValue = Math.max(...this.values.map((v) => v.value));
  }

  get neutralValue() {
    return this.minValue + this.valueRange / 2;
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
  normalizeValue(value: number | undefined | null): MatchingSpaceCoordinate {
    if (value == null) return MISSING_VALUE;
    if (!(typeof value === 'number'))
      throw new Error(`Value must be a number! Got ${typeof value}`);
    if (value < this.minValue || value > this.maxValue)
      throw new Error(`Value out of bounds [${this.minValue}, ${this.maxValue}]: ${value}`);
    return NORMALIZED_DISTANCE_EXTENT * ((value - this.minValue) / this.valueRange - 0.5);
  }

  /**
   * Utility for creating Likert questions.
   * @param scale The number of options to show
   * @returns A MultipleChoiceQuestion object
   */
  static fromLikert(id: string, scale: number) {
    if (!Number.isSafeInteger(scale)) throw new Error('Scale must be an integer.');
    const values = Array.from({length: scale}, (_, i) => ({value: i + 1}));
    return new MultipleChoiceQuestion(id, values);
  }
}
