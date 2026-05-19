/**
 * NominationsGenerator unit tests.
 *
 * GEN-08 + polymorphism contract (RESEARCH §9 / migration line 741 CHECK):
 *   - Client-side ref validation: throws a descriptive error BEFORE bulk_import
 *     when required refs are empty (covers candidates, elections, constituencies)
 *   - Emits only the authoritative polymorphic ref (`candidate`) — no redundant
 *     `organization` tagging (dropped the legacy tests/ admin-client workaround)
 *   - Does NOT emit `entity_type` (GENERATED column; migration line 724–731)
 *   - Emits `election` + `constituency` refs on every generated row
 *   - Clamps generated count to `refs.candidates.length` with logger warning
 *
 * Plus D-22 acceptance: external_id prefix applied; fixed[] pass-through.
 */

import { describe, expect, it, vi } from 'vitest';
import { NominationsGenerator } from '../../src/generators/NominationsGenerator';
import { makeCtx } from '../utils';

// Helper: build a ctx.refs with the three ref categories populated that
// NominationsGenerator requires for generated rows.
function populatedRefs(): ReturnType<typeof makeCtx>['refs'] {
  return {
    ...makeCtx().refs,
    elections: [{ external_id: 'seed_election_00' }],
    constituencies: [{ external_id: 'seed_con_00' }],
    candidates: [{ external_id: 'seed_cand_0000' }, { external_id: 'seed_cand_0001' }],
    organizations: [{ external_id: 'seed_party_01' }]
  };
}

describe('NominationsGenerator', () => {
  it('returns [] for empty fragment', () => {
    const gen = new NominationsGenerator(makeCtx());
    expect(gen.generate({})).toEqual([]);
  });

  it('honors count up to refs.candidates.length', () => {
    const gen = new NominationsGenerator(makeCtx({ refs: populatedRefs() }));
    const rows = gen.generate({ count: 2 });
    expect(rows).toHaveLength(2);
  });

  it('GEN-08: throws descriptive error when refs.candidates empty', () => {
    const refs = populatedRefs();
    refs.candidates = [];
    const gen = new NominationsGenerator(makeCtx({ refs }));
    expect(() => gen.generate({ count: 1 })).toThrow(/ctx\.refs is empty.*candidates/);
  });

  it('GEN-08: throws descriptive error when refs.elections empty', () => {
    const refs = populatedRefs();
    refs.elections = [];
    const gen = new NominationsGenerator(makeCtx({ refs }));
    expect(() => gen.generate({ count: 1 })).toThrow(/ctx\.refs is empty.*elections/);
  });

  it('GEN-08: throws descriptive error when refs.constituencies empty', () => {
    const refs = populatedRefs();
    refs.constituencies = [];
    const gen = new NominationsGenerator(makeCtx({ refs }));
    expect(() => gen.generate({ count: 1 })).toThrow(/ctx\.refs is empty.*constituencies/);
  });

  it('emits candidate ref on every generated row (polymorphic CHECK constraint)', () => {
    const gen = new NominationsGenerator(makeCtx({ refs: populatedRefs() }));
    const rows = gen.generate({ count: 2 });
    rows.forEach((r) => {
      const rowAny = r as unknown as { candidate?: { external_id: string } };
      expect(rowAny.candidate).toBeDefined();
      expect(rowAny.candidate!.external_id).toMatch(/^seed_cand_/);
    });
  });

  it('emits election + constituency refs on every row', () => {
    const gen = new NominationsGenerator(makeCtx({ refs: populatedRefs() }));
    const rows = gen.generate({ count: 1 });
    const rowAny = rows[0] as unknown as {
      election: { external_id: string };
      constituency: { external_id: string };
    };
    expect(rowAny.election).toEqual({ external_id: 'seed_election_00' });
    expect(rowAny.constituency).toEqual({ external_id: 'seed_con_00' });
  });

  it('does NOT emit entity_type (GENERATED column per migration line 724-731)', () => {
    const gen = new NominationsGenerator(makeCtx({ refs: populatedRefs() }));
    const rows = gen.generate({ count: 2 });
    rows.forEach((r) => expect(r).not.toHaveProperty('entity_type'));
  });

  it('does NOT emit redundant organization ref (clean polymorphism per RESEARCH §9)', () => {
    const gen = new NominationsGenerator(makeCtx({ refs: populatedRefs() }));
    const rows = gen.generate({ count: 2 });
    rows.forEach((r) => {
      // Generated candidate-type nominations MUST NOT carry `organization` —
      // the legacy tests/ admin-client workaround (CHECK num_nonnulls=1 fires
      // otherwise) is intentionally dropped; party-candidate relationship is
      // in candidates.organization_id.
      expect(r).not.toHaveProperty('organization');
    });
  });

  it('applies externalIdPrefix to generated rows (GEN-04)', () => {
    const gen = new NominationsGenerator(makeCtx({ refs: populatedRefs() }));
    const rows = gen.generate({ count: 1 });
    expect(rows[0].external_id).toMatch(/^seed_nom_cand_/);
  });

  it('passes through fixed[] with prefix applied', () => {
    const gen = new NominationsGenerator(makeCtx());
    const rows = gen.generate({
      count: 0,
      fixed: [
        {
          external_id: 'my_nom',
          alliance: { external_id: 'seed_alliance_00' },
          election: { external_id: 'seed_election_00' },
          constituency: { external_id: 'seed_con_00' }
        } as never
      ]
    });
    expect(rows).toHaveLength(1);
    expect(rows[0].external_id).toBe('seed_my_nom');
  });

  it('clamps count to refs.candidates.length with logger warning', () => {
    const loggerSpy = vi.fn();
    const gen = new NominationsGenerator(makeCtx({ refs: populatedRefs(), logger: loggerSpy }));
    // populatedRefs() has 2 candidates; requesting 5 should clamp + warn
    const rows = gen.generate({ count: 5 });
    expect(rows).toHaveLength(2);
    expect(loggerSpy).toHaveBeenCalled();
    expect(loggerSpy.mock.calls[0][0]).toContain('Clamped to 2');
  });

  it('produces deterministic output across runs with same seed', () => {
    const run1 = new NominationsGenerator(makeCtx({ refs: populatedRefs() })).generate({ count: 2 });
    const run2 = new NominationsGenerator(makeCtx({ refs: populatedRefs() })).generate({ count: 2 });
    expect(run1).toEqual(run2);
  });
});
