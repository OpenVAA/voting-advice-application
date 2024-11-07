import { describe, expect, test } from 'vitest';
import { removeDuplicates } from './removeDuplicates';

describe('removeDuplicates', () => {
  test('should return the same array when the input has no duplicates', () => {
    const input = [1, 2, 3, 4, 5];
    const result = removeDuplicates(input);
    expect(result).toEqual(input);
  });

  test('Should remove all duplicate elements from an array of strings', () => {
    const input = ['apple', 'banana', 'apple', 'orange', 'banana'];
    const expectedOutput = ['apple', 'banana', 'orange'];
    const result = removeDuplicates(input);
    expect(result).toEqual(expectedOutput);
  });
});
