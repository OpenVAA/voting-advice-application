/**
 * The constant-time comparison: equal only for the same bytes, whatever the length or the alphabet of either value.
 */

import { describe, expect, it } from 'vitest';
import { constantTimeEqual } from './constantTimeEqual.ts';

const SECRET = 'server-secret-fixture-0123456789';

describe('constantTimeEqual', () => {
  it('is true for an equal value', () => {
    expect(constantTimeEqual(SECRET, SECRET)).toBe(true);
  });

  it.each([
    ['a different value of the same length', `${SECRET.slice(0, -1)}X`],
    ['a value differing in its first character', `X${SECRET.slice(1)}`],
    ['a shorter value that is a prefix', SECRET.slice(0, 10)],
    ['a longer value that starts with the expected one', `${SECRET}X`],
    ['the value in another case', SECRET.toUpperCase()],
    ['the value with surrounding white space', ` ${SECRET} `],
    ['an empty value', '']
  ])('is false for %s', (_label, presented) => {
    expect(constantTimeEqual(presented, SECRET)).toBe(false);
  });

  it('compares characters outside ASCII by their UTF-8 bytes', () => {
    expect(constantTimeEqual('sala-ä-ö', 'sala-ä-ö')).toBe(true);
    expect(constantTimeEqual('sala-a-ö', 'sala-ä-ö')).toBe(false);
  });

  it('is true for an empty expected value only when the presented one is empty too', () => {
    expect(constantTimeEqual('', '')).toBe(true);
    expect(constantTimeEqual('x', '')).toBe(false);
  });
});
