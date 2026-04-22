# Phase 56: Generator Foundations & Plumbing - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-22
**Phase:** 56-generator-foundations-plumbing
**Areas discussed:** Generator shape + override, Bulk-write path + client home, Template schema + validator, Stub answers + testing

---

## Gray Area Selection

| Option | Description | Selected |
|--------|-------------|----------|
| Generator shape + override | How each per-entity generator is authored; what ctx carries; override semantics; full-graph composition for GEN-08. | ✓ |
| Bulk-write path + client home | `bulk_import` RPC vs new writer; rollback semantics; answers/joins; SupabaseAdminClient home. | ✓ |
| Template schema + validator | Zod vs Valibot vs pure TS; types home; smart-defaults strategy; schema scope. | ✓ |
| Stub answers + testing | Answer stub before Phase 57; categorical handling; unit-test shape; env-var enforcement. | ✓ |

**User's choice:** All four areas selected.

---

## Generator shape + override

### Q1: How should each per-entity generator be authored?

| Option | Description | Selected |
|--------|-------------|----------|
| Pure function | `(fragment, ctx) => Rows[]`. Stateless; simple override surface. | |
| Class with generate() | Class with `generate(fragment, ctx)` method; room for `validate()` / `defaults()`. | ✓ |
| Factory returning fn | `makeCandidateGenerator(config) => fn`. Lets built-ins pre-bind constants. | |

**User's choice:** Class with generate()
**Notes:** Leaves room for `defaults()` / `validate()` sibling methods without forcing the override surface to care about them.

### Q2: What should the shared generator context carry?

| Option | Description | Selected |
|--------|-------------|----------|
| Seeded faker instance | Single faker instance seeded from template.seed, passed down. | ✓ |
| project_id + external_id prefix | Resolved once; no env reads inside generators. | ✓ |
| Prior-entity ref map | Downstream generators pick refs from earlier-generated entities; enforces GEN-08 in memory. | ✓ |
| Shared logger / warnings sink | For test assertions and CLI summary output. | ✓ |

**User's choice:** All four (multiSelect).

### Q3: What's the override semantics?

| Option | Description | Selected |
|--------|-------------|----------|
| Full replace only | `{ candidates: fn }` replaces built-in verbatim. | ✓ |
| Replace OR transform | `replace: fn` or `transform: (builtInRows) => Rows[]` — two shapes. | |
| Replace + post-hook | Built-in always runs; override is post-processor. | |

**User's choice:** Full replace only
**Notes:** Matches GEN-03 verbatim. Users who want partial tweaks compose manually.

### Q4: How should the full-graph seeder compose generators for referential integrity (GEN-08)?

| Option | Description | Selected |
|--------|-------------|----------|
| Fixed topo order | Hard-coded pipeline matching `bulk_import` RPC dependency order. | ✓ |
| Dependency-declared nodes | Each generator declares `dependsOn: [...]`; seeder topo-sorts. | |
| Two-pass: rows first, links second | Rows then join-table linking as separate passes. | |

**User's choice:** Fixed topo order

### Reconciliation note
Built-ins are classes with `generate()`, but the override map uses bare functions per GEN-03. Pipeline resolves as `overrides[table]?.(fragment, ctx) ?? builtIn.generate(fragment, ctx)`.

---

## Bulk-write path + client home

### Q1: How should generator output get into the database?

| Option | Description | Selected |
|--------|-------------|----------|
| Reuse bulk_import RPC | Call existing RPC; single-txn server-side; dep-ordered upsert. | ✓ |
| Generator-native writer | New `SeedWriter` in dev-seed with chunked `.upsert()`. Duplicates RPC logic. | |
| Hybrid | `bulk_import` for happy path, direct `.upsert()` for special cases. | |

**User's choice:** Reuse bulk_import RPC

### Q2: What should 'fails cleanly and rolls back on partial insert' (NF-05) actually mean here?

| Option | Description | Selected |
|--------|-------------|----------|
| Rely on bulk_import's single-txn behavior | RPC aborts on any error; nothing commits. Document explicitly. | ✓ |
| Generator-level pre-validation + rollback | Validate graph in JS before calling RPC. | |
| Best-effort with explicit partial-write disclosure | Allow partial writes; warn + list. | |

**User's choice:** Rely on bulk_import's single-txn behavior

### Q3: How should answers JSONB and join tables be populated?

| Option | Description | Selected |
|--------|-------------|----------|
| Reuse importAnswers + linkJoinTables | Use existing SupabaseAdminClient helpers. | ✓ |
| Build answers JSONB pre-insert | Resolve external_id → UUID in JS before RPC. | |
| New RPC for graph-aware upsert | Server-side all-in-one bulk. | |

**User's choice:** Reuse importAnswers + linkJoinTables

### Q4: Where should SupabaseAdminClient live for Phase 56?

| Option | Description | Selected |
|--------|-------------|----------|
| Move to @openvaa/dev-tools | Owns bulk-write lifecycle; tests import cross-workspace. | ✓ (then superseded — see follow-up) |
| Stay in tests/, dev-tools imports from it | Zero move; awkward packages→tests dependency. | |
| Thin wrapper in dev-tools | New wrapper; two sources of truth. | |

**User's choice:** Move to @openvaa/dev-tools (then redirected to new package `@openvaa/dev-seed` — see follow-up)

### Follow-up: Handling tables bulk_import doesn't accept

| Option | Description | Selected |
|--------|-------------|----------|
| Pass-through + linkJoinTables | accounts/projects as ctx-only refs; feedback via direct `.upsert()`; joins via linkJoinTables. | ✓ |
| Extend bulk_import RPC | Migration to add accounts/projects/feedback/joins. | |
| Scope feedback out of Phase 56 | Amend success criterion 1 to exclude feedback. | |

