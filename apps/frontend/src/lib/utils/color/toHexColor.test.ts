/**
 * `toHexColor`, the one normalisation of a colour to the form it is compared, stored and painted in.
 */

import { describe, expect, it } from 'vitest';
import { HEX_COLOR, toHexColor } from './toHexColor';

describe('toHexColor', () => {
  it.each([
    ['#2546A8', '#2546a8'],
    ['#0A0', '#00aa00'],
    ['0a0', '#00aa00'],
    ['2546a8', '#2546a8'],
    ['rgb(37, 70, 168)', '#2546a8']
  ])('normalises %s to %s', (text, expected) => {
    expect(toHexColor(text)).toBe(expected);
    expect(expected).toMatch(HEX_COLOR);
  });

  it.each(['', 'red', '#12345', '#fff; background: url(x)', 'rgb(300, 0, 0)', 'rgb(0,0)'])(
    'answers undefined for %j, which is no colour',
    (text) => {
      expect(toHexColor(text)).toBeUndefined();
    }
  );
});
