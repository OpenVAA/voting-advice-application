/**
 * `e2e/base` template shape tests.
 *
 * Retargeted from the retired `e2e` template suite to the canonical base dataset (formerly `baseV1`, now `packages/dev-seed/src/templates/e2e/base.ts`).
 * The base dataset is the single multi-election / multi-constituency seed that every downstream setup + spec consumes; this file locks its structural shape so accidental drift in the dataset is caught at the unit-test gate.
 *
 * Every asserted count + external_id is derived from `e2e/base.ts` directly (read at authoring time from the source, not carried over from the old e2e single-election expectations). The old e2e contracts (`test-election-1`, single-election, 18 candidates) are intentionally NOT reproduced — the base dataset is a different, multi-election shape.
 *
 * contract: pure I/O. No Supabase imports, no `createClient`, no `.rpc `.
 */

import { describe, expect, it } from 'vitest';
import { validateTemplate } from '../../src/template/schema';
import { baseTemplate } from '../../src/templates/e2e/base';

// ---------------------------------------------------------------------------
// Fragment introspection helpers. The Template type marks every table field as optional, so we narrow carefully to avoid masking real type errors.
// ---------------------------------------------------------------------------

type FragmentView = { fixed?: Array<Record<string, unknown>>; count?: number };

function fragmentOf(table: string): FragmentView | undefined {
  const val = (baseTemplate as unknown as Record<string, unknown>)[table];
  if (val && typeof val === 'object' && !Array.isArray(val) && 'fixed' in (val as object)) {
    return val as FragmentView;
  }
  return undefined;
}

function fixedOf(table: string): Array<Record<string, unknown>> {
  return fragmentOf(table)?.fixed ?? [];
}

function externalIdsOf(table: string): Array<string> {
  return fixedOf(table)
    .map((r) => r.external_id)
    .filter((id): id is string => typeof id === 'string');
}

function allExternalIds(): Array<string> {
  const ids: Array<string> = [];
  for (const key of Object.keys(baseTemplate)) {
    for (const row of fixedOf(key)) {
      if (typeof row.external_id === 'string') ids.push(row.external_id);
    }
  }
  return ids;
}

// ---------------------------------------------------------------------------
// Positive inclusion list — key external_ids that downstream setup/specs assert against. Derived from e2e/base.ts (the surviving dataset).
// ---------------------------------------------------------------------------