**User's choice:** Pass-through + linkJoinTables

### Follow-up: Package re-scoping (user-initiated)

User redirected: "Actually, make this generator its own package @openvaa/dev-data-generator or if u come up with a better name." This overrode the STATE.md lock of extending `@openvaa/dev-tools`.

| Option | Description | Selected |
|--------|-------------|----------|
| @openvaa/dev-data-generator | User's suggested name — explicit but long. | |
| @openvaa/seed | Short; ambiguity with `seed: number` and `seed.sql`. | |
| @openvaa/dev-seed | Mid-length; `dev-` prefix signals dev-only; parallels dev-tools. | ✓ |
| @openvaa/data-seeder | Descriptive without `dev-` prefix. | |

**User's choice:** `@openvaa/dev-seed`
**Notes:** "3 and rename all dev commands in the main package as dev:foo" — captured as D-02 (Phase 58 concern).

---

## Template schema + validator

### Q1: How should the core template schema and runtime validator be built?

| Option | Description | Selected |
|--------|-------------|----------|
| Zod | De-facto TS validator; field-pointing errors; already in catalog. | ✓ |
| Valibot | Smaller; less familiar. | |
| Pure TS + hand-rolled assert | No runtime validator dep; handwritten error messages. | |
| Defer validator to Phase 58 | TS types only in 56. | |

**User's choice:** Zod
**Notes:** Confirmed zod is already in the Yarn catalog (used by @openvaa/llm, @openvaa/question-info, @openvaa/frontend).

### Q2: Where should the template TypeScript types live?

| Option | Description | Selected |
|--------|-------------|----------|
| In @openvaa/dev-seed | Co-located with schema and validator. | ✓ |
| Split: types in app-shared, validator in dev-seed | Cross-package indirection. | |

**User's choice:** In @openvaa/dev-seed

### Q3: How should smart defaults for 'every field optional' (TMPL-02) be implemented?

| Option | Description | Selected |
|--------|-------------|----------|
| Per-generator defaults() method | Each class's `defaults(ctx)` returns its own fragment. | ✓ |
| Centralized defaults object | One `DEFAULTS` constant module. | |
| Zod `.default()` on every field | Native zod defaults. | |

**User's choice:** Per-generator defaults() method

### Q4: How opinionated should the Phase 56 schema be about future fields?

| Option | Description | Selected |
|--------|-------------|----------|
| Minimal core only | Phase 57/58 extend via `.extend()`. | ✓ |
| Full schema stub, partial validation | Declare full shape now; validate gradually. | |
| Minimal with explicit placeholder fields | Commented-out future fields. | |

**User's choice:** Minimal core only

---

## Stub answers + testing

### Q1: What should the Phase 56 candidate-answers stub do for a `{}` template?

| Option | Description | Selected |
|--------|-------------|----------|
| Empty answers JSONB | `answers = {}`; Phase 57 replaces wholesale. | |
| Random valid value per question | Uniform random; end-to-end pipeline smoke; no party clustering. | ✓ |
| MISSING_VALUE for all answers | Exercises missing-value matching path. | |

**User's choice:** Random valid value per question

### Q2: How should categorical subdimensions (GEN-07) be handled at the generator level?

| Option | Description | Selected |
|--------|-------------|----------|
| Generator emits valid-shape answers, matching pkg handles subdims | Generator doesn't understand subdimensions. | ✓ |
| Pre-compute subdimension projections in generator | Duplicates matching-package logic. | |

**User's choice:** Option 1 — generator emits shape-valid answers only.
**Notes:** "make a note for the distribution aware generation that we can default or random values for categorical qs" — captured as D-21: the Phase 57 distribution-aware model can fall back to random-valid-choice for categorical questions when no explicit loading/choice mapping is supplied, mirroring the D-19 stub.

### Q3: How should per-generator unit tests be structured (DX-02)?

| Option | Description | Selected |
|--------|-------------|----------|
| Pure input/output, no DB | Pure function tests; fast; no Supabase dependency. | ✓ |
| Hybrid: unit + small integration smoke test | Plus a full-pipeline smoke test against real Supabase. | |
| Unit only; integration deferred to Phase 58 | DX-03 already lives in Phase 58. | |

**User's choice:** Pure input/output, no DB

### Q4: Where should env-var enforcement live (success criterion 6)?

| Option | Description | Selected |
|--------|-------------|----------|
| In the writer constructor / pre-flight | Only when write-path is invoked. | ✓ |
| At module import time | Breaks generator-only unit tests. | |
| CLI-level check (defer to Phase 58) | Programmatic consumers silently fail. | |

**User's choice:** In the writer constructor / pre-flight

---

## Claude's Discretion

- Directory layout inside `packages/dev-seed/src/`
- Public entry point naming (`Seeder`, `seedDatabase`, `runSeeder`, ...)
- Ctx logger shape (callback, event emitter, console-like object)
- Whether `feedback` ships as a real generator or a minimal stub module in Phase 56
- tsup vs tsc vs tsx-only build config for `@openvaa/dev-seed`

## Deferred Ideas

- Partial / transform override shape (rejected D-05 — users compose manually)
- Dependency-declared generator nodes (rejected D-06 — topo is stable)
- Phase 56 integration test against real Supabase (deferred to Phase 58 DX-03)
- Extending `bulk_import` RPC for accounts/projects/feedback/join-tables (rejected D-11)
- Schema-wide zod `.default()` (rejected D-08 — per-generator defaults instead)
