import { expect, test } from 'vitest';
import { MISSING_VALUE, QUESTION_TYPE, TextQuestion } from '../../../internal';
import { getTestData, getTestDataRoot } from '../../../testUtils';

const root = getTestDataRoot();
const questionData = getTestData().questions.questions;
const objData = questionData.find((q) => q.type === QUESTION_TYPE.Text);
if (!objData) throw new Error('Test setup error: Test data does not contain a Text question');

test('Should assert value and not be matchable', () => {
  const obj = root.getQuestion(objData.id) as TextQuestion;
  expect(obj).toBeInstanceOf(TextQuestion);

  const text = 'Hello, World!';
  const number = 123;
  expect(obj.ensureValue(text)).toBe(text);
  expect(obj.ensureValue(number)).toBe(`${number}`);
  expect(obj.ensureValue(true)).toEqual(MISSING_VALUE);
  expect(obj.ensureValue([text])).toEqual(MISSING_VALUE);

  expect(obj.isMatchable).toBe(false);
  expect(() => obj.normalizeValue(text)).toThrow();
});
