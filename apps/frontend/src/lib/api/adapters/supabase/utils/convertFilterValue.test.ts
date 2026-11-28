import { describe, expect, it } from 'vitest';
import { convertFilterValue } from '../utils/convertFilterValue';

describe('convertFilterValue', () => {
  it('returns undefined for undefined, so the RPC parameter is omitted and its SQL DEFAULT NULL applies', () => {
    expect(convertFilterValue<string>(undefined)).toBeUndefined();
  });

  it('returns undefined for null', () => {
    expect(convertFilterValue<string>(null)).toBeUndefined();
  });

  it('wraps a single string in a one-element array', () => {
    expect(convertFilterValue('abc')).toEqual(['abc']);
  });

  it('returns an array unchanged and preserves its order', () => {
    expect(convertFilterValue(['a', 'b'])).toEqual(['a', 'b']);
  });

  // An empty array is reachable from a user-supplied URL: `parseParams` filters empty values out of an array param, so `?electionId=` yields `[]`. An empty id array matches no row, so it would read as a genuine no-match.
  it('throws for an empty array rather than answering with nothing', () => {
    expect(() => convertFilterValue<string>([])).toThrow(/empty filter array/);
    // The absence of a filter stays a separate, valid request.
    expect(convertFilterValue<string>(undefined)).toBeUndefined();
  });

  it('wraps a single number, proving the generic spans number as well as string', () => {
    expect(convertFilterValue(1)).toEqual([1]);
  });
});
