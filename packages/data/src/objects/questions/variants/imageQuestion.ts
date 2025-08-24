import { ensureImage, OBJECT_TYPE, Question } from '../../../internal';
import type { QUESTION_TYPE } from '../../../internal';

/**
 * A non-matchable simple question whose answer is an Image object.
 */
export class ImageQuestion extends Question<typeof QUESTION_TYPE.Image> {
  readonly objectType = OBJECT_TYPE.ImageQuestion;

  protected _ensureValue(value: NonNullable<unknown>) {
    return ensureImage(value);
  }
}
