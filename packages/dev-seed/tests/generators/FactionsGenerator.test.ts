/**
 * FactionsGenerator unit tests.
 *
 * acceptance criteria (a)–(e) + default count = 0 (templates must opt-in explicitly — factions are uncommon in VAA datasets).
 *
 * TEST F lives here: since 162-07b `factions.organization_id` is `NOT NULL`, so every generated row must name an organization and a template that asks for factions with none to attach them to must fail LOUDLY at generation time rather than as a bare not-null violation from inside `bulk_import`. Both halves are asserted, because the raise without the attach would be a generator that only ever fails, and the attach without the raise would be one that emits `undefined` and defers the error to Postgres.
 */

import { describe, expect, it } from 'vitest';
import { FactionsGenerator } from '../../src/generators/FactionsGenerator';
import { makeCtx } from '../utils';

/** A ctx with organizations to attach factions to — the shape every non-zero faction run now requires. */
function ctxWithOrgs(count = 2) {
  return makeCtx({
    refs: {
      ...makeCtx().refs,
      organizations: Array.from({ length: count }, (_, i) => ({
        id: `00000000-0000-0000-0000-00000000000${i + 1}`,
        external_id: `seed_org_${i}`
      }))
    }
  });
}

describe('FactionsGenerator', () => {
  it('default count is 0 (templates enable explicitly)', () => {
    const gen = new FactionsGenerator(makeCtx());
    expect(gen.defaults(makeCtx()).count).toBe(0);
  });

  it('honors count from fragment', () => {
    const gen = new FactionsGenerator(ctxWithOrgs());
    expect(gen.generate({ count: 2 })).toHaveLength(2);
  });

  it('applies externalIdPrefix to generated rows (GEN-04)', () => {
    const gen = new FactionsGenerator(ctxWithOrgs());
    const rows = gen.generate({ count: 2 });
    rows.forEach((r) => expect(r.external_id).toMatch(/^seed_faction_/));
  });

  it('applies externalIdPrefix to fixed[] rows (GEN-04)', () => {
    const gen = new FactionsGenerator(ctxWithOrgs());
    const rows = gen.generate({
      count: 0,
      fixed: [{ external_id: 'my_faction', name: { en: 'Fixed Faction' } as never }]
    });
    expect(rows[0].external_id).toBe('seed_my_faction');
  });

  it('passes through fixed[] data unchanged modulo prefix', () => {
    const gen = new FactionsGenerator(ctxWithOrgs());
    const name = { en: 'Custom Faction' };
    const rows = gen.generate({ count: 0, fixed: [{ external_id: 'fx', name: name as never }] });
    expect(rows[0].name).toEqual(name);
  });

  it('produces deterministic output across runs with same seed', () => {
    const run1 = new FactionsGenerator(ctxWithOrgs()).generate({ count: 2 });
    const run2 = new FactionsGenerator(ctxWithOrgs()).generate({ count: 2 });
    expect(run1).toEqual(run2);
  });

  // TEST F, first half: every synthetic row carries an organization, picked round-robin so the mapping is deterministic under a seeded faker — the same rule CandidatesGenerator's pick follows.
  it('attaches an organization reference to EVERY row of a non-zero synthetic run', () => {
    const rows = new FactionsGenerator(ctxWithOrgs(2)).generate({ count: 5 });
    expect(rows).toHaveLength(5);
    rows.forEach((r, i) => {
      expect(r.organization, `row ${i} carries no organization reference`).toBeDefined();
      expect(r.organization?.external_id).toMatch(/^seed_org_/);
    });
    // Round-robin over two organizations, so row i takes organization i % 2 and a rerun reproduces it exactly.
    expect(rows.map((r) => r.organization?.external_id)).toEqual([
      'seed_org_0',
      'seed_org_1',
      'seed_org_0',
      'seed_org_1',
      'seed_org_0'
    ]);
  });

  // TEST F, second half: the paired raise. Without it, a template with no organizations would emit rows with no reference and the failure would surface from inside `bulk_import` as a not-null violation naming a column — Postgres's vocabulary, not the template's, and with no indication of which fragment caused it.
  it('raises a NAMED error when asked for factions with no organizations to attach them to', () => {
    const gen = new FactionsGenerator(makeCtx());
    expect(() => gen.generate({ count: 3 })).toThrowError(/FactionsGenerator/);
    expect(() => gen.generate({ count: 3 })).toThrowError(/factions\.organization_id is NOT NULL/);
    // The message names the template keys the author must act on, not the column the database complained about.
    expect(() => gen.generate({ count: 3 })).toThrowError(/`organizations` fragment/);
  });

  it('does NOT raise for a zero-count run with no organizations — the default template must stay seedable', () => {
    const gen = new FactionsGenerator(makeCtx());
    expect(() => gen.generate({ count: 0 })).not.toThrow();
    expect(gen.generate({ count: 0 })).toEqual([]);
  });
});
