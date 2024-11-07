import { ensureArray, ensureString, Question, QUESTION_TYPE } from '../../../internal';

/**
 * A non-matchable question whose answer is an array of strings.
 */
export class MultipleTextQuestion extends Question<typeof QUESTION_TYPE.MultipleText> {
  protected _ensureValue(value: NonNullable<unknown>) {
    return ensureArray(value, (v) => ensureString(v));
  }
}
