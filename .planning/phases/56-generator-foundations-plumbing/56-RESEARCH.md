# Phase 56: Generator Foundations & Plumbing - Research

**Researched:** 2026-04-22
**Domain:** TypeScript data generation + Supabase bulk write path, monorepo package scaffolding
**Confidence:** HIGH (codebase-internal; all claims verified against repo files)

## Executive Summary

Phase 56 scaffolds `@openvaa/dev-seed` — a new private workspace package that generates typed rows for 16 non-system public tables and bulk-writes them through the existing `bulk_import` RPC, `importAnswers`, and `linkJoinTables` helpers that today live in `tests/tests/utils/supabaseAdminClient.ts`. The big decisions (class-based generators with captured ctx per D-26, bare-function overrides per D-25, zod schema per D-16, ctx.answerEmitter seam per D-27, split admin client per D-24) are already locked in CONTEXT.md. This research fills in the implementation grain: exact RPC wire shapes, exact fields the helpers look for on generator output, exact row-insert contracts per table, and exact monorepo wiring.

Three risks surfaced in the research that the planner must account for and that are NOT documented in CONTEXT.md:

1. **The `bulk_import` RPC snake-cases everything before calling** — the existing `SupabaseAdminClient.bulkImport` wrapper applies `PROPERTY_MAP` conversion, strips `_`-prefixed fields, strips `answersByExternalId`, and converts `{externalId: "..."}` → `{external_id: "..."}` (supabaseAdminClient.ts:158-198). Generators that emit camelCase + `_constituencyGroups`-style refs pass through this conversion layer; generators that emit snake_case directly do NOT. The planner must pick a convention and the writer must honor it.
2. **`bulk_import` does NOT support all 16 tables** — its `processing_order` array (migration line 2751-2756) covers 11 tables. Accounts, projects, feedback, and both join tables are NOT in it; passing them produces `RAISE EXCEPTION 'Unknown collection: %'` (line 2763). D-11 acknowledges this but the planner must ensure the writer routes correctly — generators for these 5 tables emit rows, but the writer path is different (pass-through for accounts/projects; direct upsert for feedback; `linkJoinTables` for the two join tables).
3. **`test:unit` runs through Turborepo, but only apps have the script today** — the root `yarn test:unit` = `turbo run test:unit` (package.json:16). Packages have tests via the root `vitest.workspace.ts` + per-package empty `vitest.config.ts` stub, but none of the packages currently declare a `test:unit` script. For dev-seed's tests to run in CI via `yarn test:unit`, the new package needs BOTH an empty vitest.config.ts (for workspace discovery when running `yarn test:unit:watch` = `vitest`) AND a `test:unit` script in package.json (for `turbo run test:unit`). This is a subtle wiring detail; skipping either half yields silent test misses.

**Primary recommendation:** Mirror `@openvaa/dev-tools`'s package shape (private, tsx-only, no tsup) per D-28, add a `test:unit` script + empty `vitest.config.ts`, and place the generator convention at the SupabaseAdminClient layer's existing camelCase-with-`_`-prefixed-refs convention — then the writer uses the same translation logic that exists today.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Package & Workspace**
- **D-01:** Seeder ships as `@openvaa/dev-seed`, NOT an extension of `@openvaa/dev-tools`. Overrides STATE.md's `@openvaa/dev-tools` framing.
- **D-02:** Phase 58 CLI work uses `dev:foo` namespace (e.g. `dev:seed`). Forward-looking; not implemented in Phase 56.
- **D-03:** Downstream docs mentioning `@openvaa/dev-tools` as seeder home are stale and must be updated (REQUIREMENTS.md GEN-05/10, CLI-01/02/03, DX-04, ROADMAP phase descriptions, PROJECT.md).

**Generator Shape (GEN-01, GEN-02, GEN-03)**
- **D-04:** Each built-in generator is a class with `generate(fragment, ctx)` returning `Rows[]` typed via `@openvaa/supabase-types`.
- **D-05:** Override map shape: `{ [table]: (fragment, ctx) => Rows[] }`. Pipeline resolves as `overrides[table]?.(fragment, ctx) ?? builtIn.generate(fragment, ctx)`. Full-replace semantics; no transform/post-hook.
- **D-06:** Fixed topo order: elections → constituency_groups → constituencies → organizations → alliances → factions → candidates → question_categories → questions → nominations → app_settings; accounts/projects ctx-only; feedback + join tables wired after main pass.

**Generator Context**
- **D-07:** ctx carries: single seeded faker instance, projectId + externalIdPrefix, prior-entity ref map, shared logger/warnings sink.

**Smart Defaults (TMPL-02)**
- **D-08:** Each generator has `defaults(ctx): Fragment` method. `resolveFragment(template, ctx)` merges template over `generator.defaults(ctx)`.

**Bulk-Write Path**
- **D-09:** Reuse `bulk_import` RPC unchanged.
- **D-10:** Reuse `importAnswers` + `linkJoinTables` helpers unchanged.
- **D-11:** Tables `bulk_import` does NOT accept: accounts/projects (ctx bootstrap refs, no writes); feedback (direct `.upsert()`); join tables (`linkJoinTables`).
- **D-12:** NF-05 rollback = `bulk_import`'s single-txn guarantee. Document in JSDoc; do NOT add independent rollback layer.

**SupabaseAdminClient (D-24 refines D-13, D-14)**
- **D-24:** SPLIT, not wholesale-moved. Dev-seed owns: `bulkImport`, `bulkDelete`, `importAnswers`, `linkJoinTables`, `updateAppSettings`, constructor, `COLLECTION_MAP`/`FIELD_MAP`, `TEST_PROJECT_ID`. Tests/ retains auth helpers (`setPassword`, `forceRegister`, `unregisterCandidate`, `sendEmail`, `sendForgotPassword`, `deleteAllTestUsers`, `safeListUsers`, `fixGoTrueNulls`) + legacy E2E utilities (`findData`, `query`, `update`, `documentId` alias) via subclass or composition wrapper that depends on the dev-seed base. `tests/tests/utils/supabaseAdminClient.ts` is REWRITTEN (not deleted) to re-export + extend. Approximate split: ~300-line dev-seed base + ~400-line tests-only shell.

**Environment Enforcement (NF-02, Success Criterion 6)**
- **D-15:** Env-var check at writer constructor / pre-flight, NOT at module import. Pure generators stay env-free.

**Template Schema**
- **D-16:** zod (catalog — already `^4.3.6`). `.error.issues[].path` provides field-pointing errors (TMPL-09). TS types via `z.infer<>`.
- **D-17:** Template types in `@openvaa/dev-seed`; consumers `import type {Template}`.
- **D-18:** Phase 56 minimal core schema: top-level `seed?: number`, `externalIdPrefix?: string`, `projectId?: string`, per-entity `{ count?: number, fixed?: RowFragment[] }`. ALL fields `.optional()`. Phase 57/58 extend via `.extend()`.

**Override/Class Reconciliation (D-25, D-26 refines D-04, D-05)**
- **D-25:** Public override signature is `(fragment, ctx) => Rows[]` — GEN-03 gets a one-line amendment.
- **D-26:** Built-in classes capture ctx at construction: `new CandidateGenerator(ctx)` + `gen.generate(fragment)`. Pipeline bridges:
  ```ts
  const gen = new CandidateGenerator(ctx);
  const rows = overrides.candidates?.(fragment, ctx) ?? gen.generate(fragment);
  ```
  `defaults(ctx)` remains per-call (template-merge at resolve time).

**Stub Answer Behavior (GEN-07 stub)**
- **D-19/D-20:** Random-valid-per-question via seeded faker. Uniform Likert / random categorical choice. Generator emits shape-valid only; subdimension projection is matching's job.
- **D-21:** Phase 57 can fall back to random-valid for categorical without loadings.
- **D-27:** Seam = `ctx.answerEmitter ?? defaultRandomValidEmit`. Single function pointer — no interface. Unit-test hook for determinism assertion.

**Testing**
- **D-22:** Generator unit tests = pure I/O, no DB. Assert: shape matches `@openvaa/supabase-types`; external_id prefix applied; count honored; fixed[] pass-through unchanged; seeded determinism.
- **D-23:** Writer unit test = env-var enforcement + ctx/bulkImport call shape with mocked admin client. Integration testing deferred to Phase 58 DX-03.

**Package Shape (D-28 refines D-01)**
- **D-28:** Private workspace package. Mirror `@openvaa/dev-tools`:
  - `"private": true`, `"type": "module"`
  - Scripts: `build` (echo no-op), `lint`, `typecheck`, `test:unit`
  - NO `files`, NO `exports` map, NO `publishConfig`, NO `license`
  - tsx-only runner; NO tsup build

### Claude's Discretion
- Exact file/directory layout in `packages/dev-seed/src/` (e.g. `generators/`, `template/`, `writer.ts`, `pipeline.ts`)
- Naming of the public entry point (`Seeder`, `seedDatabase`, `runSeeder`, etc.)
- Whether `ctx` logger is `(msg: string) => void`, event emitter, or console-like
- Whether `feedback` ships in Phase 56 or stays a stub module (direct `.upsert()` path)
- Subclass vs composition for tests/ admin-client shell (pick lighter diff)
- `ctx.answerEmitter` as top-level or nested `ctx.emitters.answer` (naming-only)

