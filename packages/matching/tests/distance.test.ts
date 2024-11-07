import { COORDINATE } from '@openvaa/core';
import { describe, expect, test } from 'vitest';
import { MockQuestion } from './utils';
import { measureDistance } from '../src/distance/measure';
import {
  absoluteKernel,
  basicDivision,
  basicSum,
  directionalDistance,
  directionalKernel,
  DISTANCE_METRIC,
  euclideanDistance,
  euclideanSubdimWeight,
  euclideanSum,
  manhattanDistance
} from '../src/distance/metric';
import { MISSING_VALUE_METHOD } from '../src/missingValue';
import { createSubspace, MatchingSpace, Position } from '../src/space';
import type { DistanceMeasurementOptions } from '../src/distance';

// For convenience
const neutral = COORDINATE.Neutral;
const max = COORDINATE.Max;
const min = COORDINATE.Min;
const half = COORDINATE.Extent / 2;
const full = COORDINATE.Extent;
const halfMin = neutral + 0.5 * (min - neutral); // I.e. somewhat disagree
const halfMax = neutral + 0.5 * (max - neutral); // I.e. somewhat agree

describe('metric: kernels', () => {
  test('absoluteKernel', () => {
    expect(absoluteKernel(-max, max)).toBeCloseTo(2 * Math.abs(max));
    expect(absoluteKernel(max, -max), 'to be commutable').toBeCloseTo(2 * Math.abs(max));
    expect(absoluteKernel(max, max)).toBeCloseTo(0);
  });
  test('directionalKernel', () => {
    expect(directionalKernel(min, max)).toBeCloseTo(full);
    expect(directionalKernel(max, min), 'to be commutable').toBeCloseTo(full);
    expect(directionalKernel(neutral, max), 'to be half when either value is neutral').toBeCloseTo(half);
    expect(directionalKernel(min, neutral), 'to be half when either value is neutral 2').toBeCloseTo(half);
    expect(directionalKernel(neutral, halfMax), 'to be half when either value is neutral 3').toBeCloseTo(half);
    expect(directionalKernel(neutral, neutral), 'to be half when either value is neutral 3').toBeCloseTo(half);
    expect(directionalKernel(halfMin, halfMax), 'to scale with assumed uncertainty').toBeCloseTo(0.625 * full);
    expect(directionalKernel(halfMax, halfMin), 'to scale with assumed uncertainty and commute').toBeCloseTo(
      0.625 * full
    );
    expect(directionalKernel(min, halfMax), 'to scale with assumed uncertainty 2').toBeCloseTo(0.75 * full);
    expect(directionalKernel(max, halfMin), 'to scale with assumed uncertainty 3').toBeCloseTo(0.75 * full);
  });
  test('basicSum', () => {
    expect(basicSum([1, 2, 3])).toBeCloseTo(6);
  });
  test('euclideanSum', () => {
    expect(euclideanSum([1, 2, 3])).toBeCloseTo(Math.sqrt(1 + 2 ** 2 + 3 ** 2));
  });
  test('basicDivision', () => {
    expect(basicDivision(5)).toBeCloseTo(1 / 5);
  });
  test('euclideanSubdimWeight', () => {
    const subdimWeight = euclideanSubdimWeight(4);
    expect(subdimWeight).toBeCloseTo(1 / Math.sqrt(4));
    expect(
      euclideanSum([2, 3, subdimWeight, subdimWeight, subdimWeight, subdimWeight]),
      'euclidean sum of subdimensions to equal 1'
    ).toBeCloseTo(euclideanSum([2, 3, 1]));
  });
});

