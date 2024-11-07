import { COORDINATE, MISSING_VALUE } from '@openvaa/core';
import { describe, expect, test } from 'vitest';
import { CategoricalQuestion, OrdinalQuestion } from '../src/question';

describe('categoricalQuestion', () => {
  test('binary question and missing values', () => {
    const values = [{ id: 'no' }, { id: 'yes' }];
    const question = new CategoricalQuestion({ id: 'q1', values });
    expect(question.normalizeValue('no')).toBe(COORDINATE.Min);
    expect(question.normalizeValue('yes')).toBe(COORDINATE.Max);
    expect(question.normalizeValue(undefined)).toBe(MISSING_VALUE);
    expect(() => question.normalizeValue('missing id')).toThrow();
  });
  test('multiple dimensions', () => {
    const values = [{ id: 'red' }, { id: 'blue' }, { id: 'green' }];
    const question = new CategoricalQuestion({ id: 'q1', values });
    expect(question.normalizeValue('red')).toEqual([COORDINATE.Max, COORDINATE.Min, COORDINATE.Min]);
    expect(question.normalizeValue('green')).toEqual([COORDINATE.Min, COORDINATE.Min, COORDINATE.Max]);
    expect(question.normalizeValue(undefined)).toEqual(values.map(() => MISSING_VALUE));
  });
});

test('ordinalQuestion', () => {
  const question = OrdinalQuestion.fromLikert({ id: 'q1', scale: 5 });
  const { values } = question;
  expect(question.normalizeValue(values[0].id)).toBe(COORDINATE.Min);
  expect(question.normalizeValue(values[2].id)).toBe(COORDINATE.Neutral);
  expect(question.normalizeValue(values[4].id)).toBe(COORDINATE.Max);
  expect(question.normalizeValue(undefined)).toBe(MISSING_VALUE);
  expect(() => question.normalizeValue('missing id')).toThrow();
});
