import { describe, expect, test } from 'vitest';
import { MockQuestion } from './utils';
import { coordinatesShape, createSubspace, equalShapes, flatten, MatchingSpace, Position, reshape } from '../src/space';

test('Shape', () => {
  expect(coordinatesShape([1, 1, undefined]), 'flat shape with').toEqual([1, 1, 1]);
  expect(coordinatesShape([1, undefined, [1, 1, 1]]), 'shape with subdimension').toEqual([1, 1, 3]);
  expect(flatten([1, 1, undefined]), 'flattened flat shape').toEqual([1, 1, undefined]);
  expect(flatten([1, undefined, [1, 1, 1]]), 'flattened shape with subdimension').toEqual([1, undefined, 1, 1, 1]);
  expect(equalShapes([1, 1, 1], [1, 1, 1]), 'equal shapes').toBe(true);
  expect(equalShapes([1, 1, 3], [1, 1, 3]), 'equal shapes').toBe(true);
  expect(equalShapes([1, 1, 1], [1, 1, 3]), 'different shapes').toBe(false);
  expect(equalShapes([1, 1, 1], [1, 1, 1, 1]), 'different shapes').toBe(false);
  expect(reshape({ flat: [1, 2, 3, 4, 5, 6], shape: [1, 1, 3, 1] }), 'reshape').toEqual([1, 2, [3, 4, 5], 6]);
  const coords = [1, undefined, [1, 1, 1]];
  expect(
    reshape({ flat: flatten(coords), shape: coordinatesShape(coords) }),
    'reshape flattened to original shape'
  ).toEqual(coords);
  expect(() => reshape({ flat: [1, 2, 3, 4, 5, 6], shape: [1, 1, 3, 1, 2] }), 'illegal reshape').toThrow();
});

test('MatchingSpace', () => {
  expect(new MatchingSpace({ shape: [1, 1, 3] }).shape, 'fully defined shape').toEqual([1, 1, 3]);
  expect(new MatchingSpace({ shape: 3 }).shape, 'shape as number of dimensions').toEqual([1, 1, 1]);
  expect(new MatchingSpace({ shape: [1, 1, 3] }).weights, 'uniform weights by default').toEqual([1, 1, 1]);
  expect(new MatchingSpace({ shape: 3 }).weights, 'uniform weights by default').toEqual([1, 1, 1]);
  expect(new MatchingSpace({ shape: 3, weights: [1, 2, 3] }).weights, 'fully defined weights').toEqual([1, 2, 3]);
  expect(() => new MatchingSpace({ shape: 3, weights: [1, 2, 3, 4] }), 'incompatible weights and shape').toThrow();
  const dimensions = [1, 1, 3];
  const weights = [1, 2, 3];
  const questions = dimensions.map((i) => new MockQuestion(i));
  describe('MatchingSpace.fromQuestions', () => {
    const questionWeights = Object.fromEntries(questions.map((q, i) => [q.id, weights[i]]));
    delete questionWeights[2];
    const expected = [weights[0], weights[1], 1]; // the last should default to one
    expect(MatchingSpace.fromQuestions({ questions }).shape, 'to have correct dimensions').toEqual(dimensions);
    expect(
      MatchingSpace.fromQuestions({ questions, questionWeights }).weights,
      'to have specified weights defaulting to one'
    ).toEqual(expected);
  });
  const space = new MatchingSpace({ shape: 3, weights: [1, 1, 1] });
  expect(
    space.isCompatible(new MatchingSpace({ shape: 3, weights: [1, 2, 3] })),
    'compatible with different weights'
  ).toBe(true);
  expect(space.isCompatible(new MatchingSpace({ shape: 4 })), 'incompatible with different shape').toBe(false);
  expect(space.isCompatible([1, 1, undefined]), 'compatible with coordinates of same shape').toBe(true);
  expect(space.isCompatible([1, 1, [1, 2, 3]]), 'incompatible with coordinates of different shape').toBe(false);
});

test('Position', () => {
  const space = new MatchingSpace({ shape: [1, 1, 3] });
  const coordinates = [1, 1, [1, 2, undefined]];
  const wrongCoords = [1, 1, [1, 2]];
  const position = new Position({ coordinates, space });
  expect(position.shape, 'position shape').toEqual([1, 1, 3]);
  expect(() => new Position({ coordinates: wrongCoords, space }), 'mismatching coordinates and space').toThrow();
});

test('createSubspace', () => {
  const dimensions = [1, 1, 3];
  const questions = dimensions.map((i) => new MockQuestion(i));
  expect(
    createSubspace({ questions, subset: questions.slice(1) }).weights,
    'weights outside subset to be zero'
  ).toEqual([0, 1, 1]);
});
