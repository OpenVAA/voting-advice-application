/**
 * The single derived declaration of what a hand-authored `fixed[]` row may carry — one source of truth for TWO enforcement layers:
 *
 *   - the **type** layer: `FixedRow<C>` and its twelve named aliases, consumed by `Template`, so an illegal key is a TypeScript error at authoring time;
 *   - the **runtime** layer: `permittedKeys(collection)`, consumed by the seed writer's unknown-key guard, so an illegal key that slipped past the compiler is a loud failure instead of a silent drop.
 *
 * ## The four sources
 *
 * **(1) DB columns.** `TablesInsert<T>` from `@openvaa/supabase-types`, plus every legal camelCase form, derived MECHANICALLY from {@link FIELD_MAP}: for a column `c` of table `T`, the legal keys are `c` itself plus every key `k` with `FIELD_MAP[k] === c`. Hand-writing camel aliases would be wrong three separate ways — see {@link FIELD_MAP}'s note. `TABLE_COLUMNS` is the value-level mirror of the generated types and is checked against them in BOTH directions at compile time, so a schema change that adds or removes a column is a type error here rather than silent drift.
 *
 * **(2) Sentinels.** From `LINK_SENTINELS` in `./linkSentinels`, which is also what the join-table resolver reads. Ten `(collection, key)` pairs.
 *
 * **(3) Non-column fields.** {@link NON_COLUMN_FIELDS} and {@link COLLECTION_NON_COLUMNS}, MOVED here out of `bulkImport` (they were declared inline inside the method) and imported back by it, so the stripping behaviour and the permission decision cannot drift apart.
 *
 * **(4) RPC relationship references.** {@link RELATIONSHIP_REFS}, transcribed from the `CASE p_table_name` block of `_bulk_upsert_record` in `apps/supabase/supabase/schema/501-bulk-operations.sql` (note the doubled `supabase/` segment — that is the real path).
 *
 * ⚠ **Source (4) is the one source that is NOT derived, and it is stated here rather than implied away.** Postgres cannot iterate a TypeScript const, so `RELATIONSHIP_REFS` is a transcription held honest by a PARITY TEST (`tests/template/permittedKeys.test.ts`) that reads the SQL from disk and fails in both directions when the two disagree. Omitting source (4) is not an option: it is present on 2,955 key occurrences across the built-in templates — every `nominations` row, plus `candidates.organization`, `questions.category` and `constituencies.parent` — so a three-source guard would fail every E2E setup project.
 *
 * ## Canonical keying
 *
 * The canonical key is the **resolved snake_case table name**.
 * {@link resolveCollectionName} is exported from here and imported back by `supabaseAdminClient.ts`, so there is exactly one implementation.
 * {@link permittedKeys} resolves first and then looks up, and a lookup miss
 * **throws**. Returning an empty set (or `undefined`) on a miss would let a keying confusion permit everything — a guard that reports success while checking nothing.
 */

import { PROPERTY_MAP } from '@openvaa/supabase-types';
import { resolveCollectionName } from './collectionNames';
import { LINK_SENTINELS } from './linkSentinels';
import type { TablesInsert } from '@openvaa/supabase-types';
import type { SentinelPayload } from './linkSentinels';

// -----------------------------------------------------------------------------
// Collections and name resolution
// -----------------------------------------------------------------------------

/**
 * The twelve snake_case table names dev-seed authors rows for.
 *
 * `accounts` and `projects` are deliberately absent: they are bootstrapped by `seed.sql` and `Writer.write` deletes them from the payload before it reaches the admin client (`writer.ts:148-149`), so no authored row is ever written to them.
 */
export type CollectionKey =
  | 'elections'
  | 'constituency_groups'
  | 'constituencies'
  | 'organizations'
  | 'alliances'
  | 'factions'
  | 'candidates'
  | 'question_categories'
  | 'questions'
  | 'nominations'
  | 'app_settings'
  | 'feedback';

/**
 * The two tables `Writer.write` strips from the payload before Pass 1 (`writer.ts`, the `delete bulkData.accounts` / `delete bulkData.projects` pair). They are NOT template-declarable — `TemplateSchema` has no slot for either and all 30 built-ins emit zero rows — but they ARE `TOPO_ORDER` entries, so `runPipeline` puts an (empty) array under each key, and `writer.test.ts` passes `accounts: [{ id: 'x' }]` and `projects: [{ id: 'y' }]` as pass-through fixtures.
 *
 * ⚠ **They are modelled here because Pass 0 reads the PRE-DELETION `data`.**
 * Measured: with these two unmodelled, the guard's `permittedKeys` lookup throws `unknown collection "accounts"` on the two `writer.test.ts` pass-through fixtures — offences on the non-pipeline fixture surface. Widening the allow-list with a stated reason is the sanctioned resolution; narrowing the survey is not. Kept OUT of {@link CollectionKey} so the twelve template-declarable slots, the twelve `FixedRow` aliases and `Template`'s key-set conformance assertion are untouched.
 */
export type PassThroughCollectionKey = 'accounts' | 'projects';

/** Every collection the RUNTIME guard models — the twelve, plus the two pass-throughs. */
export type GuardedCollectionKey = CollectionKey | PassThroughCollectionKey;

