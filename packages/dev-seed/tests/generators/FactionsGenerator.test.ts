/**
 * FactionsGenerator unit tests.
 *
 * D-22 acceptance criteria (a)–(e) + default count = 0 (templates must opt-in
 * explicitly per RESEARCH §4.10 — factions are uncommon in VAA datasets).
 */

import { describe, expect, it } from 'vitest';
import { FactionsGenerator } from '../../src/generators/FactionsGenerator';
import { makeCtx } from '../utils';

describe('FactionsGenerator', () => {
  it('default count is 0 (templates enable explicitly)', () => {
    const gen = new FactionsGenerator(makeCtx());
    expect(gen.defaults(makeCtx()).count).toBe(0);
  });

  it('honors count from fragment', () => {
    const gen = new FactionsGenerator(makeCtx());
    expect(gen.generate({ count: 2 })).toHaveLength(2);
  });

  it('applies externalIdPrefix to generated rows (GEN-04)', () => {
    const gen = new FactionsGenerator(makeCtx());
    const rows = gen.generate({ count: 2 });
    rows.forEach((r) => expect(r.external_id).toMatch(/^seed_faction_/));
  });

  it('applies externalIdPrefix to fixed[] rows (GEN-04)', () => {
    const gen = new FactionsGenerator(makeCtx());
    const rows = gen.generate({
      count: 0,
      fixed: [{ external_id: 'my_faction', name: { en: 'Fixed Faction' } as never }]
    });
    expect(rows[0].external_id).toBe('seed_my_faction');
  });

  it('passes through fixed[] data unchanged modulo prefix', () => {
    const gen = new FactionsGenerator(makeCtx());
    const name = { en: 'Custom Faction' };
    const rows = gen.generate({ count: 0, fixed: [{ external_id: 'fx', name: name as never }] });
    expect(rows[0].name).toEqual(name);
  });

  it('produces deterministic output across runs with same seed', () => {
    const run1 = new FactionsGenerator(makeCtx()).generate({ count: 2 });
    const run2 = new FactionsGenerator(makeCtx()).generate({ count: 2 });
    expect(run1).toEqual(run2);
  });
});
