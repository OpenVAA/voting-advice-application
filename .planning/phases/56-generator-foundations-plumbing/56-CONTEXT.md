# Phase 56: Generator Foundations & Plumbing - Context

**Gathered:** 2026-04-22
**Status:** Ready for planning

<domain>
## Phase Boundary

Scaffold per-entity row generators and the write-path plumbing for a new
`@openvaa/dev-seed` package. Deliverables:

- One generator module per non-system public table (16 entities)
- A seeded-faker + project/ref-aware generator context
- A full-replace override hook matching GEN-03 verbatim
- The core template TypeScript type + runtime validator
- A writer that bulk-upserts generator output through the existing
  `bulk_import` RPC + `importAnswers` + `linkJoinTables`
- Per-generator unit tests, pure input/output

Explicitly **out of scope** for this phase (later phases in the milestone):
- Latent-factor / PCA-inspired candidate answer model → Phase 57
- Built-in `default` / `e2e` templates → Phase 58
- CLI surface (`seed`, `seed:teardown`, `dev:reset-with-data`) → Phase 58
- Portrait seeding → Phase 58
- `generateTranslationsForAllLocales` wiring → Phase 58
- Rewriting `tests/seed-test-data.ts` on top of the generator → Phase 59
- Deleting legacy JSON fixtures → Phase 59

Carried forward from milestone-level context (no re-asking):
- Row types sourced from `@openvaa/supabase-types` (no hand-redeclared shapes)
- `@faker-js/faker` (catalog) for RNG
- Service-role key via `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` env
- Non-system public tables only (see Success Criterion 1)
- `apps/supabase/supabase/seed.sql` bootstrap (accounts + projects + storage_config)
  is left intact; the generator layers on top
- `bulk_import` / `bulk_delete` SQL RPCs already exist — reuse, do not reimplement

</domain>

<decisions>
## Implementation Decisions

### Package & Workspace
- **D-01:** Seeder ships as a new package, **`@openvaa/dev-seed`**, not an extension
  of `@openvaa/dev-tools`. This overrides the prior STATE.md note
  ("the seeder extends `@openvaa/dev-tools` rather than starting a new package").
  Rationale: keeps maintainer CLIs (keygen, pem-to-jwk) separate from data seeding;
  clean workspace boundary; independent release cadence if ever needed.
- **D-02:** Forward-looking naming convention for Phase 58 CLI work: **all
  seed-related scripts in the root `package.json` use the `dev:foo` namespace**
  (e.g. `dev:seed`, `dev:seed:teardown`, `dev:reset-with-data`). Consistent with
  existing `dev:start` / `dev:stop` / `dev:reset` / `dev:status`. Not implemented
  in Phase 56 — captured here so Phase 58 does not re-ask.
- **D-03:** Downstream docs referencing `@openvaa/dev-tools` as the seeder home
  are stale and must be updated: REQUIREMENTS.md (GEN-05, GEN-10, CLI-01/02/03,
  DX-04), ROADMAP.md phase descriptions, PROJECT.md "Target features" bullet.
  Sync can happen alongside Phase 56 plan execution or in a small
  docs-housekeeping commit before planning.

### Generator Shape (GEN-01, GEN-02, GEN-03)
- **D-04:** Each built-in generator is a **class with a `generate(fragment, ctx)`
  method** returning `Rows[]` typed against `@openvaa/supabase-types`.
  Leaves room for sibling methods (`defaults()`, `validate()`) without forcing
  the override surface to care about them.
- **D-05:** The **override map shape is a bare function per GEN-03**:
  `{ [table]: (fragment, ctx) => Rows[] }`. The pipeline resolves each entity as
  `overrides[table]?.(fragment, ctx) ?? builtIn.generate(fragment, ctx)`.
  Overrides **fully replace** built-in output (no transform / post-hook shape
  in Phase 56 — users compose manually if they need partial tweaks).
- **D-06:** The **full-graph seeder uses a fixed topological order**, mirroring
  `bulk_import`'s `processing_order`: elections → constituency_groups →
  constituencies → organizations → alliances → factions → candidates →
  question_categories → questions → nominations → app_settings, with
  `accounts` / `projects` as ctx-only pass-through (bootstrap refs) and
  `feedback` + join tables wired after the main pass.

