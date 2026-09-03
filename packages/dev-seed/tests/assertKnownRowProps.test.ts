/**
 * Pass 0 — the runtime unknown-property guard.
 *
 * `assertKnownRowProps(data)` is the layer the type system cannot reach: excess property checking is a fresh-object-literal rule, so the 28 `perm-*` templates whose rows `buildMinimal.ts` constructs programmatically are invisible to the type layer. This spec is the guard's contract.
 *
 * Four things it pins down:
 *
 *   1. **The three-part message** — key, collection and the row's `external_id`, all present in one throw.
 *   2. **The index fallback** — a row with no `external_id` is reported by its index, and the guard NEVER complains that an `external_id` is missing.
 *      That is the RPC's job and it already does it by name; pre-empting it would change the failure mode for the `writer.test.ts` fixtures that legitimately carry none.
 *   3. **Canonical keying** — five cases over `resolveCollectionName`.
 *   4. **The deny/exclude split**, with a parity case asserting that the denied set and the documented exclusion table together reproduce the RPC's own `skip_columns` array in both directions.
 */

import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { assertKnownRowProps } from '../src/assertKnownRowProps';
import { deniedKeys, DENIED_BY_TABLE, SKIP_COLUMNS_NOT_DENIED } from '../src/template/permittedKeys';
import negctlEntityTypeCamel from './fixtures/negctl-questions-entity-type-camel';
import negctlEntityTypeSnake from './fixtures/negctl-questions-entity-type';
import { PROPERTY_MAP } from '@openvaa/supabase-types';

const HERE = dirname(fileURLToPath(import.meta.url));
/** `packages/dev-seed/tests` → repo root. */
const REPO_ROOT = resolve(HERE, '../../..');
/** Note the doubled `supabase/` segment — that is the real path. */
const SCHEMA_SQL = resolve(REPO_ROOT, 'apps/supabase/supabase/schema/501-bulk-operations.sql');

/** Capture a throw's message, or `''` when the call did not throw. */
function messageOf(fn: () => void): string {
  try {
    fn();
  } catch (error) {
    return error instanceof Error ? error.message : String(error);
  }
  return '';
}

// -----------------------------------------------------------------------------
// The three-part message
// -----------------------------------------------------------------------------

describe('assertKnownRowProps — TMPL-02: the message names the key, the collection and the external_id', () => {
  it('names all three in ONE message for an unknown key on a questions row', () => {
    const message = messageOf(() =>
      assertKnownRowProps({
        questions: [{ external_id: 'qu-1', type: 'text', answersByExternalId: { 'cand-1': { value: 3 } } }]
      })
    );
    // All three facts, asserted in a single expectation so the message cannot satisfy the criterion by carrying two of them.
    expect(message).toMatch(/answersByExternalId[\s\S]*questions[\s\S]*qu-1|answersByExternalId[\s\S]*qu-1/);
    expect(message).toContain('answersByExternalId');
    expect(message).toContain('questions');
    expect(message).toContain('qu-1');
  });

  it('follows the in-tree `<function>: <what went wrong>` house style and reads well after the CLI’s `Error: ` prefix', () => {
    const message = messageOf(() => assertKnownRowProps({ elections: [{ external_id: 'el-1', bogus: 1 }] }));
    expect(message.startsWith('assertKnownRowProps: ')).toBe(true);
  });

  it('states that the key would be SILENTLY DROPPED — the failure mode being replaced', () => {
    const message = messageOf(() => assertKnownRowProps({ elections: [{ external_id: 'el-1', bogus: 1 }] }));
    expect(message).toMatch(/silently dropped/);
  });

  it('lists the permitted keys for the collection and names the declaration file as the remediation', () => {
    const message = messageOf(() => assertKnownRowProps({ elections: [{ external_id: 'el-1', bogus: 1 }] }));
    expect(message).toContain('election_date');
    expect(message).toContain('packages/dev-seed/src/template/permittedKeys.ts');
    expect(message).toMatch(/LINK_SENTINELS|COLLECTION_NON_COLUMNS/);
  });

  it('throws on the FIRST offence, not an aggregate — the second offending key is absent from the message', () => {
    const message = messageOf(() =>
      assertKnownRowProps({ elections: [{ external_id: 'el-1', firstBogus: 1, secondBogus: 2 }] })
    );
    expect(message).toContain('firstBogus');
    expect(message).not.toContain('secondBogus');
  });
});

