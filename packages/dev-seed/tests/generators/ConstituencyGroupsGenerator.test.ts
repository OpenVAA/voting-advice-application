/**
 * ConstituencyGroupsGenerator unit tests.
 *
 * D-22 acceptance criteria (a)–(e) + sentinel-free output. The `_constituencies`
 * join sentinel (RESEARCH §4.4) is populated by Plan 07's post-topo pass; this
 * generator emits none.
 */

import { describe, expect, it } from 'vitest';
import { ConstituencyGroupsGenerator } from '../../src/generators/ConstituencyGroupsGenerator';
import { makeCtx } from '../utils';

describe('ConstituencyGroupsGenerator', () => {
  it('honors count from fragment', () => {
    const gen = new ConstituencyGroupsGenerator(makeCtx());
    expect(gen.generate({ count: 3 })).toHaveLength(3);
  });

  it('applies externalIdPrefix to generated rows (GEN-04)', () => {
    const gen = new ConstituencyGroupsGenerator(makeCtx());
    const rows = gen.generate({ count: 2 });
    rows.forEach((r) => expect(r.external_id).toMatch(/^seed_/));
  });

  it('applies externalIdPrefix to fixed[] rows (GEN-04)', () => {
    const gen = new ConstituencyGroupsGenerator(makeCtx());
    const rows = gen.generate({
      count: 0,
      fixed: [{ external_id: 'my_cg', name: { en: 'Fixed CG' } as never }]
    });
    expect(rows[0].external_id).toBe('seed_my_cg');
  });

  it('passes through fixed[] data unchanged modulo prefix', () => {
    const gen = new ConstituencyGroupsGenerator(makeCtx());
    const name = { en: 'Custom CG' };
    const rows = gen.generate({ count: 0, fixed: [{ external_id: 'fx', name: name as never }] });
    expect(rows[0].name).toEqual(name);
  });

  it('produces deterministic output across runs with same seed', () => {
    const run1 = new ConstituencyGroupsGenerator(makeCtx()).generate({ count: 3 });
    const run2 = new ConstituencyGroupsGenerator(makeCtx()).generate({ count: 3 });
    expect(run1).toEqual(run2);
  });

  it('every generated row has project_id', () => {
    const gen = new ConstituencyGroupsGenerator(makeCtx());
    const rows = gen.generate({ count: 2 });
    rows.forEach((r) => expect(r.project_id).toBe('00000000-0000-0000-0000-000000000001'));
  });

  it('does NOT emit _constituencies sentinel (post-topo pass owns enrichment)', () => {
    const gen = new ConstituencyGroupsGenerator(makeCtx());
    const rows = gen.generate({ count: 1 });
    expect(rows[0]).not.toHaveProperty('_constituencies');
  });
});
