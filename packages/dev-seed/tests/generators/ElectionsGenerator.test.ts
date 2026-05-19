/**
 * ElectionsGenerator unit tests.
 *
 * D-22 acceptance criteria coverage:
 *   (a) row shape matches TablesInsert<'elections'> — compile-time via typecheck
 *       plus spot-check on `project_id` + `external_id` at runtime
 *   (b) external_id prefix applied (GEN-04) — generated + fixed[] paths
 *   (c) count is honored
 *   (d) fixed[] pass-through unchanged modulo prefix
 *   (e) seeded faker produces deterministic output (same seed → same bytes)
 *
 * Plus sentinel check: generator does NOT emit the `_constituencyGroups` enrichment
 * sentinel (Plan 07's post-topo pass owns that — RESEARCH §4.3).
 */

import { describe, expect, it } from 'vitest';
import { ElectionsGenerator } from '../../src/generators/ElectionsGenerator';
import { makeCtx } from '../utils';

describe('ElectionsGenerator', () => {
  it('honors count from fragment', () => {
    const gen = new ElectionsGenerator(makeCtx());
    expect(gen.generate({ count: 3 })).toHaveLength(3);
  });

  it('applies externalIdPrefix to generated rows (GEN-04)', () => {
    const gen = new ElectionsGenerator(makeCtx());
    const rows = gen.generate({ count: 2 });
    rows.forEach((r) => expect(r.external_id).toMatch(/^seed_/));
  });

  it('applies externalIdPrefix to fixed[] rows (GEN-04)', () => {
    const gen = new ElectionsGenerator(makeCtx());
    const rows = gen.generate({
      count: 0,
      fixed: [{ external_id: 'my_election', name: { en: 'Fixed' } as never }]
    });
    expect(rows).toHaveLength(1);
    expect(rows[0].external_id).toBe('seed_my_election');
  });

  it('passes through fixed[] data unchanged modulo prefix', () => {
    const gen = new ElectionsGenerator(makeCtx());
    const name = { en: 'Custom Election' };
    const rows = gen.generate({ count: 0, fixed: [{ external_id: 'fx', name: name as never }] });
    expect(rows[0].name).toEqual(name);
  });

  it('produces deterministic output across runs with same seed', () => {
    const run1 = new ElectionsGenerator(makeCtx()).generate({ count: 3 });
    const run2 = new ElectionsGenerator(makeCtx()).generate({ count: 3 });
    expect(run1).toEqual(run2);
  });

  it('every generated row has project_id set to ctx.projectId', () => {
    const gen = new ElectionsGenerator(makeCtx());
    const rows = gen.generate({ count: 2 });
    rows.forEach((r) => expect(r.project_id).toBe('00000000-0000-0000-0000-000000000001'));
  });

  it('does NOT emit _constituencyGroups sentinel (post-topo pass owns enrichment)', () => {
    const gen = new ElectionsGenerator(makeCtx());
    const rows = gen.generate({ count: 1 });
    expect(rows[0]).not.toHaveProperty('_constituencyGroups');
  });
});
