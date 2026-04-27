/**
 * Default-template nominations override — distribution tests.
 *
 * Covers the `allocateLinearFalloff` helper + the end-to-end override shape.
 * Phase 58 UAT follow-up (2026-04-23).
 */

import { describe, expect, it } from 'vitest';
import { allocateLinearFalloff, nominationsOverride } from '../../src/templates/defaults/nominations-override';
import type { Ctx } from '../../src/types';

describe('allocateLinearFalloff', () => {
  it('returns [12, 11, 10, 10, 9, 8, 8, 7, 6, 6, 5, 4, 4] for the default (13 constituencies, 100 candidates)', () => {
    expect(allocateLinearFalloff(13, 100)).toEqual([12, 11, 10, 10, 9, 8, 8, 7, 6, 6, 5, 4, 4]);
  });

  it('sums to exactly N for any (M, N)', () => {
    for (const M of [1, 2, 3, 5, 13, 20]) {
      for (const N of [0, 1, 10, 100, 1000]) {
        const sum = allocateLinearFalloff(M, N).reduce((s, x) => s + x, 0);
        expect(sum).toBe(N);
      }
    }
  });

  it('produces a monotonically non-increasing sequence', () => {
    const counts = allocateLinearFalloff(13, 100);
    for (let i = 1; i < counts.length; i++) {
      expect(counts[i]).toBeLessThanOrEqual(counts[i - 1]);
    }
  });

  it('gives exactly a 3:1 ratio for the default config (largest / smallest = 3)', () => {
    const counts = allocateLinearFalloff(13, 100);
    expect(counts[0] / counts[counts.length - 1]).toBe(3);
  });

  it('degenerate cases: M=0 or N=0 returns all-zeros of length M', () => {
    expect(allocateLinearFalloff(0, 100)).toEqual([]);
    expect(allocateLinearFalloff(5, 0)).toEqual([0, 0, 0, 0, 0]);
  });

  it('M=1 puts everything in the one slot', () => {
    expect(allocateLinearFalloff(1, 42)).toEqual([42]);
  });
});

describe('nominationsOverride', () => {
  function makeCtx(opts: { candidates: number; constituencies: number; elections?: number }): Ctx {
    return {
      projectId: 'proj-xyz',
      externalIdPrefix: 'seed_',
      faker: {} as never,
      logger: () => {},
      refs: {
        candidates: Array.from({ length: opts.candidates }, (_, i) => ({
          external_id: `cand_${String(i).padStart(4, '0')}`
        })),
        constituencies: Array.from({ length: opts.constituencies }, (_, i) => ({
          external_id: `c_${String(i).padStart(2, '0')}`
        })),
        elections: Array.from({ length: opts.elections ?? 1 }, (_, i) => ({
          external_id: `elec_${i}`
        })),
        organizations: [],
        alliances: [],
        factions: [],
        question_categories: [],
        questions: []
      } as Ctx['refs']
    } as Ctx;
  }

  it('emits exactly candidates.length rows', () => {
    const rows = nominationsOverride({}, makeCtx({ candidates: 100, constituencies: 13 }));
    expect(rows).toHaveLength(100);
  });

  it('distributes rows across every constituency (no empty constituencies for default config)', () => {
    const rows = nominationsOverride({}, makeCtx({ candidates: 100, constituencies: 13 }));
    const byConst = new Map<string, number>();
    for (const row of rows) {
      const cId = (row as { constituency: { external_id: string } }).constituency.external_id;
      byConst.set(cId, (byConst.get(cId) ?? 0) + 1);
    }
    expect(byConst.size).toBe(13);
    // Largest / smallest = exactly 3
    const counts = Array.from(byConst.values()).sort((a, b) => b - a);
    expect(counts[0] / counts[counts.length - 1]).toBe(3);
  });

  it('each candidate is nominated exactly once', () => {
    const rows = nominationsOverride({}, makeCtx({ candidates: 100, constituencies: 13 }));
    const seen = new Set<string>();
    for (const row of rows) {
      const candId = (row as { candidate: { external_id: string } }).candidate.external_id;
      expect(seen.has(candId)).toBe(false);
      seen.add(candId);
    }
    expect(seen.size).toBe(100);
  });

  it('throws when refs are empty', () => {
    expect(() => nominationsOverride({}, makeCtx({ candidates: 0, constituencies: 13 }))).toThrow(/ctx\.refs is empty/);
    expect(() => nominationsOverride({}, makeCtx({ candidates: 100, constituencies: 0 }))).toThrow(
      /ctx\.refs is empty/
    );
  });
});
