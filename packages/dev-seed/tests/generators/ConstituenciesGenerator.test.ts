/**
 * ConstituenciesGenerator unit tests.
 *
 * D-22 acceptance criteria (a)–(e) + the self-FK parent ref's cycle-avoidance
 * invariant: any generated `parent: { external_id }` ref points to a row emitted
 * EARLIER in the same batch (no forward refs, no self-reference, no cycles).
 */

import { describe, expect, it } from 'vitest';
import { ConstituenciesGenerator } from '../../src/generators/ConstituenciesGenerator';
import { makeCtx } from '../utils';

describe('ConstituenciesGenerator', () => {
  it('honors count from fragment', () => {
    const gen = new ConstituenciesGenerator(makeCtx());
    expect(gen.generate({ count: 5 })).toHaveLength(5);
  });

  it('applies externalIdPrefix to generated rows (GEN-04)', () => {
    const gen = new ConstituenciesGenerator(makeCtx());
    const rows = gen.generate({ count: 3 });
    rows.forEach((r) => expect(r.external_id).toMatch(/^seed_con_/));
  });

  it('applies externalIdPrefix to fixed[] rows (GEN-04)', () => {
    const gen = new ConstituenciesGenerator(makeCtx());
    const rows = gen.generate({
      count: 0,
      fixed: [{ external_id: 'my_con', name: { en: 'Fixed Con' } as never }]
    });
    expect(rows[0].external_id).toBe('seed_my_con');
  });

  it('passes through fixed[] data unchanged modulo prefix', () => {
    const gen = new ConstituenciesGenerator(makeCtx());
    const name = { en: 'Custom Constituency' };
    const rows = gen.generate({ count: 0, fixed: [{ external_id: 'fx', name: name as never }] });
    expect(rows[0].name).toEqual(name);
  });

  it('produces deterministic output across runs with same seed', () => {
    const run1 = new ConstituenciesGenerator(makeCtx()).generate({ count: 5 });
    const run2 = new ConstituenciesGenerator(makeCtx()).generate({ count: 5 });
    expect(run1).toEqual(run2);
  });

  it('parent self-FK only refers to prior-generated constituencies (no forward refs, no cycles)', () => {
    const gen = new ConstituenciesGenerator(makeCtx());
    const rows = gen.generate({ count: 10 });
    rows.forEach((r, idx) => {
      const rowAny = r as unknown as { parent?: { external_id: string } };
      if (rowAny.parent) {
        const parentExtId = rowAny.parent.external_id;
        const parentIdx = rows.findIndex((x) => x.external_id === parentExtId);
        expect(parentIdx).toBeGreaterThanOrEqual(0);
        expect(parentIdx).toBeLessThan(idx);
      }
    });
  });
});
