import { expect, test } from 'vitest';
import { COORDINATE, normalizeCoordinate } from '../../src/matching/distance';

test('normalizeCoordinate', () => {
  expect(normalizeCoordinate({ value: 0, min: -10, max: 10 })).toEqual(COORDINATE.Neutral);
  expect(normalizeCoordinate({ value: -10, min: -10, max: 10 })).toEqual(COORDINATE.Min);
  expect(normalizeCoordinate({ value: 10, min: -10, max: 10 })).toEqual(COORDINATE.Max);
  expect(normalizeCoordinate({ value: 5, min: -10, max: 10 })).toEqual(
    COORDINATE.Neutral + 0.5 * (COORDINATE.Max - COORDINATE.Neutral)
  );
});