/**
 * `COLLECTION_MAP` and `resolveCollectionName` live in `./collectionNames`, a leaf module, and are re-exported here so every existing import path is unchanged. They live there because `linkSentinels.ts` needs the same primitive for `pickCollection`, and importing it from THIS module would close an ESM cycle whose entry through `linkSentinels.ts` throws a TDZ `ReferenceError` — see `./collectionNames`'s header. Still exactly one implementation; only its address differs.
 */
export { COLLECTION_MAP, resolveCollectionName } from './collectionNames';

/**
 * Maps camelCase field names to Supabase snake_case column names.
 * Extends `PROPERTY_MAP` with legacy / alias mappings.
 *
 * MOVED here from `supabaseAdminClient.ts`, which imports it back for `resolveFieldName`. This module needs it to derive source (1)'s camel forms, and a second copy would be free to drift from the one that does the actual renaming.
 *
 * ⚠ **Three measured hazards make hand-writing a camel alias wrong.**
 *   - `PROPERTY_MAP` is `COLUMN_MAP` reversed, and `COLUMN_MAP` maps BOTH `organization_id` and `organization_id_nom` to `organizationId`. Reversal is last-wins, so `FIELD_MAP.organizationId` is `organization_id_nom` — a column on no table at all. Derived mechanically, `organizationId` is therefore admitted nowhere, which is what the pipeline actually does; a hand-written alias would have permitted a key the RPC rejects.
 *   - `sort_order`'s only legal camel form is `order`, never `sortOrder`.
 *   - `published` is an identity entry, so a "keys that differ" filter drops it.
 */
export const FIELD_MAP: Record<string, string> = {
  ...PROPERTY_MAP,
  // Legacy aliases
  documentId: 'id'
};

// -----------------------------------------------------------------------------
// Source (1) — DB columns
// -----------------------------------------------------------------------------

/**
 * Value-level mirror of the generated `TablesInsert<…>` column sets.
 *
 * TypeScript types are erased, so the runtime guard needs a value. The two assertions below hold this list to the generated types in both directions: `satisfies` rejects a name that is not a column, and `_NoMissingColumns` rejects a column that is missing from the list. Regenerating `@openvaa/supabase-types` after a migration therefore breaks the build here rather than silently narrowing the guard.
 */
const TABLE_COLUMNS = {
  elections: [
    'color',
    'created_at',
    'current_round',
    'custom_data',
    'election_date',
    'election_start_date',
    'election_type',
    'external_id',
    'id',
    'image',
    'info',
    'is_generated',
    'multiple_rounds',
    'name',
    'project_id',
    'published',
    'short_name',
    'sort_order',
    'subtype',
    'updated_at'
  ],
  constituency_groups: [
    'color',
    'created_at',
    'custom_data',
    'external_id',
    'id',
    'image',
    'info',
    'is_generated',
    'name',
    'project_id',
    'published',
    'short_name',
    'sort_order',
    'subtype',
    'updated_at'
  ],
  constituencies: [
    'color',
    'created_at',
    'custom_data',
    'external_id',
    'id',
    'image',
    'info',
    'is_generated',
    'keywords',
    'name',
    'parent_id',
    'project_id',
    'published',
    'short_name',
    'sort_order',
    'subtype',
    'updated_at'
  ],
  organizations: [
    'answers',
    'auth_user_id',
    'color',
    'created_at',
    'custom_data',
    'external_id',
    'id',
    'image',
    'info',
    'is_generated',
    'name',
    'project_id',
    'published',
    'short_name',
    'sort_order',
    'subtype',
    'updated_at'
  ],
  alliances: [
    'color',
    'created_at',
    'custom_data',
    'external_id',
    'id',
    'image',
    'info',
    'is_generated',
    'name',
    'project_id',
    'published',
    'short_name',
    'sort_order',
    'subtype',
    'updated_at'
  ],
  factions: [
    'color',
    'created_at',
    'custom_data',
    'external_id',
    'id',
    'image',
    'info',
    'is_generated',
    'name',
    'project_id',
    'published',
    'short_name',
    'sort_order',
    'subtype',
    'updated_at'
  ],
  candidates: [
    'answers',
    'auth_user_id',
    'color',
    'created_at',
    'custom_data',
    'external_id',
    'first_name',
    'id',
    'image',
    'info',
    'is_generated',
    'last_name',
    'organization_id',
    'project_id',
    'published',
    'short_name',
    'sort_order',
    'subtype',
    'terms_of_use_accepted',
    'updated_at'
  ],
  question_categories: [
    'category_type',
    'color',
    'constituency_ids',
    'created_at',
    'custom_data',
    'election_ids',
    'election_rounds',
    'entity_type',
    'external_id',
    'id',
    'image',
    'info',
    'is_generated',
    'name',
    'project_id',
    'published',
    'short_name',
    'sort_order',
    'subtype',
    'updated_at'
  ],
  questions: [
    'allow_open',
    'category_id',
    'choices',
    'color',
    'constituency_ids',
    'created_at',
    'custom_data',
    'election_ids',
    'election_rounds',
    'entity_type',
    'external_id',
    'id',
    'image',
    'info',
    'is_generated',
    'name',
    'project_id',
    'published',
    'required',
    'settings',
    'short_name',
    'sort_order',
    'subtype',
    'type',
    'updated_at'
  ],
  nominations: [
    'alliance_id',
    'candidate_id',
    'color',
    'constituency_id',
    'created_at',
    'custom_data',
    'election_id',
    'election_round',
    'election_symbol',
    'entity_type',
    'external_id',
    'faction_id',
    'id',
    'image',
    'info',
    'is_generated',
    'name',
    'organization_id',
    'parent_nomination_id',
    'project_id',
    'published',
    'short_name',
    'sort_order',
    'subtype',
    'unconfirmed',
    'updated_at'
  ],
  app_settings: ['created_at', 'customization', 'external_id', 'id', 'project_id', 'settings', 'updated_at'],
  feedback: ['created_at', 'date', 'description', 'id', 'project_id', 'rating', 'url', 'user_agent']
} as const satisfies { [C in CollectionKey]: ReadonlyArray<Extract<keyof TablesInsert<C>, string>> };

