/**
 * `defaultDimensions` unit tests (Plan 57-02 Task 1).
 *
 * Covers the RED/GREEN gate for `src/emitters/latent/dimensions.ts`:
 *   - Test 1: empty template → D-57-01 default `{ dims: 2, eigenvalues: [1, 1/3] }`.
 *   - Tests 2-4: `dims in {1, 3, 4}` → geometric decay `(1/3)^i` per D-57-02.
 *   - Test 5: explicit `eigenvalues` override → verbatim use, `dims` derived from length.
 *   - Test 6: both `dimensions` and `eigenvalues` supplied (schema-enforced length match)
 *     → explicit eigenvalues honored verbatim.
 *   - Test 7: determinism + array-identity — no shared mutable state between calls.
 *
 * D-22 contract: pure I/O. No Supabase imports, no `createClient`, no `.rpc()`.
 */

import { describe, expect, it } from 'vitest';
import { defaultDimensions } from '../../src/emitters/latent/dimensions';
import type { Template } from '../../src/template/types';

describe('defaultDimensions (GEN-06a / D-57-01 / D-57-02)', () => {
  it('default is {dims:2, eigenvalues:[1, 1/3]}', () => {
    const r = defaultDimensions({} as Template);
    expect(r.dims).toBe(2);
    expect(r.eigenvalues).toHaveLength(2);
    expect(r.eigenvalues[0]).toBeCloseTo(1, 12);
    expect(r.eigenvalues[1]).toBeCloseTo(1 / 3, 12);
  });

  it('dims=1 → eigenvalues=[1]', () => {
    const r = defaultDimensions({ latent: { dimensions: 1 } } as Template);
    expect(r.dims).toBe(1);
    expect(r.eigenvalues).toEqual([1]);
  });

  it('dims=3 → eigenvalues=[1, 1/3, 1/9] (geometric decay ratio 1/3)', () => {
    const r = defaultDimensions({ latent: { dimensions: 3 } } as Template);
    expect(r.dims).toBe(3);
    expect(r.eigenvalues).toHaveLength(3);
    expect(r.eigenvalues[0]).toBeCloseTo(1, 12);
    expect(r.eigenvalues[1]).toBeCloseTo(1 / 3, 12);
    expect(r.eigenvalues[2]).toBeCloseTo(1 / 9, 12);
  });

  it('dims=4 → eigenvalues=[1, 1/3, 1/9, 1/27]', () => {
    const r = defaultDimensions({ latent: { dimensions: 4 } } as Template);
    expect(r.dims).toBe(4);
    expect(r.eigenvalues[3]).toBeCloseTo(1 / 27, 12);
  });

  it('explicit eigenvalues override default decay; dims derived from length', () => {
    const r = defaultDimensions({ latent: { eigenvalues: [2, 0.5] } } as Template);
    expect(r.dims).toBe(2);
    expect(r.eigenvalues).toEqual([2, 0.5]);
  });

  it('explicit dimensions + eigenvalues (length-matched, schema-enforced)', () => {
    const r = defaultDimensions({
      latent: { dimensions: 2, eigenvalues: [2, 0.5] }
    } as Template);
    expect(r.dims).toBe(2);
    expect(r.eigenvalues).toEqual([2, 0.5]);
  });

  it('is a pure function — two calls with same input return equal output', () => {
    const input = { latent: { dimensions: 3 } } as Template;
    const a = defaultDimensions(input);
    const b = defaultDimensions(input);
    expect(a).toEqual(b);
    // Also: returned array is a fresh array (consumer can mutate without affecting cache).
    expect(a.eigenvalues).not.toBe(b.eigenvalues);
  });
});
