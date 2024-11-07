import { expect, test } from 'vitest';
import { COORDINATE, DateQuestion, MISSING_VALUE, QUESTION_TYPE } from '../../../internal';
import { getTestData, getTestDataRoot } from '../../../testUtils';

const root = getTestDataRoot();
const questionData = getTestData().questions.questions;
const objData = questionData.find((q) => q.type === QUESTION_TYPE.Date);
if (!objData) throw new Error('Test setup error: Test data does not contain a Date question');

test('Should require min and max for normalization', () => {
  const obj = root.getQuestion(objData.id) as DateQuestion;
  expect(obj).toBeInstanceOf(DateQuestion);

  obj.min = null;
  expect(obj.isMatchable).toEqual(false);
  expect(() => obj.normalizeValue(new Date())).toThrow();

  obj.min = new Date('2022-01-01');
  obj.max = new Date('2023-01-01');
  expect(obj.isMatchable).toEqual(true);
});

test('Should assert and normalize value', () => {
  const obj = root.getQuestion(objData.id) as DateQuestion;

  obj.min = new Date('2022-01-01');
  obj.max = new Date('2023-01-01');

  const dateString = '2022-06-01';
  const date = new Date(dateString);
  expect(obj.ensureValue(date)).toEqual(date);
  expect(obj.ensureValue(dateString)).toEqual(date);
  expect(obj.ensureValue('INVALID DATE')).toEqual(MISSING_VALUE);
  expect(obj.ensureValue([date])).toEqual(MISSING_VALUE);

  expect(obj.normalizeValue(obj.min)).toEqual(COORDINATE.Min);
  expect(obj.normalizeValue(obj.max)).toEqual(COORDINATE.Max);
  expect(obj.normalizeValue(date)).toBeGreaterThan(COORDINATE.Min);
  expect(obj.normalizeValue(date)).toBeLessThan(COORDINATE.Max);
  expect(() => obj.normalizeValue(new Date('1100-01-01')), 'Value out of bounds').toThrow();
  expect(() => obj.normalizeValue(new Date('2100-01-01')), 'Value out of bounds').toThrow();
});