/**
 * Value-level mirror of the two pass-through tables' column sets — see {@link PassThroughCollectionKey} for why they are modelled at all. Held to the generated types in both directions by the same pair of assertions as {@link TABLE_COLUMNS}.
 */
const PASS_THROUGH_COLUMNS = {
  accounts: ['created_at', 'id', 'name', 'updated_at'],
  projects: ['account_id', 'created_at', 'default_locale', 'id', 'name', 'updated_at']
} as const satisfies { [C in PassThroughCollectionKey]: ReadonlyArray<Extract<keyof TablesInsert<C>, string>> };

/** `true` when `TValue` is exactly `never`; the compile-time completeness probe below. */
type IsNever<TValue> = [TValue] extends [never] ? true : false;

/** Columns the generated types declare but {@link TABLE_COLUMNS} omits. */
type MissingColumns = {
  [C in CollectionKey]: Exclude<Extract<keyof TablesInsert<C>, string>, (typeof TABLE_COLUMNS)[C][number]>;
}[CollectionKey];

/** Columns the generated types declare but {@link PASS_THROUGH_COLUMNS} omits. */
type MissingPassThroughColumns = {
  [C in PassThroughCollectionKey]: Exclude<
    Extract<keyof TablesInsert<C>, string>,
    (typeof PASS_THROUGH_COLUMNS)[C][number]
  >;
}[PassThroughCollectionKey];

/**
 * Compile-time assertion: no generated column is missing from {@link TABLE_COLUMNS}. If a migration adds a column, this line stops compiling and names it.
 */
const COLUMN_COVERAGE_IS_COMPLETE: IsNever<MissingColumns> extends true ? true : MissingColumns = true;
void COLUMN_COVERAGE_IS_COMPLETE;

/** The same assertion for the two pass-through tables. */
const PASS_THROUGH_COVERAGE_IS_COMPLETE: IsNever<MissingPassThroughColumns> extends true
  ? true
  : MissingPassThroughColumns = true;
void PASS_THROUGH_COVERAGE_IS_COMPLETE;

/**
 * The column source the runtime guard consults, keyed by RESOLVED table name.
 * One object so a single lookup covers all fourteen tables `TOPO_ORDER` names.
 */
const COLUMNS_BY_TABLE: Readonly<Record<GuardedCollectionKey, ReadonlyArray<string>>> = {
  ...TABLE_COLUMNS,
  ...PASS_THROUGH_COLUMNS
};

// -----------------------------------------------------------------------------
// Source (3) — non-column fields, MOVED out of bulkImport
// -----------------------------------------------------------------------------

/**
 * Non-column fields stripped on EVERY collection, with the reason for each.
 *
 * - `answersByExternalId` — consumed by `importAnswers` (writer Pass 2), which
 *   resolves question external_ids to UUIDs and writes the `answers` JSONB.
 */
const NON_COLUMN_FIELD_LIST = ['answersByExternalId'] as const;

/**
 * ⚠ **Stripping scope and PERMISSION scope are different questions, and this map is the second one.**
 *
 * `bulkImport` strips {@link NON_COLUMN_FIELD_LIST} on *every* collection, and that behaviour is deliberately unchanged. But a field is only a LEGAL authoring key on the collections that actually read it, and `answersByExternalId` is read by `importAnswers` on exactly two: `candidates` and `organizations` (`supabaseAdminClient.ts`, the `importAnswers` body — it iterates those two tables and no others).
 *
 * On a `questions` row the key is not a typo a spell-checker would catch; it is a plausible key on the wrong table, and it is silently stripped with nothing written from it. That is exactly what the class-(2) negative control at `tests/fixtures/negctl-questions-answers.ts` asserts. Admitting the key globally would make that control **structurally unable to fire** — a guard that cannot fail.
 *
 * Measured cost of the scoping: **zero.** Across all 30 built-ins the key occurs on `candidates` (438 rows) and `organizations` (1 row, `perm-org-matching`) and nowhere else.
 */
const NON_COLUMN_FIELD_READERS = {
  answersByExternalId: ['candidates', 'organizations']
} as const satisfies Record<(typeof NON_COLUMN_FIELD_LIST)[number], ReadonlyArray<CollectionKey>>;

