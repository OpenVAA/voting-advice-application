import { COORDINATE, type CoordinateOrMissing, type Id, type MatchableQuestion, MISSING_VALUE } from '@openvaa/core';

interface MultipleChoiceValue {
  id: Id;
}

/**
 * An example implementation for categorical multiple choice questions. Categorality means that the question’s values cannot be ordered. For example, if the question and answering choices are "Favourite color?" and red, blue or green, this means that the matching distance between "red" and "blue" is the same as between "red" and "green".
 * NB. The mathematical model we use treats categorical questions as a combination of `n` binary choices or dimensions where `n` is the number of choices, unless `n` is 2, in which case a single dimension suffices. Because of this, categorical questions will **only yield distances of `[0, 2/n]` where `n` is the number of choices**, i.e., for the favourite color example, the match score can only be 100% in case of agreement or ~33% for disagreement. For binary questions, the range is 0–100%.
 * This behavior is semantically motivated by the treatment of the questions as binary choices. In the example, this would map to in case of A answering "red" and B, "blue":
 * - Red is favored?:   A yes, B no  => disagree
 * - Blue is favored?:  A no,  B yes => disagree
 * - Green is favored?: A no,  B no  => agree
 * Thus, the respondents disagree on two counts but agree on one. In contrast, had they given the same answer, agreement would be perfect regardless of the number of choices.
 * If such behavior limited in the level of disagreement is not what you want, this can be partially remedied by increasing the question weight to `n/2`. Note, however, that this will correct its weighting compared to other questions, but it will not yield full disagreement when looking at the question in isolation because the matching algorithm will normalise the distance using the maximum possible distance after computing it.
 */
export class CategoricalQuestion implements MatchableQuestion {
  readonly id: Id;
  readonly values: ReadonlyArray<MultipleChoiceValue>;
  [key: string]: unknown;

  /**
   * @param id Unique id
   * @param values Array of objects with a value property
   * @param ordinal Whether the question is ordinal (e.g. Likert scale) @default true
   */
  constructor({ id, values }: { id: Id; values: ReadonlyArray<MultipleChoiceValue> }) {
    if (values.length < 2) throw new Error('There must be at least 2 values in the values array.');
    this.id = id;
    this.values = values;
  }

  /**
   * Binary questions are treated as one-dimensional, but others have multiple dimensions.
   */
  get normalizedDimensions(): number {
    return this.values.length === 2 ? 1 : this.values.length;
  }

  /**
   * Used to convert answers to the question into normalized distances for used in matching.
   * @param value A question's native value
   * @returns The value in the signed normalized range (e.g. [-.5, .5])
   */
  normalizeValue(value: unknown): CoordinateOrMissing | Array<CoordinateOrMissing> {
    if (value == null) return this.values.length === 2 ? MISSING_VALUE : this.values.map(() => MISSING_VALUE);
    if (!(typeof value === 'string')) throw new Error(`Value must be a string! Got ${typeof value}`);
    const choice = this.values.find((v) => v.id === value);
    if (choice == null) throw new Error(`Choice with id ${value} not found in question.`);
    // The mathematical model we use treats categorical questions as a combination of `n` binary choices or dimensions where `n` is the number of choices, unless `n` is 2, in which case a single dimension suffices.
    if (this.values.length === 2) return this.values.indexOf(choice) === 0 ? COORDINATE.Min : COORDINATE.Max;
    // Otherwise, create subdmensions where we assign the max value to the selected choice and min to others
    return this.values.map((v) => (v === choice ? COORDINATE.Max : COORDINATE.Min));
  }
}
