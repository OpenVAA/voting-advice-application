/**
 * `e2e/base` template shape tests (see phase 93 Plan 02).
 *
 * Retargeted from the retired `e2e` template suite to the canonical base
 * dataset (formerly `baseV1`, now `packages/dev-seed/src/templates/e2e/base.ts`).
 * The base dataset is the single multi-election / multi-constituency seed that
 * every downstream setup + spec consumes; this file locks its structural
 * shape so accidental drift in the dataset is caught at the unit-test gate.
 *
 * Every asserted count + external_id is derived from `e2e/base.ts` directly
 * (read at authoring time from the source, not carried over from the old e2e
 * single-election expectations). The old e2e contracts (`test-election-1`,
 * single-election, 18 candidates) are intentionally NOT reproduced — the base
 * dataset is a different, multi-election shape.
 *
 * contract: pure I/O. No Supabase imports, no `createClient`, no `.rpc `.
 */

import { describe, expect, it } from 'vitest';
import { validateTemplate } from '../../src/template/schema';
import { baseTemplate } from '../../src/templates/e2e/base';

// ---------------------------------------------------------------------------
// Fragment introspection helpers. The Template type marks every table field as
// optional, so we narrow carefully to avoid masking real type errors.
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
// Positive inclusion list — key external_ids that downstream setup/specs
// assert against. Derived from e2e/base.ts (the surviving dataset).
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

  // 5 organizations
  { table: 'organizations', id: 'test-e2e-base-or-aa' },
  { table: 'organizations', id: 'test-e2e-base-or-c' },

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
  { table: 'candidates', id: 'test-e2e-base-ca-aa-unregistered' }
];

// ---------------------------------------------------------------------------
// Test suite
// ---------------------------------------------------------------------------

describe('baseTemplate — shape + schema validation', () => {
  it('passes validateTemplate without throwing', () => {
    expect(() => validateTemplate(baseTemplate)).not.toThrow();
  });

  it('sets generateTranslationsForAllLocales: false (single-locale e2e per D-58-16)', () => {
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

  it('organizations.fixed has exactly 5 entries', () => {
    expect(fixedOf('organizations')).toHaveLength(5);
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
      | { name?: { en?: string } }
      | undefined;
    expect(e?.name?.en).toBe('[el-reg] Regional Election');
  });

  it('test-e2e-base-el-mun name is "[el-mun] Municipal Election"', () => {
    const e = fixedOf('elections').find((r) => r.external_id === 'test-e2e-base-el-mun') as
      | { name?: { en?: string } }
      | undefined;
    expect(e?.name?.en).toBe('[el-mun] Municipal Election');
  });

  it('test-e2e-base-ca-aa-special is the partial-answer "Special" candidate under party AA', () => {
    const c = fixedOf('candidates').find((r) => r.external_id === 'test-e2e-base-ca-aa-special') as
      | { first_name?: string; organization?: { external_id?: string } }
      | undefined;
    expect(c?.first_name).toBe('Special');
    expect(c?.organization?.external_id).toBe('test-e2e-base-or-aa');
  });
});

describe('baseTemplate — registration + hierarchy invariants', () => {
  it('test-e2e-base-ca-aa-hidden has NO terms_of_use_accepted (candidate-level hidden)', () => {
    const c = fixedOf('candidates').find((r) => r.external_id === 'test-e2e-base-ca-aa-hidden') as
      | { terms_of_use_accepted?: string }
      | undefined;
    expect(c).toBeDefined();
    expect(c?.terms_of_use_accepted).toBeUndefined();
  });

  it('test-e2e-base-ca-aa-unregistered has NO terms_of_use_accepted and NO answers', () => {
    const c = fixedOf('candidates').find((r) => r.external_id === 'test-e2e-base-ca-aa-unregistered') as
      | { terms_of_use_accepted?: string; answersByExternalId?: unknown }
      | undefined;
    expect(c).toBeDefined();
    expect(c?.terms_of_use_accepted).toBeUndefined();
    expect(c?.answersByExternalId).toBeUndefined();
  });

  it('test-e2e-base-ca-independent has no organization ref (independent candidate)', () => {
    const c = fixedOf('candidates').find((r) => r.external_id === 'test-e2e-base-ca-independent') as
      | { organization?: unknown }
      | undefined;
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

describe('baseTemplate — question scoping sentinels', () => {
  it('test-e2e-base-qg-opin-el-reg carries an _elections scoping sentinel for test-e2e-base-el-reg', () => {
    const cat = fixedOf('question_categories').find((r) => r.external_id === 'test-e2e-base-qg-opin-el-reg') as
      | { _elections?: { external_id?: Array<string> } }
      | undefined;
    expect(cat?._elections?.external_id).toContain('test-e2e-base-el-reg');
  });

  it('test-e2e-base-qg-opin-co-mun-se-sw carries a _constituencies sentinel for the SE/SW municipalities', () => {
    const cat = fixedOf('question_categories').find((r) => r.external_id === 'test-e2e-base-qg-opin-co-mun-se-sw') as
      | { _constituencies?: { external_id?: Array<string> } }
      | undefined;
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
