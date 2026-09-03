/**
 * Derivation spec for the single permitted-key declaration.
 *
 * `permittedKeys(collection)` is the union of FOUR derived sources:
 *
 *   1. DB columns — `TablesInsert<T>` from `@openvaa/supabase-types`, plus every legal camelCase form derived mechanically from `FIELD_MAP`.
 *   2. Sentinels — `LINK_SENTINELS`, the const `linkJoinTables` reads.
 *   3. Non-column fields — `NON_COLUMN_FIELDS` + `COLLECTION_NON_COLUMNS`, moved out of `bulkImport` so one declaration serves both stripping and permission.
 *   4. RPC relationship references — the `_bulk_upsert_record` per-table relationship `CASE` block. Postgres cannot iterate a TypeScript const, so source (4) is PARITY-TESTED against `apps/supabase/supabase/schema/501-bulk-operations.sql` rather than derived. That test lives here, and it fails in BOTH directions.
 *
 * Canonical keying is the RESOLVED snake_case table name. A lookup for an unrecognised collection THROWS — returning an empty set would make a keying confusion permit everything: a guard that reports success while checking nothing.
 */

import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { assertKnownRowProps } from '../../src/assertKnownRowProps';
import { LINK_SENTINELS } from '../../src/template/linkSentinels';
import type { LinkSentinelRule } from '../../src/template/linkSentinels';
import {
  COLLECTION_NON_COLUMNS,
  NON_COLUMN_FIELDS,
  permittedKeys,
  RELATIONSHIP_REFS,
  resolveCollectionName
} from '../../src/template/permittedKeys';

const HERE = dirname(fileURLToPath(import.meta.url));
/** `packages/dev-seed/tests/template` → repo root. */
const REPO_ROOT = resolve(HERE, '../../../..');

/**
 * The declarative schema copy of `_bulk_upsert_record`. Note the doubled `supabase/` segment — `apps/supabase/supabase/schema/…` is the real path.
 */
const SCHEMA_SQL = resolve(REPO_ROOT, 'apps/supabase/supabase/schema/501-bulk-operations.sql');
/** The applied migration copy of the same function. */
const MIGRATION_SQL = resolve(REPO_ROOT, 'apps/supabase/supabase/migrations/00001_initial_schema.sql');

/**
 * Extract the `CASE p_table_name … END CASE;` relationship block verbatim.
 * Used both for parsing (parity with `RELATIONSHIP_REFS`) and for the schema-vs-migration byte comparison (research assumption A3).
 */
function extractCaseBlock(sql: string): string {
  const start = sql.indexOf('CASE p_table_name');
  const end = sql.indexOf('END CASE;', start);
  if (start < 0 || end < 0) throw new Error('relationship CASE block not found');
  return sql.slice(start, end + 'END CASE;'.length);
}

/** Parse the `CASE` block into `{ table: { jsonKey: { fk, table } } }`. */
function parseRelationshipCase(sql: string): Record<string, Record<string, { fk: string; table: string }>> {
  const block = extractCaseBlock(sql);
  const parsed: Record<string, Record<string, { fk: string; table: string }>> = {};
  const re = /WHEN\s+'([a-z_]+)'\s+THEN\s+relationships\s*:=\s*'([\s\S]*?)'::jsonb;/g;
  for (const match of block.matchAll(re)) {
    const [, table, json] = match;
    const entries = JSON.parse(json) as Record<string, { fk: string; table: string }>;
    if (Object.keys(entries).length > 0) parsed[table] = entries;
  }
  return parsed;
}