### Deferred Ideas (OUT OF SCOPE)
- Partial/transform override shape (rejected; full-replace only in Phase 56)
- Dependency-declared generator nodes (rejected; fixed topo order)
- Phase 56 integration test against real local Supabase (deferred to Phase 58 DX-03)
- Extending `bulk_import` RPC to cover accounts/projects/feedback/join-tables (rejected)
- Schema-wide `.default()` with centralized defaults (rejected; per-generator `defaults()`)
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| GEN-01 | One independent generator module per non-system public table (16) | §4 Per-Table Row Requirements gives authoritative shape per table |
| GEN-02 | Generators return typed rows via `@openvaa/supabase-types` | §3 Row Types — use `TablesInsert<'X'>` for per-entity return types |
| GEN-03 | Override via `{ [table]: (fragment, ctx) => Rows[] }` (extended per D-25) | §1 Bulk-import contract confirms accepted collection shape |
| GEN-04 | `external_id` with configurable prefix (default `seed_`) | §1 RPC requires `external_id`; §4 confirms every content table has `external_id` + partial unique index on `(project_id, external_id)` |
| GEN-05 | Writes via service-role `SupabaseAdminClient` | §2 Admin client contracts — inherit from split dev-seed base |
| GEN-07 | Categorical question subdimension handling | §4 questions table + §9 answer shape per type; stub emits shape-valid only |
| GEN-08 | Nominations referential integrity | §9 Nominations Polymorphism — CHECK constraint, hierarchy trigger, parent consistency |
| TMPL-01 | Single template schema (TS type) | §6 zod patterns in codebase |
| TMPL-02 | Every field optional, `{}` template valid | §6 zod `.optional()` pattern |
| TMPL-08 | Optional `seed: number` for reproducible faker | §5 Faker seeded-instance pattern |
| TMPL-09 | Validation errors point at offending field | §6 zod `error.issues[].path` provides field paths natively |
| NF-01 | Seed completes in <10s on local Supabase | Honored by using `bulk_import` RPC (single txn, one RPC call per collection) per D-09 |
| NF-02 | Zero secrets; reads env vars; fails loudly if missing | §2 — writer constructor enforces per D-15 |
| NF-03 | TypeScript strict mode, no `any` in public surface | §7 — use shared-config tsconfig.base.json; row types are strict |
| NF-05 | Fails cleanly and rolls back on partial insert | §1 — `bulk_import` is single-txn SECURITY INVOKER; mid-collection violation aborts, nothing commits (per D-12) |
| DX-02 | Unit tests for each generator | §8 Vitest setup — per-package `vitest.config.ts` + root workspace picks up tests |
</phase_requirements>

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Row shape generation (typed records) | Node.js package (`@openvaa/dev-seed`) | — | Pure TS domain; no I/O |
| Template validation | Node.js package | — | zod runs anywhere |
| Service-role bulk write | Node.js package → Supabase RPC | PostgREST → PostgreSQL | Single responsibility in `SupabaseAdminClient`; actual writes happen DB-side via PL/pgSQL |
| Reference integrity (external_id → UUID) | PostgreSQL (`bulk_import` / `resolve_external_ref`) | Node.js (client-side graph validation) | DB is authoritative; client validates eagerly to fail fast |
| Answer JSONB stitching | Node.js (`importAnswers`) | PostgreSQL (`validate_answers_jsonb` trigger) | Two-pass: bulk_import creates candidates, then importAnswers resolves question external_ids |
| Join table linking | Node.js (`linkJoinTables`) | PostgreSQL | Two-pass: bulk_import creates entities, then client resolves external_ids → UUIDs and upserts rows |
| Env var enforcement (NF-02) | Writer constructor (runtime) | — | Must fail before any DB call; NOT at module import |

## 1. `bulk_import` RPC Contract

**Source:** `apps/supabase/supabase/migrations/00001_initial_schema.sql` lines 2735-2806.

### Function signature

```sql
CREATE OR REPLACE FUNCTION public.bulk_import(p_data jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
```

- **SECURITY INVOKER**: admin RLS policies are enforced; the service-role client bypasses RLS automatically.
- **Transactional**: PostgREST wraps RPC calls in a transaction. A single `RAISE EXCEPTION` anywhere aborts everything.
- **Single JSON arg**: everything goes into `p_data`.

### Input shape (top level)

Verified from the SQL comment block at line 2720-2724:

```jsonc
{
  "elections":          [ { "external_id": "...", "project_id": "...", ... }, ... ],
  "constituency_groups":[ ... ],
  "constituencies":     [ ... ],
  "organizations":      [ ... ],
  "alliances":          [ ... ],
  "factions":           [ ... ],
  "candidates":         [ ... ],
  "question_categories":[ ... ],
  "questions":          [ ... ],
  "nominations":        [ ... ],
  "app_settings":       [ ... ]
}
```

### Accepted collections (exactly these 11 — NO OTHERS)

From `processing_order` (line 2751-2756):

```
elections, constituency_groups, constituencies,
organizations, alliances, factions, candidates,
question_categories, questions,
nominations, app_settings
```

**Any other key** (`accounts`, `projects`, `feedback`, `election_constituency_groups`, `constituency_group_constituencies`) → `RAISE EXCEPTION 'Unknown collection: %'` (line 2763). This is load-bearing for D-11.

### Per-item requirements

Every item in every collection must include:

1. **`external_id`** — required. Line 2645-2649: `IF ext_id IS NULL THEN RAISE EXCEPTION 'external_id is required...'`.
2. **`project_id`** — required, per item (not top level). Line 2783-2786: `IF NOT item ? 'project_id' THEN RAISE EXCEPTION 'project_id is required...'`.

### Columns auto-populated by the DB (MUST NOT be sent)

Line 2616-2618:

```sql
skip_columns text[] := ARRAY['id', 'created_at', 'updated_at', 'project_id', 'entity_type'];
```

- `id`, `created_at`, `updated_at` → auto-filled by column defaults / `update_updated_at` trigger.
- `project_id` → already added as the first column by `_bulk_upsert_record` (line 2603); sending it in item JSON is OK but ignored (skipped).
- `entity_type` → for nominations, this is a GENERATED column derived from which FK is set (line 724-731); sending it fails because the table rejects writes to generated columns.

**Note**: `entity_type` skip ONLY applies to nominations; for questions/question_categories, `entity_type` is a regular `jsonb` column and will be written.

### Reference resolution (`{external_id: "..."}` refs)

Per-table relationship map, line 2622-2643:

| Table | JSON key | FK column | Target table |
|-------|---------|-----------|--------------|
| candidates | `organization` | `organization_id` | `organizations` |
| nominations | `candidate` | `candidate_id` | `candidates` |
| nominations | `organization` | `organization_id` | `organizations` |
| nominations | `faction` | `faction_id` | `factions` |
| nominations | `alliance` | `alliance_id` | `alliances` |
| nominations | `election` | `election_id` | `elections` |
| nominations | `constituency` | `constituency_id` | `constituencies` |
| nominations | `parent_nomination` | `parent_nomination_id` | `nominations` |
| questions | `category` | `category_id` | `question_categories` |
| constituencies | `parent` | `parent_id` | `constituencies` |

Generators emit items like:

```jsonc
{
  "external_id": "seed_cand_0001",
  "project_id": "00000000-0000-0000-0000-000000000001",
  "first_name": "Alice",
  "last_name": "Example",
  "organization": { "external_id": "seed_party_01" }
}
```

`resolve_external_ref` (line 2531-2575) looks up `organizations` WHERE `project_id` = X AND `external_id` = `"seed_party_01"` and swaps in the UUID. Missing → `RAISE EXCEPTION 'External reference not found: external_id "%" in table "%"'`.

**Refs can also be plain UUID strings**: line 2568-2570. Generators that have a UUID in hand (bootstrap refs from seed.sql) can pass it directly.

### Unknown-column behavior

**Unknown columns error at insert time, not at validation.** Line 2700-2708 builds dynamic SQL `INSERT INTO public.<table> (<cols>) VALUES (...)` — any column not present in the table definition produces a Postgres error like `column "foo" does not exist`. There's no whitelist; the DB rejects it.

**This is why `SupabaseAdminClient.bulkImport` strips `_`-prefixed fields and `answersByExternalId`** (supabaseAdminClient.ts:178-180) — those are sentinel fields the helpers use to pass ref lists to `linkJoinTables` / `importAnswers`, and they'd be rejected by the RPC if sent.

### Return value

```jsonc
{
  "elections":   { "created": 2, "updated": 0 },
  "candidates":  { "created": 40, "updated": 0 },
  ...
}
```

Line 2799-2801.

## 2. `importAnswers` & `linkJoinTables` Contracts

**Source:** `tests/tests/utils/supabaseAdminClient.ts` lines 234-480.

### `importAnswers` (lines 234-305)

**Fields it looks for on each candidate:**
- `answersByExternalId` OR `answers_by_external_id` (line 241) — object keyed by question `external_id`, value is the answer shape.
- `externalId` OR `external_id` (line 273) — identifies the candidate.

**Shape of `answersByExternalId`:**
```jsonc
{
  "answersByExternalId": {
    "seed_q_0001": { "value": 3 },               // Likert scalar
    "seed_q_0002": { "value": "choice_a" },      // single-choice categorical
    "seed_q_0003": { "value": ["a", "b"] }       // multi-choice
  }
}
```