### Generator Context (`ctx`)
- **D-07:** Context object passed to every generator carries:
  1. A **single seeded `@faker-js/faker` instance** seeded once from
     `template.seed` at pipeline start. Enables TMPL-08 (deterministic output)
     without each generator opting in.
  2. **`projectId`** (default: `TEST_PROJECT_ID` from seed.sql) and
     **`externalIdPrefix`** (default: `seed_` per GEN-04) — resolved once,
     read by every generator. No generator reaches into env directly.
  3. A **prior-entity ref map** (`{ organizations: [...], constituencies: [...],
     ... }`) populated as generators run in topo order. Candidates pick a party
     from `ctx.refs.organizations`; nominations wire candidate × election ×
     constituency from the map. Enforces GEN-08 referential integrity in memory
     before the writer is called.
  4. A **shared logger / warnings sink** so unit tests can assert generator
     emissions and Phase 58's CLI can print a per-run summary (CLI-05).

### Smart Defaults (TMPL-02)
- **D-08:** Each generator class exposes a **`defaults(ctx): Fragment` method**
  returning the fragment it uses when the template doesn't supply one. At
  runtime, `resolveFragment(template, ctx)` merges explicit template input over
  `generator.defaults(ctx)`. Smart defaults stay co-located with the generator
  that owns them — no central defaults table to keep in sync with the schema.

### Bulk-Write Path (NF-01, NF-05)
- **D-09:** **Reuse the existing `bulk_import` RPC** for the main insert pass —
  it already handles dependency ordering + upsert-by-external_id + relationship
  resolution + ref validation, all in a single PL/pgSQL transaction. No new
  SQL surface in Phase 56.
- **D-10:** Answers JSONB population and M:N join tables reuse the existing
  **`importAnswers` + `linkJoinTables`** helpers on `SupabaseAdminClient`.
  Generators emit candidates with `answersByExternalId` and elections /
  constituency_groups / question_categories with `_constituencyGroups` /
  `_constituencies` / `_elections` ref objects; the helpers resolve external_id
  → UUID post-insert. No duplication of this logic in Phase 56.
- **D-11:** Tables `bulk_import` does not accept (`accounts`, `projects`,
  `feedback`, `constituency_group_constituencies`, `election_constituency_groups`)
  are handled as follows:
  - `accounts`, `projects` — generators return bootstrap refs from seed.sql;
    no writes from dev-seed. The refs flow into `ctx.refs` for downstream
    generators.
  - `feedback` — direct `.upsert()` in the writer (not bulk_import).
  - Join tables — wired via `linkJoinTables`.
- **D-12:** NF-05 "rollback on partial insert" semantics: **lean on
  `bulk_import`'s single-transaction behavior** — a mid-collection FK or
  constraint violation aborts the RPC and nothing commits. Document this
  behavior explicitly in the writer's JSDoc; do not add an independent
  rollback layer. Generators additionally build the full ref graph in memory
  before the first RPC call, so orphan-FK errors are caught client-side in
  the common case.

