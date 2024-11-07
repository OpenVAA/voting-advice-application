import {
  type CoordinateOrMissing,
  type Id,
  type MatchableQuestion,
  MISSING_VALUE,
  normalizeCoordinate
} from '@openvaa/core';

interface MultipleChoiceValue {
  id: Id;
  value: number;
}

/**
 * An example implementation for an ordinal multiple choice questions, such as a Likert question. Ordinality means that the question’s values can be ordered and compared to each other. If this is not the case, use a `CategoricalQuestion` instead.
 */
export class OrdinalQuestion implements MatchableQuestion {
  readonly id: Id;
  readonly maxValue: number;
  readonly minValue: number;
  readonly normalizedDimensions = 1;
  readonly values: ReadonlyArray<MultipleChoiceValue>;
  [key: string]: unknown;

  /**
   * @param id Unique id
   * @param values Array of objects with a value property
   */
  constructor({ id, values }: { id: Id; values: ReadonlyArray<MultipleChoiceValue> }) {
    if (values.length < 2) throw new Error('There must be at least 2 values in the values array.');
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
   * Used to convert answers to the question into normalized distances for used in matching.
   * @param value A question's native value
   * @returns The value in the signed normalized range (e.g. [-.5, .5])
   */
  normalizeValue(value: unknown): CoordinateOrMissing {
    if (value == null) return MISSING_VALUE;
    if (!(typeof value === 'string')) throw new Error(`Value must be a string! Got ${typeof value}`);
    const choiceValue = this.values.find((v) => v.id === value)?.value;
    if (choiceValue == null) throw new Error(`Choice with id ${value} not found in question.`);
    return normalizeCoordinate({ value: choiceValue, min: this.minValue, max: this.maxValue });
  }

  /**
   * Utility for creating Likert questions.
   * @param scale The number of options to show
   * @returns A OrdinalQuestion object
   */
  static fromLikert({ id, scale }: { id: string; scale: number }): OrdinalQuestion {
    if (!Number.isSafeInteger(scale)) throw new Error('Scale must be an integer.');
    const values = Array.from({ length: scale }, (_, i) => ({
      id: `choice_${i + 1}`,
      value: i + 1
    }));
    return new OrdinalQuestion({ id, values });
  }
}
