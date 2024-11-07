import { describe, expect, test } from 'vitest';
import { isEmptyValue } from '../internal';

describe('isEmptyValue', () => {
  test('Should return true when the input is null', () => {
    expect(isEmptyValue(null)).toBe(true);
  });
  test('Should return true when the input is undefined', () => {
    expect(isEmptyValue(undefined)).toBe(true);
  });
  test('Should return true when the input is an empty string', () => {
    expect(isEmptyValue('')).toBe(true);
  });
  test('Should return true when the input is a string with only whitespace', () => {
    expect(isEmptyValue('   ')).toBe(true);
  });
  test('Should return true when the input is an empty array', () => {
    expect(isEmptyValue([])).toBe(true);
  });
  test('Should return false when the input is a non-empty array', () => {
    expect(isEmptyValue([1, 2, 3])).toBe(false);
  });
  test('Should return true when the input is an empty object', () => {
    expect(isEmptyValue({})).toBe(true);
  });
  test('Should return true when the input is a Date object with an invalid date', () => {
    expect(isEmptyValue(new Date('invalid-date'))).toBe(true);
  });
});
