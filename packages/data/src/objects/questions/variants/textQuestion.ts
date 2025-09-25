import { ensureString, OBJECT_TYPE, Question } from '../../../internal';
import type { QUESTION_TYPE } from '../../../internal';

/**
 * A non-matchable simple question whose answer is a string.
 */
export class TextQuestion extends Question<typeof QUESTION_TYPE.Text> {
  readonly objectType = OBJECT_TYPE.TextQuestion;

  protected _ensureValue(value: NonNullable<unknown>) {
    return ensureString(value);
  }
}
