/**
 * defaultPositions tests (Plan 57-04 Task 1).
 *
 * Covers GEN-06d / D-57-04 — per-candidate isotropic Gaussian draw around a
 * party centroid. The position default is the only sub-step that runs
 * per-candidate (D-57-13 — dims/centroids/loadings/spread are closure-cached
 * by the emitter shell). Tests pin:
 *   - shape + higher-dim generalization (Tests 1, 2)
 *   - D-57-04 / D-57-11 short-circuit when `spread === 0` (Tests 3, 4)
 *   - statistical correctness: centered at centroid, std matches spread,
 *     isotropic across dims, zero cross-dim correlation (Tests 5, 6, 7)
 *   - API behaviour — partyIdx selection, determinism (Tests 8, 9)
 *   - error handling for out-of-range partyIdx (Test 10)
 *   - Pitfall 1 finiteness regression over 1000 varied-spread calls (Test 11)
 *
 * D-22 contract: pure I/O, no Supabase imports.
 */

import { describe, expect, it } from 'vitest';
import { defaultPositions } from '../../src/emitters/latent/positions';
import { makeCtx } from '../utils';

describe('defaultPositions (GEN-06d / D-57-04)', () => {
  it('returns Array<number> of length dims; finite coords', () => {
    const ctx = makeCtx();
    const p = defaultPositions(0, [[0, 0]], 0.15, ctx);
    expect(p).toHaveLength(2);
    p.forEach((v) => expect(Number.isFinite(v)).toBe(true));
  });

  it('generalizes to higher dims', () => {
    const ctx = makeCtx();
    const p = defaultPositions(0, [[0, 0, 0, 0]], 0.15, ctx);
    expect(p).toHaveLength(4);
    p.forEach((v) => expect(Number.isFinite(v)).toBe(true));
  });

  it('spread=0 returns exact centroid (D-57-04 deterministic mode)', () => {
    const ctx = makeCtx();
    const p = defaultPositions(0, [[1, 2, 3]], 0, ctx);
    expect(p).toEqual([1, 2, 3]);
  });

  it('spread=0 consumes zero faker draws (short-circuit via boxMuller)', () => {
    const ctx = makeCtx();
    // Draw one from a fresh ctx to establish the faker's state
    const preDraw = ctx.faker.number.int({ min: 0, max: 1_000_000 });
    defaultPositions(0, [[1, 2]], 0, ctx);
    defaultPositions(0, [[1, 2]], 0, ctx);
    const postDraw = ctx.faker.number.int({ min: 0, max: 1_000_000 });
    // Compare against a fresh ctx
    const ref = makeCtx();
    const a = ref.faker.number.int({ min: 0, max: 1_000_000 });
    const b = ref.faker.number.int({ min: 0, max: 1_000_000 });
    expect(preDraw).toBe(a);
    expect(postDraw).toBe(b);
  });

  it('centers at centroid; std matches spread (statistical check)', () => {
    const ctx = makeCtx();
    const N = 2000;
    const xs: Array<number> = [];
    const ys: Array<number> = [];
    for (let i = 0; i < N; i++) {
      const p = defaultPositions(0, [[5, -3]], 0.1, ctx);
      xs.push(p[0]);
      ys.push(p[1]);
    }
    const meanX = xs.reduce((a, b) => a + b, 0) / N;
    const meanY = ys.reduce((a, b) => a + b, 0) / N;
    const stdX = Math.sqrt(xs.reduce((a, b) => a + (b - meanX) ** 2, 0) / N);
    const stdY = Math.sqrt(ys.reduce((a, b) => a + (b - meanY) ** 2, 0) / N);
    expect(meanX).toBeGreaterThan(4.99);
    expect(meanX).toBeLessThan(5.01);
    expect(meanY).toBeGreaterThan(-3.01);
    expect(meanY).toBeLessThan(-2.99);
    expect(stdX).toBeGreaterThan(0.095);
    expect(stdX).toBeLessThan(0.105);
    expect(stdY).toBeGreaterThan(0.095);
    expect(stdY).toBeLessThan(0.105);
  });

  it('is isotropic — std matches across dims (D-57-04)', () => {
    const ctx = makeCtx();
    const N = 2000;
    const xs: Array<number> = [];
    const ys: Array<number> = [];
    for (let i = 0; i < N; i++) {
      const p = defaultPositions(0, [[0, 0]], 0.15, ctx);
      xs.push(p[0]);
      ys.push(p[1]);
    }
    const meanX = xs.reduce((a, b) => a + b, 0) / N;
    const meanY = ys.reduce((a, b) => a + b, 0) / N;
    const stdX = Math.sqrt(xs.reduce((a, b) => a + (b - meanX) ** 2, 0) / N);
    const stdY = Math.sqrt(ys.reduce((a, b) => a + (b - meanY) ** 2, 0) / N);
    const ratio = stdX / stdY;
    expect(stdX).toBeGreaterThan(0.14);
    expect(stdX).toBeLessThan(0.16);
    expect(stdY).toBeGreaterThan(0.14);
    expect(stdY).toBeLessThan(0.16);
    expect(ratio).toBeGreaterThan(0.95);
    expect(ratio).toBeLessThan(1.05);
  });

  it('dimensions are independent — |correlation| < 0.1 over 2000 draws', () => {
    const ctx = makeCtx();
    const N = 2000;
    const xs: Array<number> = [];
    const ys: Array<number> = [];
    for (let i = 0; i < N; i++) {
      const p = defaultPositions(0, [[0, 0]], 0.15, ctx);
      xs.push(p[0]);
      ys.push(p[1]);
    }
    const meanX = xs.reduce((a, b) => a + b, 0) / N;
    const meanY = ys.reduce((a, b) => a + b, 0) / N;
    let num = 0;
    let denomX = 0;
    let denomY = 0;
    for (let i = 0; i < N; i++) {
      num += (xs[i] - meanX) * (ys[i] - meanY);
      denomX += (xs[i] - meanX) ** 2;
      denomY += (ys[i] - meanY) ** 2;
    }
    const r = num / Math.sqrt(denomX * denomY);
    expect(Math.abs(r)).toBeLessThan(0.1);
  });

  it('uses partyIdx-specific centroid', () => {
    const ctx = makeCtx();
    expect(
      defaultPositions(
        0,
        [
          [0, 0],
          [5, 5]
        ],
        0,
        ctx
      )
    ).toEqual([0, 0]);
    expect(
      defaultPositions(
        1,
        [
          [0, 0],
          [5, 5]
        ],
        0,
        ctx
      )
    ).toEqual([5, 5]);
  });

  it('is deterministic under seeded ctx.faker', () => {
    const a = defaultPositions(0, [[0, 0]], 0.15, makeCtx());
    const b = defaultPositions(0, [[0, 0]], 0.15, makeCtx());
    expect(a).toEqual(b);
  });

  it('throws on out-of-range partyIdx', () => {
    const ctx = makeCtx();
    expect(() => defaultPositions(-1, [[0, 0]], 0.15, ctx)).toThrow(/out of range/);
    expect(() => defaultPositions(5, [[0, 0]], 0.15, ctx)).toThrow(/out of range/);
    expect(() => defaultPositions(0, [], 0.15, ctx)).toThrow(/out of range/);
  });

  it('produces finite coords over 1000 varied-spread calls (Pitfall 1 regression)', () => {
    const ctx = makeCtx();
    for (let i = 0; i < 1000; i++) {
      const spread = (i % 10) * 0.05;
      const p = defaultPositions(0, [[0, 0]], spread, ctx);
      p.forEach((v) => expect(Number.isFinite(v)).toBe(true));
    }
  });
});
