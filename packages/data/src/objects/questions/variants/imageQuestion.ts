import { ensureImage, Question, QUESTION_TYPE } from '../../../internal';

/**
 * A non-matchable simple question whose answer is an Image object.
 */
export class ImageQuestion extends Question<typeof QUESTION_TYPE.Image> {
  protected _ensureValue(value: NonNullable<unknown>) {
    return ensureImage(value);
  }
}
