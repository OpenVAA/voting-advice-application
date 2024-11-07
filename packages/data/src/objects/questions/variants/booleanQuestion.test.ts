import { expect, test } from 'vitest';
import { BooleanQuestion, COORDINATE, MISSING_VALUE, QUESTION_TYPE } from '../../../internal';
import { getTestData, getTestDataRoot } from '../../../testUtils';

const root = getTestDataRoot();
const questionData = getTestData().questions.questions;
const objData = questionData.find((q) => q.type === QUESTION_TYPE.Boolean);
if (!objData) throw new Error('Test setup error: Test data does not contain a Boolean question');

test('Should assert and normalize value', () => {
  const obj = root.getQuestion(objData.id) as BooleanQuestion;
  expect(obj).toBeInstanceOf(BooleanQuestion);

  expect(obj.ensureValue(true)).toEqual(true);
  expect(obj.ensureValue(999)).toEqual(MISSING_VALUE);
  expect(obj.ensureValue([false])).toEqual(MISSING_VALUE);

  expect(obj.isMatchable).toBe(true);
  expect(obj.normalizeValue(false)).toEqual(COORDINATE.Min);
  expect(obj.normalizeValue(true)).toEqual(COORDINATE.Max);
});