// -----------------------------------------------------------------------------
// Rows with no external_id — the index fallback
// -----------------------------------------------------------------------------

describe('assertKnownRowProps — rows without an external_id', () => {
  it('never requires an external_id: feedback / accounts / projects / app_settings rows pass', () => {
    // These are the shapes `writer.test.ts` has always passed. Requiring an external_id here would turn about twenty existing tests red for the wrong reason.
    expect(() => assertKnownRowProps({ feedback: [{ rating: 5 }] })).not.toThrow();
    expect(() => assertKnownRowProps({ feedback: [{ rating: 5, description: 'test' }] })).not.toThrow();
    expect(() => assertKnownRowProps({ accounts: [{ id: 'x' }] })).not.toThrow();
    expect(() => assertKnownRowProps({ projects: [{ id: 'y' }] })).not.toThrow();
    expect(() => assertKnownRowProps({ app_settings: [{ settings: { key: 'value' } }] })).not.toThrow();
  });

  it('falls back to the row INDEX in the message, and never says an external_id is missing', () => {
    const message = messageOf(() =>
      assertKnownRowProps({ feedback: [{ rating: 5 }, { rating: 4 }, { rating: 3, bogus: true }] })
    );
    expect(message).toContain('index 2');
    expect(message).toContain('feedback');
    expect(message).toContain('bogus');
    // The RPC raises `external_id is required` by name three passes later; the guard must not pre-empt that clearer error with one of its own.
    expect(message).not.toMatch(/required|missing/i);
  });

  it('accepts the camelCase externalId spelling as the row identifier too', () => {
    const message = messageOf(() => assertKnownRowProps({ elections: [{ externalId: 'el-camel', bogus: 1 }] }));
    expect(message).toContain('el-camel');
  });
});

// -----------------------------------------------------------------------------
// One canonical keying — both consumers resolve into it
// -----------------------------------------------------------------------------

describe('assertKnownRowProps — one canonical keying (the five camelCase / snake_case cases)', () => {
  /**
   * ⚠ **Case 1 is the required REAL FAILING CASE, and this pair is INVERTED.**
   *
   * Under an allow-list keyed by the RAW template collection key with no resolution step, `questionCategories` misses the map, the unknown-collection throw fires, and case 1 goes RED — measured. Under the SHIPPED resolved keying it is GREEN, and that green IS the success signal.
   * A reader taking case 1's pass as "the control did not fire" has the pair backwards.
   *
   * Case 5 is its `COLLECTION_NON_COLUMNS` twin, exercising the `constituency_groups` entry through its camel alias — the one entry whose lookup key genuinely differs from its collection key today.
   */
  const sentinelRow = { external_id: 'qc-1', _elections: { externalId: ['el-1'] } };

  it('1. accepts the camelCase collection key (RED if the allow-list is keyed pre-resolution)', () => {
    expect(() => assertKnownRowProps({ questionCategories: [sentinelRow] })).not.toThrow();
  });

  it('2. accepts the snake_case collection key — the same entry, not a second one', () => {
    expect(() => assertKnownRowProps({ question_categories: [sentinelRow] })).not.toThrow();
  });

  it('3. reports the RESOLVED table name when it throws, so the message is greppable', () => {
    expect(() => assertKnownRowProps({ questionCategories: [{ external_id: 'qc-1', bogus: 1 }] })).toThrow(
      /bogus[\s\S]*qc-1[\s\S]*question_categories/
    );
  });

  it('4. an unrecognised collection is LOUD, never silently permissive', () => {
    const message = messageOf(() => assertKnownRowProps({ nonsense_collection: [{ external_id: 'x' }] }));
    // Both the raw collection and the table it resolved to, so a keying confusion is legible rather than a mystery.
    expect(message).toContain('nonsense_collection');
    expect(message).toMatch(/resolved/);
    expect(message).not.toBe('');
    // ⚠ And the blame lands on the COLLECTION, not on whatever key happened to come first. If `permittedKeys` returned an empty set on a miss instead of throwing, this call would still fail — but as `unknown property 'external_id'`, which sends the author hunting for a defect in a row that is perfectly well-formed.
    expect(message).not.toMatch(/unknown property/);
    expect(message).toMatch(/unknown collection/);
  });

  it('4b. an unrecognised collection is loud even when it carries ZERO rows', () => {
    // An empty array must not be a way past the guard: `Writer.write` receives one array per TOPO_ORDER entry and several are routinely empty.
    expect(() => assertKnownRowProps({ nonsense_collection: [] })).toThrow(/nonsense_collection/);
  });

  it('5. COLLECTION_NON_COLUMNS resolves the same way — candidates.email and the bare constituencies array', () => {
    expect(() =>
      assertKnownRowProps({
        candidates: [{ external_id: 'c1', first_name: 'A', last_name: 'B', email: 'a@b.c' }]
      })
    ).not.toThrow();
    expect(() =>
      assertKnownRowProps({
        constituencyGroups: [{ external_id: 'cg1', constituencies: [{ external_id: 'co1' }] }]
      })
    ).not.toThrow();
  });
});

