import { expect, test } from 'vitest';
import { MISSING_VALUE, MultipleTextQuestion, QUESTION_TYPE } from '../../../internal';
import { getTestData, getTestDataRoot } from '../../../testUtils';

const root = getTestDataRoot();
const questionData = getTestData().questions.questions;
const objData = questionData.find((q) => q.type === QUESTION_TYPE.MultipleText);
if (!objData) throw new Error('Test setup error: Test data does not contain a MultipleText question');

test('Should assert value and not be matchable', () => {
  const obj = root.getQuestion(objData.id) as MultipleTextQuestion;
  expect(obj).toBeInstanceOf(MultipleTextQuestion);

  const texts = ['Text 1', 'Text 2', 'Text 3'];
  expect(obj.ensureValue(texts)).toEqual(texts);
  expect(obj.ensureValue('Text')).toEqual(MISSING_VALUE);
  expect(obj.ensureValue({ 0: 'Text 1', 1: 'Text 2' })).toEqual(MISSING_VALUE);

  expect(obj.isMatchable).toBe(false);
  expect(() => obj.normalizeValue(texts)).toThrow();
});
