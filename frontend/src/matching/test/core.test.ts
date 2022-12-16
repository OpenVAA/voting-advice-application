import { expect, test } from 'vitest'

import { MatchingSpace, MatchingSpaceCoordinate, MatchingSpacePosition, MISSING_VALUE } from '..';

const weights = [1, 2, 3];
const ms = new MatchingSpace(weights);
const coords: MatchingSpaceCoordinate[] = [-0.5, 0.5, MISSING_VALUE];
const wrongCoords: MatchingSpaceCoordinate[] = [-0.5, 0.5, MISSING_VALUE, 0.5];

test('MatchingSpace', () => {
    expect(ms.dimensions).toBe(3);
    expect(ms.maxDistance).toBe(6);
});

test('MatchingSpacePosition', () => {
    const position = new MatchingSpacePosition(coords, ms);
    expect(position.dimensions).toBe(3);
    expect(() => new MatchingSpacePosition(wrongCoords, ms)).toThrowError();
});