// -----------------------------------------------------------------------------
// Source (4) — the ten RPC relationship references, admitted in practice
// -----------------------------------------------------------------------------

describe('assertKnownRowProps — source (4): the RPC relationship references are admitted', () => {
  it('admits every one of the seven nomination refs, including the unused faction', () => {
    for (const key of [
      'candidate',
      'organization',
      'faction',
      'alliance',
      'election',
      'constituency',
      'parent_nomination'
    ]) {
      expect(() =>
        assertKnownRowProps({ nominations: [{ external_id: 'nom-1', [key]: { external_id: 'x' } }] })
      ).not.toThrow();
    }
  });

  it('admits candidateExternalId on nominations — bulkImport reads it by name', () => {
    expect(() =>
      assertKnownRowProps({ nominations: [{ external_id: 'nom-1', candidateExternalId: 'cand-1' }] })
    ).not.toThrow();
  });

  it('admits the three single-ref tables', () => {
    expect(() =>
      assertKnownRowProps({ candidates: [{ external_id: 'c1', organization: { external_id: 'o1' } }] })
    ).not.toThrow();
    expect(() =>
      assertKnownRowProps({ questions: [{ external_id: 'qu-1', category: { external_id: 'qc-1' } }] })
    ).not.toThrow();
    expect(() =>
      assertKnownRowProps({ constituencies: [{ external_id: 'co-1', parent: { external_id: 'co-0' } }] })
    ).not.toThrow();
  });

  it('does NOT admit a ref on a table the RPC does not declare it for', () => {
    expect(() => assertKnownRowProps({ elections: [{ external_id: 'el-1', category: { external_id: 'x' } }] })).toThrow(
      /category/
    );
  });
});

// -----------------------------------------------------------------------------
// The deny-list and its documented, non-throwing exclusion table
// -----------------------------------------------------------------------------