describe('metric: distance', () => {
  const metrics = Object.entries(DISTANCE_METRIC).map(([name, metric]) => ({ name, metric }));
  const space = new MatchingSpace({ shape: 3 });
  const posMin = new Position({ coordinates: [min, min, min], space });
  const posMax = new Position({ coordinates: [max, max, max], space });
  const posMissing = new Position({ coordinates: [min, min, undefined], space });
  const posAllMissing = new Position({ coordinates: [undefined, undefined, undefined], space });
  const space2D = new MatchingSpace({ shape: 2 });
  const posMin2D = new Position({ coordinates: [min, min], space: space2D });
  const posMax2D = new Position({ coordinates: [max, max], space: space2D });

  test.each(metrics)('extreme distance with metric $name', ({ metric }) => {
    expect(metric({ a: posMin, b: posMax })).toBeCloseTo(COORDINATE.Extent);
    expect(metric({ b: posMin, a: posMax }), 'to be commutable').toBeCloseTo(COORDINATE.Extent);
  });
  test.each(metrics)('disallow missing with metric $name', ({ metric }) => {
    expect(() => metric({ a: posMin, b: posMissing }), 'to disallow missing by default').toThrow();
    expect(() => metric({ a: posMissing, b: posMin }), 'to disallow missing by default 2').toThrow();
    expect(() => metric({ a: posMissing, b: posMin, allowMissing: false }), 'to explicitly disallow missing').toThrow();
  });
  test.each(metrics)('disregard dimensions with missing values with metric $name', ({ metric }) => {
    expect(
      metric({ a: posMax, b: posMissing, allowMissing: true }),
      'to skip the third dimension when calculating distance'
    ).toBeCloseTo(metric({ a: posMin2D, b: posMax2D }));
    expect(metric({ a: posMissing, b: posMax, allowMissing: true }), 'to be commutable').toBeCloseTo(
      metric({ a: posMin2D, b: posMax2D })
    );
  });
  test.each(metrics)('return half extent when all dimensions are missing with metric $name', ({ metric }) => {
    expect(metric({ a: posMin, b: posAllMissing, allowMissing: true })).toBeCloseTo(half);
  });

  test('manhattanDistance', () => {
    const weights = [1.3121, 5.1324, 9.123, 13.14, 0];
    const shape = [1, 1, 1, 3, 1];
    const space = new MatchingSpace({ shape, weights });
    const a = new Position({ coordinates: [min, min, neutral, [max, max, max], max], space });
    const b = new Position({ coordinates: [max, min, max, [max, min, neutral], min], space });
    let expected =
      weights[0] * full + // min-max
      weights[1] * 0 + // min-min
      weights[2] * half + // neutral-max
      (weights[3] * (0 + full + half)) / 3 + // [max, max, max]-[max, min, neutral]
      weights[4] * full; // but weight is zero
    // divide expected by sum of weights
    expected /= weights.reduce((acc, v) => acc + v, 0);
    expect(manhattanDistance({ a, b })).toBeCloseTo(expected);
    expect(manhattanDistance({ a: b, b: a }), 'to be commutable').toBeCloseTo(expected);
  });

  test('directionalDistance', () => {
    const weights = [1.3121, 5.1324, 9.123, 13.14, 43.745];
    const shape = [1, 1, 1, 3, 1];
    const space = new MatchingSpace({ shape, weights });
    const a = new Position({ coordinates: [min, min, neutral, [max, max, max], halfMin], space });
    const b = new Position({
      coordinates: [max, halfMin, max, [max, min, neutral], halfMax],
      space
    });
    let expected =
      weights[0] * full + // min-max
      weights[1] * 0.25 * full + // min-halfMin
      weights[2] * half + // neutral-max
      (weights[3] * (0 + full + half)) / 3 + // [max, max, max]-[max, min, neutral]
      weights[4] * 0.625 * full; // halfMin-halfMax
    // divide expected by sum of weights
    expected /= weights.reduce((acc, v) => acc + v, 0);
    expect(directionalDistance({ a, b })).toBeCloseTo(expected);
    expect(directionalDistance({ a: b, b: a }), 'to be commutable').toBeCloseTo(expected);
  });

  test('euclideanDistance', () => {
    const weights = [1.3121, 5.1324, 9.123, 13.14, 0];
    const shape = [1, 1, 1, 3, 1];
    const space = new MatchingSpace({ shape, weights });
    const a = new Position({ coordinates: [min, min, neutral, [max, max, max], max], space });
    const b = new Position({ coordinates: [max, min, max, [max, min, neutral], min], space });
    const expectedDistances = [
      weights[0] * full, // min-max
      weights[1] * 0, // min-min
      weights[2] * half, // neutral-max
      // the subdims need to be expanded for the summing to work correctly
      (weights[3] * 0) / Math.sqrt(3), // [max, max, max]-[max, min, neutral] 0
      (weights[3] * full) / Math.sqrt(3), // [max, max, max]-[max, min, neutral] 1
      (weights[3] * half) / Math.sqrt(3), // [max, max, max]-[max, min, neutral] 2
      weights[4] * full // but weight is zero
    ];
    // foot of sum of squares
    let expected = Math.sqrt(expectedDistances.reduce((acc, v) => acc + v ** 2, 0));
    // divide expected by root of sum of squares weights
    expected /= Math.sqrt(weights.reduce((acc, v) => acc + v ** 2, 0));
    expect(euclideanDistance({ a, b })).toBeCloseTo(expected);
    expect(euclideanDistance({ a: b, b: a }), 'to be commutable').toBeCloseTo(expected);
  });
});

describe('metric: measure', () => {
  const questions = Array.from({ length: 4 }, () => void 0).map(() => new MockQuestion(1));
  const space = MatchingSpace.fromQuestions({ questions });
  const subspaces = [
    createSubspace({ questions, subset: questions.slice(2) }),
    createSubspace({ questions, subset: questions.slice(0, 3) })
  ];
  const minPos = new Position({ coordinates: [min, min, min, min], space });
  const otherPos = new Position({ coordinates: [min, neutral, max, undefined], space });
  const options: DistanceMeasurementOptions = {
    metric: DISTANCE_METRIC.Manhattan,
    missingValueOptions: {
      method: MISSING_VALUE_METHOD.RelativeMaximum
    }
  };

  test('missing values', () => {
    const expectedA = (0 + half + full + full) / 4;
    expect(
      measureDistance({ reference: minPos, target: otherPos, options }),
      'to impute missing correctly'
    ).toBeCloseTo(expectedA);
    const expectedB = (0 + half + full + 0) / 3;
    expect(
      measureDistance({
        reference: otherPos,
        target: minPos,
        options: { ...options, allowMissingReference: true }
      }),
      'to skip the missing reference dimension'
    ).toBeCloseTo(expectedB);
    expect(
      () => measureDistance({ reference: otherPos, target: minPos, options }),
      'to disallow missing reference values by default'
    ).toThrow();
  });

  test('subspaces', () => {
    const result = measureDistance({ reference: minPos, target: otherPos, options, subspaces });
    const expectedGlobal = (0 + half + full + full) / 4;
    const expectedSubspaceA = (full + full) / 2; // The last two dimensions only
    const expectedSubspaceB = (0 + half + full) / 3; // The first three dimensions only
    expect(result.global, 'to contain global distance').toBeCloseTo(expectedGlobal);
    expect(result.subspaces.length, 'to contain subspace distances for all subspaces').toEqual(subspaces.length);
    expect(result.subspaces[0], 'to correctly compute subspace distance 1').toBeCloseTo(expectedSubspaceA);
    expect(result.subspaces[1], 'to correctly compute subspace distance 2').toBeCloseTo(expectedSubspaceB);
  });
});
