/**
 * OrganizationsGenerator unit tests.
 *
 * D-22 acceptance criteria (a)–(e) + Phase 56 no-auth scope assertion: generated
 * rows MUST NOT carry `auth_user_id` (Phase 56 excludes auth per RESEARCH §4.8).
 */

import { describe, expect, it } from 'vitest';
import { OrganizationsGenerator } from '../../src/generators/OrganizationsGenerator';
import { makeCtx } from '../utils';

describe('OrganizationsGenerator', () => {
  it('honors count from fragment', () => {
    const gen = new OrganizationsGenerator(makeCtx());
    expect(gen.generate({ count: 3 })).toHaveLength(3);
  });

  it('applies externalIdPrefix to generated rows (GEN-04)', () => {
    const gen = new OrganizationsGenerator(makeCtx());
    const rows = gen.generate({ count: 2 });
    rows.forEach((r) => expect(r.external_id).toMatch(/^seed_org_/));
  });

  it('applies externalIdPrefix to fixed[] rows (GEN-04)', () => {
    const gen = new OrganizationsGenerator(makeCtx());
    const rows = gen.generate({
      count: 0,
      fixed: [{ external_id: 'my_party', name: { en: 'Fixed Party' } as never }]
    });
    expect(rows[0].external_id).toBe('seed_my_party');
  });

  it('passes through fixed[] data unchanged modulo prefix', () => {
    const gen = new OrganizationsGenerator(makeCtx());
    const name = { en: 'Custom Party' };
    const rows = gen.generate({ count: 0, fixed: [{ external_id: 'fx', name: name as never }] });
    expect(rows[0].name).toEqual(name);
  });

  it('produces deterministic output across runs with same seed', () => {
    const run1 = new OrganizationsGenerator(makeCtx()).generate({ count: 3 });
    const run2 = new OrganizationsGenerator(makeCtx()).generate({ count: 3 });
    expect(run1).toEqual(run2);
  });

  it('every generated row has project_id', () => {
    const gen = new OrganizationsGenerator(makeCtx());
    const rows = gen.generate({ count: 2 });
    rows.forEach((r) => expect(r.project_id).toBe('00000000-0000-0000-0000-000000000001'));
  });

  it('does NOT emit auth_user_id (Phase 56 no-auth scope per RESEARCH §4.8)', () => {
    const gen = new OrganizationsGenerator(makeCtx());
    const rows = gen.generate({ count: 3 });
    rows.forEach((r) => expect(r).not.toHaveProperty('auth_user_id'));
  });
});