describe('permittedKeys — source (1): DB columns and their legal camelCase forms', () => {
  it('admits snake_case columns and the camel forms FIELD_MAP actually resolves', () => {
    const candidates = permittedKeys('candidates');
    for (const key of ['first_name', 'last_name', 'external_id', 'project_id', 'sort_order', 'custom_data']) {
      expect(candidates.has(key)).toBe(true);
    }
    for (const key of ['firstName', 'lastName', 'customData']) {
      expect(candidates.has(key)).toBe(true);
    }
    // ⚠ `externalId` was asserted here and is asserted FALSE below instead: it is a `FIELD_MAP` camel form, but not a legal ROW key. See the block below.
  });

  /**
   * Three layers can disagree about the camelCase id spelling, and the runtime guard is the one at risk of being the odd one out. `FixedRow<C>` rejects a `fixed[]` row spelled `externalId` (excess property; `external_id: string` is required) and `assertFixedRowsCarryExternalId` rejects it (it reads `row.external_id` only) — but `assertKnownRowProps` PERMITTED it on every collection.
   *
   * All eleven generators read `fx.external_id` only, so such a row emits `external_id: '<prefix>undefined'` and carries the surviving `externalId` key through the `{...fx}` spread. Both keys were permitted, so the corrupted id reached the database — and on the E2E path (`setupFromTemplate` → `runPipeline` → `write`, no `validateTemplate`) the runtime guard is the ONLY check.
   */
  describe('externalId is a FIELD_MAP camel form but NOT a legal row key', () => {
    it('is refused on every guarded collection, snake spelling admitted', () => {
      for (const collection of [
        'elections',
        'constituency_groups',
        'constituencies',
        'organizations',
        'alliances',
        'factions',
        'candidates',
        'question_categories',
        'questions',
        'nominations',
        'app_settings',
        'feedback'
      ]) {
        const keys = permittedKeys(collection);
        expect(keys.has('external_id'), collection).toBe(true);
        expect(keys.has('externalId'), collection).toBe(false);
      }
    });

    it('the withholding is targeted — every other camel form still derives', () => {
      // A narrowing broad enough to drop `firstName` would break 439 in-tree rows, so this is what says the subtraction hit only what it meant to.
      const candidates = permittedKeys('candidates');
      expect(candidates.has('firstName')).toBe(true);
      expect(candidates.has('lastName')).toBe(true);
      expect(candidates.has('customData')).toBe(true);
      expect(permittedKeys('elections').has('electionDate')).toBe(true);
      expect(permittedKeys('questions').has('categoryId')).toBe(true);
    });

    it('is refused by the guard with the unknown-property message, naming the row', () => {
      const message = messageOf(() => assertKnownRowProps({ elections: [{ externalId: 'el-1' }] }));
      expect(message).toContain('externalId');
      expect(message).toContain('unknown property');
      // The permitted list in the message carries the spelling the author wants.
      expect(message).toContain('external_id');
    });
  });

  it('does NOT admit sortOrder — sort_order’s only legal camel form is `order`', () => {
    expect(permittedKeys('candidates').has('sortOrder')).toBe(false);
    const elections = permittedKeys('elections');
    expect(elections.has('order')).toBe(true);
    expect(elections.has('sort_order')).toBe(true);
    expect(elections.has('sortOrder')).toBe(false);
  });

  it('models organizationId as the mapping actually resolves it, not as intuition suggests', () => {
    // COLUMN_MAP maps BOTH `organization_id` and `organization_id_nom` to `organizationId`; reversing it is last-wins, so FIELD_MAP.organizationId is `organization_id_nom` — a column on NO table. A hand-written camel alias would therefore permit a key the RPC rejects. Derived mechanically, it is admitted nowhere. Fixing the collision itself is a cross-package change and is deliberately left open.
    expect(permittedKeys('candidates').has('organization_id')).toBe(true);
    expect(permittedKeys('candidates').has('organizationId')).toBe(false);
    expect(permittedKeys('nominations').has('organizationId')).toBe(false);
  });

  it('admits the legacy documentId alias wherever an `id` column exists', () => {
    expect(permittedKeys('elections').has('documentId')).toBe(true);
  });

  it('does not leak one table’s columns into another', () => {
    expect(permittedKeys('elections').has('first_name')).toBe(false);
    expect(permittedKeys('candidates').has('election_date')).toBe(false);
  });
});

