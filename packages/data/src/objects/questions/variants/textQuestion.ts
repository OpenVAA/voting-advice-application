import { ensureString, Question, QUESTION_TYPE } from '../../../internal';

/**
 * A non-matchable simple question whose answer is a string.
 */
export class TextQuestion extends Question<typeof QUESTION_TYPE.Text> {
  protected _ensureValue(value: NonNullable<unknown>) {
    return ensureString(value);
  }
}
