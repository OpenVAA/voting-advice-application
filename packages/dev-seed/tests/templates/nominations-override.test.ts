/**
 * Default-template nominations override — distribution tests.
 *
 * Covers the PARTY_CONSTITUENCY_MATRIX integrity + the end-to-end override shape.
 * Phase 58 UAT follow-up (2026-04-23); Phase 64 manual-smoke densification +
 * parent_nomination wiring (2026-04-28).
 */

import { describe, expect, it } from 'vitest';
import { PARTY_WEIGHTS } from '../../src/templates/defaults/candidates-override';
import {
  PARTY_CONSTITUENCY_MATRIX,
  nominationsOverride
} from '../../src/templates/defaults/nominations-override';
import type { Ctx } from '../../src/types';

describe('PARTY_CONSTITUENCY_MATRIX', () => {
  it('has 8 rows (one per party) matching PARTY_WEIGHTS length', () => {
    expect(PARTY_CONSTITUENCY_MATRIX).toHaveLength(PARTY_WEIGHTS.length);
  });

  it('has 5 columns (one per constituency)', () => {
    for (const row of PARTY_CONSTITUENCY_MATRIX) {
      expect(row).toHaveLength(5);
    }
  });

  it('row sums match PARTY_WEIGHTS (each party total)', () => {
    for (let p = 0; p < PARTY_CONSTITUENCY_MATRIX.length; p++) {
      const rowSum = PARTY_CONSTITUENCY_MATRIX[p].reduce((s, x) => s + x, 0);
      expect(rowSum).toBe(PARTY_WEIGHTS[p]);
    }
  });

  it('total cell sum equals PARTY_WEIGHTS sum (327)', () => {
    const total = PARTY_CONSTITUENCY_MATRIX.flat().reduce((s, x) => s + x, 0);
    const expected = PARTY_WEIGHTS.reduce((s, x) => s + x, 0);
    expect(total).toBe(expected);
    expect(total).toBe(327);
  });

  it('has every cell non-zero — every (party, constituency) pair gets ≥1 candidate', () => {
    for (const row of PARTY_CONSTITUENCY_MATRIX) {
      for (const cell of row) {
        expect(cell).toBeGreaterThan(0);
      }
    }
  });

  it('largest constituency (col 0) carries party counts in [5, 15] range', () => {
    const c0 = PARTY_CONSTITUENCY_MATRIX.map((row) => row[0]);
    expect(Math.min(...c0)).toBe(5);
    expect(Math.max(...c0)).toBe(15);
  });

  it('smallest constituency (col 4) carries party counts in [3, 9] range', () => {
    const c4 = PARTY_CONSTITUENCY_MATRIX.map((row) => row[4]);
    expect(Math.min(...c4)).toBe(3);
    expect(Math.max(...c4)).toBe(9);
  });

  it('column sums are monotonically non-increasing (largest → smallest)', () => {
    const colSums = PARTY_CONSTITUENCY_MATRIX[0].map((_, c) =>
      PARTY_CONSTITUENCY_MATRIX.reduce((s, row) => s + row[c], 0)
    );
    for (let c = 1; c < colSums.length; c++) {
      expect(colSums[c]).toBeLessThanOrEqual(colSums[c - 1]);
    }
  });
});

describe('nominationsOverride', () => {
  function makeCtx(opts: {
    candidates: number;
    constituencies: number;
    organizations: number;
    elections?: number;
  }): Ctx {
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
        organizations: Array.from({ length: opts.organizations }, (_, i) => ({
          external_id: `org_${i}`
        })),
        alliances: [],
        factions: [],
        question_categories: [],
        questions: []
      } as Ctx['refs']
    } as Ctx;
  }

  const CANONICAL = { candidates: 327, constituencies: 5, organizations: 8 };

  it('emits 367 rows (327 candidate + 40 org) for the default config', () => {
    const rows = nominationsOverride({}, makeCtx(CANONICAL));
    expect(rows).toHaveLength(327 + 40);
  });

  it('emits exactly one organization-type nomination per (party × constituency) cell', () => {
    const rows = nominationsOverride({}, makeCtx(CANONICAL));
    const orgRows = rows.filter((r) => 'organization' in r && !('candidate' in r));
    expect(orgRows).toHaveLength(8 * 5);
  });

  it('emits exactly one candidate-type nomination per candidate', () => {
    const rows = nominationsOverride({}, makeCtx(CANONICAL));
    const candRows = rows.filter((r) => 'candidate' in r);
    expect(candRows).toHaveLength(327);
    const seen = new Set<string>();
    for (const row of candRows) {
      const candId = (row as { candidate: { external_id: string } }).candidate.external_id;
      expect(seen.has(candId)).toBe(false);
      seen.add(candId);
    }
    expect(seen.size).toBe(327);
  });

  it('every candidate-type nomination references a valid (party × constituency) parent_nomination', () => {
    const rows = nominationsOverride({}, makeCtx(CANONICAL));
    const orgIds = new Set(
      rows.filter((r) => !('candidate' in r)).map((r) => (r as { external_id: string }).external_id)
    );
    const candRows = rows.filter((r) => 'candidate' in r);
    for (const row of candRows) {
      const parentId = (row as { parent_nomination: { external_id: string } }).parent_nomination.external_id;
      expect(orgIds.has(parentId)).toBe(true);
    }
  });

  it('distributes candidates across every constituency (no empty constituencies)', () => {
    const rows = nominationsOverride({}, makeCtx(CANONICAL));
    const candRows = rows.filter((r) => 'candidate' in r);
    const byConst = new Map<string, number>();
    for (const row of candRows) {
      const cId = (row as { constituency: { external_id: string } }).constituency.external_id;
      byConst.set(cId, (byConst.get(cId) ?? 0) + 1);
    }
    expect(byConst.size).toBe(5);
    const counts = Array.from(byConst.values()).sort((a, b) => b - a);
    expect(counts).toEqual([80, 74, 66, 59, 48]);
  });

  it('throws when refs are empty', () => {
    expect(() => nominationsOverride({}, makeCtx({ ...CANONICAL, candidates: 0 }))).toThrow(
      /ctx\.refs is empty/
    );
    expect(() => nominationsOverride({}, makeCtx({ ...CANONICAL, constituencies: 0 }))).toThrow(
      /ctx\.refs is empty/
    );
    expect(() => nominationsOverride({}, makeCtx({ ...CANONICAL, organizations: 0 }))).toThrow(
      /ctx\.refs is empty/
    );
  });

  it('throws when organizations count does not match PARTY_WEIGHTS length', () => {
    expect(() => nominationsOverride({}, makeCtx({ ...CANONICAL, organizations: 7 }))).toThrow(
      /expected 8 organizations/
    );
    expect(() => nominationsOverride({}, makeCtx({ ...CANONICAL, organizations: 9 }))).toThrow(
      /expected 8 organizations/
    );
  });

  it('throws when constituencies count does not match the matrix column count', () => {
    expect(() => nominationsOverride({}, makeCtx({ ...CANONICAL, constituencies: 4 }))).toThrow(
      /5 columns but ctx\.refs\.constituencies has 4/
    );
    expect(() => nominationsOverride({}, makeCtx({ ...CANONICAL, constituencies: 6 }))).toThrow(
      /5 columns but ctx\.refs\.constituencies has 6/
    );
  });
});
