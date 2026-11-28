/**
 * AlliancesGenerator unit tests.
 *
 * acceptance criteria (a)–(e) + default count = 0 (templates must opt-in explicitly — alliances are uncommon in VAA datasets).
 */

import { describe, expect, it } from 'vitest';
import { AlliancesGenerator } from './AlliancesGenerator';
import { DEFAULT_COUNTS } from '../pipeline';
import { makeCtx } from '../testUtils';

describe('AlliancesGenerator', () => {
  it('default count is 0 (templates enable explicitly)', () => {
    expect(DEFAULT_COUNTS.alliances).toBe(0);
  });

  it('honors count from fragment', () => {
    const gen = new AlliancesGenerator(makeCtx());
    expect(gen.generate({ count: 2 })).toHaveLength(2);
  });

  it('applies externalIdPrefix to generated rows', () => {
    const gen = new AlliancesGenerator(makeCtx());
    const rows = gen.generate({ count: 2 });
    rows.forEach((r) => expect(r.external_id).toMatch(/^seed_alliance_/));
  });

  it('applies externalIdPrefix to fixed[] rows', () => {
    const gen = new AlliancesGenerator(makeCtx());
    const rows = gen.generate({
      count: 0,
      fixed: [{ external_id: 'my_alliance', name: { en: 'Fixed Alliance' } as never }]
    });
    expect(rows[0].external_id).toBe('seed_my_alliance');
  });

  it('passes through fixed[] data unchanged modulo prefix', () => {
    const gen = new AlliancesGenerator(makeCtx());
    const name = { en: 'Custom Alliance' };
    const rows = gen.generate({ count: 0, fixed: [{ external_id: 'fx', name: name as never }] });
    expect(rows[0].name).toEqual(name);
  });

  it('produces deterministic output across runs with same seed', () => {
    const run1 = new AlliancesGenerator(makeCtx()).generate({ count: 2 });
    const run2 = new AlliancesGenerator(makeCtx()).generate({ count: 2 });
    expect(run1).toEqual(run2);
  });
});