describe('permittedKeys — source (2): sentinels from LINK_SENTINELS', () => {
  /**
   * Re-derived from the four resolution sites in `supabaseAdminClient.ts` at execution HEAD (`linkJoinTables`, `:387`; the two join blocks at `:392-398` and `:446-451`; `electionResolve` and `constResolve` called for BOTH `question_categories` and `questions`). Ten `(collection, key)` pairs.
   */
  const EXPECTED_PAIRS = [
    'elections/_constituencyGroups',
    'elections/_constituency_groups',
    'elections/constituencyGroups',
    'elections/constituency_groups',
    'constituency_groups/_constituencies',
    'constituency_groups/constituencies',
    'question_categories/_elections',
    'questions/_elections',
    'question_categories/_constituencies',
    'questions/_constituencies'
  ];

  /**
   * Widened once. `LINK_SENTINELS` is `as const satisfies …`, so each rule's `collections` is a narrow literal tuple and array predicates over the union of rules would collapse their argument type to `never`.
   */
  const RULES: ReadonlyArray<LinkSentinelRule> = LINK_SENTINELS;

  function flatten(): Array<string> {
    const out: Array<string> = [];
    for (const rule of RULES) {
      for (const collection of rule.collections) {
        for (const key of rule.keys) out.push(`${collection}/${key}`);
      }
    }
    return out;
  }

  it('flattens to exactly the ten hand-enumerated (collection, key) pairs', () => {
    expect([...flatten()].sort()).toEqual([...EXPECTED_PAIRS].sort());
    expect(flatten()).toHaveLength(10);
  });

  it('includes the three bare non-underscore forms — 76 in-tree rows depend on them', () => {
    // ⚠ These MUST be asserted against LINK_SENTINELS SPECIFICALLY, not against the four-source union. COLLECTION_NON_COLUMNS supplies the same two collections independently, so a regression that empties the bare forms from this const is invisible from the union.
    const pairs = flatten();
    expect(pairs).toContain('elections/constituencyGroups');
    expect(pairs).toContain('elections/constituency_groups');
    expect(pairs).toContain('constituency_groups/constituencies');
  });

  it('preserves `??`-precedence key order inside the elections rule', () => {
    // `collections` is a union of two narrower arrays, because `LinkSentinelRule` pairs collections with target kind, so `.includes` needs the widening read to accept a bare string.
    const electionsRule = RULES.find((rule) => (rule.collections as ReadonlyArray<string>).includes('elections'));
    expect(electionsRule?.keys).toEqual([
      '_constituencyGroups',
      '_constituency_groups',
      'constituencyGroups',
      'constituency_groups'
    ]);
  });

  it('surfaces every sentinel key through permittedKeys', () => {
    const elections = permittedKeys('elections');
    for (const key of ['_constituencyGroups', '_constituency_groups', 'constituencyGroups', 'constituency_groups']) {
      expect(elections.has(key)).toBe(true);
    }
    const questions = permittedKeys('questions');
    expect(questions.has('_elections')).toBe(true);
    expect(questions.has('_constituencies')).toBe(true);
    // The same two keys are NOT read on these collections.
    expect(permittedKeys('candidates').has('_elections')).toBe(false);
    expect(permittedKeys('elections').has('_constituencies')).toBe(false);
  });
});

describe('permittedKeys — source (3): the non-column fields moved out of bulkImport', () => {
  it('keeps the moved consts byte-equivalent to what bulkImport declared', () => {
    expect([...NON_COLUMN_FIELDS].sort()).toEqual(['answersByExternalId']);
    expect(Object.keys(COLLECTION_NON_COLUMNS).sort()).toEqual(['candidates', 'constituency_groups', 'elections']);
    expect([...COLLECTION_NON_COLUMNS.candidates].sort()).toEqual(['email']);
    expect([...COLLECTION_NON_COLUMNS.elections].sort()).toEqual(['constituencyGroups', 'constituency_groups']);
    expect([...COLLECTION_NON_COLUMNS.constituency_groups].sort()).toEqual(['constituencies']);
  });

  it('admits answersByExternalId on the two collections that READ it, and email on candidates only', () => {
    // ⚠ `bulkImport` STRIPS `answersByExternalId` on every collection, but `importAnswers` READS it on exactly `candidates` and `organizations`, and permission follows the read — otherwise the class-(2) control (`answersByExternalId` on a `questions` row) would be structurally unable to fire.
    expect(permittedKeys('candidates').has('answersByExternalId')).toBe(true);
    expect(permittedKeys('organizations').has('answersByExternalId')).toBe(true);
    expect(permittedKeys('questions').has('answersByExternalId')).toBe(false);
    expect(permittedKeys('elections').has('answersByExternalId')).toBe(false);
    expect(permittedKeys('candidates').has('email')).toBe(true);
    expect(permittedKeys('organizations').has('email')).toBe(false);
  });
});

