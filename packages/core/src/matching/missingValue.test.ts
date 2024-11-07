import { expect, test } from 'vitest';
import { isEmptyValue } from '../../src/matching/missingValue';

test('isEmptyValue', () => {
  expect(isEmptyValue(undefined), 'undefined to be empty').toBe(true);
  expect(isEmptyValue(null), 'null to be empty').toBe(true);
  expect(isEmptyValue(new Date('Invalid Date')), 'invalid date to be empty').toBe(true);
  expect(isEmptyValue([]), 'empty array').toBe(true);
  expect(isEmptyValue({}), 'empty object').toBe(true);
  expect(isEmptyValue({ a: '', b: null, c: [], d: {} }), 'object with only empty properties').toBe(true);
  expect(isEmptyValue('   '), 'string with only spaces').toBe(true);
  expect(isEmptyValue('a'), 'not empty').toBe(false);
  expect(isEmptyValue('1'), 'not empty').toBe(false);
  expect(isEmptyValue(new Date()), 'not empty').toBe(false);
  expect(isEmptyValue([1]), 'not empty').toBe(false);
  expect(isEmptyValue({ a: 1, b: null }), 'not empty').toBe(false);
});
