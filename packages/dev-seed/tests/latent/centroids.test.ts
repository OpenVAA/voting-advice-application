/**
 * `defaultCentroids` unit tests (Plan 57-03 — GEN-06b / D-57-03 / D-57-05).
 *
 * Covers the farthest-point greedy max-min default centroid sampler:
 *   - Shape: `Array<Array<number>>`, outer length = N parties, inner length = dims.
 *   - Edge cases: N=0 returns `[]`; N=1 returns a single Gaussian draw; no `NaN` /
 *     `Infinity` anywhere (Pitfall 1 regression guard via `gaussian.ts`).
 *   - Determinism: two `makeCtx()` calls (both seeded 42) emit byte-identical
 *     centroids for the same parties input.
 *   - Anchor handling (D-57-05): full anchor map is honored verbatim; partial
 *     anchor map fills missing parties via farthest-point; wrong-length anchors
 *     are silently ignored and the slot is filled via farthest-point.
 *   - Spread sanity: at N=8 with eigenvalues `[1, 1/3]`, min pairwise Euclidean
 *     distance exceeds 0.3 (a baseline uniform Gaussian cloud would miss with
 *     high probability). Protects against algorithm regression.
 *
 * D-22 contract: pure I/O. No Supabase imports, no `createClient`, no `.rpc()`.
 */

import { describe, expect, it } from 'vitest';
import { defaultCentroids } from '../../src/emitters/latent/centroids';
import { makeCtx } from '../utils';

const PARTIES_1 = [{ external_id: 'seed_party_0' }];
const PARTIES_4 = [
  { external_id: 'seed_party_0' },
  { external_id: 'seed_party_1' },
  { external_id: 'seed_party_2' },
  { external_id: 'seed_party_3' }
];
const PARTIES_8 = Array.from({ length: 8 }, (_, i) => ({ external_id: `seed_party_${i}` }));

describe('defaultCentroids (GEN-06b / D-57-03 / D-57-05)', () => {
  it('returns shape Array<Array<number>> with length N × dims; no NaN', () => {
    const ctx = makeCtx();
    const c = defaultCentroids(2, [1, 1 / 3], PARTIES_4, ctx);
    expect(c).toHaveLength(4);
    c.forEach((row) => {
      expect(row).toHaveLength(2);
      row.forEach((v) => expect(Number.isFinite(v)).toBe(true));
    });
  });

  it('returns [] when N === 0 (Pitfall-like edge)', () => {
    const ctx = makeCtx();
    expect(defaultCentroids(2, [1, 1 / 3], [], ctx)).toEqual([]);
  });

  it('returns single centroid when N === 1 (no max-min iteration needed)', () => {
    const ctx = makeCtx();
    const c = defaultCentroids(2, [1, 1 / 3], PARTIES_1, ctx);
    expect(c).toHaveLength(1);
    expect(c[0]).toHaveLength(2);
    c[0].forEach((v) => expect(Number.isFinite(v)).toBe(true));
  });

  it('is deterministic under a seeded ctx.faker', () => {
    const a = defaultCentroids(2, [1, 1 / 3], PARTIES_4, makeCtx());
    const b = defaultCentroids(2, [1, 1 / 3], PARTIES_4, makeCtx());
    expect(a).toEqual(b);
  });

  it('honors full anchor map (D-57-05) — all parties anchored', () => {
    const ctx = makeCtx();
    const anchors = {
      seed_party_0: [0.5, -0.5],
      seed_party_1: [-0.5, 0.5],
      seed_party_2: [0.5, 0.5],
      seed_party_3: [-0.5, -0.5]
    };
    const c = defaultCentroids(2, [1, 1 / 3], PARTIES_4, ctx, anchors);
    expect(c[0]).toEqual([0.5, -0.5]);
    expect(c[1]).toEqual([-0.5, 0.5]);
    expect(c[2]).toEqual([0.5, 0.5]);
    expect(c[3]).toEqual([-0.5, -0.5]);
    // Anchors must be COPIED — mutating the returned centroid must not affect the source anchor
    c[0][0] = 999;
    expect(anchors.seed_party_0[0]).toBe(0.5);
  });

  it('fills missing parties via farthest-point when anchors are partial (D-57-05)', () => {
    const ctx = makeCtx();
    const anchors = {
      seed_party_1: [1, 1],
      seed_party_3: [-1, -1]
    };
    const c = defaultCentroids(2, [1, 1 / 3], PARTIES_4, ctx, anchors);
    expect(c[1]).toEqual([1, 1]);
    expect(c[3]).toEqual([-1, -1]);
    // Unanchored slots must be populated
    expect(c[0]).toBeDefined();
    expect(c[0]).toHaveLength(2);
    expect(c[2]).toBeDefined();
    expect(c[2]).toHaveLength(2);
    c[0].forEach((v) => expect(Number.isFinite(v)).toBe(true));
    c[2].forEach((v) => expect(Number.isFinite(v)).toBe(true));
  });

  it('farthest-point spreads centroids apart for N=8 (min pairwise distance > baseline)', () => {
    const ctx = makeCtx();
    const c = defaultCentroids(2, [1, 1 / 3], PARTIES_8, ctx);
    let minDist = Infinity;
    for (let i = 0; i < c.length; i++) {
      for (let j = i + 1; j < c.length; j++) {
        const d = Math.sqrt((c[i][0] - c[j][0]) ** 2 + (c[i][1] - c[j][1]) ** 2);
        if (d < minDist) minDist = d;
      }
    }
    // Baseline: 0.3. With eigenvalues [1, 0.333] and pool of 80, farthest-point
    // reliably exceeds this; a failure indicates algorithm regression.
    expect(minDist).toBeGreaterThan(0.3);
  });

  it('silently ignores wrong-length anchors', () => {
    const ctx = makeCtx();
    const anchors = { seed_party_0: [0.5] }; // length 1, dims = 2
    const c = defaultCentroids(2, [1, 1 / 3], PARTIES_4, ctx, anchors);
    // Anchor ignored → slot filled via farthest-point
    expect(c[0]).toHaveLength(2);
    expect(c[0]).not.toEqual([0.5]);
    c[0].forEach((v) => expect(Number.isFinite(v)).toBe(true));
  });

  it('produces finite coordinates over many seeds (Pitfall 1 regression via gaussian.ts)', () => {
    for (let seed = 0; seed < 100; seed++) {
      // Build a ctx with a distinct seed
      const base = makeCtx();
      base.faker.seed(seed);
      const c = defaultCentroids(2, [1, 1 / 3], PARTIES_4, base);
      c.forEach((row) => row.forEach((v) => expect(Number.isFinite(v)).toBe(true)));
    }
  });
});
