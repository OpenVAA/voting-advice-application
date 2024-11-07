import { COORDINATE } from '@openvaa/core';
import { expect, test } from 'vitest';
import {
  imputeMissingPosition,
  imputeMissingValue,
  MISSING_VALUE_BIAS,
  MISSING_VALUE_METHOD
} from '../src/missingValue';
import { MatchingSpace, Position } from '../src/space';

// For convenience
const neutral = COORDINATE.Neutral;
const max = COORDINATE.Max;
const min = COORDINATE.Min;

test('imputeMissingValue', () => {
  expect(
    imputeMissingValue({
      reference: neutral,
      options: {
        method: MISSING_VALUE_METHOD.Neutral
      }
    }),
    'neutral method to disregard reference value'
  ).toEqual(neutral);
  expect(
    imputeMissingValue({
      reference: max,
      options: {
        method: MISSING_VALUE_METHOD.Neutral
      }
    }),
    'neutral method to disregard reference value 2'
  ).toEqual(neutral);
  expect(
    imputeMissingValue({
      reference: neutral,
      options: {
        method: MISSING_VALUE_METHOD.Neutral,
        bias: MISSING_VALUE_BIAS.Positive
      }
    }),
    'neutral method to disregard bias'
  ).toEqual(neutral);
  expect(
    imputeMissingValue({
      reference: neutral,
      options: {
        method: MISSING_VALUE_METHOD.RelativeMaximum,
        bias: MISSING_VALUE_BIAS.Positive
      }
    }),
    'RelativeMaximum method to respect bias'
  ).toEqual(max);
  expect(
    imputeMissingValue({
      reference: neutral,
      options: {
        method: MISSING_VALUE_METHOD.RelativeMaximum,
        bias: MISSING_VALUE_BIAS.Negative
      }
    }),
    'RelativeMaximum method to respect bias 2'
  ).toEqual(min);
  expect(
    imputeMissingValue({
      reference: max,
      options: {
        method: MISSING_VALUE_METHOD.RelativeMaximum,
        bias: MISSING_VALUE_BIAS.Positive
      }
    }),
    'RelativeMaximum method to disregard bias if reference is not neutral'
  ).toEqual(min);
  expect(
    imputeMissingValue({
      reference: neutral + 0.5 * (max - neutral),
      options: {
        method: MISSING_VALUE_METHOD.RelativeMaximum,
        bias: MISSING_VALUE_BIAS.Positive
      }
    }),
    'RelativeMaximum method to disregard bias if reference is not neutral 2'
  ).toEqual(min);
});

test('imputeMissingPosition', () => {
  const space = new MatchingSpace({ shape: [1, 1, 1, 3] });
  const refCoords = [neutral, min, max, [neutral, min, max]];
  const tgtCoords = [undefined, min, undefined, [neutral, undefined, max]];
  const expected = [max, min, min, [neutral, max, max]];
  expect(
    imputeMissingPosition({
      reference: new Position({ coordinates: refCoords, space }),
      target: new Position({ coordinates: tgtCoords, space }),
      options: {
        method: MISSING_VALUE_METHOD.RelativeMaximum,
        bias: MISSING_VALUE_BIAS.Positive
      }
    }).coordinates,
    'all coordinates to be imputed'
  ).toEqual(expected);
});