### SupabaseAdminClient Home (GEN-05)
- **D-13:** **Move `SupabaseAdminClient` from `tests/tests/utils/` to
  `@openvaa/dev-seed`** (new location: `packages/dev-seed/src/supabaseAdminClient.ts`
  or similar, planner's call). `tests/` imports it from `@openvaa/dev-seed`
  going forward. This is the **provisional Phase 56 pick**; E2E-04 in Phase 59
  may revisit based on the final dependency graph.
- **D-14:** Adding `@supabase/supabase-js` and `@openvaa/supabase-types` as
  `@openvaa/dev-seed` dependencies is implied by D-13.

### Environment-Variable Enforcement (Success Criterion 6)
- **D-15:** "Fails loudly when `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY`
  are missing" is enforced at the **writer constructor / pre-flight**, not at
  module import. Pure generators remain independent of env so
  `yarn test:unit` does not require env fixture. Covered by a writer-level
  unit test that sets env to `undefined` and asserts a descriptive throw.

### Template Schema & Validator (TMPL-01, TMPL-02, TMPL-08, TMPL-09)
- **D-16:** **Schema + validator built with `zod`** (already in Yarn catalog —
  no new catalog entry). Field-pointing error messages come from
  `.error.issues[].path` and satisfy TMPL-09 without hand-maintenance. TS
  types are derived via `z.infer<>`.
- **D-17:** Template types live in `@openvaa/dev-seed` under
  `src/template/types.ts` (or planner-chosen layout). Consumers
  `import type {Template} from '@openvaa/dev-seed'`.
- **D-18:** **Phase 56 ships a minimal core schema** covering:
  top-level `seed?: number`, `externalIdPrefix?: string`, `projectId?: string`,
  and per-entity `{ count?: number, fixed?: RowFragment[] }` shape.
  Phase 57 extends with the `latent: { dimensions, centroids, spread,
  loadings, noise }` block via `.extend()`. Phase 58 adds
  `generateTranslationsForAllLocales`, portrait config, and full `default` /
  `e2e` template fields. Every Phase 56 field is `.optional()` — a `{}`
  template must produce a valid row-set.

### Stub Answer Behavior (GEN-07 stub — the real model is Phase 57)
- **D-19:** In Phase 56, the candidate-answers stub emits a **random valid
  value per question**: uniform random Likert score / random categorical
  choice / etc., picked from the seeded faker. This exercises the full
  pipeline end-to-end (`bulk_import` → `importAnswers` → matching render)
  before Phase 57 replaces it with the latent-factor model.
- **D-20:** Categorical-question subdimension handling: **the generator emits
  shape-valid answers only**; subdimension projection logic lives entirely in
  `@openvaa/matching`. The generator does not need to understand subdimensions
  in Phase 56.
- **D-21:** **Note for Phase 57 planner** — the distribution-aware answer
  generator can fall back to random-valid-choice for categorical questions
  when no explicit loading / choice mapping is supplied, mirroring the D-19
  stub behavior. Prevents the Phase 57 model from needing categorical-specific
  special cases at v1.

### Testing Strategy (DX-02)
- **D-22:** Per-generator unit tests are **pure input / output, no DB**.
  Each test asserts: (a) row shape matches `@openvaa/supabase-types` for the
  target table; (b) `external_id` prefix is applied; (c) `count` is honored;
  (d) `fixed[]` hand-authored rows pass through unchanged (modulo prefix);
  (e) seeded faker produces deterministic output across runs. Runs under
  `yarn test:unit` via vitest.
- **D-23:** Writer unit test covers env-var enforcement (D-15) and the ctx
  / `bulkImport` call shape with a mocked admin client. Integration testing
  against a real local Supabase is **Phase 58's DX-03** — not required in
  Phase 56.

### Claude's Discretion
- Exact file / directory layout inside `packages/dev-seed/src/` (e.g.
  `generators/`, `template/`, `writer.ts`, `pipeline.ts`) — planner's call.
- Naming of the public entry point (`Seeder`, `seedDatabase`, `runSeeder`, etc.).
- Whether the `ctx` logger is a simple `(msg: string) => void` callback, an
  event emitter, or a console-like object — planner's call based on testing
  needs.
- Whether `feedback` ships in Phase 56 at all or stays a stub module (D-11
  requires a direct `.upsert()` path — planner can scope it as minimal).
- tsup vs tsc build config for the new package — match the closest existing
  workspace (dev-tools is tsx-only; @openvaa/core uses tsup; dev-seed is not
  publish-bound, so tsx is likely sufficient).

### Folded Todos
None — `gsd-sdk todo.match-phase 56` returned zero matches.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents (researcher, planner, executor) MUST read these before
planning or implementing.**

### Milestone Context
- `.planning/ROADMAP.md` §"Phase 56: Generator Foundations & Plumbing" — goal,
  dependencies, success criteria (all 6 must be TRUE at verification)
- `.planning/REQUIREMENTS.md` — GEN-01, GEN-02, GEN-03, GEN-04, GEN-05, GEN-07,
  GEN-08, TMPL-01, TMPL-02, TMPL-08, TMPL-09, NF-01, NF-02, NF-03, NF-05, DX-02
- `.planning/STATE.md` §"Accumulated Context → Decisions" — milestone-level
  locks (scope boundary, faker catalog dep, tests/utils client). Note D-01
  above **overrides** the `@openvaa/dev-tools` line in STATE.md.
- `.planning/PROJECT.md` §"Current Milestone" + "Constraints" — tech stack,
  Turborepo / Yarn 4 workspace constraints, no new deps outside catalog

### Backend Surface (reuse, do not reimplement)
- `apps/supabase/supabase/migrations/00001_initial_schema.sql` §`bulk_import`
  (lines 2735–2806) — RPC signature, processing_order, transactional guarantee,
  collections supported
- `apps/supabase/supabase/migrations/00001_initial_schema.sql` §`bulk_delete`
  (lines 2829–2929) — RPC signature, deletion modes, reverse-dep order
- `apps/supabase/supabase/migrations/00001_initial_schema.sql`
  §`resolve_external_ref` + `_bulk_upsert_record` (lines 2531–2716) — how the
  RPC resolves `{external_id: "..."}` nested refs; generators emit this shape
- `apps/supabase/supabase/migrations/00001_initial_schema.sql`
  §`CREATE TABLE public.*` blocks (lines 383–1020) — authoritative table shapes
  for all 16 non-system public tables
- `apps/supabase/supabase/seed.sql` — bootstrap rows (account, project,
  storage_config) that generators must NOT overwrite

### Row Types & Conventions
- `packages/supabase-types/src/index.ts` — `Tables`, `TablesInsert`,
  `COLUMN_MAP`, `PROPERTY_MAP`, `TABLE_MAP` — source of truth for row types
  and camel/snake mapping
- `packages/supabase-types/src/column-map.ts` — how data-package properties
  map to DB columns (needed when generators emit data-model-shaped fragments)

### Existing Admin Client (being moved to dev-seed)
- `tests/tests/utils/supabaseAdminClient.ts` — full current surface:
  `bulkImport`, `bulkDelete`, `importAnswers`, `linkJoinTables`,
  `updateAppSettings`, `findData`, auth helpers. Moves to `@openvaa/dev-seed`
  per D-13; tests/ imports from the new home.

### Downstream Consumers (do not touch in Phase 56 — phase 59 rewrites)
- `tests/seed-test-data.ts` — current E2E seed script; Phase 59 rewrites it
  on top of dev-seed with the `e2e` template
- `tests/tests/data/default-dataset.json`, `voter-dataset.json`,
  `candidate-addendum.json` — legacy fixtures to delete in Phase 59 after
  parity check

### Data Model & Matching
- `packages/data/src/` — entity hierarchy (Candidate, Organization,
  Question, Election, etc.); generators emit data-model-compatible fragments
- `packages/matching/src/` — subdimension / MISSING_VALUE conventions that
  Phase 57's answer model will adhere to (not required reading for Phase 56
  generators, which emit shape-valid stub answers only)
