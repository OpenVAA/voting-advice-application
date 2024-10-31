import type {CoordinateOrMissing, Id} from 'vaa-core';
import {OrdinalQuestion} from 'vaa-matching';

/**
 * A dummy question object for matching.
 */
export class LikertQuestion extends OrdinalQuestion {
  public readonly category: QuestionCategoryProps;
  constructor({id, values, category}: LikertQuestionOptions) {
    super({id, values});
    this.category = category;
  }

  normalizeValue(value: number | undefined): CoordinateOrMissing {
    // The current frontend implemenation of questions uses numbers for choice keys
    return super.normalizeValue(Number.isFinite(value) ? `${value}` : undefined);
  }
}
/**
 * Options for a dummy question object for matching.
 */
interface LikertQuestionOptions {
  id: Id;
  values: ConstructorParameters<typeof OrdinalQuestion>[0]['values'];
  category: QuestionCategoryProps;
}
