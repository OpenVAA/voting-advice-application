import { describe } from 'vitest';
import { mean } from './mean';

describe('mean', () => {
  test('Should return the correct mean for an array containing both positive and negative integers', () => {
    expect(mean([10, -10, 20, -20, 30, -30])).toBe(0);
  });

  test('Should throw an error when the input array is empty', () => {
    expect(() => mean([])).toThrow('Cannot calculate mean of an empty list.');
  });

  test('Should return the correct mean for an array with a single element', () => {
    expect(mean([42])).toBe(42);
  });
});
