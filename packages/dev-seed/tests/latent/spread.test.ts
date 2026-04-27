/**
 * `defaultSpread` unit tests (Plan 57-02 Task 2).
 *
 * Covers the RED/GREEN gate for `src/emitters/latent/spread.ts`:
 *   - Test 1: no template override → D-57-04 default `0.15`.
 *   - Test 2: scalar template override forwarded verbatim.
 *   - Test 3: `tplSpread === 0` preserved (nullish-coalesce, not `||`) — collapses
 *     candidates to centroids, a legal deterministic mode.
 *   - Test 4: determinism — two calls with same args return equal numbers; no faker
 *     consulted.
 *   - Test 5: purity — defaultSpread consumes ZERO faker draws across varied inputs.
 *
 * D-22 contract: pure I/O. No Supabase imports, no `createClient`, no `.rpc()`.
 */

import { describe, expect, it } from 'vitest';
import { defaultSpread } from '../../src/emitters/latent/spread';
import { makeCtx } from '../utils';

describe('defaultSpread (GEN-06c / D-57-04)', () => {
  it('returns 0.15 by default', () => {
    const ctx = makeCtx();
    expect(defaultSpread(ctx)).toBe(0.15);
  });

  it('honors scalar template override', () => {
    const ctx = makeCtx();
    expect(defaultSpread(ctx, 0.3)).toBe(0.3);
  });

  it('accepts spread=0 (collapses to centroid — legal deterministic mode)', () => {
    const ctx = makeCtx();
    expect(defaultSpread(ctx, 0)).toBe(0);
  });

  it('is pure — two calls return equal values', () => {
    const ctxA = makeCtx();
    const ctxB = makeCtx();
    expect(defaultSpread(ctxA, 0.2)).toBe(defaultSpread(ctxB, 0.2));
    expect(defaultSpread(ctxA)).toBe(defaultSpread(ctxB));
  });

  it('does not read ctx.faker (pure lookup)', () => {
    // Compare the two ctx objects' faker state before and after. If defaultSpread
    // consumes a random draw, state would diverge. Since defaultSpread just
    // returns a constant, both remain identical.
    const ctx = makeCtx();
    const pre = ctx.faker.number.int({ min: 0, max: 1_000_000 });
    defaultSpread(ctx);
    defaultSpread(ctx, 0.2);
    defaultSpread(ctx, 0);
    const post = ctx.faker.number.int({ min: 0, max: 1_000_000 });
    // `post` must equal the SECOND draw after `pre` (the first draw inside the
    // faker's sequence) — i.e. defaultSpread consumed zero draws in between.
    // Verify: reset and compare.
    const fresh = makeCtx();
    const first = fresh.faker.number.int({ min: 0, max: 1_000_000 });
    const second = fresh.faker.number.int({ min: 0, max: 1_000_000 });
    expect(pre).toBe(first);
    expect(post).toBe(second);
  });
});