describe('permittedKeys — source (4): RPC relationship references, parity-tested against the SQL', () => {
  it('admits all seven nomination refs including the RPC-declared-but-unused faction', () => {
    const nominations = permittedKeys('nominations');
    for (const key of [
      'candidate',
      'organization',
      'faction',
      'alliance',
      'election',
      'constituency',
      'parent_nomination'
    ]) {
      expect(nominations.has(key)).toBe(true);
    }
  });

  it('admits candidateExternalId on nominations — bulkImport reads it by name', () => {
    // `supabaseAdminClient.ts:178` decides nomination polymorphism with `'candidate' in record || 'candidateExternalId' in record`.
    expect(permittedKeys('nominations').has('candidateExternalId')).toBe(true);
  });

  it('admits the three single-ref tables', () => {
    expect(permittedKeys('candidates').has('organization')).toBe(true);
    expect(permittedKeys('questions').has('category')).toBe(true);
    expect(permittedKeys('constituencies').has('parent')).toBe(true);
  });

  it('RELATIONSHIP_REFS equals the 501-bulk-operations.sql CASE block in BOTH directions', () => {
    const fromSql = parseRelationshipCase(readFileSync(SCHEMA_SQL, 'utf8'));
    const fromTs = JSON.parse(JSON.stringify(RELATIONSHIP_REFS)) as typeof fromSql;

    // Direction 1: every table+key the SQL declares is present in the const.
    expect(Object.keys(fromSql).sort()).toEqual(Object.keys(fromTs).sort());
    for (const table of Object.keys(fromSql)) {
      expect(Object.keys(fromSql[table]).sort()).toEqual(Object.keys(fromTs[table]).sort());
      for (const key of Object.keys(fromSql[table])) {
        expect(fromTs[table][key]).toEqual(fromSql[table][key]);
      }
    }
    // Direction 2: the whole structures are equal, so an extra entry on either side fails too.
    expect(fromTs).toEqual(fromSql);
    expect(Object.values(fromSql).reduce((n, refs) => n + Object.keys(refs).length, 0)).toBe(10);
  });

  it('the schema copy and the applied migration copy of the CASE block agree', () => {
    // Checking that the two `skip_columns` arrays are byte-identical does NOT cover the relationship CASE blocks. This closes that gap.
    expect(extractCaseBlock(readFileSync(MIGRATION_SQL, 'utf8'))).toEqual(
      extractCaseBlock(readFileSync(SCHEMA_SQL, 'utf8'))
    );
  });
});

/** Capture a throw's message, or `''` when the call did not throw. */
function messageOf(fn: () => unknown): string {
  try {
    fn();
  } catch (error) {
    return error instanceof Error ? error.message : String(error);
  }
  return '';
}