/**
 * The key `importAnswers` reads a row's answer payload under — exported so the READ site and the PERMISSION site are the same string rather than two literals that can drift.
 *
 * Both call sites in `importAnswers` used to read `row.answersByExternalId ?? row.answers_by_external_id`. The snake spelling is on neither side of the permission split above, is not a column, and is absent from `COLUMN_MAP` / `PROPERTY_MAP` — so `bulkImport` forwarded it to the RPC as a nonexistent column, and Pass 0 rejects it outright. There is deliberately no such fallback; this const keeps the surviving spelling honest.
 *
 * The `satisfies` is the guard: if `answersByExternalId` ever leaves {@link NON_COLUMN_FIELD_LIST}, this line stops compiling rather than letting `importAnswers` read a key the guard rejects.
 */
export const ANSWERS_BY_EXTERNAL_ID_KEY = 'answersByExternalId' satisfies (typeof NON_COLUMN_FIELD_LIST)[number];

/**
 * Non-column fields stripped on ONE collection each, with the reason for each.
 *
 * - `candidates.email` — a hand-off payload for candidate invitation, not a
 *   column on the table.
 * - `elections.constituencyGroups` / `.constituency_groups` and
 *   `constituency_groups.constituencies` — M:N declarations consumed by `linkJoinTables` (writer Pass 3). There is no scalar column on the parent table, so leaving them in the payload makes `_bulk_upsert_record` reject the row with `column "x" of relation "y" does not exist`.
 *
 * ⚠ Those last three pairs are ALSO sentinel key forms under source (2). They stay here because `bulkImport`'s stripping behaviour must not change by one key — but `LINK_SENTINELS` is the authority for PERMISSION. Asserting them against the four-source union cannot detect a regression that empties them from `LINK_SENTINELS`, because this const supplies them independently (measured: 0 rejections instead of 76). The derivation spec therefore asserts them against `LINK_SENTINELS` specifically.
 */
const COLLECTION_NON_COLUMN_LIST = {
  candidates: ['email'],
  elections: ['constituencyGroups', 'constituency_groups'],
  constituency_groups: ['constituencies']
} as const satisfies Partial<Record<CollectionKey, ReadonlyArray<string>>>;

/**
 * Runtime form of {@link NON_COLUMN_FIELD_LIST}, consumed by `bulkImport`'s strip loop. Contents are byte-identical to the set it used to declare inline.
 */
export const NON_COLUMN_FIELDS: ReadonlySet<string> = new Set<string>(NON_COLUMN_FIELD_LIST);

/**
 * Runtime form of {@link COLLECTION_NON_COLUMN_LIST}, keyed by the RESOLVED table name — `bulkImport` looks it up with `resolveCollectionName(collection)` and has always done so. Contents are byte-identical to the record it used to declare inline.
 */
export const COLLECTION_NON_COLUMNS: Record<string, ReadonlySet<string>> = Object.fromEntries(
  Object.entries(COLLECTION_NON_COLUMN_LIST).map(([table, keys]) => [table, new Set<string>(keys)])
);

/**
 * Authoring keys admitted on every collection irrespective of its columns.
 *
 * `Fragment<TRow>` (`src/types.ts:27-30`) re-requires `external_id` on every hand-authored row because the writer's upsert is keyed on it. That holds even for `feedback`, whose table genuinely has no `external_id` column (`107-feedback.sql`) and whose rows the writer skips entirely (`writer.ts:151`).
 *
 * ⚠ **`externalId` was here and is not any more** — see {@link CAMEL_FORMS_NOT_ADMITTED}, which is what actually removes it, since the camel derivation would otherwise re-admit it on every table that has the column.
 */
const AUTHORING_KEYS = ['external_id'] as const;

/**
 * Camel forms `FIELD_MAP` resolves, which are nonetheless NOT admitted as row keys — the one place source (1)'s mechanical derivation is narrowed by hand, with the reason stated per entry.
 *
 * ### `externalId`
 *
 * Three layers can disagree about the camelCase id spelling, and the runtime guard is the one that can silently be the odd one out:
 *
 * | Layer | Verdict on a `fixed[]` row spelled `externalId` |
 * |---|---|
 * | `FixedRow<C>` | rejected — `external_id: string` is required and `externalId` is an excess property |
 * | `assertFixedRowsCarryExternalId` (`schema.ts`) | rejected — reads `row.external_id` only |
 * | `assertKnownRowProps` | **permitted**, on every collection |
 *
 * All eleven generators emit ``external_id: `${externalIdPrefix}${fx.external_id}` `` and read `fx.external_id` ONLY, so a `fixed[]` row carrying the camel spelling emits `external_id: 'seed_undefined'` — and the surviving `externalId` key rides along on the `{...fx}` spread. Both keys were permitted, so the corrupted id reached the database.
 *
 * This matters most on the path with no zod layer: `setupFromTemplate` calls `runPipeline` → `writer.write` WITHOUT `validateTemplate`, so for the E2E templates the runtime guard is the only check — and it was the one layer that let this through.
 *
 * **Measured cost of the narrowing: zero.** Across all 30 built-ins — 1,481 rows and 11,125 key occurrences — `externalId` appears as a top-level row key exactly **0** times. (It appears often as a NESTED key, inside sentinel payloads and `ExternalRef` objects; Pass 0 inspects top-level row keys only, so those are untouched.)
 *
 * ⚠ `describeRow` in `assertKnownRowProps` still READS `row.externalId` when labelling a row in a message. That is deliberate and is not a permission: a guard should be able to name the row it is rejecting using whatever id the row carries.
 */
