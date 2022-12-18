import { expect, test } from 'vitest'
import { MatchingSpace, MatchingSpaceCoordinate, MatchingSpacePosition, MISSING_VALUE, 
    NORMALIZED_DISTANCE_EXTENT, SignedNormalizedDistance } from '.';

// For convenience
const maxDist = NORMALIZED_DISTANCE_EXTENT;
const maxVal: SignedNormalizedDistance = NORMALIZED_DISTANCE_EXTENT / 2;
const minVal: SignedNormalizedDistance = -maxVal;
const weights = [1, 2, 3];
const ms = new MatchingSpace(weights);
const coords: MatchingSpaceCoordinate[] = [minVal, maxVal, MISSING_VALUE];
const wrongCoords: MatchingSpaceCoordinate[] = [minVal, maxVal, MISSING_VALUE, maxVal];

test('MatchingSpace', () => {
    expect(ms.dimensions).toBe(3);
    expect(ms.maxDistance).toBe(6);
});

test('MatchingSpacePosition', () => {
    const position = new MatchingSpacePosition(coords, ms);
    expect(position.dimensions).toBe(3);
    expect(() => new MatchingSpacePosition(wrongCoords, ms)).toThrowError();
});