describe('resolveCollectionName / permittedKeys — canonical keying', () => {
  it('resolves camelCase collection aliases to the snake_case table name', () => {
    expect(resolveCollectionName('questionCategories')).toBe('question_categories');
    expect(resolveCollectionName('constituencyGroups')).toBe('constituency_groups');
    expect(resolveCollectionName('parties')).toBe('organizations');
    expect(resolveCollectionName('elections')).toBe('elections');
  });

  it('returns ONE entry reached through the resolver, not two parallel entries', () => {
    expect(permittedKeys('questionCategories')).toBe(permittedKeys('question_categories'));
    expect(permittedKeys('constituencyGroups')).toBe(permittedKeys('constituency_groups'));
  });

  it('does not inherit Object.prototype keys — the resolver always returns a string', () => {
    // `COLLECTION_MAP` is a plain object literal, so a bare `COLLECTION_MAP[collection] ?? collection` also sees inherited members: `resolveCollectionName('constructor')` returned the `Object` constructor and `'toString'` returned `Object.prototype.toString` — FUNCTIONS, not the declared `string`. Every call site passes template-controlled data, and `bulkImport` uses the result as an object key (`cleaned[tableName]`).
    for (const inherited of ['constructor', 'toString', 'valueOf', 'hasOwnProperty', '__proto__']) {
      expect(typeof resolveCollectionName(inherited), inherited).toBe('string');
      // Unmapped names pass through unchanged — which is what makes the guard downstream report an unknown COLLECTION rather than a mangled one.
      expect(resolveCollectionName(inherited), inherited).toBe(inherited);
    }
  });

  it('an inherited key reaches the loud unknown-collection throw, not a silent wrong table', () => {
    // The behavioural consequence of the fix: the failure is the guard's own message, naming the raw key, rather than a message interpolating a function's source into `resolved to table "..."`.
    const message = messageOf(() => permittedKeys('toString'));
    expect(message).toContain('toString');
    expect(message).toContain('unknown collection');
    expect(message).not.toContain('native code');
  });

  it('THROWS for an unrecognised collection, naming both the raw key and the resolved table', () => {
    expect(() => permittedKeys('nonsense_collection')).toThrow(/nonsense_collection/);
    expect(() => permittedKeys('nonsenseCollection')).toThrow(/nonsenseCollection/);
    // The resolved name is in the message too, so a keying confusion is legible.
    let message = '';
    try {
      permittedKeys('parties_typo');
    } catch (error) {
      message = error instanceof Error ? error.message : String(error);
    }
    expect(message).toContain('parties_typo');
    expect(message).toContain('resolved');
  });

  it('returns a frozen set — callers cannot widen the allow-list at runtime', () => {
    expect(() => (permittedKeys('elections') as Set<string>).add('smuggled')).toThrow();
  });

  /**
   * A claim that the set "refuses to be widened after construction" does not hold on its own: `Object.freeze` does not protect a `Set`'s internal `[[SetData]]` slot — only its own properties. Overriding `add` blocks the ordinary spelling and nothing else, and a constructor populating itself via the ordinary `Set` API uses precisely that escape hatch. The case above exercises only the override, so the gap was invisible to the suite.
   *
   * These cases perform the smuggle on the MEMOIZED, process-wide instance and assert the guard did not widen.
   */
  describe('the immutability claim survives a prototype-borrowed mutation', () => {
    it('Set.prototype.add.call does not widen the memoized allow-list', () => {
      const keys = permittedKeys('elections') as Set<string>;
      const sizeBefore = keys.size;
      // May or may not throw — the receiver is a genuine Set, so the borrowed method can legally write into a slot nothing reads. What must hold is that the GUARD did not move.
      try {
        Set.prototype.add.call(keys, 'smuggled');
      } catch {
        /* acceptable — the assertion is about `has`, not about the throw */
      }
      expect(keys.has('smuggled')).toBe(false);
      expect(keys.size).toBe(sizeBefore);
      expect([...keys]).not.toContain('smuggled');
      // And the widening is not visible to the next caller either — the same instance is handed to every consumer of the guard.
      expect(permittedKeys('elections').has('smuggled')).toBe(false);
    });

    it('Set.prototype.delete.call and .clear.call cannot narrow it either', () => {
      const keys = permittedKeys('elections') as Set<string>;
      const sizeBefore = keys.size;
      expect(keys.has('external_id')).toBe(true);
      try {
        Set.prototype.delete.call(keys, 'external_id');
      } catch {
        /* see above */
      }
      try {
        Set.prototype.clear.call(keys);
      } catch {
        /* see above */
      }
      expect(keys.has('external_id')).toBe(true);
      expect(keys.size).toBe(sizeBefore);
    });

    it('still behaves as a Set for every read the guard and its messages perform', () => {
      // `assertKnownRowProps` spreads the set to build its "Permitted keys" list, so the iterator, `size` and `forEach` must all read through.
      const keys = permittedKeys('elections');
      expect(keys).toBeInstanceOf(Set);
      expect([...keys]).toHaveLength(keys.size);
      expect([...keys.values()]).toEqual([...keys]);
      expect([...keys.keys()]).toEqual([...keys]);
      expect([...keys.entries()].map(([a]) => a)).toEqual([...keys]);
      const seen: Array<string> = [];
      keys.forEach((value, value2, set) => {
        expect(value2).toBe(value);
        expect(set).toBe(keys);
        seen.push(value);
      });
      expect(seen).toEqual([...keys]);
    });
  });
});