Answer shape = `{ value: ..., info?: string | LocalizedString }` — validated by `validate_answer_value` (migration line 168-230).

**Algorithm (post-bulk_import):**
1. Collect all question `external_id`s across all candidates (line 239-245).
2. SELECT `id, external_id FROM questions WHERE external_id IN (...) AND project_id = X` (line 251-255).
3. Build `extId → UUID` map (line 263-266).
4. For each candidate: resolve question extIds → UUIDs, build `answers` JSONB keyed by question UUID, `UPDATE candidates SET answers = ... WHERE id = X` (line 296-299).

**Generators must emit `answersByExternalId`** — the helper does NOT accept direct `answers` JSONB (that would require resolving UUIDs client-side, which the helper's entire purpose is to avoid).

**Error behavior:** if any question external_id doesn't resolve, `RAISE Error('importAnswers: no questions found for external_ids: ...')`. Fails loudly per NF-02.

### `linkJoinTables` (lines 322-480)

Three link types handled, each with its own sentinel field convention:

**A. election → constituency_groups** (`election_constituency_groups` join table)

Generators emit on each election:
```jsonc
{
  "externalId": "seed_election_01",
  "_constituencyGroups": { "externalId": ["seed_cg_01", "seed_cg_02"] }
}
```

OR the legacy snake_case equivalent `_constituency_groups: { external_id: [...] }` (line 328-335).

**B. constituency_group → constituencies** (`constituency_group_constituencies` join table)

Generators emit on each constituency_group:
```jsonc
{
  "externalId": "seed_cg_01",
  "_constituencies": { "externalId": ["seed_con_01", "seed_con_02", ...] }
}
```

Line 387-392.

**C. question_category → elections** (via `election_ids` JSONB column, not a join table)

Generators emit on each question_category:
```jsonc
{
  "externalId": "seed_cat_01",
  "_elections": { "externalId": ["seed_election_01"] }
}
```

Line 446-478. After bulk_import creates the category (with `election_ids` null), this helper resolves election extIds → UUIDs and updates the category's `election_ids` JSONB column with the UUID array.

**Critical finding:** `linkJoinTables` uses `_`-prefixed sentinel fields (`_constituencyGroups`, `_constituencies`, `_elections`). `bulkImport` strips `_`-prefixed fields before sending to the RPC (supabaseAdminClient.ts:179). This enables the two-pass pattern to work on the SAME input dataset — generators emit one set of rows that both passes consume, extracting different information.

### Two-pass post-insert pattern (how the writer stitches it)

```ts
await client.bulkImport(data);      // Pass 1: creates rows (strips _ fields + answersByExternalId)
await client.importAnswers(data);   // Pass 2: stitches candidate answers from same dataset
await client.linkJoinTables(data);  // Pass 3: stitches join tables + category→election refs
```

This is the exact call sequence the writer must implement (D-09/D-10).

### Field name conversion layer in `bulkImport` itself

Critical for the planner: `bulkImport` (supabaseAdminClient.ts:158-198) is NOT a pass-through. It:

1. Strips fields: `answersByExternalId`, `_`-prefixed anything, per-collection extras (`candidates: email`).
2. Converts camelCase → snake_case via `FIELD_MAP` (`PROPERTY_MAP` from supabase-types) — e.g. `firstName` → `first_name`, `externalId` → `external_id`.
3. Nested ref conversion: `{externalId: "X"}` → `{external_id: "X"}` (line 184-185).
4. Nomination polymorphism: if `isNomination && key === 'organization' && hasCandidateRef`, strip `organization` (line 180) — see §9.

**Implication:** Generators can emit camelCase fragments (idiomatic for TS) and rely on the writer to snake-case them. OR generators emit snake_case directly. The planner picks; existing code uses camelCase-with-`_`-sentinel convention, so mirroring that is the lowest-risk path.

### `app_settings` handling

`updateAppSettings` (line 495-514) uses a different RPC — `merge_jsonb_column` — for deep-merging partial settings into the existing row. But `bulk_import` DOES support `app_settings` (line 2755). Choice: the generator can emit an `app_settings` row in the bulk payload for initial settings, OR call `updateAppSettings` separately for nested changes. For Phase 56's scope (pure generator I/O), the simpler path is emitting an `app_settings` row through bulk_import since seed.sql already bootstraps an empty app_settings row (seed.sql:39-41).

## 3. Row Types from `@openvaa/supabase-types`

**Source:** `packages/supabase-types/src/index.ts`, `src/column-map.ts`, `src/database.ts`.

### Public exports

From `index.ts`:

```ts
// TYPES
export type { CompositeTypes, Database, Enums, Json, Tables, TablesInsert, TablesUpdate } from './database.js';
export type { ColumnName, PropertyName, CollectionName, TableName } from './column-map.js';

// VALUES
export { Constants } from './database.js';
export { COLUMN_MAP, PROPERTY_MAP, TABLE_MAP, COLLECTION_NAME_MAP } from './column-map.js';
```

### Type generics (database.ts:1173-1244)

- `Tables<'candidates'>` — full row type (for reads / select results)
- `TablesInsert<'candidates'>` — insert-shaped type (optional id/created_at/updated_at, required name/first_name/etc.)
- `TablesUpdate<'candidates'>` — all-optional (for patches)

### Recommendation: `TablesInsert<'X'>` for generator return types

Every generator's `generate()` method should return `TablesInsert<TableName>[]`. Rationale:

- `id` is `?string` in Insert types (line 46, 80, 130, 184, etc.) — auto-generated by `DEFAULT gen_random_uuid()` so generators should NOT set it.
- `created_at`, `updated_at` are `?string` in Insert types — auto-filled by triggers.
- Required NOT NULL columns (e.g. `candidates.first_name`, `nominations.election_id`) are required in Insert — TypeScript enforces them at generator level.
- `project_id` is required in Insert for most tables — generators read from `ctx.projectId`.

Example for a candidate generator:
```ts
import type { TablesInsert } from '@openvaa/supabase-types';
export type CandidateRow = TablesInsert<'candidates'>;
// = { first_name: string; last_name: string; project_id: string; id?: string; ... }
```

### Maps for writer's snake-case translation

`COLUMN_MAP` (column-map.ts:7-73): snake → camel, 30+ entries incl. `first_name → firstName`, `external_id → externalId`, `project_id → projectId`.
`PROPERTY_MAP` (reverse): camel → snake. **This is what `SupabaseAdminClient.bulkImport` uses** (supabaseAdminClient.ts:56-60).
`TABLE_MAP` (line 92-100): camelCase collection → snake_case table (e.g. `constituencyGroups → constituency_groups`).
`COLLECTION_NAME_MAP` (reverse): snake → camel.

### Enum types available

From database.ts:1148-1162:
- `Database['public']['Enums']['question_type']` — `'text' | 'number' | 'boolean' | 'image' | 'date' | 'multipleText' | 'singleChoiceOrdinal' | 'singleChoiceCategorical' | 'multipleChoiceCategorical'`
- `Database['public']['Enums']['entity_type']` — `'candidate' | 'organization' | 'faction' | 'alliance'`
- `Database['public']['Enums']['category_type']` — `'info' | 'opinion' | 'default'`

Use via `Enums<'question_type'>` (exported from index.ts).

## 4. Per-Table Row Requirements (16 tables)

Source: `apps/supabase/supabase/migrations/00001_initial_schema.sql` §table definitions + `packages/supabase-types/src/database.ts` insert types.

**Pattern:** 11 of 16 tables have identical DataObject scaffolding (id, project_id, name, short_name, info, color, image, sort_order, subtype, custom_data, is_generated, created_at, updated_at) + `external_id` + per-table additions. The unique index is `(project_id, external_id) WHERE external_id IS NOT NULL` — partial, so null external_ids are allowed but not useful for dev-seed.

### 4.1 `accounts` (line 383-388)

Required: `name` (text).
Auto: `id`, `created_at`, `updated_at`.
**D-11: no writes; bootstrap ref only.** `ctx.refs.accounts` pre-populated from seed.sql: `{ id: '00000000-0000-0000-0000-000000000001', name: 'Default Account' }`.

### 4.2 `projects` (line 394-401)

Required: `account_id` (FK accounts), `name`. Defaults: `default_locale = 'en'`.
**D-11: no writes; bootstrap ref.** seed.sql project: `00000000-0000-0000-0000-000000000001`.

### 4.3 `elections` (line 408-427)

Required: `project_id`. All other fields nullable or defaulted.
Columns: `name`, `short_name`, `info`, `color`, `image` (jsonb), `sort_order` (int), `subtype` (text), `custom_data` (jsonb), `is_generated` (bool, default false), `election_date` (date), `election_start_date` (date), `election_type` (text), `multiple_rounds` (bool, default false), `current_round` (int, default 1), `external_id` (text, partial unique), `created_at`, `updated_at` (auto).

**JSONB `name` shape:** localized string per `is_localized_string` (migration line 96-122): object where every value is a string, e.g. `{ en: "2024 Finnish Parliamentary Election", fi: "Eduskuntavaalit 2024" }`.

**Sentinel field for generator output:** `_constituencyGroups: { externalId: string[] }` — picked up by `linkJoinTables`.

### 4.4 `constituency_groups` (line 433-447)

Required: `project_id`. Same DataObject scaffolding as elections.
**Sentinel:** `_constituencies: { externalId: string[] }` — picked up by `linkJoinTables`.

### 4.5 `constituencies` (line 453-469)

Required: `project_id`. Plus: `keywords` (jsonb), `parent_id` (self-FK, ON DELETE SET NULL).
**Ref shape for parent:** emit `parent: { external_id: "..." }`; `_bulk_upsert_record` resolves via `constituencies` relationship (migration line 2640).

### 4.6 `constituency_group_constituencies` (line 475-479) — JOIN TABLE

Required: `constituency_group_id`, `constituency_id`. PRIMARY KEY on both.
**D-11: NOT in `bulk_import`. Written by `linkJoinTables` via upsert with `onConflict: 'constituency_group_id,constituency_id'`** (supabaseAdminClient.ts:429-432).
**Generators do NOT emit rows for this table** — they emit `_constituencies` sentinel on parent constituency_group rows.

### 4.7 `election_constituency_groups` (line 481-485) — JOIN TABLE

Required: `election_id`, `constituency_group_id`. PRIMARY KEY on both.
**D-11: same as 4.6.** Written by `linkJoinTables` via `_constituencyGroups` sentinel on election rows.

### 4.8 `organizations` (line 488-503)

Required: `project_id`. Plus: `auth_user_id` (nullable FK to auth.users), `answers` (jsonb, default '{}').
Standard DataObject scaffolding. No FK to other content.
**Note:** seed-produced organizations should leave `auth_user_id` NULL (Phase 56 scope excludes auth).

### 4.9 `candidates` (line 509-527, + 535 + 761)

Required: `project_id`, `first_name` (text NOT NULL), `last_name` (text NOT NULL).
Optional: `organization_id` (FK), `auth_user_id`, `terms_of_use_accepted` (timestamptz), `answers` (jsonb, default '{}').
**Ref shape for organization:** emit `organization: { external_id: "..." }`.
**Sentinel for answers:** emit `answersByExternalId: { [questionExtId]: { value: ... } }` — picked up by `importAnswers`.

### 4.10 `factions` (line 537-551)

Required: `project_id`. Standard DataObject scaffolding. No additional content FKs. (Factions' hierarchy is expressed through nominations, not here.)

### 4.11 `alliances` (line 557-571)

Required: `project_id`. Standard DataObject scaffolding. No additional content FKs.

### 4.12 `question_categories` (line 580-599)

Required: `project_id`. Plus:
- `category_type` (enum: `'info' | 'opinion' | 'default'`, default `'opinion'`)
- `election_ids` (jsonb) — array of UUIDs, populated post-insert by `linkJoinTables`
- `election_rounds` (jsonb)
- `constituency_ids` (jsonb)
- `entity_type` (jsonb)

**Sentinel:** `_elections: { externalId: string[] }` — picked up by `linkJoinTables` which resolves and updates `election_ids`.

### 4.13 `questions` (line 605-629)

Required: `project_id`, `type` (enum question_type NOT NULL), `category_id` (FK question_categories NOT NULL).
Optional: `choices` (jsonb), `settings` (jsonb), `election_ids`, `election_rounds`, `constituency_ids`, `entity_type` (jsonb), `allow_open` (bool default true), `required` (bool default true).

**`choices` validation (migration line 645-689 `validate_question_choices` trigger):**
For types `singleChoiceOrdinal`, `singleChoiceCategorical`, `multipleChoiceCategorical`:
- `choices` MUST be a non-null JSON array with ≥2 elements
- Each choice MUST be an object with an `id` key
- Example: `[{ id: "1", label: { en: "Strongly disagree" } }, { id: "2", label: { en: "Disagree" } }, ...]`

For other types (text, number, boolean, date, image, multipleText), `choices` can be null.

**Ref shape for category:** emit `category: { external_id: "..." }`.

### 4.14 `nominations` (line 704-742)

Required (SQL): `project_id`, `election_id`, `constituency_id`, `entity_type` (GENERATED — do NOT send).
Plus exactly ONE of: `candidate_id`, `organization_id`, `faction_id`, `alliance_id` — enforced by CHECK constraint line 741.
Optional: `election_round` (int default 1), `election_symbol` (text), `parent_nomination_id` (self-FK), `unconfirmed` (bool default false).

**Ref shapes:** `candidate`, `organization`, `faction`, `alliance`, `election`, `constituency`, `parent_nomination` — all as `{ external_id: "..." }` per migration line 2625-2634.

See §9 for the polymorphism handling.

### 4.15 `app_settings` (line 914-920, + 927)

Required: `project_id` (UNIQUE — only one row per project).
Optional: `settings` (jsonb default `{}`), `customization` (jsonb default `{}`), `external_id`.

**Bootstrap consideration:** seed.sql already inserts an app_settings row for `TEST_PROJECT_ID` with `settings = {}` (seed.sql:39-41). A generator-produced `app_settings` row with an external_id would UPSERT — but the UNIQUE constraint is on `project_id`, not on `(project_id, external_id)`. The upsert via `bulk_import` uses `ON CONFLICT (project_id, external_id)` (migration line 2703), which does NOT match the `(project_id)` UNIQUE. Result: attempting to insert an app_settings row with a new external_id when seed.sql has already inserted one (external_id NULL) → UNIQUE violation on project_id.

**Implication:** the generator should either (a) call `updateAppSettings` (direct merge) rather than bulk_import, OR (b) the writer must DELETE the seed.sql app_settings row before calling bulk_import. The planner should surface this to discuss-phase if unclear; the simplest option given D-11's "direct upsert for feedback" precedent is (a) — treat app_settings the same way: out of bulk_import path, go through `updateAppSettings` or `.upsert({ project_id, settings }, { onConflict: 'project_id' })`.

### 4.16 `feedback` (line 949-961)

Required: `project_id`. CHECK constraint: `rating IS NOT NULL OR description IS NOT NULL` (at least one).
Optional: `rating` (int), `description` (text), `date` (timestamptz default now()), `url` (text), `user_agent` (text).
**No `external_id` column.** Not idempotent via external_id; generator must handle re-runs differently (or skip).
**D-11: direct `.upsert()` in writer.**

## 5. `@faker-js/faker` Seeded-Instance Patterns

**Catalog version (verified):** `^8.4.1` — `.yarnrc.yml:21`.

**Two equivalent deterministic-output patterns (confirmed from faker docs):**

### Pattern A: Constructor with seed option (cleanest, recommended)

```ts
import { Faker, en } from '@faker-js/faker';

const faker = new Faker({ locale: [en], seed: template.seed ?? 42 });

// Deterministic output
faker.person.firstName();  // same result every run for a given seed
```

### Pattern B: Default instance + `.seed()` call

```ts
import { faker } from '@faker-js/faker';

faker.seed(template.seed ?? 42);
faker.person.firstName();
```

**Gotcha with Pattern B:** the default `faker` instance is a MODULE-LEVEL singleton. If two tests import it and run in parallel (vitest default), they share state. For unit tests that assert determinism, each test must call `faker.seed(N)` at the start — easy to forget.

**Recommendation:** Use Pattern A. Construct a fresh `new Faker({ locale: [en], seed })` once at pipeline start, store on `ctx.faker` per D-07, and pass ctx into every generator. Each generator reads `ctx.faker.person.firstName()` etc. — no module-level state, no shared-state bugs in tests.

**Determinism caveat (from faker docs):** output is dependent on both the seed AND the number/order of calls since the seed was set. Reordering `faker.person.firstName()` and `faker.company.name()` inside a generator changes the output of both. This matters for the determinism unit test (same-seed-same-output assertion) — the test must compare on the COMPLETE output, not on individual fields, because any intra-generator reordering breaks byte-identity.

**Locale chain:** `locale: [en]` uses English only. `locale: [fi, en]` tries Finnish first, falls back to English. For Phase 56, `[en]` is the minimum; Phase 58 introduces localization and may want `[en, fi, sv, da]`.

## 6. zod Patterns in This Codebase

**Catalog version:** `^4.3.6` — `.yarnrc.yml:24`. This is zod v4 (major API changes from v3).

**Existing usage** (verified via grep):
- `packages/argument-condensation/src/core/condensation/responseValidators/responseWithArguments.ts` — `z.object({...}) satisfies z.ZodType<ResponseWithArguments>` pattern.
- `packages/question-info/src/utils/schemaGenerator.ts` — dynamic schemas returning `z.ZodSchema`, conditional `z.object({...})` composition.
- `packages/llm/src/llm-providers/provider.types.ts` — declarative `z.object`.

### Pattern 1: Define schema, derive TS type

```ts
import { z } from 'zod';

export const TemplateSchema = z.object({
  seed: z.number().optional(),
  externalIdPrefix: z.string().optional(),
  projectId: z.string().uuid().optional(),
  elections: z.object({
    count: z.number().int().nonnegative().optional(),
    fixed: z.array(z.any()).optional()  // Phase 56 accepts any shape; refined in Phase 57/58
  }).optional(),
  // ... one per entity
});

export type Template = z.infer<typeof TemplateSchema>;
```

### Pattern 2: `.extend()` for Phase 57/58

Per the [zod v4 migration guide](https://zod.dev/v4/changelog), `.merge()` is deprecated — use `.extend()`:

```ts
// Phase 57 adds:
export const TemplateSchemaP57 = TemplateSchema.extend({
  latent: z.object({
    dimensions: z.number().int().positive(),
    centroids: z.array(z.array(z.number())),
    spread: z.number().positive(),
    loadings: z.record(z.string(), z.array(z.number())),
    noise: z.number().nonnegative()
  }).optional()
});
```

### Pattern 3: Field-pointing errors (TMPL-09)

In zod v4, `safeParse()` returns `{ success: false, error: { issues: [...] } }` where each issue has `path: (string | number)[]`. Example error reporter:

```ts
function reportErrors(result: z.SafeParseReturnType<unknown, Template>): string {
  if (result.success) return '';
  return result.error.issues
    .map(iss => `  at template.${iss.path.join('.')}: ${iss.message}`)
    .join('\n');
}
```

Example output: `at template.elections.count: Expected number, received string`.

### Pattern 4: `.optional()` everywhere

Per D-18 and zod v4 semantics: `.optional()` makes the KEY optional. To make a field optional BUT with a default applied, use `.default()` instead: `z.number().default(1)` → undefined becomes 1. Per D-08 "smart defaults stay co-located with the generator," template fields are `.optional()` (no defaults in the schema); the per-generator `defaults(ctx)` method provides them. This gives a cleaner test surface.

## 7. Turborepo / Yarn Workspace Wiring

**Sources:** `turbo.json`, `.yarnrc.yml`, `packages/dev-tools/package.json` (the closest analog), `package.json` (root).

### turbo.json task wiring (lines 1-24)

```jsonc
{
  "tasks": {
    "build":     { "dependsOn": ["^build"], "outputs": ["build/**", "dist/**"], "inputs": ["src/**", "tsconfig.json", "tsconfig.*.json", "tsup.config.ts", "package.json"] },
    "test:unit": { "dependsOn": ["build"], "cache": false },
    "lint":      { "dependsOn": ["^lint"], "outputs": [], "inputs": ["$TURBO_DEFAULT$", "eslint.config.*"] },
    "typecheck": { "dependsOn": ["^build"], "outputs": [], "inputs": ["$TURBO_DEFAULT$", "tsconfig.json", "tsconfig.*.json"] }
  }
}
```

- **`build`** depends on upstream `^build` (dependency order). Outputs go to `build/` or `dist/`. Per D-28, dev-seed's `build` is `echo 'Nothing to build.'` (tsx-only).
- **`test:unit`** depends on `build` (local package's own build). Cache is OFF — tests always run. **A package without a `test:unit` script is silently skipped by `turbo run test:unit`.**
- **`lint`** runs project-wide with `^lint` (upstream first).
- **`typecheck`** depends on upstream `^build` (so downstream TS refs resolve).

### Mandatory `@openvaa/dev-seed/package.json` scripts (per D-28, mirror dev-tools)

```jsonc
{
  "private": true,
  "name": "@openvaa/dev-seed",
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "build": "echo 'Nothing to build.'",
    "lint": "eslint --flag v10_config_lookup_from_file src/",
    "typecheck": "tsc --noEmit",
    "test:unit": "vitest run"
  },
  "dependencies": {
    "@openvaa/supabase-types": "workspace:^",
    "@supabase/supabase-js": "catalog:",
    "@faker-js/faker": "catalog:",
    "zod": "catalog:"
  },
  "devDependencies": {
    "@openvaa/shared-config": "workspace:^",
    "@types/node": "catalog:",
    "eslint": "catalog:",
    "tsx": "catalog:",
    "typescript": "catalog:",
    "vitest": "catalog:"
  }
}
```

**Do NOT include**: `files`, `exports`, `publishConfig`, `license`, `module`, `types` — per D-28.

### tsconfig.json (mirror dev-tools)

```jsonc
{
  "$schema": "https://json.schemastore.org/tsconfig",
  "extends": "@openvaa/shared-config/ts",
  "compilerOptions": {
    "lib": ["es2022"],
    "rootDir": "./src",
    "outDir": "./dist",
    "noEmit": true,
    "composite": false,
    "declarationMap": false,
    "types": ["node"]
  },
  "include": ["src/**/*"],
  "references": [
    { "path": "../supabase-types/tsconfig.json" }
  ]
}
```

**Crucial:** add `references` to `@openvaa/supabase-types` so IDE resolves imports without requiring a build (CLAUDE.md "IDE Resolution" note).

### Workspace registration

Root `package.json:67-70` declares `workspaces: ["packages/*", "apps/*"]` — creating `packages/dev-seed/` with a `package.json` is sufficient; no root change needed.

### Adding `@openvaa/dev-seed` to tests workspace

`tests/` is NOT a workspace (no `package.json` found). Its deps come from the root. Therefore: NO `"@openvaa/dev-seed": "workspace:^"` addition in tests. The refactored `tests/tests/utils/supabaseAdminClient.ts` imports directly from `@openvaa/dev-seed` (resolved by the root Yarn install).

**Correction to D-24's framing:** D-24 says "Tests workspace adds `"@openvaa/dev-seed": "workspace:^"` to its devDependencies." Since tests/ has no package.json, this is wrong as stated — the dep should be added to root `package.json` devDependencies (where the rest of the test-related deps live: `@playwright/test`, `@supabase/supabase-js`, etc.). **Planner: flag this as a one-line diff from D-24.**

## 8. Vitest Setup for New Workspace

**Sources:** `vitest.workspace.ts` (root), `packages/matching/vitest.config.ts`, `package.json:16-17`, existing test patterns.

### Dual-path test discovery in this repo

1. **`yarn test:unit` (CI path)** = `turbo run test:unit` (package.json:16). Only runs packages with a `test:unit` script in their package.json. Currently: `apps/docs`, `apps/frontend`, `apps/supabase`. **Package tests are NOT run by this command today.**
2. **`yarn test:unit:watch` (dev path)** = `vitest` at root (package.json:17). Uses `vitest.workspace.ts` which declares `['packages/**/vitest.config.ts']`. **Any package with a `vitest.config.ts` stub gets picked up.**

### Minimum dev-seed setup for BOTH paths to work

Create two files:

**`packages/dev-seed/vitest.config.ts`** (for workspace discovery):
```ts
/**
 * Empty config enables root vitest.workspace.ts to pick up this package's tests.
 * Mirrors the pattern in packages/matching/vitest.config.ts.
 */
export default {};
```

**`packages/dev-seed/package.json`** scripts block (for Turborepo):
```jsonc
"scripts": {
  "test:unit": "vitest run"
}
```

With both in place: `yarn test:unit` runs dev-seed tests via Turborepo, and `yarn test:unit:watch` also picks them up.

### Test file locations

Convention across the monorepo (verified via find): `packages/<name>/tests/**/*.test.ts`. Vitest discovers `.test.ts` / `.spec.ts` files anywhere under the package root by default — no glob config needed.

**Recommended layout:**
```
packages/dev-seed/
├── package.json
├── tsconfig.json
├── vitest.config.ts           ← empty marker
├── src/
│   ├── index.ts               ← package entry
│   ├── generators/
│   │   ├── candidateGenerator.ts
│   │   ├── electionGenerator.ts
│   │   └── ... (16 total)
│   ├── writer/
│   │   └── SupabaseAdminClient.ts   ← split from tests/
│   ├── template/
│   │   ├── schema.ts          ← zod
│   │   └── types.ts
│   └── pipeline.ts
└── tests/
    ├── candidateGenerator.test.ts
    ├── ... (one per generator + writer + pipeline)
    └── determinism.test.ts    ← cross-cutting seeded-output test
```

### Minimum viable unit test pattern

```ts
import { describe, it, expect } from 'vitest';
import { Faker, en } from '@faker-js/faker';
import { CandidateGenerator } from '../src/generators/candidateGenerator';

describe('CandidateGenerator', () => {
  const makeCtx = (overrides = {}) => ({
    faker: new Faker({ locale: [en], seed: 42 }),
    projectId: '00000000-0000-0000-0000-000000000001',
    externalIdPrefix: 'seed_',
    refs: { organizations: [{ external_id: 'seed_party_01' }] },
    logger: () => {},
    ...overrides
  });

  it('honors count from fragment', () => {
    const gen = new CandidateGenerator(makeCtx());
    const rows = gen.generate({ count: 5 });
    expect(rows).toHaveLength(5);
  });

  it('applies externalIdPrefix', () => {
    const gen = new CandidateGenerator(makeCtx());
    const rows = gen.generate({ count: 1 });
    expect(rows[0].external_id).toMatch(/^seed_/);
  });

  it('produces deterministic output for same seed', () => {
    const run1 = new CandidateGenerator(makeCtx()).generate({ count: 3 });
    const run2 = new CandidateGenerator(makeCtx()).generate({ count: 3 });
    expect(run1).toEqual(run2);
  });

  it('passes through fixed[] unchanged (modulo prefix)', () => {
    const gen = new CandidateGenerator(makeCtx());
    const rows = gen.generate({ count: 0, fixed: [{ first_name: 'Alice', last_name: 'Example', external_id: 'my_cand' }] });
    expect(rows).toEqual([expect.objectContaining({ first_name: 'Alice', last_name: 'Example', external_id: 'seed_my_cand' })]);
  });
});
```

Confirms D-22's acceptance criteria (a)-(e) in a single file.

## 9. Nominations Polymorphism

**Sources:** migration lines 704-742 (table definition + CHECK), lines 298-378 (`validate_nomination` trigger), supabaseAdminClient.ts:172-180 (existing client-side workaround).

### Exact constraint (migration line 741)

```sql
CHECK (num_nonnulls(candidate_id, organization_id, faction_id, alliance_id) = 1)
```

**Exactly ONE of the four entity FKs must be non-null.** Sending more than one → violation. Sending zero → violation.

### `entity_type` is a GENERATED column (lines 724-731)

```sql
entity_type public.entity_type NOT NULL GENERATED ALWAYS AS (
  CASE
    WHEN candidate_id IS NOT NULL THEN 'candidate'::public.entity_type
    WHEN organization_id IS NOT NULL THEN 'organization'::public.entity_type
    WHEN faction_id IS NOT NULL THEN 'faction'::public.entity_type
    WHEN alliance_id IS NOT NULL THEN 'alliance'::public.entity_type
  END
) STORED
```

Generators MUST NOT emit `entity_type` for nominations. It's listed in `skip_columns` (migration line 2617) for a reason.

### Hierarchy rules (`validate_nomination` trigger, lines 298-378)

1. `alliance` nominations — no parent allowed. Top-level.
2. `organization` nominations — parent must be `alliance` (or none for standalone).
3. `faction` nominations — parent MUST be `organization` (required; faction cannot be top-level).
4. `candidate` nominations — parent must be `organization` or `faction` (or none for standalone).

### Parent consistency (lines 360-373)

If `parent_nomination_id` is set, the child's `election_id`, `constituency_id`, and `election_round` MUST match the parent's. Otherwise: `RAISE EXCEPTION 'Nomination election_id must match parent...'`.

### Existing client-side workaround (supabaseAdminClient.ts:172-180)

```ts
// Nominations are polymorphic: only one entity FK allowed (candidate OR organization).
// When a candidate nomination has an 'organization' field (the candidate's party),
// strip it to avoid check constraint violation. But for organization nominations
// (no 'candidate' field), keep 'organization' as it's the nominated entity.
const isNomination = tableName === 'nominations';
const hasCandidateRef = isNomination && ('candidate' in record || 'candidateExternalId' in record);
// ...
if (isNomination && key === 'organization' && hasCandidateRef) continue;
```

This means existing call sites emit BOTH `candidate` and `organization` on candidate nominations (treating `organization` as the candidate's party), and the client strips the redundant `organization`. Generators for Phase 56 should follow the same convention OR emit only the one authoritative FK ref and drop the redundancy.

**Recommendation (cleaner):** generator emits ONLY the authoritative entity ref (e.g. candidate nominations have `candidate: {external_id: ...}`, no `organization`; party/list nominations have `organization: {external_id: ...}`). The party-candidate relationship is already expressed via `candidates.organization_id`. Drop the workaround in the dev-seed split since we control the emission side.

### Generator emission shape per nomination type

**Candidate nomination (primary case):**
```ts
{
  external_id: 'seed_nom_cand_0001',
  project_id: ctx.projectId,
  candidate: { external_id: 'seed_cand_0001' },
  election: { external_id: 'seed_election_01' },
  constituency: { external_id: 'seed_con_01' },
  election_round: 1,
  election_symbol: '42',
  parent_nomination: { external_id: 'seed_nom_org_0001' }  // optional: if nested under a party nomination
}
```

**Organization/party list nomination:**
```ts
{
  external_id: 'seed_nom_org_0001',
  project_id: ctx.projectId,
  organization: { external_id: 'seed_party_01' },
  election: { external_id: 'seed_election_01' },
  constituency: { external_id: 'seed_con_01' },
  election_round: 1,
  parent_nomination: { external_id: 'seed_nom_alliance_0001' }  // optional: if nested under an alliance
}
```

**Faction nomination (child of organization only):**
```ts
{
  external_id: 'seed_nom_fac_0001',
  project_id: ctx.projectId,
  faction: { external_id: 'seed_faction_01' },
  election: { external_id: 'seed_election_01' },
  constituency: { external_id: 'seed_con_01' },
  election_round: 1,
  parent_nomination: { external_id: 'seed_nom_org_0001' }  // REQUIRED — faction can't be top-level
}
```

**Alliance nomination (top-level only, no parent):**
```ts
{
  external_id: 'seed_nom_alliance_0001',
  project_id: ctx.projectId,
  alliance: { external_id: 'seed_alliance_01' },
  election: { external_id: 'seed_election_01' },
  constituency: { external_id: 'seed_con_01' },
  election_round: 1
  // NO parent_nomination
}
```

### GEN-08 referential integrity (in-memory client-side)

Per D-07.3, ctx carries a prior-entity ref map. Nomination generator runs AFTER candidates, organizations, factions, alliances, elections, constituencies (per D-06 topo order), so `ctx.refs` has all the referenced entities. The generator should assert every referenced entity is in `ctx.refs` before emitting the row — any miss throws client-side with a clear error before bulk_import is called. This catches bugs that would otherwise surface as `resolve_external_ref` exceptions deep in PL/pgSQL.

## Runtime State Inventory

Phase 56 is a new-package greenfield phase with no rename or migration. Existing systems are left intact. The one touch-point is the SupabaseAdminClient SPLIT (D-24) — not a rename.

| Category | Items Found | Action Required |
|----------|-------------|------------------|
| Stored data | None — this phase ships no schema changes and no data writes beyond test fixtures. Generators' output lands in a fresh / reset local Supabase. | None |
| Live service config | None — no external services configured. Local Supabase only. | None |
| OS-registered state | None. | None |
| Secrets/env vars | `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` — READ by writer per NF-02. Same names as existing `tests/tests/utils/supabaseAdminClient.ts:31,37`. No rename. | None (keys unchanged; D-15 just adds a pre-flight check) |
| Build artifacts | `tests/tests/utils/supabaseAdminClient.ts` — rewritten (not renamed) per D-24 to re-export + extend `@openvaa/dev-seed`'s base. Existing `.egg-info`/`node_modules` references to the original file survive because path stays identical. | None (import path preserved by design) |

**Per §7 "Correction to D-24":** the one additional touchpoint — `@openvaa/dev-seed` must be added to root `package.json` devDependencies (not to a tests-workspace that doesn't exist). **This is a one-line diff** and is already captured as a known planner note.

## Common Pitfalls

### Pitfall 1: Emitting fields bulk_import can't accept
**What goes wrong:** generator emits `_constituencyGroups` / `answersByExternalId` and the writer forgets to strip them before calling `bulk_import`. RPC errors with `column "_constituencyGroups" does not exist`.
**How to avoid:** writer calls `bulkImport` (which strips) rather than raw `client.rpc('bulk_import', {...})`. The dev-seed base already has this logic (supabaseAdminClient.ts:160-192).
**Warning signs:** `column "X" does not exist` errors at RPC time.

### Pitfall 2: Sending `id` / `entity_type` on nominations
**What goes wrong:** generator auto-fills `id` as a UUID or emits `entity_type: 'candidate'`. DB rejects (`entity_type` is generated; `id` is skipped but also unintended).
**How to avoid:** generators return `TablesInsert<'X'>` — TS prevents required id. For `entity_type`, omit it from the nomination generator entirely.

### Pitfall 3: Nomination referencing candidate & organization together
**What goes wrong:** generator emits candidate nomination with redundant `organization` ref; CHECK `num_nonnulls(candidate_id, organization_id, ...) = 1` fires.
**How to avoid:** per §9, emit ONLY the authoritative entity ref. Drop the existing "emit both, client strips" workaround in dev-seed.

### Pitfall 4: Non-determinism from shared faker state
**What goes wrong:** tests import module-level faker, each test mutates seed, vitest runs tests in parallel, output varies.
**How to avoid:** Pattern A in §5 — construct `new Faker({ locale: [en], seed })` per pipeline run. Every unit test makes its own ctx with its own Faker instance.

### Pitfall 5: `app_settings` UNIQUE-on-project_id conflict with seed.sql
**What goes wrong:** seed.sql inserts app_settings with external_id NULL. Generator emits app_settings with external_id='seed_appsettings'. `bulk_import`'s ON CONFLICT is `(project_id, external_id) WHERE external_id IS NOT NULL` — does NOT match the seed.sql row. Postgres falls through to the UNIQUE(project_id) constraint and raises.
**How to avoid:** Option (a, recommended): route app_settings through `updateAppSettings` (direct merge), not `bulk_import`. Treats app_settings like feedback — outside bulk_import path. Option (b): writer DELETEs the seed.sql app_settings row before bulk_import. Option (a) is less invasive.
**Warning signs:** `duplicate key value violates unique constraint "app_settings_project_id_key"`.

### Pitfall 6: Turborepo skipping tests silently
**What goes wrong:** package has `vitest.config.ts` but no `test:unit` script. `yarn test:unit:watch` runs tests, but CI `yarn test:unit` does not — regression passes CI.
**How to avoid:** per §8, add BOTH `vitest.config.ts` and `"test:unit": "vitest run"` in package.json.

### Pitfall 7: Generator running before its ctx.refs is populated
**What goes wrong:** nomination generator runs before candidate generator (wrong topo order), ctx.refs.candidates is empty, every nomination references a non-existent candidate, `resolve_external_ref` aborts the whole RPC.
**How to avoid:** pipeline.ts executes generators in D-06 fixed order. Add an assertion in nomination generator that `ctx.refs.candidates.length > 0` (if templates request candidate nominations).

## Code Examples

### Minimal generator skeleton (D-26 pattern)

```ts
// packages/dev-seed/src/generators/candidateGenerator.ts
import type { TablesInsert } from '@openvaa/supabase-types';
import type { Ctx } from '../types';

export type CandidateFragment = {
  count?: number;
  fixed?: Array<Partial<TablesInsert<'candidates'>> & { external_id: string }>;
};

export class CandidateGenerator {
  constructor(private ctx: Ctx) {}

  defaults(): CandidateFragment {
    return { count: 5 };
  }

  generate(fragment: CandidateFragment): Array<TablesInsert<'candidates'>> {
    const merged = { ...this.defaults(), ...fragment };
    const { faker, projectId, externalIdPrefix, refs } = this.ctx;
    const rows: Array<TablesInsert<'candidates'>> = [];

    for (const fixed of merged.fixed ?? []) {
      rows.push({
        ...fixed,
        external_id: `${externalIdPrefix}${fixed.external_id}`,
        project_id: projectId
      });
    }

    for (let i = 0; i < (merged.count ?? 0); i++) {
      const party = refs.organizations[i % refs.organizations.length];
      rows.push({
        external_id: `${externalIdPrefix}cand_${String(i).padStart(4, '0')}`,
        project_id: projectId,
        first_name: faker.person.firstName(),
        last_name: faker.person.lastName(),
        // Ref passed through bulk_import's relationship resolver:
        // @ts-expect-error — bulk_import accepts {external_id: "..."} in lieu of FK column
        organization: { external_id: party.external_id }
      });
    }

    return rows;
  }
}
```

### Pipeline integration (D-25 + D-26 bridge)

```ts
// packages/dev-seed/src/pipeline.ts
import { CandidateGenerator } from './generators/candidateGenerator';
import type { Template, Overrides, Ctx } from './types';

const TOPO_ORDER = [
  'elections', 'constituency_groups', 'constituencies',
  'organizations', 'alliances', 'factions', 'candidates',
  'question_categories', 'questions', 'nominations', 'app_settings'
] as const;

export async function runPipeline(template: Template, overrides: Overrides = {}): Promise<Record<string, unknown[]>> {
  const ctx = buildCtx(template);
  const output: Record<string, unknown[]> = {};

  for (const table of TOPO_ORDER) {
    const gen = buildGenerator(table, ctx);
    const fragment = template[table] ?? {};
    // D-25 public signature + D-26 bridge:
    output[table] = overrides[table]?.(fragment, ctx) ?? gen.generate(fragment);
    // D-07 refs populated for downstream generators:
    ctx.refs[table] = output[table].map((r: any) => ({ external_id: r.external_id }));
  }

  return output;
}
```

### Writer with env-var pre-flight (D-15)

```ts
// packages/dev-seed/src/writer.ts
import { SupabaseAdminClient } from './supabaseAdminClient';

export class Writer {
  private client: SupabaseAdminClient;

  constructor() {
    if (!process.env.SUPABASE_URL) {
      throw new Error('SUPABASE_URL env var is required but not set. Did you forget to run `supabase start`?');
    }
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('SUPABASE_SERVICE_ROLE_KEY env var is required but not set.');
    }
    this.client = new SupabaseAdminClient();
  }

  /**
   * Executes the three-pass write sequence.
   * Rolls back via bulk_import's single-transaction guarantee (migration line 2715 SECURITY INVOKER).
   * Per D-12: a mid-collection FK / constraint violation aborts the RPC and nothing commits.
   * importAnswers and linkJoinTables run in separate transactions; failures there leave bulk_import rows
   * committed — documented in callers' JSDoc.
   */
  async write(data: Record<string, unknown[]>): Promise<void> {
    const bulkData = { ...data };
    // Route tables not in bulk_import's processing_order elsewhere:
    delete bulkData.feedback;
    delete bulkData.accounts;
    delete bulkData.projects;
    // (join tables are never emitted at top level by generators)

    await this.client.bulkImport(bulkData);
    await this.client.importAnswers(bulkData);
    await this.client.linkJoinTables(bulkData);

    // Direct paths per D-11:
    if (data.feedback) await this.upsertFeedback(data.feedback);
    if (data.app_settings) await this.upsertAppSettings(data.app_settings);
  }

  // ... private helpers
}
```

### zod template schema + field-pointing errors (TMPL-01, TMPL-09)

```ts
// packages/dev-seed/src/template/schema.ts
import { z } from 'zod';

const perEntityFragment = z.object({
  count: z.number().int().nonnegative().optional(),
  fixed: z.array(z.record(z.string(), z.unknown())).optional()
}).optional();

export const TemplateSchema = z.object({
  seed: z.number().int().optional(),
  externalIdPrefix: z.string().optional(),
  projectId: z.string().uuid().optional(),
  elections: perEntityFragment,
  constituency_groups: perEntityFragment,
  constituencies: perEntityFragment,
  organizations: perEntityFragment,
  alliances: perEntityFragment,
  factions: perEntityFragment,
  candidates: perEntityFragment,
  question_categories: perEntityFragment,
  questions: perEntityFragment,
  nominations: perEntityFragment,
  app_settings: perEntityFragment,
  feedback: perEntityFragment
});

export type Template = z.infer<typeof TemplateSchema>;

export function validateTemplate(input: unknown): Template {
  const result = TemplateSchema.safeParse(input);
  if (result.success) return result.data;
  const msg = result.error.issues
    .map(iss => `  template.${iss.path.join('.')}: ${iss.message}`)
    .join('\n');
  throw new Error(`Template validation failed:\n${msg}`);
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `tests/seed-test-data.ts` + hand-maintained JSON fixtures | Template-driven generator in `@openvaa/dev-seed` | v2.5 (now) | Fixtures retire in Phase 59 |
| SupabaseAdminClient in `tests/utils/` | Split: dev-seed base + tests/ auth/E2E shell | This phase (D-24) | Tests workspace imports base from dev-seed |
| Hand-written row shapes | `TablesInsert<'X'>` from `@openvaa/supabase-types` | Already established | Generators are strictly typed |
| Module-level faker default instance | Per-run `new Faker({seed})` on ctx | This phase (D-07) | Deterministic tests, no shared state |
| zod v3 `.merge()` | zod v4 `.extend()` | Catalog already on `^4.3.6` | Use `.extend()` for Phase 57/58 schema extensions |

**Deprecated/outdated:** None — all building blocks (bulk_import, importAnswers, linkJoinTables, supabase-types, faker catalog, zod catalog) are current and in use.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `ctx.refs.accounts` and `ctx.refs.projects` pre-populated from seed.sql bootstrap | §4.1-4.2 | Generators referencing accounts/projects throw; mitigation: verify at ctx construction |
| A2 | Emitting `app_settings` through `updateAppSettings` rather than `bulk_import` avoids the UNIQUE(project_id) conflict | §4.15, Pitfall 5 | If chosen wrong, first `yarn dev:reset-with-data` run after seed.sql fails with UNIQUE violation; planner should surface this to discuss-phase before locking |
| A3 | zod v4's `.error.issues[].path` semantics match the codebase's existing zod usage (question-info, argument-condensation) | §6 | Error messages may need minor reformatting; low risk because v4 is already installed |
| A4 | Faker 8.4.1's `new Faker({ locale: [en], seed })` constructor produces the same deterministic sequence across runs | §5 | Determinism unit test would catch this immediately; trivial fix if constructor-seed doesn't work (call `.seed()` after construction) |

**Table A2 is the critical one** — it's a decision between two architectural paths for app_settings writes, and if taken wrong, every `dev:reset-with-data` run fails on first try. Planner should either lock this via discuss-phase OR include both paths in the plan with a clear selection gate.

## Open Questions (RESOLVED)

All four questions below were resolved into locked plan tasks before the plan-checker ran. Recommendations adopted verbatim.

1. **Should the generator for `app_settings` be a stub or a full generator?** — **RESOLVED: stub that returns `[]` for empty templates; writer routes any `fixed[]` rows through `updateAppSettings` (direct JSONB merge) — NOT through `bulk_import`.**
   - What we know: seed.sql already inserts one app_settings row per project. bulk_import's ON CONFLICT rule can't match it.
   - What's unclear: whether the Phase 56 scope includes setting any non-empty app_settings values (e.g., default localized strings), or whether the generator just returns `[]` (no-op) and Phase 58 handles it.
   - Recommendation (adopted — see Plan 05 AppSettingsGenerator + Plan 07 writer routing): Phase 56 generator returns `[]` for empty templates + runs `updateAppSettings` for non-empty `fixed[]` rows. Simplest path that honors D-11.

2. **Does the split admin client need a "read-only" base vs. a "write" base?** — **RESOLVED: write-only base in Phase 56. No read surface ported.**
   - What we know: D-24 lists bulkImport, bulkDelete, importAnswers, linkJoinTables, updateAppSettings — all write ops.
   - What's unclear: `findData`, `query`, `update` on the current client are read/update ops used by E2E assertions. Does dev-seed need ANY read surface for the pipeline to pre-validate refs (e.g., confirm seed.sql bootstrap rows exist)?
   - Recommendation (adopted — see Plan 02 base class): start with write-only surface. If the pipeline needs reads (e.g., to assert the bootstrap project exists before seeding), add a narrow `getBootstrapRefs()` method — don't port the full `findData`.

3. **Does the feedback generator ship in Phase 56 at all?** — **RESOLVED: stub generator that returns `[]` when `count` is 0 (default); writer skips feedback writes in Phase 56 and logs a warning if `fixed[]` rows are supplied.** See ISS-02 amendment to CONTEXT.md D-11 below for the companion decision update.
   - CONTEXT.md Claude's Discretion item. Feedback has no external_id, can't be idempotently re-seeded, has no test/demo value.
   - Recommendation (adopted — see Plan 05 FeedbackGenerator + Plan 07 writer): scope out (empty generator that returns `[]`). Phase 58/59 can add it if demo use surfaces. Reduces surface area of Phase 56 and of the writer's direct-upsert special casing.

4. **What does `ctx.answerEmitter` look like at the type level for Phase 57 handshake?** — **RESOLVED: the `AnswerEmitter` type below is defined in `packages/dev-seed/src/types.ts` and exported from the barrel `src/index.ts`. Phase 57 imports this type and supplies a latent-factor implementation.**
   - D-27 says "single function pointer, no interface." But Phase 57 needs to know the signature to implement the latent model.
   - Recommendation (adopted — see Plan 03 types.ts): define in Phase 56 as:
     ```ts
     type AnswerEmitter = (
       candidate: TablesInsert<'candidates'>,
       questions: Array<TablesInsert<'questions'>>,
       ctx: Ctx
     ) => Record<string /* question external_id */, { value: unknown; info?: unknown }>;
     ```
     This locks the seam and lets Phase 57 drop in a latent-factor implementation with no ctx changes.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| `@faker-js/faker` | Generator RNG | ✓ (catalog) | ^8.4.1 | — |
| `zod` | Template schema | ✓ (catalog) | ^4.3.6 | — |
| `@supabase/supabase-js` | Service-role client | ✓ (catalog) | ^2.49.4 | — |
| `tsx` | Test + script runner | ✓ (catalog) | ^4.19.2 | — |
| `vitest` | Unit tests | ✓ (catalog) | ^3.2.4 | — |
| `@openvaa/supabase-types` | Row types | ✓ (workspace:^) | 0.1.0 | — |
| Local Supabase | Writer execution target | — | — | Phase 56 tests don't require it (D-22 pure I/O); Phase 58 integration test will |
| Node.js ≥ 22 | Runtime | ✓ (engines) | 22 | — |

**Nothing missing; everything needed is in the catalog or already a workspace dep.**

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | vitest ^3.2.4 (catalog) |
| Config file | `packages/dev-seed/vitest.config.ts` (empty marker) + root `vitest.workspace.ts` |
| Quick run command | `yarn workspace @openvaa/dev-seed test:unit` |
| Full suite command | `yarn test:unit` (runs Turborepo across all packages+apps) |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| GEN-01 | 16 generator modules return typed rows | unit | `vitest run tests/*Generator.test.ts` | ❌ Wave 0 |
| GEN-02 | Rows are typed via `@openvaa/supabase-types` | typecheck + unit | `tsc --noEmit && vitest` | ❌ Wave 0 |
| GEN-03 | Override map fully replaces built-in | unit | `vitest run tests/pipeline.test.ts -t "override"` | ❌ Wave 0 |
| GEN-04 | `external_id` carries configurable prefix | unit (per generator) | `vitest run tests/*Generator.test.ts -t "prefix"` | ❌ Wave 0 |
| GEN-07 | Answer stub emits shape-valid per question type | unit | `vitest run tests/candidateGenerator.test.ts -t "answers"` | ❌ Wave 0 |
| GEN-08 | Nominations have referential integrity | unit | `vitest run tests/nominationGenerator.test.ts` | ❌ Wave 0 |
| TMPL-01 | Single `Template` TS type covers all entities | typecheck | `tsc --noEmit` | ❌ Wave 0 |
| TMPL-02 | `{}` template produces valid row-set | unit | `vitest run tests/pipeline.test.ts -t "empty template"` | ❌ Wave 0 |
| TMPL-08 | Seed produces deterministic output | unit | `vitest run tests/determinism.test.ts` | ❌ Wave 0 |
| TMPL-09 | Validation errors include field path | unit | `vitest run tests/template.test.ts -t "error"` | ❌ Wave 0 |
| NF-02 | Writer fails loudly without env vars | unit (mocked) | `vitest run tests/writer.test.ts -t "env"` | ❌ Wave 0 |
| NF-03 | No `any` in public surface | typecheck + lint | `tsc --noEmit && eslint src/` | ❌ Wave 0 |
| NF-05 | Rollback on partial insert documented in JSDoc | grep-review | manual code review | ❌ Wave 0 |
| DX-02 | Each generator has unit tests | file-existence | `ls tests/*Generator.test.ts` | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `yarn workspace @openvaa/dev-seed test:unit` (fast; no DB)
- **Per wave merge:** `yarn test:unit` (full monorepo)
- **Phase gate:** Full suite green + `yarn lint:check` + `yarn format:check` + typecheck before `/gsd-verify-work`

### Wave 0 Gaps

All test infrastructure is greenfield for `@openvaa/dev-seed`:

- [ ] `packages/dev-seed/package.json` with `test:unit` script + deps
- [ ] `packages/dev-seed/tsconfig.json` with shared-config extension + supabase-types project ref
- [ ] `packages/dev-seed/vitest.config.ts` (empty marker for root workspace discovery)
- [ ] `packages/dev-seed/tests/` directory for test files (one per generator + writer + pipeline + determinism)
- [ ] No framework install needed — `vitest` is already in catalog, inherits via devDependencies

## Project Constraints (from CLAUDE.md)

Relevant CLAUDE.md directives the planner must honor:

- **Turborepo cached builds:** new package must declare `build` / `lint` / `typecheck` / `test:unit` scripts so Turborepo's task graph works. D-28 confirms `build` is a no-op.
- **TypeScript project references:** add `references` to `@openvaa/supabase-types` in tsconfig.json. CLAUDE.md: "You don't need to build dependencies for IDE to resolve imports" — only if references are declared.
- **Never `any` in public surface (NF-03 + CLAUDE.md):** use `TablesInsert<'X'>` for generator return types; `Record<string, unknown>` is acceptable for opaque JSONB payloads in tests.
- **Yarn 4 workspace pattern:** dependencies use `"@openvaa/core": "workspace:^"` + TypeScript references. Catalog deps use `"catalog:"`.
- **`MISSING_VALUE` usage:** Phase 56 random-valid stub does NOT use `MISSING_VALUE` per D-19. Phase 57 will.
- **Accessibility / WCAG 2.1 AA:** N/A — dev-seed has no UI surface.
- **Code Review Checklist:** final verify-work step should spot-check against `docs/code-review-checklist.md` / `.agents/code-review-checklist.md`.

## Sources

### Primary (HIGH confidence)
- `apps/supabase/supabase/migrations/00001_initial_schema.sql` — single-file schema + RPC definitions (lines cited inline)
- `tests/tests/utils/supabaseAdminClient.ts` — full admin client surface
- `packages/supabase-types/src/index.ts`, `column-map.ts`, `database.ts` — row type generics + enums + maps
- `packages/dev-tools/package.json` + `tsconfig.json` — D-28 template for dev-seed shape
- `packages/matching/package.json` + `vitest.config.ts` — §8 vitest workspace pattern
- `vitest.workspace.ts`, `turbo.json`, `.yarnrc.yml`, root `package.json` — §7 wiring
- `apps/supabase/supabase/seed.sql` — bootstrap refs for ctx

### Secondary (MEDIUM confidence — cross-verified with official docs)
- [Faker.js constructor + seed docs](https://fakerjs.dev/api/faker) — §5 Pattern A confirmed against v8 docs
- [Zod v4 migration guide](https://zod.dev/v4/changelog) — §6 `.extend()` over `.merge()` confirmed
- [Zod error issues + path](https://zod.dev/error-customization) — §6 `error.issues[].path` confirmed

### Tertiary (LOW confidence — none)
No unverified web-search-only claims in this research.

## Metadata

**Confidence breakdown:**
- `bulk_import` RPC contract: HIGH — read verbatim from migration file
- Row shapes (16 tables): HIGH — read verbatim from migration + database.ts
- `importAnswers` / `linkJoinTables` contracts: HIGH — read verbatim from supabaseAdminClient.ts
- Faker seeded instance pattern: HIGH — confirmed via official docs + existing faker 8.4.1 in catalog
- Zod patterns: MEDIUM — confirmed v4 API via official docs; existing codebase usage (question-info, argument-condensation) still uses patterns compatible with both v3/v4
- Turborepo/Vitest wiring: HIGH — read from existing configs and package shapes
- Nominations polymorphism: HIGH — migration + existing workaround both read verbatim
- app_settings UNIQUE conflict (A2): MEDIUM — deduced from migration + bulk_import SQL; not tested live. Suggest planner confirm via a dry-run or surface to discuss-phase.

**Research date:** 2026-04-22
**Valid until:** 2026-05-22 (30 days — stable internal codebase; only risk is migration SQL drift, which would require regenerating `@openvaa/supabase-types`)

## RESEARCH COMPLETE