- `packages/core/src/` — `MISSING_VALUE` constant (not used by the Phase 56
  random-valid stub, but the schema and future latent-factor model will)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **`tests/tests/utils/supabaseAdminClient.ts`** — full bulk-write surface
  already implemented and battle-tested by E2E. Moves to `@openvaa/dev-seed`
  in Phase 56 per D-13 (no rewrite, just relocation + new deps).
- **`bulk_import` / `bulk_delete` SQL RPCs** — dependency-ordered upsert with
  external_id resolution; single-txn rollback; already granted to
  `authenticated` + invoker-RLS. Reused verbatim per D-09.
- **`importAnswers` / `linkJoinTables` on SupabaseAdminClient** — handle the
  two things `bulk_import` doesn't: candidate `answers` JSONB (question
  external_id → UUID resolution) and M:N join tables. Reused per D-10.
- **`@faker-js/faker` in Yarn catalog** — seeded RNG for deterministic runs
  (TMPL-08). Already a root devDependency.
- **`zod` in Yarn catalog** — already used by @openvaa/llm, @openvaa/question-info,
  @openvaa/frontend. Reused per D-16 (no new catalog entry).
- **`@openvaa/supabase-types`** — `Tables`, `TablesInsert`, and the column /
  property maps give us typed row shapes without hand-maintenance.
