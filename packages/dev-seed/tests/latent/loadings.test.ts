/**
 * Unit tests for `defaultLoadings` — Plan 57-05 sub-step default.
 *
 * Covers:
 *   - Matrix shape keyed by `question.external_id` (D-57-06 storage contract).
 *   - Pitfall 3 regression: `questions.length === 0` → `{}` (no throw, no
 *     iteration — Phase 56 determinism tests with empty `{}` template rely on
 *     this).
 *   - `dims === 0` edge: keys present with length-0 vectors (no throw).
 *   - Phase 56 guard replication: questions with no `external_id` are silently
 *     skipped (mirrors `extractChoiceIds` / `defaultRandomValidEmit`).
 *   - N(0, 1) statistics over 60 entries at seed 42 (loose bounds for small N).
 *   - D-57-07 per-question override — supplied vector copied verbatim into the
 *     matching `external_id` slot.
 *   - Override copy semantics — mutating the returned vector does NOT mutate
 *     the source `tplLoadings` entry.
 *   - Wrong-length override silently ignored (defensive guard against template
 *     drift between `dims` and per-question vector length).
 *   - Determinism under a seeded `ctx.faker` (two fresh ctxs with the same
 *     seed produce byte-identical matrices).
 *   - Pitfall 1 regression via `gaussian.ts` — no `NaN` / `Infinity` entries
 *     across 50 distinct seeds.
 */

import type { TablesInsert } from '@openvaa/supabase-types';
import { describe, expect, it } from 'vitest';
import { defaultLoadings } from '../../src/emitters/latent/loadings';
import { makeCtx } from '../utils';

const PROJECT_UUID = '00000000-0000-0000-0000-000000000001';
const CATEGORY_UUID = '00000000-0000-0000-0000-000000000099';

function mkQ(extId: string): TablesInsert<'questions'> {
  return {
    external_id: extId,
    project_id: PROJECT_UUID,
    type: 'singleChoiceOrdinal',
    category_id: CATEGORY_UUID
  };
}

describe('defaultLoadings (GEN-06e / D-57-06 / D-57-07)', () => {
  it('returns record keyed by external_id with length-dims vectors', () => {
    const ctx = makeCtx();
    const qs = [mkQ('seed_q_0'), mkQ('seed_q_1'), mkQ('seed_q_2')];
    const m = defaultLoadings(qs, 2, ctx);
    expect(Object.keys(m)).toEqual(['seed_q_0', 'seed_q_1', 'seed_q_2']);
    for (const k of Object.keys(m)) {
      expect(m[k]).toHaveLength(2);
      m[k].forEach((v) => expect(Number.isFinite(v)).toBe(true));
    }
  });

  it('returns {} for empty questions (Pitfall 3 regression)', () => {
    expect(defaultLoadings([], 2, makeCtx())).toEqual({});
  });

  it('handles dims=0 — returns keys with empty vectors', () => {
    const m = defaultLoadings([mkQ('seed_q_0')], 0, makeCtx());
    expect(m).toEqual({ seed_q_0: [] });
  });

  it('silently skips questions with no external_id (Phase 56 guard)', () => {
    const ctx = makeCtx();
    const qs: ReadonlyArray<TablesInsert<'questions'>> = [
      mkQ('seed_q_0'),
      { project_id: PROJECT_UUID, type: 'singleChoiceOrdinal', category_id: CATEGORY_UUID } // no external_id
    ];
    const m = defaultLoadings(qs, 2, ctx);
    expect(Object.keys(m)).toEqual(['seed_q_0']);
  });

  it('samples approximately N(0, 1) (loose statistical bounds)', () => {
    const ctx = makeCtx();
    const qs = Array.from({ length: 20 }, (_, i) => mkQ(`seed_q_${i}`));
    const m = defaultLoadings(qs, 3, ctx);
    const all: Array<number> = [];
    for (const k of Object.keys(m)) all.push(...m[k]);
    expect(all).toHaveLength(60);
    const mean = all.reduce((a, b) => a + b, 0) / all.length;
    const std = Math.sqrt(all.reduce((a, b) => a + (b - mean) ** 2, 0) / all.length);
    // Loose bounds — 60 samples from N(0,1) have sample std in ~[0.8, 1.2] and
    // sample mean in ~[-0.3, 0.3] at seed 42.
    expect(mean).toBeGreaterThan(-0.3);
    expect(mean).toBeLessThan(0.3);
    expect(std).toBeGreaterThan(0.8);
    expect(std).toBeLessThan(1.2);
  });

  it('honors per-question template override (D-57-07)', () => {
    const ctx = makeCtx();
    const qs = [mkQ('seed_q_0'), mkQ('seed_q_1')];
    const tpl = { seed_q_0: [0.5, -0.5] };
    const m = defaultLoadings(qs, 2, ctx, tpl);
    expect(m.seed_q_0).toEqual([0.5, -0.5]);
    expect(m.seed_q_1).toHaveLength(2);
    m.seed_q_1.forEach((v) => expect(Number.isFinite(v)).toBe(true));
    // q1 is NOT the same vector as q0 (sampled, not copied)
    expect(m.seed_q_1).not.toEqual([0.5, -0.5]);
  });

  it('copies override vector — mutating output does not affect template', () => {
    const ctx = makeCtx();
    const tpl = { seed_q_0: [0.5, -0.5] };
    const m = defaultLoadings([mkQ('seed_q_0')], 2, ctx, tpl);
    m.seed_q_0[0] = 999;
    expect(tpl.seed_q_0[0]).toBe(0.5);
  });

  it('silently ignores wrong-length override (falls back to sampling)', () => {
    const ctx = makeCtx();
    const tpl = { seed_q_0: [0.5] }; // length 1; dims=2
    const m = defaultLoadings([mkQ('seed_q_0')], 2, ctx, tpl);
    expect(m.seed_q_0).toHaveLength(2);
    expect(m.seed_q_0).not.toEqual([0.5]);
    m.seed_q_0.forEach((v) => expect(Number.isFinite(v)).toBe(true));
  });

  it('is deterministic under seeded ctx.faker', () => {
    const qs = [mkQ('a'), mkQ('b'), mkQ('c')];
    const a = defaultLoadings(qs, 3, makeCtx());
    const b = defaultLoadings(qs, 3, makeCtx());
    expect(a).toEqual(b);
  });

  it('produces finite entries over 50 distinct seeds (Pitfall 1 regression)', () => {
    const qs = [mkQ('a'), mkQ('b')];
    for (let seed = 0; seed < 50; seed++) {
      const ctx = makeCtx();
      ctx.faker.seed(seed);
      const m = defaultLoadings(qs, 3, ctx);
      for (const k of Object.keys(m)) m[k].forEach((v) => expect(Number.isFinite(v)).toBe(true));
    }
  });
});