const CAMEL_FORMS_NOT_ADMITTED: ReadonlySet<string> = new Set<string>(['externalId']);

// -----------------------------------------------------------------------------
// Source (4) — RPC relationship references
// -----------------------------------------------------------------------------

/**
 * The `_bulk_upsert_record` per-table relationship reference map, transcribed from the `CASE p_table_name` block of `apps/supabase/supabase/schema/501-bulk-operations.sql`.
 *
 * These keys are neither columns nor sentinels nor stripped fields: the RPC resolves each to a FK column by looking the reference up by `external_id`.
 *
 * `nominations.faction` is admitted although nothing in-tree emits it — the RPC declares it, and omitting it would break the first factions-bearing template somebody writes.
 *
 * ⚠ Not derived. Held to the SQL by the two-directional parity test in `tests/template/permittedKeys.test.ts`; see this file's header.
 */
export const RELATIONSHIP_REFS = {
  candidates: { organization: { fk: 'organization_id', table: 'organizations' } },
  nominations: {
    candidate: { fk: 'candidate_id', table: 'candidates' },
    organization: { fk: 'organization_id', table: 'organizations' },
    faction: { fk: 'faction_id', table: 'factions' },
    alliance: { fk: 'alliance_id', table: 'alliances' },
    election: { fk: 'election_id', table: 'elections' },
    constituency: { fk: 'constituency_id', table: 'constituencies' },
    parent_nomination: { fk: 'parent_nomination_id', table: 'nominations' }
  },
  questions: { category: { fk: 'category_id', table: 'question_categories' } },
  constituencies: { parent: { fk: 'parent_id', table: 'constituencies' } }
} as const satisfies Partial<Record<CollectionKey, Record<string, { fk: string; table: string }>>>;

/**
 * Keys read BY NAME alongside the RPC's relationship map, but absent from it.
 *
 * `nominations.candidateExternalId` is read by `bulkImport` when it decides whether a nomination is a candidate nomination (`supabaseAdminClient.ts:178`), so it is a legal authoring key even though nothing in-tree emits it and the SQL does not name it. Kept out of {@link RELATIONSHIP_REFS} so the parity test stays exact.
 */
const RPC_ADJACENT_REFS = {
  nominations: ['candidateExternalId']
} as const satisfies Partial<Record<CollectionKey, ReadonlyArray<string>>>;

// -----------------------------------------------------------------------------
// The deny-list, and the documented exclusions that are NOT denied
// -----------------------------------------------------------------------------

/**
 * The file the `skip_columns` array is read from, declared once so callers can cite provenance without hard-coding the path a second time.
 *
 * Note the doubled `supabase/` segment — that is the real path. The shorter `apps/supabase/migrations/…` form, which appears in older notes, does not exist.
 */
export const SKIP_COLUMNS_SOURCE = 'apps/supabase/supabase/schema/501-bulk-operations.sql';

/**
 * Keys that are REAL columns of their table and therefore survive any allow-list, but which the `bulk_import` RPC silently discards.
 *
 * This is why an allow-list alone is not enough: `entity_type` is a genuine column on the three tables below, so it passes every `TablesInsert`-derived permitted set — and the RPC drops it anyway, handing the template author exit 0 and a row that lacks what they asked for.
 *
 * ⚠ **This map is deliberately NOT the RPC's `skip_columns` array.** Seeding it literally rejects every row in the repository: `project_id` is emitted by every generator on all 1,481 rows, and the RPC drops the payload's copy only to re-supply its own from its `p_project_id` parameter. The four columns that are skipped-but-not-denied live in {@link SKIP_COLUMNS_NOT_DENIED} with a reason each, and a spec asserts that the two sets together reproduce the SQL array exactly, in both directions — so a future `skip_columns` addition cannot pass unnoticed.
 *
 * `entity_type` is denied on exactly the three tables that declare the column; on any other table it is simply an unknown key and the allow-list catches it with the allow-list's own message.
 */
export const DENIED_BY_TABLE = {
  nominations: ['entity_type'],
  question_categories: ['entity_type'],
  questions: ['entity_type']
} as const satisfies {
  [C in 'nominations' | 'question_categories' | 'questions']: ReadonlyArray<Extract<keyof TablesInsert<C>, string>>;
};

/**
 * The four `skip_columns` entries this guard does NOT throw on, each with the measured reason. Documented and non-throwing — the delta from the RPC's own array is stated here rather than left silent.
 */
export const SKIP_COLUMNS_NOT_DENIED: Readonly<Record<string, string>> = {
  project_id:
    'Emitted on every generated row (1,481 of 1,481 measured across the 30 built-ins). ' +
    'The RPC drops the payload copy and re-supplies its own from p_project_id, so denying it would turn every seed run and every E2E setup red.',
  id:
    'A TablesInsert-legal key that two existing writer.test.ts fixtures supply (accounts and projects pass-through rows). ' +
    'Denying it would fail those tests for a reason unrelated to what they assert.',
  created_at:
    'Zero in-tree rows emit it. A template that sets a creation timestamp gets a DB-overridden value rather than a wrong one, ' +
    'which is worth this note rather than a throw.',
  updated_at: 'Zero in-tree rows emit it. Excluded for the same reason as created_at, and for symmetry with it.'
};

