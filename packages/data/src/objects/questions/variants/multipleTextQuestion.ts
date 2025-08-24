import { ensureArray, ensureString, OBJECT_TYPE, Question } from '../../../internal';
import type { QUESTION_TYPE } from '../../../internal';

/**
 * A non-matchable question whose answer is an array of strings.
 */
export class MultipleTextQuestion extends Question<typeof QUESTION_TYPE.MultipleText> {
  readonly objectType = OBJECT_TYPE.MultipleTextQuestion;

  protected _ensureValue(value: NonNullable<unknown>) {
    return ensureArray(value, (v) => ensureString(v));
  }
}
