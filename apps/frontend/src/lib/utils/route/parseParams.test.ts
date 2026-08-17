import { describe, expect, it } from 'vitest';
import { parseParams } from './parseParams';

/**
 * Unit test for `parseParams` covering the name-disjoint
 * dissociation rule between the route-side `electionTab` (singular SELECTED
 * election) and the search-side `electionId` (AVAILABLE array) surfaces.
 *
 * The two keys are different identifiers throughout the codebase and live on
 * the merged `Partial<Params>` object as two distinct top-level entries.
 */
describe('parseParams — name-disjoint dissociation (electionTab vs electionId)', () => {
  it('preserves both route-side electionTab AND search-side electionId on the merged params object', () => {
    const out = parseParams({
      params: { electionTab: 'foo' },
      url: new URL('https://x/?electionId=bar&electionId=baz')
    });
    expect(out.electionTab).toBe('foo');
    expect(out.electionId).toEqual(['bar', 'baz']);
  });

  it('returns only electionTab when no URL search side is present', () => {
    const out = parseParams({
      params: { electionTab: 'foo' },
      url: undefined
    });
    expect(out.electionTab).toBe('foo');
    expect(out.electionId).toBeUndefined();
  });

  it('returns only the search-side electionId array when route side is absent', () => {
    const out = parseParams({
      params: {},
      url: new URL('https://x/?electionId[0]=a&electionId[1]=b')
    });
    expect(out.electionTab).toBeUndefined();
    expect(out.electionId).toEqual(['a', 'b']);
  });

  it('does not overwrite route-side electionTab with the search-side electionId array', () => {
    const out = parseParams({
      params: { electionTab: 'route-side' },
      url: new URL('https://x/?electionId[0]=search-side-1&electionId[1]=search-side-2')
    });
    // The two surfaces live on DIFFERENT top-level keys; neither overwrites
    // the other because they are name-disjoint identifiers.
    expect(out.electionTab).toBe('route-side');
    expect(out.electionId).toEqual(['search-side-1', 'search-side-2']);
  });

  it('preserves search-side electionId single-value when no electionId array is present', () => {
    const out = parseParams({
      params: {},
      url: new URL('https://x/?electionId=solo')
    });
    expect(out.electionId).toEqual(['solo']);
  });
});