// (`deniedKeys` itself is declared below, after `PermittedKeySet` — the frozen set class it shares with the allow-list is a class declaration, so building the denied sets up here would read it inside its own temporal dead zone.)

// -----------------------------------------------------------------------------
// The union — runtime layer
// -----------------------------------------------------------------------------

/**
 * A `Set` that refuses to be widened after construction.
 *
 * {@link permittedKeys} memoizes one set per table and hands the same instance to every caller, so a caller that mutated it would silently widen the guard for the whole process. Mutating members throw instead.
 *
 * ## ⚠ The members are held in a PRIVATE set, not in this instance's own
 * `[[SetData]]`, and that is what makes the guarantee true
 *
 * `Object.freeze` does not protect a `Set`'s internal `[[SetData]]` slot — only its own properties. So overriding `add` / `delete` / `clear` blocked the ordinary spelling and nothing else: `Set.prototype.add.call(permittedKeys( 'elections'), 'smuggled')` widened the memoized, process-wide allow-list, and a constructor populating itself through the ordinary `Set` API uses precisely that escape hatch, so the technique would sit three lines above the guarantee it defeats.
 *
 * Every read is now answered from `#values`, which no `Set.prototype.*.call` can reach. The class still EXTENDS `Set`, so `instanceof Set` and the `ReadonlySet<string>` contract both hold and no call site moved; the superclass's own data is simply left empty and unread. A prototype-borrowed mutation therefore writes into a slot nothing consults — it cannot throw (the receiver is a genuine `Set`), but it cannot widen the guard either, which is the property that matters.
 *
 * Held by `tests/template/permittedKeys.test.ts`, which performs the smuggle and asserts `has` still says no.
 */
class PermittedKeySet extends Set<string> {
  readonly #values: ReadonlySet<string>;

  constructor(values: Iterable<string>) {
    super();
    this.#values = new Set<string>(values);
    Object.freeze(this);
  }

  override has(value: string): boolean {
    return this.#values.has(value);
  }

  override get size(): number {
    return this.#values.size;
  }

  override [Symbol.iterator](): SetIterator<string> {
    return this.#values[Symbol.iterator]();
  }

  override keys(): SetIterator<string> {
    return this.#values.keys();
  }

  override values(): SetIterator<string> {
    return this.#values.values();
  }

  override entries(): SetIterator<[string, string]> {
    return this.#values.entries();
  }

