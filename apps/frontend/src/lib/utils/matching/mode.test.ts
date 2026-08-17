import { describe } from 'vitest';
import { mode } from './mode';

describe('mode', () => {
  test('Should throw an error when the input array is empty', () => {
    expect(() => mode([])).toThrow('Cannot calculate mode of an empty list.');
  });

  test('Should return the single element when the input array contains only one element', () => {
    const singleElementArray = [42];
    expect(mode(singleElementArray)).toEqual(42);
  });

  test('Should return the element itself when all elements in the array are the same', () => {
    const identicalElementsArray = [7, 7, 7, 7, 7];
    expect(mode(identicalElementsArray)).toEqual(7);
  });

  test('Should return the most frequent element', () => {
    const arrayWithMode = [1, 2, 2, 3, 3, 3, 4];
    expect(mode(arrayWithMode)).toEqual(3);
  });

  test('Should return the correct mode for an array with negative numbers', () => {
    const arrayWithNegativeNumbers = [-1, -2, -2, -3, -1, -1, -1];
    expect(mode(arrayWithNegativeNumbers)).toEqual(-1);
  });

  test('Should return the first encountered element when the most frequency is tied', () => {
    const arrayWithTiedMode = [1, 2, 2, 3, 3];
    expect(mode(arrayWithTiedMode)).toEqual(2);
  });

  test('Should return the correct mode for an array with floating point numbers', () => {
    const arrayWithFloats = [1.1, 2.2, 2.2, 3.3, 4.4, 2.2];
    expect(mode(arrayWithFloats)).toEqual(2.2);
  });

  test('Should return the correct mode for an array with mixed data types', () => {
    const mixedArray = [1, 'a', 'a', 2, 3, 'a', 3, 3];
    expect(mode(mixedArray)).toEqual('a');
  });

  test('Should handle object literals correctly', () => {
    const object1 = { key: 'value1' };
    const object2 = { key: 'value2' };
    const arrayWithObjects = [object1, object2, object1, object1, object2];
    expect(mode(arrayWithObjects)).toEqual(object1);
  });
});
