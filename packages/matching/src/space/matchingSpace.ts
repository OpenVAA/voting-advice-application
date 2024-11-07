import { coordinatesShape, equalShapes, type Shape } from './shape';
import type { Id, MatchableQuestion } from '@openvaa/core';
import type { Position, PositionCoordinates } from './position';

export class MatchingSpace {
  /**
   * A space wherein the matching distances are measured.
   * The `MatchingSpace` consists of a number of dimensions, which can be weighted and which may have subdimensions. The subdimensions are used for questions which cannot be represented by a single dimension, such as, categorical questions with more than two options and preference order questions.
   * The answers of an entity are converted into `Position`s in this space such that each answer is represented by a `Coordinate` in the dimension for that question, or `Coordinate`s in each of its subdimensions if these exist. For this conversion, the `normalizeValue` method of the relevant `MatchableQuestion` is relied on.
   * Note that the `Coordinate` may also be missing in which case the `imputeMissingValue` function is used when matching.
   */

  /**
   * The number of subdimensions for each dimensions in this space.
   */
  readonly shape: Shape;
  /**
   * The weights for each first-order dimension in this space.
   */
  weights: Array<number>;

  /**
   * Define a space for matching.
   * @param shape - Either the number of flat dimensions or an array containing the number of subdimensions for each dimension.
   * @param weights - Optional weights to use for matching for each first-order dimension in this space. Default: 1 for each dimension.
   */
  constructor({ shape, weights }: { shape: number | Shape; weights?: Array<number> }) {
    if (typeof shape === 'number') shape = Array.from({ length: shape }, () => 1);
    weights ??= Array.from({ length: shape.length }, () => 1);
    if (shape.length !== weights.length) throw new Error('Shape and weights must have the same length');
    this.shape = shape;
    this.weights = weights;
  }

  /**
   * Check if this space is compatible with another `MatchingSpace`, `Position` or `PositionCoordinates`, i.e. that their dimensionality is the same but their weights may differ.
   */
  isCompatible(target: MatchingSpace | Position | PositionCoordinates): boolean {
    const targetShape: Shape = 'shape' in target ? target.shape : coordinatesShape(target);
    return equalShapes(this.shape, targetShape);
  }

  /**
   * Create a `MatchingSpace` from a list of `MatchableQuestion`s with possible weighting.
   * @param questions - The questions that defined the dimensions of the space.
   * @param questionWeights - A full or partial record of question weights by id. If not specified at all or a given question, the weights default to 1. Note that weights for subdimensions cannot be supplied.
   */
  static fromQuestions({
    questions,
    questionWeights
  }: {
    questions: ReadonlyArray<MatchableQuestion>;
    questionWeights?: Record<Id, number>;
  }): MatchingSpace {
    const shape = new Array<number>(questions.length);
    const weights = new Array<number>(questions.length);
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      shape[i] = q.normalizedDimensions ?? 1;
      weights[i] = questionWeights?.[q.id] ?? 1;
    }
    return new MatchingSpace({ shape, weights });
  }
}