- **`apps/supabase/supabase/seed.sql`** — bootstrap `TEST_PROJECT_ID`
  (`00000000-0000-0000-0000-000000000001`) already seeded; generators use this
  as the default `projectId` in ctx.

### Established Patterns
- **Workspace dep pattern**: `"@openvaa/supabase-types": "workspace:^"` +
  TypeScript `references` in tsconfig. Follow the same pattern for dev-seed's
  workspace deps.
- **tsx as runner for dev-tools-style packages**: `@openvaa/dev-tools` uses
  tsx scripts directly — dev-seed can follow the same pattern until Phase 58
  adds a real CLI.
- **Turborepo task config**: new package needs `build`, `lint`, `typecheck`,
  `test:unit` tasks to integrate cleanly. Mirror `@openvaa/dev-tools`'s
  `package.json` scripts block as a starting point.
- **Vitest unit tests** are picked up by the root `yarn test:unit` via
  `turbo run test:unit`. No per-package test-runner config needed.

### Integration Points
- **New package**: `packages/dev-seed/` — added to root `workspaces: ["packages/*", ...]`
  automatically.
- **Tests workspace**: currently imports `SupabaseAdminClient` from
  `./tests/utils/supabaseAdminClient`. After D-13 it imports from
  `@openvaa/dev-seed` (add `"@openvaa/dev-seed": "workspace:^"` to tests'
  devDependencies). The old file is deleted in the same phase to avoid two
  copies drifting.
- **Root package.json**: no new scripts in Phase 56 (CLI is Phase 58). The
  `dev:foo` naming convention (D-02) is a forward-looking note.

</code_context>

<specifics>
## Specific Ideas

- **Override call shape must match GEN-03 verbatim** — bare function map
  `{ [table]: (fragment) => Rows }`, even though built-ins are classes. The
  pipeline bridges the two shapes internally.
- **`{}` template is a first-class test case** — a unit test should assert the
  full pipeline accepts `{}` and produces non-empty row output for every
  entity (count default ≥ 1) without throwing.
- **Deterministic seed is load-bearing for downstream** — Phase 57's latent
  model tests will rely on `template.seed` producing stable output, so the
  Phase 56 faker-seeding infrastructure should be exercised by a unit test
  that runs the pipeline twice with `seed: 42` and asserts byte-identical
  row output across runs.
- **Package rename implication** — REQUIREMENTS.md IDs that currently mention
  `@openvaa/dev-tools` (GEN-05, GEN-10, CLI-01, CLI-02, CLI-03, DX-04) need a
  pass to replace with `@openvaa/dev-seed`. This is a doc-sync chore, not a
  Phase 56 implementation task, but the planner should call it out.

</specifics>

<deferred>
## Deferred Ideas

- **Partial / transform override shape** (replace vs transform) — rejected
  in Phase 56 (D-05). If users want to tweak a single field of the built-in
  output, they compose a wrapper themselves. Revisit only if real usage shows
  full-replace is ergonomically painful.
- **Dependency-declared generator nodes** — rejected in Phase 56 (D-06).
  Topo order is stable for the 16 fixed tables. Revisit only if a new entity
  class emerges post-milestone.
- **Phase 56 integration test against real local Supabase** — rejected in
  favor of Phase 58's DX-03. Keeps Phase 56's test surface clean and fast.
- **Extending `bulk_import` RPC to cover accounts/projects/feedback/join-tables** —
  rejected in Phase 56 (D-11). Blast radius is too large for this phase;
  revisit if the pass-through + direct-upsert approach turns out brittle.
- **Schema-wide `.default()` with centralized defaults** — rejected in favor of
  per-generator `defaults()` method (D-08).

</deferred>

---

*Phase: 56-generator-foundations-plumbing*
*Context gathered: 2026-04-22*