describe('assertKnownRowProps — entity_type is denied, the other four skip_columns are excluded', () => {
  it('throws the DENY message for entity_type on each of the three declaring tables', () => {
    for (const [collection, externalId] of [
      ['questions', 'qu-1'],
      ['question_categories', 'qc-1'],
      ['nominations', 'nom-1']
    ] as const) {
      const message = messageOf(() =>
        assertKnownRowProps({ [collection]: [{ external_id: externalId, entity_type: 'candidate' }] })
      );
      expect(message).toContain('entity_type');
      expect(message).toContain(collection);
      expect(message).toContain(externalId);
      // The deny message says something DIFFERENT from the unknown-key message: the key is a real column the RPC discards, not a key nobody reads.
      expect(message).toMatch(/skip_columns/);
      expect(message).toMatch(/501-bulk-operations\.sql/);
      expect(message).toMatch(/[Rr]emove it/);
      expect(message).not.toMatch(/unknown property/);
    }
  });

  it('throws the DENY message for the CAMEL form entityType on each of the three declaring tables', () => {
    // ⚠ CR-01. `COLUMN_MAP` maps `entity_type` → `entityType`, so source (1) admits the camel form on every table that declares the column, and a deny-list written as a snake-case literal never saw it. `bulkImport` then ran `resolveFieldName('entityType') === 'entity_type'` and handed the key to the RPC, whose `skip_columns` discarded it — exit 0, column unset.
    // The camel form must produce the SAME deny message as the snake one.
    for (const [collection, externalId] of [
      ['questions', 'qu-1'],
      ['question_categories', 'qc-1'],
      ['nominations', 'nom-1']
    ] as const) {
      const message = messageOf(() =>
        assertKnownRowProps({ [collection]: [{ external_id: externalId, entityType: 'candidate' }] })
      );
      expect(message).toContain('entityType');
      expect(message).toContain(collection);
      expect(message).toContain(externalId);
      expect(message).toMatch(/skip_columns/);
      expect(message).toMatch(/501-bulk-operations\.sql/);
      expect(message).toMatch(/[Rr]emove it/);
      // The camel form must NOT fall through to the allow-list's message: that is the bug — the allow-list PERMITS it, so falling through means passing.
      expect(message).not.toMatch(/unknown property/);
    }
  });

  it('the derived denied set carries EVERY spelling of its declaration, and nothing else', () => {
    // Two directions over one table, so neither the derivation nor the declaration can grow without the other. Derived ⊇ declared, and every derived member resolves back onto a declared column — a camel form that `FIELD_MAP` does not resolve to a denied column cannot appear here.
    for (const table of Object.keys(DENIED_BY_TABLE) as Array<keyof typeof DENIED_BY_TABLE>) {
      const declared = [...DENIED_BY_TABLE[table]] as Array<string>;
      const derived = [...deniedKeys(table)];
      // Direction 1: every declared snake column is denied.
      for (const column of declared) expect(derived).toContain(column);
      // Direction 2: every derived key resolves onto a declared column.
      for (const key of derived) expect(declared).toContain(PROPERTY_MAP[key as never] ?? key);
      // And the one column declared today is denied under both spellings.
      expect(derived.sort()).toEqual(['entityType', 'entity_type']);
    }
  });

  it('BOTH negative-control fixtures fire against the shipped guard, snake and camel alike', () => {
    // The DENY control, run in CI rather than only through `yarn db:seed --template <abs path>` against a live database. A control that fires only on an operator's machine is a guard that cannot be relied on, and the camel arm is the one that could not fire at all until the deny-list covered it: `entityType` sat in the PERMITTED set and was absent from the DENIED one.
    for (const [label, fixture] of [
      ['snake (144-01, byte-frozen)', negctlEntityTypeSnake],
      ['camel (the CR-01 arm)', negctlEntityTypeCamel]
    ] as const) {
      const rows = fixture.questions.fixed as Array<Record<string, unknown>>;
      // The fixture is a template, so guard the shape: an empty `fixed[]` would make this case pass without looking at anything.
      expect(rows.length, label).toBeGreaterThan(0);
      const message = messageOf(() => assertKnownRowProps({ questions: rows }));
      expect(message, label).toMatch(/skip_columns/);
      expect(message, label).not.toMatch(/unknown property/);
    }
  });

  it('does NOT deny entityType on a table that does not declare the column', () => {
    // Same asymmetry as the snake case below: `elections` has no `entity_type` column, so `entityType` is not a permitted camel form there either — it is caught, but by the allow-list, with the allow-list's message.
    const message = messageOf(() => assertKnownRowProps({ elections: [{ external_id: 'el-1', entityType: 'x' }] }));
    expect(message).toContain('unknown property');
  });

  it('does NOT deny entity_type on a table that does not declare the column', () => {
    // `elections` has no `entity_type` column, so the key is UNKNOWN there — caught, but by the allow-list, with the allow-list's message.
    const message = messageOf(() => assertKnownRowProps({ elections: [{ external_id: 'el-1', entity_type: 'x' }] }));
    expect(message).toContain('unknown property');
  });

  it('all four EXCLUDED skip_columns pass without throwing', () => {
    expect(() =>
      assertKnownRowProps({
        questions: [
          {
            external_id: 'qu-1',
            project_id: '00000000-0000-0000-0000-000000000001',
            id: 'a-uuid',
            created_at: '2026-01-01T00:00:00Z',
            updated_at: '2026-01-01T00:00:00Z'
          }
        ]
      })
    ).not.toThrow();
  });

  it('the exclusion table is DOCUMENTED — every entry carries a non-empty reason', () => {
    expect(Object.keys(SKIP_COLUMNS_NOT_DENIED).sort()).toEqual(['created_at', 'id', 'project_id', 'updated_at']);
    for (const reason of Object.values(SKIP_COLUMNS_NOT_DENIED)) {
      expect(typeof reason).toBe('string');
      expect(reason.length).toBeGreaterThan(20);
    }
  });

  it('DENIED ∪ EXCLUDED equals the RPC’s skip_columns array, in BOTH directions', () => {
    // Parsed from the SQL read at run time — a future `skip_columns` addition cannot pass unnoticed, in either direction.
    const sql = readFileSync(SCHEMA_SQL, 'utf8');
    const match = sql.match(/skip_columns\s+text\[\]\s*:=\s*ARRAY\[([\s\S]*?)\]/);
    expect(match).not.toBeNull();
    const fromSql = [...(match as RegExpMatchArray)[1].matchAll(/'([a-z_]+)'/g)].map((m) => m[1]);
    expect(fromSql.length).toBeGreaterThan(0);

    const denied = new Set(Object.values(DENIED_BY_TABLE).flatMap((keys) => [...keys]));
    const excluded = new Set(Object.keys(SKIP_COLUMNS_NOT_DENIED));
    const union = [...new Set([...denied, ...excluded])].sort();

    // Direction 1: everything the SQL skips is accounted for as denied or excluded.
    expect(union).toEqual([...new Set(fromSql)].sort());
    // Direction 2: nothing is denied or excluded that the SQL does not skip.
    for (const key of union) expect(fromSql).toContain(key);
    // And the split is the specified one: exactly one honest deny entry.
    expect([...denied].sort()).toEqual(['entity_type']);
  });

  it('denies entity_type on exactly the three tables that declare the column', () => {
    expect(Object.keys(DENIED_BY_TABLE).sort()).toEqual(['nominations', 'question_categories', 'questions']);
  });
});

// -----------------------------------------------------------------------------
// Shape and purity
// -----------------------------------------------------------------------------

describe('assertKnownRowProps — shape', () => {
  it('returns undefined and throws nothing for a clean multi-collection dataset', () => {
    expect(
      assertKnownRowProps({
        elections: [{ external_id: 'el-1', name: { en: 'E' }, project_id: 'p' }],
        constituency_groups: [{ external_id: 'cg-1', _constituencies: { externalId: ['co-1'] } }],
        constituencies: [{ external_id: 'co-1' }],
        app_settings: [{ settings: {} }],
        feedback: [{ rating: 5 }],
        accounts: [],
        projects: []
      })
    ).toBeUndefined();
  });

  it('ignores non-array values rather than crashing on them', () => {
    expect(() =>
      assertKnownRowProps({ elections: undefined as unknown as Array<Record<string, unknown>> })
    ).not.toThrow();
  });
});
