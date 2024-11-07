import { describe, expect, test } from 'vitest';
import {
  ensureArray,
  ensureBoolean,
  ensureDate,
  ensureId,
  ensureImage,
  ensureNumber,
  ensureString,
  ensureUnique
} from './ensureValue';
import { MISSING_VALUE } from '../internal';

const literals = ['true', 2, true, {}, new Date(), [], null, undefined];

describe('ensureString', () => {
  test('Should return the string value when the input is a valid string', () => {
    expect(ensureString('valid string')).toBe('valid string');
  });
  test('Should convert a number to a string when the input is a valid number', () => {
    expect(ensureString(123)).toBe('123');
  });
  test.each(literals.filter((v) => !(typeof v === 'string') && !(typeof v === 'number')))(
    'Should return MISSING_VALUE for %p',
    (value) => expect(ensureString(value)).toBe(MISSING_VALUE)
  );
});
describe('ensureId', () => {
  test('Should return the string value when the input is a valid string', () => {
    expect(ensureId('valid Id')).toBe('valid Id');
  });
  test('Should return MISSING_VALUE for an empty or whitespace string', () => {
    expect(ensureId('')).toBe(MISSING_VALUE);
    expect(ensureId('   ')).toBe(MISSING_VALUE);
  });
  test.each(literals.filter((v) => !(typeof v === 'string')))('Should return MISSING_VALUE for %p', (value) =>
    expect(ensureId(value)).toBe(MISSING_VALUE)
  );
});
describe('ensureNumber', () => {
  test('Should return the number value when the input is a valid number', () => {
    expect(ensureNumber(123)).toBe(123);
  });
  test('Should convert a string to a number when the input is a valid numeric string', () => {
    expect(ensureNumber('123')).toBe(123);
  });
  test('Should return MISSING_VALUE when the input is a non-numeric string', () => {
    expect(ensureNumber('abc')).toBe(MISSING_VALUE);
  });
  test.each(literals.filter((v) => !(typeof v === 'number')))('Should return MISSING_VALUE for %p', (value) =>
    expect(ensureNumber(value)).toBe(MISSING_VALUE)
  );
});
describe('ensureBoolean', () => {
  test('Should return the boolean value when the input is a valid boolean', () => {
    expect(ensureBoolean(true)).toBe(true);
    expect(ensureBoolean(false)).toBe(false);
  });
  test('Should convert 1 to true and 0 to false when the input is a valid number', () => {
    expect(ensureBoolean(1)).toBe(true);
    expect(ensureBoolean(0)).toBe(false);
  });
  test.each(literals.filter((v) => !(typeof v === 'boolean')))('Should return MISSING_VALUE for %p', (value) =>
    expect(ensureBoolean(value)).toBe(MISSING_VALUE)
  );
});
describe('ensureImage', () => {
  test('Should return the image value when the input is a valid image object', () => {
    const validImage = { url: 'http://example.com/image.jpg' };
    expect(ensureImage(validImage)).toBe(validImage);
  });
  test.each(literals)('Should return MISSING_VALUE for %p', (value) => expect(ensureImage(value)).toBe(MISSING_VALUE));
});
describe('ensureDate', () => {
  test('Should return the Date object when the input is a valid date string', () => {
    expect(ensureDate('2023-10-05')).toEqual(new Date('2023-10-05'));
  });
  test.each(literals.filter((v) => !(v instanceof Date) && !(typeof v === 'number')))(
    'Should return MISSING_VALUE for %p',
    (value) => expect(ensureDate(value)).toBe(MISSING_VALUE)
  );
});
describe('ensureArray', () => {
  test('Should return MISSING_VALUE when the input is not an array', () => {
    expect(ensureArray({ key: 'value' }, () => true)).toBe(MISSING_VALUE);
  });
  test('Should return an empty array when the input is an empty array', () => {
    expect(ensureArray([], ensureString)).toEqual([]);
  });
  test('Should return MISSING_VALUE when any item in the array is invalid according to ensureItem', () => {
    const invalidArray = [1, 'invalid', 3];
    expect(ensureArray(invalidArray, ensureNumber)).toBe(MISSING_VALUE);
  });
  test('Should return an array of converted items when all items are valid according to ensureItem', () => {
    const validArray = [1, '2', 3];
    const ensureItem = ensureNumber;
    const expectedArray = [1, 2, 3];
    expect(ensureArray(validArray, ensureItem)).toEqual(expectedArray);
  });
  test.each(literals.filter((v) => !Array.isArray(v)))('Should return MISSING_VALUE for %p', (value) =>
    expect(ensureArray(value, () => true)).toBe(MISSING_VALUE)
  );
});
describe('ensureUnique', () => {
  test('Should return the array when all elements are unique strings', () => {
    const uniqueStrings = ['a', 'b', 'c'];
    expect(ensureUnique(uniqueStrings)).toEqual(uniqueStrings);
  });
  test('Should return MISSING_VALUE when there are duplicate strings in the array', () => {
    const duplicateStrings = ['a', 'b', 'a'];
    expect(ensureUnique(duplicateStrings)).toBe(MISSING_VALUE);
  });
});
