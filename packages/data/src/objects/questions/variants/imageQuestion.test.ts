import { expect, test } from 'vitest';
import { Image, ImageQuestion, MISSING_VALUE, QUESTION_TYPE } from '../../../internal';
import { getTestData, getTestDataRoot } from '../../../testUtils';

const root = getTestDataRoot();
const questionData = getTestData().questions.questions;
const objData = questionData.find((q) => q.type === QUESTION_TYPE.Image);
if (!objData) throw new Error('Test setup error: Test data does not contain a Image question');

test('Should assert value and not be matchable', () => {
  const obj = root.getQuestion(objData.id) as ImageQuestion;
  expect(obj).toBeInstanceOf(ImageQuestion);

  const image: Image = {
    url: 'https://example.com/image.jpg',
    alt: 'Image description'
  };
  expect(obj.ensureValue(image)).toEqual(image);
  expect(obj.ensureValue({ foo: 'bar' })).toEqual(MISSING_VALUE);
  expect(obj.ensureValue([image])).toEqual(MISSING_VALUE);

  expect(obj.isMatchable).toBe(false);
  expect(() => obj.normalizeValue(image)).toThrow();
});
