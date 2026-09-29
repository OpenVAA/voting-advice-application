import { describe, expect, test } from 'vitest';
import { sameRefs } from './sameRefs';

describe('sameRefs', () => {
  const first = { id: 'a' };
  const second = { id: 'b' };

  test('two empty arrays are the same', () => {
    expect(sameRefs([], [])).toBe(true);
  });

  test('the same elements by reference in the same order are the same', () => {
    expect(sameRefs([first, second], [first, second])).toBe(true);
  });

  test('arrays of different lengths differ', () => {
    expect(sameRefs([first], [first, second])).toBe(false);
  });

  test('an element that is equal by value but a different object differs', () => {
    expect(sameRefs([first, second], [first, { id: 'b' }])).toBe(false);
  });

  test('the same elements in a different order differ', () => {
    expect(sameRefs([first, second], [second, first])).toBe(false);
  });
});