const REQUIRED_EXTERNAL_IDS: Array<{ table: string; id: string }> = [
  // 2-election base (regional + municipal)
  { table: 'elections', id: 'test-e2e-base-el-reg' },
  { table: 'elections', id: 'test-e2e-base-el-mun' },

  // 2 constituency groups
  { table: 'constituency_groups', id: 'test-e2e-base-cg-reg' },
  { table: 'constituency_groups', id: 'test-e2e-base-cg-mun' },

  // 6 constituencies (2 regional + 4 municipal, hierarchical)
  { table: 'constituencies', id: 'test-e2e-base-co-reg-n' },
  { table: 'constituencies', id: 'test-e2e-base-co-reg-s' },
  { table: 'constituencies', id: 'test-e2e-base-co-mun-ne' },
  { table: 'constituencies', id: 'test-e2e-base-co-mun-sw' },

  // 8 organizations: the 5 parties voters see, the unconfirmed selection organization, the unconfirmed invitation organization and the unconfirmed registration organization
  { table: 'organizations', id: 'test-e2e-base-or-aa' },
  { table: 'organizations', id: 'test-e2e-base-or-c' },
  { table: 'organizations', id: 'test-e2e-base-or-sel' },
  { table: 'organizations', id: 'test-e2e-base-or-invitation' },
  { table: 'organizations', id: 'test-e2e-base-or-registration' },

  // 2 alliances
  { table: 'alliances', id: 'test-e2e-base-al-a' },
  { table: 'alliances', id: 'test-e2e-base-al-b' },

  // question categories (1 info + 7 opinion)
  { table: 'question_categories', id: 'test-e2e-base-qg-info' },
  { table: 'question_categories', id: 'test-e2e-base-qg-opin-base' },
  { table: 'question_categories', id: 'test-e2e-base-qg-opin-el-reg' },
  { table: 'question_categories', id: 'test-e2e-base-qg-opin-co-mun-se-sw' },

  // key questions (info text consumed by results cardContents; opinion base)
  { table: 'questions', id: 'test-e2e-base-qu-info-text' },
  { table: 'questions', id: 'test-e2e-base-qu-info-text-link' },
  { table: 'questions', id: 'test-e2e-base-qu-opin-base-1-likert5' },

  // key candidates (perfect/worst/partial/independent + unregistered)
  { table: 'candidates', id: 'test-e2e-base-ca-aa-special' },
  { table: 'candidates', id: 'test-e2e-base-ca-aa-hidden' },
  { table: 'candidates', id: 'test-e2e-base-ca-ba-1' },
  { table: 'candidates', id: 'test-e2e-base-ca-independent' },
  { table: 'candidates', id: 'test-e2e-base-ca-aa-unregistered' },

  // the two unconfirmed selection candidates
  { table: 'candidates', id: 'test-e2e-base-ca-sel-a' },
  { table: 'candidates', id: 'test-e2e-base-ca-sel-b' },

  // the unconfirmed invitation candidate
  { table: 'candidates', id: 'test-e2e-base-ca-invitation' },

  // the four unconfirmed candidates reserved for the registration, recovery and scan tests
  { table: 'candidates', id: 'test-e2e-base-ca-registration' },
  { table: 'candidates', id: 'test-e2e-base-ca-recovery' },
  { table: 'candidates', id: 'test-e2e-base-ca-scan-open' },
  { table: 'candidates', id: 'test-e2e-base-ca-scan-used' }
];

// ---------------------------------------------------------------------------
// Test suite
// ---------------------------------------------------------------------------

describe('baseTemplate — shape + schema validation', () => {
  it('passes validateTemplate without throwing', () => {
    expect(() => validateTemplate(baseTemplate)).not.toThrow();
  });

  it('sets generateTranslationsForAllLocales: false (single-locale e2e)', () => {
    expect(baseTemplate.generateTranslationsForAllLocales).toBe(false);
  });

  it('sets externalIdPrefix: "" so literal test- ids pass through unchanged', () => {
    expect(baseTemplate.externalIdPrefix).toBe('');
  });

  it('sets a numeric seed for determinism', () => {
    expect(typeof baseTemplate.seed).toBe('number');
  });
});

