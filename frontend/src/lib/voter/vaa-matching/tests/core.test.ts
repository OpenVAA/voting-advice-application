import {
  NORMALIZED_DISTANCE_EXTENT,
  type SignedNormalizedDistance,
  MISSING_VALUE,
  type Coordinate
} from 'vaa-shared';
import {MatchingSpace, Position} from '../src/space';

// For convenience
const maxVal: SignedNormalizedDistance = NORMALIZED_DISTANCE_EXTENT / 2;
const minVal: SignedNormalizedDistance = -maxVal;
const weights = [1, 2, 3];
const ms = new MatchingSpace(weights);
const coords: Array<Coordinate> = [minVal, maxVal, MISSING_VALUE];
const wrongCoords: Array<Coordinate> = [minVal, maxVal, MISSING_VALUE, maxVal];

test('MatchingSpace', () => {
  expect(ms.dimensions).toBe(3);
  expect(ms.maxDistance).toBe(6);
});

test('Position', () => {
  const position = new Position(coords, ms);
  expect(position.dimensions).toBe(3);
  expect(() => new Position(wrongCoords, ms)).toThrowError();
});
