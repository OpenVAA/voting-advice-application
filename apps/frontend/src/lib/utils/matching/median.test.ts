import { describe } from 'vitest';
import { median } from './median';

describe('median', () => {
  test('Should throw an error when the input array is empty', () => {
    expect(() => median([])).toThrow('Cannot calculate median of an empty list.');
  });

  test('Should return the single element when the input array has one element', () => {
    expect(median([42])).toBe(42);
  });

  test('Should return the median for an array containing both negative and positive integers', () => {
    expect(median([2, -1, -3, 4, 6])).toBe(2);
  });

  test('Should return the median for an even-length array of positive integers', () => {
    expect(median([3, 5, 1, 7])).toBe(4);
  });

  test('Should return the median for an odd-length array of negative integers', () => {
    expect(median([-5, -9, -1, -3, -7])).toBe(-5);
  });
});