describe('baseTemplate — required external_id inclusion list', () => {
  it.each(REQUIRED_EXTERNAL_IDS)('table $table contains required external_id $id', ({ table, id }) => {
    const frag = fragmentOf(table);
    expect(frag, `missing fragment for table ${table}`).toBeDefined();
    expect(externalIdsOf(table)).toContain(id);
  });

  it('has no duplicate external_ids across the whole template', () => {
    const ids = allExternalIds();
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe('baseTemplate — multi-election row-count shape (derived from e2e/base.ts)', () => {
  it('elections.fixed has exactly 2 entries (regional + municipal)', () => {
    expect(fixedOf('elections')).toHaveLength(2);
  });

  it('constituency_groups.fixed has exactly 2 entries (CG-Reg + CG-Mun)', () => {
    expect(fixedOf('constituency_groups')).toHaveLength(2);
  });

  it('constituencies.fixed has exactly 6 entries (2 regional + 4 municipal)', () => {
    expect(fixedOf('constituencies')).toHaveLength(6);
  });

  it('organizations.fixed has 5 + 1 + 1 + 1 entries (the 5 parties voters see + 1 unconfirmed selection organization + 1 unconfirmed invitation organization + 1 unconfirmed registration organization)', () => {
    expect(fixedOf('organizations')).toHaveLength(5 + 1 + 1 + 1);
  });

  it('candidates.fixed has 30 + 2 + 1 + 4 entries (30 journey candidates + 2 unconfirmed selection candidates + 1 unconfirmed invitation candidate + 4 unconfirmed candidates reserved for the registration, recovery and scan tests)', () => {
    expect(fixedOf('candidates')).toHaveLength(30 + 2 + 1 + 4);
  });

  it('nominations.fixed has 60 + 3 entries (60 journey nominations + 1 for each of the 3 selection rows; none for the invited candidate of the contestant journey, whose invitation creates its nomination, for the 2 invitation rows or for the 5 rows reserved for the registration, recovery and scan tests)', () => {
    expect(fixedOf('nominations')).toHaveLength(60 + 3);
  });

  it('alliances.fixed has exactly 2 entries', () => {
    expect(fixedOf('alliances')).toHaveLength(2);
  });

  it('question_categories.fixed has exactly 8 entries (1 info + 7 opinion)', () => {
    expect(fixedOf('question_categories')).toHaveLength(8);
  });

  it('exactly 1 info category + 7 opinion categories', () => {
    const cats = fixedOf('question_categories') as Array<{ category_type?: string }>;
    expect(cats.filter((c) => c.category_type === 'info')).toHaveLength(1);
    expect(cats.filter((c) => c.category_type === 'opinion')).toHaveLength(7);
  });
});

describe('baseTemplate — display-text contracts (bracketed [id] desc naming)', () => {
  it('test-e2e-base-el-reg name is "[el-reg] Regional Election"', () => {
    const e = fixedOf('elections').find((r) => r.external_id === 'test-e2e-base-el-reg') as
      { name?: { en?: string } } | undefined;
    expect(e?.name?.en).toBe('[el-reg] Regional Election');
  });

  it('test-e2e-base-el-mun name is "[el-mun] Municipal Election"', () => {
    const e = fixedOf('elections').find((r) => r.external_id === 'test-e2e-base-el-mun') as
      { name?: { en?: string } } | undefined;
    expect(e?.name?.en).toBe('[el-mun] Municipal Election');
  });

  it('test-e2e-base-ca-aa-special is the partial-answer "Special" candidate under party AA', () => {
    const c = fixedOf('candidates').find((r) => r.external_id === 'test-e2e-base-ca-aa-special') as
      { first_name?: string; organization?: { external_id?: string } } | undefined;
    expect(c?.first_name).toBe('Special');
    expect(c?.organization?.external_id).toBe('test-e2e-base-or-aa');
  });
});

describe('baseTemplate — registration + hierarchy invariants', () => {
  it('test-e2e-base-ca-aa-hidden is seeded confirmed: false (candidate-level hidden)', () => {
    const c = fixedOf('candidates').find((r) => r.external_id === 'test-e2e-base-ca-aa-hidden') as
      { confirmed?: boolean } | undefined;
    expect(c).toBeDefined();
    expect(c?.confirmed).toBe(false);
  });

  it('test-e2e-base-ca-aa-unregistered is seeded confirmed: false and has NO answers', () => {
    const c = fixedOf('candidates').find((r) => r.external_id === 'test-e2e-base-ca-aa-unregistered') as
      { confirmed?: boolean; answersByExternalId?: unknown } | undefined;
    expect(c).toBeDefined();
    expect(c?.confirmed).toBe(false);
    expect(c?.answersByExternalId).toBeUndefined();
  });

  it('the 2 unconfirmed control rows, the 2 selection candidates, the invitation candidate and the 4 candidates reserved for the registration, recovery and scan tests are the only candidates that state confirmed', () => {
    const stating = (fixedOf('candidates') as Array<{ external_id?: string }>)
      .filter((r) => 'confirmed' in r)
      .map((r) => r.external_id)
      .sort();
    expect(stating).toEqual([
      'test-e2e-base-ca-aa-hidden',
      'test-e2e-base-ca-aa-unregistered',
      'test-e2e-base-ca-invitation',
      'test-e2e-base-ca-recovery',
      'test-e2e-base-ca-registration',
      'test-e2e-base-ca-scan-open',
      'test-e2e-base-ca-scan-used',
      'test-e2e-base-ca-sel-a',
      'test-e2e-base-ca-sel-b'
    ]);
  });

  it('the selection organization, the invitation organization and the registration organization are the only organizations that state confirmed', () => {
    const stating = (fixedOf('organizations') as Array<{ external_id?: string }>)
      .filter((r) => 'confirmed' in r)
      .map((r) => r.external_id)
      .sort();
    expect(stating).toEqual(['test-e2e-base-or-invitation', 'test-e2e-base-or-registration', 'test-e2e-base-or-sel']);
  });

  it('test-e2e-base-ca-independent has no organization ref (independent candidate)', () => {
    const c = fixedOf('candidates').find((r) => r.external_id === 'test-e2e-base-ca-independent') as
      { organization?: unknown } | undefined;
    expect(c).toBeDefined();
    expect(c?.organization).toBeUndefined();
  });

  it('every municipal constituency carries a parent ref to its regional constituency', () => {
    const munIds = [
      'test-e2e-base-co-mun-ne',
      'test-e2e-base-co-mun-nw',
      'test-e2e-base-co-mun-se',
      'test-e2e-base-co-mun-sw'
    ];
    const cos = fixedOf('constituencies') as Array<{
      external_id?: string;
      parent?: { external_id?: string };
    }>;
    for (const id of munIds) {
      const co = cos.find((c) => c.external_id === id);
      expect(co, `missing constituency ${id}`).toBeDefined();
      expect(co?.parent?.external_id, `${id} missing parent ref`).toMatch(/^test-e2e-base-co-reg-[ns]$/);
    }
  });
});

describe('baseTemplate — the three entity-selection rows', () => {
  type SelectionRow = {
    external_id?: string;
    confirmed?: boolean;
    first_name?: string;
    last_name?: string;
    name?: { en?: string };
    short_name?: { en?: string };
    organization?: unknown;
    answersByExternalId?: Record<string, { value: unknown }>;
  };
  type NominationRow = {
    external_id?: string;
    candidate?: { external_id?: string };
    organization?: { external_id?: string };
    parent_nomination?: unknown;
    election?: { external_id?: string };
    constituency?: { external_id?: string };
  };

  const SELECTION_ROWS = [
    { table: 'candidates', ref: 'candidate', id: 'test-e2e-base-ca-sel-a' },
    { table: 'candidates', ref: 'candidate', id: 'test-e2e-base-ca-sel-b' },
    { table: 'organizations', ref: 'organization', id: 'test-e2e-base-or-sel' }
  ] as const;

  function rowOf(table: string, id: string): SelectionRow | undefined {
    return (fixedOf(table) as Array<SelectionRow>).find((r) => r.external_id === id);
  }

  it.each(SELECTION_ROWS)('$id is seeded confirmed: false, so voters do not see it', ({ table, id }) => {
    const row = rowOf(table, id);
    expect(row).toBeDefined();
    expect(row?.confirmed).toBe(false);
  });

  it.each(SELECTION_ROWS)(
    '$id has exactly one nomination, in the regional election, under no parent',
    ({ ref, id }) => {
      const noms = (fixedOf('nominations') as Array<NominationRow>).filter((n) => n[ref]?.external_id === id);
      expect(noms).toHaveLength(1);
      expect(noms[0].election?.external_id).toBe('test-e2e-base-el-reg');
      expect(noms[0].constituency?.external_id).toBe('test-e2e-base-co-reg-n');
      expect(noms[0].parent_nomination).toBeUndefined();
    }
  );

  it('neither selection candidate belongs to an organization, so no party gains a member', () => {
    expect(rowOf('candidates', 'test-e2e-base-ca-sel-a')?.organization).toBeUndefined();
    expect(rowOf('candidates', 'test-e2e-base-ca-sel-b')?.organization).toBeUndefined();
  });

  it('the two selection candidates differ in first name and last name, and sort A before B on both', () => {
    const a = rowOf('candidates', 'test-e2e-base-ca-sel-a');
    const b = rowOf('candidates', 'test-e2e-base-ca-sel-b');
    expect(a?.first_name).toBe('Switch-A');
    expect(a?.last_name).toBe('Entity One');
    expect(b?.first_name).toBe('Switch-B');
    expect(b?.last_name).toBe('Entity Two');
    expect(a!.first_name!.localeCompare(b!.first_name!)).toBeLessThan(0);
    expect(a!.last_name!.localeCompare(b!.last_name!)).toBeLessThan(0);
  });

  it('the two selection candidates answer the same questions as CA-AA-1 and differ on QU-Opin-Base-1 alone', () => {
    const session = rowOf('candidates', 'test-e2e-base-ca-aa-1')?.answersByExternalId;
    const a = rowOf('candidates', 'test-e2e-base-ca-sel-a')?.answersByExternalId;
    const b = rowOf('candidates', 'test-e2e-base-ca-sel-b')?.answersByExternalId;
    expect(session).toBeDefined();
    expect(a).toEqual(session);
    expect(Object.keys(b ?? {}).sort()).toEqual(Object.keys(session ?? {}).sort());
    const differing = Object.keys(a ?? {}).filter((key) => JSON.stringify(a![key]) !== JSON.stringify(b![key]));
    expect(differing).toEqual(['test-e2e-base-qu-opin-base-1-likert5']);
    expect(a!['test-e2e-base-qu-opin-base-1-likert5'].value).toBe('3');
    expect(b!['test-e2e-base-qu-opin-base-1-likert5'].value).toBe('5');
  });

  it('the selection organization has a name and a short name of its own and no answers', () => {
    const org = rowOf('organizations', 'test-e2e-base-or-sel');
    expect(org?.name?.en).toBe('[or-sel] Party Sel');
    expect(org?.short_name?.en).toBe('SEL');
    expect(org?.answersByExternalId).toBeUndefined();
    const others = (fixedOf('organizations') as Array<SelectionRow>).filter(
      (r) => r.external_id !== 'test-e2e-base-or-sel'
    );
    expect(others.map((r) => r.name?.en)).not.toContain(org?.name?.en);
    expect(others.map((r) => r.short_name?.en)).not.toContain(org?.short_name?.en);
  });
});

describe('baseTemplate — the two invitation rows', () => {
  type InvitationRow = {
    external_id?: string;
    confirmed?: boolean;
    first_name?: string;
    last_name?: string;
    name?: { en?: string };
    short_name?: { en?: string };
    organization?: unknown;
    answersByExternalId?: unknown;
  };
  type NominationRefs = {
    candidate?: { external_id?: string };
    organization?: { external_id?: string };
  };

  const INVITATION_ROWS = [
    { table: 'candidates', ref: 'candidate', id: 'test-e2e-base-ca-invitation' },
    { table: 'organizations', ref: 'organization', id: 'test-e2e-base-or-invitation' }
  ] as const;

  function rowOf(table: string, id: string): InvitationRow | undefined {
    return (fixedOf(table) as Array<InvitationRow>).find((r) => r.external_id === id);
  }

  it.each(INVITATION_ROWS)(
    '$id is seeded confirmed: false, so only an invitation that confirms it makes it confirmed',
    ({ table, id }) => {
      const row = rowOf(table, id);
      expect(row).toBeDefined();
      expect(row?.confirmed).toBe(false);
    }
  );

  it.each(INVITATION_ROWS)('$id has no nomination, so it can never be public', ({ ref, id }) => {
    const noms = (fixedOf('nominations') as Array<NominationRefs>).filter((n) => n[ref]?.external_id === id);
    expect(noms).toHaveLength(0);
  });

  it.each(INVITATION_ROWS)('$id answers nothing', ({ table, id }) => {
    expect(rowOf(table, id)?.answersByExternalId).toBeUndefined();
  });

  it('the invitation candidate has both names and belongs to no organization', () => {
    const candidate = rowOf('candidates', 'test-e2e-base-ca-invitation');
    expect(candidate?.first_name?.trim()).toBeTruthy();
    expect(candidate?.last_name?.trim()).toBeTruthy();
    expect(candidate?.organization).toBeUndefined();
  });

  it('the invitation organization has a name and a short name no other organization carries', () => {
    const org = rowOf('organizations', 'test-e2e-base-or-invitation');
    expect(org?.name?.en?.trim()).toBeTruthy();
    expect(org?.short_name?.en?.trim()).toBeTruthy();
    const others = (fixedOf('organizations') as Array<InvitationRow>).filter(
      (r) => r.external_id !== 'test-e2e-base-or-invitation'
    );
    expect(others.map((r) => r.name?.en)).not.toContain(org?.name?.en);
    expect(others.map((r) => r.short_name?.en)).not.toContain(org?.short_name?.en);
  });

  it('no candidate belongs to the invitation organization', () => {
    const members = (fixedOf('candidates') as Array<{ organization?: { external_id?: string } }>).filter(
      (c) => c.organization?.external_id === 'test-e2e-base-or-invitation'
    );
    expect(members).toHaveLength(0);
  });
});

describe('baseTemplate — the five rows reserved for the registration, recovery and scan tests', () => {
  type ReservedRow = {
    external_id?: string;
    confirmed?: boolean;
    first_name?: string;
    last_name?: string;
    name?: { en?: string };
    short_name?: { en?: string };
    organization?: unknown;
    answersByExternalId?: unknown;
  };

  const RESERVED_ROWS = [
    { table: 'candidates', id: 'test-e2e-base-ca-registration' },
    { table: 'organizations', id: 'test-e2e-base-or-registration' },
    { table: 'candidates', id: 'test-e2e-base-ca-recovery' },
    { table: 'candidates', id: 'test-e2e-base-ca-scan-open' },
    { table: 'candidates', id: 'test-e2e-base-ca-scan-used' }
  ] as const;
  const RESERVED_CANDIDATES = RESERVED_ROWS.filter((row) => row.table === 'candidates');

  function rowOf(table: string, id: string): ReservedRow | undefined {
    return (fixedOf(table) as Array<ReservedRow>).find((r) => r.external_id === id);
  }

  it.each(RESERVED_ROWS)('$id is seeded confirmed: false', ({ table, id }) => {
    const row = rowOf(table, id);
    expect(row).toBeDefined();
    expect(row?.confirmed).toBe(false);
  });

  it.each(RESERVED_ROWS)(
    '$id is named once in the whole template, so no nomination, answer or other row refers to it and it can never be public',
    ({ id }) => {
      expect(JSON.stringify(baseTemplate).split(`"${id}"`).length - 1).toBe(1);
    }
  );

  it.each(RESERVED_ROWS)('$id answers nothing', ({ table, id }) => {
    expect(rowOf(table, id)).toBeDefined();
    expect(rowOf(table, id)?.answersByExternalId).toBeUndefined();
  });

  it.each(RESERVED_CANDIDATES)('$id has both names and belongs to no organization', ({ table, id }) => {
    const candidate = rowOf(table, id);
    expect(candidate?.first_name?.trim()).toBeTruthy();
    expect(candidate?.last_name?.trim()).toBeTruthy();
    expect(candidate?.organization).toBeUndefined();
  });

  it('each reserved candidate has a full name no other candidate of the dataset carries', () => {
    const fullNames = (fixedOf('candidates') as Array<ReservedRow>).map((r) => `${r.first_name} ${r.last_name}`);
    for (const { table, id } of RESERVED_CANDIDATES) {
      const row = rowOf(table, id);
      expect(fullNames.filter((name) => name === `${row?.first_name} ${row?.last_name}`)).toHaveLength(1);
    }
  });

  it('the registration organization has a name and a short name no other organization carries', () => {
    const org = rowOf('organizations', 'test-e2e-base-or-registration');
    expect(org?.name?.en?.trim()).toBeTruthy();
    expect(org?.short_name?.en?.trim()).toBeTruthy();
    const others = (fixedOf('organizations') as Array<ReservedRow>).filter(
      (r) => r.external_id !== 'test-e2e-base-or-registration'
    );
    expect(others.map((r) => r.name?.en)).not.toContain(org?.name?.en);
    expect(others.map((r) => r.short_name?.en)).not.toContain(org?.short_name?.en);
  });
});

describe('baseTemplate — question scoping sentinels', () => {
  it('test-e2e-base-qg-opin-el-reg carries an _elections scoping sentinel for test-e2e-base-el-reg', () => {
    const cat = fixedOf('question_categories').find((r) => r.external_id === 'test-e2e-base-qg-opin-el-reg') as
      { _elections?: { external_id?: Array<string> } } | undefined;
    expect(cat?._elections?.external_id).toContain('test-e2e-base-el-reg');
  });

  it('test-e2e-base-qg-opin-co-mun-se-sw carries a _constituencies sentinel for the SE/SW municipalities', () => {
    const cat = fixedOf('question_categories').find((r) => r.external_id === 'test-e2e-base-qg-opin-co-mun-se-sw') as
      { _constituencies?: { external_id?: Array<string> } } | undefined;
    expect(cat?._constituencies?.external_id).toEqual(
      expect.arrayContaining(['test-e2e-base-co-mun-se', 'test-e2e-base-co-mun-sw'])
    );
  });
});

describe('baseTemplate — relational triangle closure', () => {
  it('every nomination carries election + constituency refs', () => {
    const noms = fixedOf('nominations') as Array<{
      external_id?: string;
      election?: unknown;
      constituency?: unknown;
    }>;
    expect(noms.length).toBeGreaterThan(0);
    for (const n of noms) {
      expect(n.election, `nomination ${n.external_id} missing election`).toBeDefined();
      expect(n.constituency, `nomination ${n.external_id} missing constituency`).toBeDefined();
    }
  });

  it('every nomination carries exactly one polymorphic ref (candidate XOR organization XOR alliance)', () => {
    const noms = fixedOf('nominations') as Array<{
      external_id?: string;
      candidate?: unknown;
      organization?: unknown;
      alliance?: unknown;
      faction?: unknown;
    }>;
    for (const n of noms) {
      const refCount = (n.candidate ? 1 : 0) + (n.organization ? 1 : 0) + (n.alliance ? 1 : 0) + (n.faction ? 1 : 0);
      expect(refCount, `nomination ${n.external_id} must carry exactly one polymorphic ref`).toBe(1);
    }
  });

  it('every nomination references an election + constituency that exists in the dataset', () => {
    const electionIds = new Set(externalIdsOf('elections'));
    const constituencyIds = new Set(externalIdsOf('constituencies'));
    const noms = fixedOf('nominations') as Array<{
      external_id?: string;
      election?: { external_id?: string };
      constituency?: { external_id?: string };
    }>;
    for (const n of noms) {
      expect(electionIds.has(n.election!.external_id!), `nom ${n.external_id} -> unknown election`).toBe(true);
      expect(constituencyIds.has(n.constituency!.external_id!), `nom ${n.external_id} -> unknown constituency`).toBe(
        true
      );
    }
  });
});
