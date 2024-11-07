import { describe, expect, test } from 'vitest';
import { validateChoices } from './choice';
import { HasId } from '../internal';
describe('validateChoices', () => {
  test('Should return false when the input array has only less than two items', () => {
    const items = [{ id: '1' }];
    expect(validateChoices([])).toBe(false);
    expect(validateChoices(items)).toBe(false);
  });
  test('Should return false when any item in the array has a missing id', () => {
    const items = [{ id: '1' }, { id: '' }];
    expect(validateChoices(items)).toBe(false);
  });
  test('Should return false when any item in the array has an id that is an empty string', () => {
    const items = [{ id: '1' }, { id: '' }];
    expect(validateChoices(items)).toBe(false);
  });
  test('Should return false when any item in the array has an id that is not a string', () => {
    const items = [{ id: 1 }, { id: '2' }] as Array<HasId>;
    expect(validateChoices(items)).toBe(false);
  });
  test('Should return false when any item in the array has a duplicate id', () => {
    const items = [{ id: '1' }, { id: '1' }];
    expect(validateChoices(items)).toBe(false);
  });
  test('Should return true when all items have unique ids and the array has more than one item', () => {
    const items = [{ id: '1' }, { id: '2' }, { id: '3' }];
    expect(validateChoices(items)).toBe(true);
  });
});
