import {expect, test} from 'vitest';
import {mean, median} from '../matching';

test('Mean and median', () => {
  expect(mean([1, 2, 2, 2, 10]), 'Mean').toEqual((1 + 2 + 2 + 2 + 10) / 5);
  expect(median([1, 2, 2, 2, 10]), 'Median').toEqual(2);
  expect(median([1, 2, 3, 10]), 'Median with even number of items').toEqual(2.5);
  expect(() => mean([]), 'Mean should throw on empty list').toThrow();
  expect(() => median([]), 'Mean should throw on empty list').toThrow();
});
