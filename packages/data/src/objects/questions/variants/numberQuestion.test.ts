import { expect, test } from 'vitest';
import { COORDINATE, MISSING_VALUE, NumberQuestion, QUESTION_TYPE } from '../../../internal';
import { getTestData, getTestDataRoot } from '../../../testUtils';

const root = getTestDataRoot();
const questionData = getTestData().questions.questions;
const objData = questionData.find((q) => q.type === QUESTION_TYPE.Number);
if (!objData) throw new Error('Test setup error: Test data does not contain a Number question');

test('Should require min and max for normalization', () => {
  const obj = root.getQuestion(objData.id) as NumberQuestion;
  expect(obj).toBeInstanceOf(NumberQuestion);

  obj.data.min = undefined;
  expect(obj.isMatchable).toEqual(false);
  expect(() => obj.normalizeValue(50)).toThrow();

  obj.data.min = 0;
  obj.data.max = 100;
  expect(obj.isMatchable).toEqual(true);
});

test('Should assert and normalize value', () => {
  const obj = root.getQuestion(objData.id) as NumberQuestion;

  obj.data.min = 0;
  obj.data.max = 100;

  const number = 50;
  expect(obj.ensureValue(number)).toBe(number);
  expect(obj.ensureValue(`${number}`)).toBe(number);
  expect(obj.ensureValue('INVALID NUMBER')).toEqual(MISSING_VALUE);
  expect(obj.ensureValue([number])).toEqual(MISSING_VALUE);

  expect(obj.normalizeValue(obj.data.min)).toEqual(COORDINATE.Min);
  expect(obj.normalizeValue(obj.data.max)).toEqual(COORDINATE.Max);
  expect(obj.normalizeValue(number)).toBeGreaterThan(COORDINATE.Min);
  expect(obj.normalizeValue(number)).toBeLessThan(COORDINATE.Max);
  expect(() => obj.normalizeValue(-100), 'Value out of bounds').toThrow();
  expect(() => obj.normalizeValue(200), 'Value out of bounds').toThrow();
});