  override forEach(callback: (value: string, value2: string, set: Set<string>) => void, thisArg?: unknown): void {
    // Iterated rather than delegated, so the third argument is THIS set — the identity `Set.prototype.forEach` passes — and `#values` never escapes.
    for (const value of this.#values) callback.call(thisArg, value, value, this);
  }

  override add(_value: string): never {
    throw new Error('permittedKeys sets are immutable — derive a new set instead of widening this one');
  }

  override delete(_value: string): never {
    throw new Error('permittedKeys sets are immutable — derive a new set instead of narrowing this one');
  }

  override clear(): never {
    throw new Error('permittedKeys sets are immutable');
  }
}

/**
 * Every camelCase key that `FIELD_MAP` resolves to `column`, minus the forms {@link CAMEL_FORMS_NOT_ADMITTED} withholds.
 *
 * The subtraction is applied HERE rather than at the one call site because the derivation has two consumers — the permitted set and (since CR-01) the denied set — and a form that is not a legal spelling of a column is not a legal spelling of it in either direction.
 */
function camelFormsFor(column: string): Array<string> {
  return Object.keys(FIELD_MAP).filter(
    (key) => FIELD_MAP[key] === column && key !== column && !CAMEL_FORMS_NOT_ADMITTED.has(key)
  );
}

function derivePermittedKeys(collection: GuardedCollectionKey): ReadonlySet<string> {
  const keys = new Set<string>(AUTHORING_KEYS);

  // (1) DB columns and the camel forms FIELD_MAP actually resolves to them.
  for (const column of COLUMNS_BY_TABLE[collection]) {
    keys.add(column);
    for (const camel of camelFormsFor(column)) keys.add(camel);
  }

  // (2) Sentinel key forms, from the const the resolver reads.
  for (const rule of LINK_SENTINELS) {
    if (!(rule.collections as ReadonlyArray<string>).includes(collection)) continue;
    for (const key of rule.keys) keys.add(key);
  }

  // (3) Non-column fields, per-collection — and the globally-STRIPPED ones only
  //     on the collections that actually READ them. See NON_COLUMN_FIELD_READERS for why permission is scoped where stripping is not.
  for (const field of NON_COLUMN_FIELD_LIST) {
    const readers: ReadonlyArray<string> = NON_COLUMN_FIELD_READERS[field];
    if (readers.includes(collection)) keys.add(field);
  }
  for (const field of COLLECTION_NON_COLUMNS[collection] ?? []) keys.add(field);

  // (4) RPC relationship references, plus the ref bulkImport reads by name.
  const refs: Record<string, { fk: string; table: string }> | undefined = (
    RELATIONSHIP_REFS as Partial<Record<string, Record<string, { fk: string; table: string }>>>
  )[collection];
  for (const key of Object.keys(refs ?? {})) keys.add(key);
  const adjacent: ReadonlyArray<string> | undefined = (
    RPC_ADJACENT_REFS as Partial<Record<string, ReadonlyArray<string>>>
  )[collection];
  for (const key of adjacent ?? []) keys.add(key);

  return new PermittedKeySet([...keys].sort());
}

const COLLECTION_KEYS: ReadonlyArray<GuardedCollectionKey> = Object.keys(
  COLUMNS_BY_TABLE
) as ReadonlyArray<GuardedCollectionKey>;

/** Memoized per resolved table name, so the returned set has a stable identity. */
const PERMITTED_KEYS: ReadonlyMap<string, ReadonlySet<string>> = new Map(
  COLLECTION_KEYS.map((collection) => [collection, derivePermittedKeys(collection)])
);

/**
 * Every key a hand-authored row of `collection` may carry — the union of the four sources described in this file's header.
 *
 * The collection name is RESOLVED first, so `questionCategories` and `question_categories` reach the same entry rather than two parallel ones, and the returned set is the same instance for both.
 *
 * @throws when the collection resolves to a table this module does not model.
 *   Returning an empty set instead would make a keying confusion permit every key on every row — a guard that reports success while checking nothing.
 */
export function permittedKeys(collection: string): ReadonlySet<string> {
  const table = resolveCollectionName(collection);
  const keys = PERMITTED_KEYS.get(table);
  if (!keys) {
    throw new Error(
      `permittedKeys: unknown collection "${collection}" (resolved to table "${table}"). ` +
        `Known tables: ${COLLECTION_KEYS.join(', ')}.`
    );
  }
  return keys;
}

/**
 * Derive one table's denied set the SAME mechanical way {@link derivePermittedKeys} derives its permitted set: the snake column, plus every camel form {@link FIELD_MAP} resolves onto that column.
 *
 * ⚠ **This symmetry is load-bearing, not tidiness.** `DENIED_BY_TABLE` is written in snake case because that is how the RPC's `skip_columns` array names its entries — but source (1) admits, for every column, *every camel form that resolves to it*, and `COLUMN_MAP` maps `entity_type` to `entityType`. A literal `new Set(['entity_type'])` therefore left `entityType` in the PERMITTED set and out of the DENIED one, so the allow-list waved it through; `bulkImport` then ran `resolveFieldName('entityType') === 'entity_type'` and shipped it to the RPC, whose `skip_columns` discarded it — exit 0 and a row missing what the author asked for, which is the exact failure mode {@link DENIED_BY_TABLE} exists to eliminate.
 *
 * The rule this encodes: **every spelling `resolveFieldName` collapses onto a denied column is itself denied.** Deriving it here rather than listing it is what makes that true for a column added to `DENIED_BY_TABLE` tomorrow.
 * `tests/assertKnownRowProps.test.ts` asserts it for both spellings on all three declaring tables, and holds the derived set to the declaration in both directions so neither can grow silently.
 */
function deriveDeniedKeys(columns: ReadonlyArray<string>): ReadonlySet<string> {
  const keys = new Set<string>();
  for (const column of columns) {
    keys.add(column);
    for (const camel of camelFormsFor(column)) keys.add(camel);
  }
  return new PermittedKeySet([...keys].sort());
}

/** Memoized denied sets, keyed by resolved table name. See {@link DENIED_BY_TABLE}. */
const DENIED_KEYS: ReadonlyMap<string, ReadonlySet<string>> = new Map(
  Object.entries(DENIED_BY_TABLE).map(([table, denied]) => [table, deriveDeniedKeys(denied)])
);

/** Empty, frozen and shared — the answer for every table with nothing denied. */
const NO_DENIED_KEYS: ReadonlySet<string> = new PermittedKeySet([]);

/**
 * Keys of `collection` that ARE real columns but are discarded by the RPC's `skip_columns` — see {@link DENIED_BY_TABLE}.
 *
 * Resolves the collection name exactly as {@link permittedKeys} does, so the two cannot disagree about which table a row belongs to — and returns EVERY spelling of each denied column, snake and camel alike, because {@link deriveDeniedKeys} mirrors source (1)'s camel derivation. A returned set is therefore wider than the snake-case declaration it is built from; the declaration, not this set, is what the `skip_columns` parity spec compares.
 *
 * ⚠ Unlike {@link permittedKeys} this does NOT throw for an unrecognised collection. The loud-on-unknown-collection rule has exactly one home and it is `permittedKeys`, which every caller consults first; a second throw here would only make which message an author sees depend on evaluation order.
 */
export function deniedKeys(collection: string): ReadonlySet<string> {
  return DENIED_KEYS.get(resolveCollectionName(collection)) ?? NO_DENIED_KEYS;
}

// -----------------------------------------------------------------------------
// The type layer
// -----------------------------------------------------------------------------

/**
 * Value a sentinel key may carry in an authored row. The authoring-facing name for `SentinelPayload`, which is the resolver-facing one.
 */
export type SentinelValue = SentinelPayload;

/** An external-id reference, in each of the three shapes the RPC path accepts. */
export type ExternalRef = { externalId: string } | { external_id: string } | string;

/**
 * A rule's key forms when it covers `TCollection`, otherwise `never`.
 *
 * `TRule` is a naked type parameter so the conditional DISTRIBUTES over the union of `LINK_SENTINELS` members — mapping over the tuple's `keyof` instead would make the index expression illegal, because that union carries the array members too.
 */
type KeysWhenRuleCovers<TRule, TCollection> = TRule extends {
  collections: ReadonlyArray<string>;
  keys: ReadonlyArray<string>;
}
  ? TCollection extends TRule['collections'][number]
    ? TRule['keys'][number]
    : never
  : never;

/** Sentinel key forms `LINK_SENTINELS` declares for `TCollection`. */
type SentinelKeysFor<TCollection extends CollectionKey> = KeysWhenRuleCovers<
  (typeof LINK_SENTINELS)[number],
  TCollection
>;

/**
 * Non-column keys admitted on `TCollection` — globally-stripped-but-reader-scoped, plus per-collection.
 *
 * ⚠ **The first arm is derived from {@link NON_COLUMN_FIELD_READERS}, not from {@link NON_COLUMN_FIELD_LIST}, and that is the whole point.** The runtime arm (`derivePermittedKeys`, source (3)) consults the readers map, so `answersByExternalId` is legal on `candidates` and `organizations` only. When this type unioned the flat LIST unconditionally, `QuestionsFixedRow` compiled a row carrying that key clean and the same row then hard-failed at seed time — this file's header claim of "one source of truth for TWO enforcement layers" was false for exactly this source. The mapped type below re-derives the arm per collection so the two layers cannot drift apart again; `tests/template/strictRowTypes.type-test.ts` holds a `@ts-expect-error` on the `questions` case, so a regression is a compile error rather than a seed-time surprise.
 */
type NonColumnKeysFor<TCollection extends CollectionKey> =
  | {
      [F in (typeof NON_COLUMN_FIELD_LIST)[number]]: TCollection extends (typeof NON_COLUMN_FIELD_READERS)[F][number]
        ? F
        : never;
    }[(typeof NON_COLUMN_FIELD_LIST)[number]]
  | (TCollection extends keyof typeof COLLECTION_NON_COLUMN_LIST
      ? (typeof COLLECTION_NON_COLUMN_LIST)[TCollection][number]
      : never);

/** RPC relationship-reference keys admitted on `TCollection`. */
type RefKeysFor<TCollection extends CollectionKey> =
  | (TCollection extends keyof typeof RELATIONSHIP_REFS
      ? Extract<keyof (typeof RELATIONSHIP_REFS)[TCollection], string>
      : never)
  | (TCollection extends keyof typeof RPC_ADJACENT_REFS ? (typeof RPC_ADJACENT_REFS)[TCollection][number] : never);

/**
 * A hand-authored `fixed[]` row for `TCollection`: its DB columns, its sentinel keys, its non-column fields and its RPC relationship references — and nothing else.
 *
 * ⚠ **Excess property checking is a fresh-object-literal rule.** Assigning a row through an intermediate variable bypasses this type's protection entirely. The runtime guard is the only cover there; see `_helpers/buildMinimal.ts`.
 */
export type FixedRow<TCollection extends CollectionKey> = Partial<TablesInsert<TCollection>> & {
  external_id: string;
} & Partial<Record<SentinelKeysFor<TCollection>, SentinelValue>> &
  Partial<Record<NonColumnKeysFor<TCollection>, unknown>> &
  Partial<Record<RefKeysFor<TCollection>, ExternalRef>>;

/*
 * The twelve named aliases.
 *
 * ⚠ **The alias is load-bearing, not stylistic.** Measured: an inline intersection produces a `TS2353` whose type name is a twenty-line structural expansion, while an alias produces `… does not exist in type 'ElectionsFixedRow'`. The error must NAME the row type, so the alias form is required.
 */

/** A hand-authored `elections` row. */
export type ElectionsFixedRow = FixedRow<'elections'>;
/** A hand-authored `constituency_groups` row. */
export type ConstituencyGroupsFixedRow = FixedRow<'constituency_groups'>;
/** A hand-authored `constituencies` row. */
export type ConstituenciesFixedRow = FixedRow<'constituencies'>;
/** A hand-authored `organizations` row. */
export type OrganizationsFixedRow = FixedRow<'organizations'>;
/** A hand-authored `alliances` row. */
export type AlliancesFixedRow = FixedRow<'alliances'>;
/** A hand-authored `factions` row. */
export type FactionsFixedRow = FixedRow<'factions'>;
/** A hand-authored `candidates` row. */
export type CandidatesFixedRow = FixedRow<'candidates'>;
/** A hand-authored `question_categories` row. */
export type QuestionCategoriesFixedRow = FixedRow<'question_categories'>;
/** A hand-authored `questions` row. */
export type QuestionsFixedRow = FixedRow<'questions'>;
/** A hand-authored `nominations` row. */
export type NominationsFixedRow = FixedRow<'nominations'>;
/** A hand-authored `app_settings` row. */
export type AppSettingsFixedRow = FixedRow<'app_settings'>;
/** A hand-authored `feedback` row. */
export type FeedbackFixedRow = FixedRow<'feedback'>;
