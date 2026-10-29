import { describe, expect, it } from 'vitest';
import { convertFilterValue } from '../utils/convertFilterValue';

describe('convertFilterValue', () => {
  it('returns [null] for undefined, the no-filter sentinel that becomes the SQL DEFAULT NULL', () => {
    expect(convertFilterValue<string>(undefined)).toEqual([null]);
  });

  it('returns [null] for null', () => {
    expect(convertFilterValue<string>(null)).toEqual([null]);
  });

  it('wraps a single string in a one-element array', () => {
    expect(convertFilterValue('abc')).toEqual(['abc']);
  });

  it('returns an array unchanged and preserves its order', () => {
    expect(convertFilterValue(['a', 'b'])).toEqual(['a', 'b']);
  });

  // REGRESSION (157 review, Lot B CR-05). An empty array is reachable from a user-supplied URL — `parseParams` filters empty values out of an array param, so `?electionId=` yields `[]` — and returning `[]` here fanned out to ZERO RPC calls: no error, no redirect, no log line, and a blank voter app. The pre-change code took `electionId[0]` (`undefined`) and issued one unfiltered call that returned everything, so this was a regression introduced by the fan-out.
  it('throws for an empty array rather than fanning out to zero calls', () => {
    expect(() => convertFilterValue<string>([])).toThrow(/empty filter array/);
    // The absence of a filter stays the separate, valid request it always was.
    expect(convertFilterValue<string>(undefined)).toEqual([null]);
  });

  it('wraps a single number, proving the generic spans number as well as string', () => {
    expect(convertFilterValue(1)).toEqual([1]);
  });
});
