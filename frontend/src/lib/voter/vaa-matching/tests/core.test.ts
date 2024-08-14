import {NORMALIZED_DISTANCE_EXTENT, type SignedNormalizedDistance, MISSING_VALUE} from 'vaa-shared';
import {MatchingSpace, MatchingSpacePosition, type MatchingSpaceCoordinate} from '../src/space';

// For convenience
const maxVal: SignedNormalizedDistance = NORMALIZED_DISTANCE_EXTENT / 2;
const minVal: SignedNormalizedDistance = -maxVal;
const weights = [1, 2, 3];
const ms = new MatchingSpace(weights);
const coords: Array<MatchingSpaceCoordinate> = [minVal, maxVal, MISSING_VALUE];
const wrongCoords: Array<MatchingSpaceCoordinate> = [minVal, maxVal, MISSING_VALUE, maxVal];

test('MatchingSpace', () => {
  expect(ms.dimensions).toBe(3);
  expect(ms.maxDistance).toBe(6);
});

test('MatchingSpacePosition', () => {
  const position = new MatchingSpacePosition(coords, ms);
  expect(position.dimensions).toBe(3);
  expect(() => new MatchingSpacePosition(wrongCoords, ms)).toThrowError();
});
