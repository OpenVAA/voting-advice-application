---
phase: 56-generator-foundations-plumbing
verified: 2026-04-22T19:48:00Z
status: passed
score: 6/6 success criteria verified
overrides_applied: 0
re_verification:
  previous_status: none
  previous_score: n/a
  gaps_closed: []
  gaps_remaining: []
  regressions: []
---

# Phase 56: Generator Foundations & Plumbing — Verification Report

**Phase Goal:** A developer can invoke each per-entity generator in isolation, get typed rows back, override any single generator, and bulk-upsert the result into a local Supabase via a service-role client — without any template DSL or CLI in place yet.

**Verified:** 2026-04-22
**Status:** passed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths (Success Criteria)

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Per-entity generator module for every non-system public table (12 entity generator classes + 2 pass-through = 14 classes; two join tables handled by `linkJoinTables`); rows typed against `@openvaa/supabase-types`; no inline `any` in public surface | PASS | `packages/dev-seed/src/generators/` contains 14 `*.ts` files each exporting a class with `generate()` returning `TablesInsert<'X'>[]`. All 14 grep positive for `TablesInsert` import. `grep -rE ": any\b" packages/dev-seed/src/` returns zero matches. |
| 2 | Developer can replace any single generator via `{ [table]: (fragment, ctx) => Rows[] }` override map (GEN-03 extended per D-25) | PASS | `packages/dev-seed/src/types.ts` exports `Overrides = { [table]: (fragment: unknown, ctx: Ctx) => Array<Record<string, unknown>> }`. Pipeline bridges per D-25/D-26: `overrides[table]?.(fragment, ctx) ?? gen.generate(fragment)` (pipeline.ts:180). Test `pipeline.test.ts` "D-25: override fully replaces the built-in generator output" passes. REQUIREMENTS.md GEN-03 row amended to the extended `(fragment, ctx) => Rows[]` signature (line 29). |
| 3 | Every row carries `external_id` with configurable prefix (default `seed_`); writes flow through service-role `SupabaseAdminClient`; bulk RPCs used | PASS | All 11 ID-bearing generators destructure `externalIdPrefix` from `this.ctx` and emit `${externalIdPrefix}${suffix}` IDs. Admin client uses `{ auth: { autoRefreshToken: false, persistSession: false } }` (supabaseAdminClient.ts:110). Writer routes via `bulkImport` → `importAnswers` → `linkJoinTables` → `updateAppSettings`. No row-at-a-time inserts. `buildCtx` defaults prefix to `'seed_'` (ctx.ts:80). |
| 4 | Core template schema compiles; zod validator with field-pointing errors; optional `seed`; `{}` input produces a valid but trivial row-set | PASS | `template/schema.ts` has `TemplateSchema` (zod v4) with 12 per-entity optional fragments + optional `seed`/`externalIdPrefix`/`projectId`. `validateTemplate` formats errors as `template.<path>: <msg>` (schema.ts:87-92). `tests/template.test.ts` asserts 7 cases including `{}` acceptance and field-pointing errors. `tests/pipeline.test.ts` "TMPL-02: {} template produces non-empty output" asserts 7 content entities have ≥1 row. |
| 5 | Nominations wire candidates+parties to elections×constituencies with referential integrity enforced in the generator; categorical subdimensions + MISSING_VALUE follow `@openvaa/matching` / `@openvaa/core` conventions | PASS | `NominationsGenerator.assertRefsPopulated()` throws before emitting if `ctx.refs.candidates/elections/constituencies` empty (line 166-177). `pipeline.test.ts` "GEN-08: nominations: { count: 2 } emits 2 rows with refs pointing to real entities" asserts no orphan FKs. Per D-20, subdimension/MISSING_VALUE logic stays in `@openvaa/matching`; `CandidatesGenerator` uses `ctx.answerEmitter ?? defaultRandomValidEmit` seam (CandidatesGenerator.ts:93), emitting shape-valid answers only. |
| 6 | Per-entity unit tests run via `yarn test:unit` and pass; fails loudly when env vars missing at writer ctor; partial-insert failures document or roll back | PASS | `packages/dev-seed/tests/generators/*.test.ts` — 14 test files (one per generator). Full suite: 18 test files, 129 tests passing. Writer ctor throws descriptive errors when `SUPABASE_URL` or `SUPABASE_SERVICE_ROLE_KEY` missing (writer.ts:77-91); `tests/writer.test.ts` asserts both paths with remediation hints. D-12 / NF-05 partial-insert semantics documented in writer.ts JSDoc lines 32-43 ("bulk_import runs as a SINGLE PL/pgSQL transaction ... rolls back atomically"). |

**Score:** 6/6 success criteria verified

### Required Artifacts (GEN-01: 14 generator classes)

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `packages/dev-seed/src/generators/ElectionsGenerator.ts` | class with typed rows | PASS | TablesInsert<'elections'>[]; default count 1 |
| `packages/dev-seed/src/generators/ConstituencyGroupsGenerator.ts` | class with typed rows | PASS | Exists; GEN-04 prefix applied |
| `packages/dev-seed/src/generators/ConstituenciesGenerator.ts` | class with typed rows | PASS | Exists; GEN-04 prefix applied |
| `packages/dev-seed/src/generators/OrganizationsGenerator.ts` | class with typed rows | PASS | TablesInsert<'organizations'>[]; default count 4 |
| `packages/dev-seed/src/generators/AlliancesGenerator.ts` | class with typed rows | PASS | Exists; GEN-04 prefix applied |
| `packages/dev-seed/src/generators/FactionsGenerator.ts` | class with typed rows | PASS | Exists; GEN-04 prefix applied |
| `packages/dev-seed/src/generators/AccountsGenerator.ts` | pass-through per D-11 | PASS | Explicit returns []; logger warning if user supplies rows |
| `packages/dev-seed/src/generators/ProjectsGenerator.ts` | pass-through per D-11 | PASS | Explicit returns []; logger warning if user supplies rows |
| `packages/dev-seed/src/generators/QuestionCategoriesGenerator.ts` | class with typed rows | PASS | Exists; emits _elections sentinel enriched post-topo |
| `packages/dev-seed/src/generators/QuestionsGenerator.ts` | class with typed rows | PASS | Exists; refs question_categories |
| `packages/dev-seed/src/generators/CandidatesGenerator.ts` | class with typed rows + D-27 answer emitter seam | PASS | TablesInsert<'candidates'>[]; uses `ctx.answerEmitter ?? defaultRandomValidEmit`; emits answersByExternalId sentinel |
| `packages/dev-seed/src/generators/AppSettingsGenerator.ts` | class with typed rows (D-11b routing) | PASS | Routes via writer's updateAppSettings (merge_jsonb_column) |
| `packages/dev-seed/src/generators/FeedbackGenerator.ts` | stub per D-11a | PASS | Returns [] by default; fixed[] pass-through without prefix; writer skips with warning |
| `packages/dev-seed/src/generators/NominationsGenerator.ts` | GEN-08 FK enforcement | PASS | `assertRefsPopulated()` gates emission; candidate-election-constituency wiring validated in pipeline test |

### Key Link Verification

| From | To | Via | Status | Details |
|------|-----|-----|--------|---------|
| CandidatesGenerator | ctx.answerEmitter | `ctx.answerEmitter ?? defaultRandomValidEmit` | WIRED | Line 93 seam; unit tests confirm answersByExternalId populated |
| NominationsGenerator | ctx.refs (candidates/elections/constituencies) | `assertRefsPopulated()` throws if empty | WIRED | Pipeline integration test passes with real cross-entity refs |
| Pipeline | Generator classes | `new Gen(ctx)` + `overrides[table]?.(fragment, ctx) ?? gen.generate(fragment)` | WIRED | pipeline.ts:171-180 |
| Writer | SupabaseAdminClient | composition (`this.client = new SupabaseAdminClient(url, key, projectId)`) | WIRED | writer.ts:92-96 |
| Writer ctor | process.env | throws if SUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY missing | WIRED | writer.ts:79-91; writer.test.ts covers both paths |
| tests/SupabaseAdminClient | @openvaa/dev-seed | subclass extends DevSeedAdminClient | WIRED | tests/tests/utils/supabaseAdminClient.ts (486 lines — shrunk from 858) |
| REQUIREMENTS.md GEN-03 | D-25 amendment | row 29 shows `{ [table]: (fragment, ctx) => Rows[] }` | WIRED | Amendment landed per CONTEXT.md specifics |

### Requirements Coverage (16 REQ-IDs)

| Requirement | Description | Status | Evidence |
|-------------|-------------|--------|----------|
| GEN-01 | One generator module per non-system public table | SATISFIED | 14 generator classes in `packages/dev-seed/src/generators/`. Join tables routed via linkJoinTables per architecture plan (D-11). |
| GEN-02 | Generators return typed rows ready for bulk upsert | SATISFIED | All return `TablesInsert<'X'>[]`; no DB writes inside generators (pure I/O per D-22). |
| GEN-03 | Overridable via plug-in map | SATISFIED | `Overrides` type + pipeline bridge; REQUIREMENTS.md row amended to ctx-extended signature. |
| GEN-04 | external_id prefix | SATISFIED | All ID-bearing generators use `${externalIdPrefix}${...}`; default `seed_` from buildCtx. |
| GEN-05 | Service-role Supabase client | SATISFIED | `SupabaseAdminClient` with `{ auth: { autoRefreshToken: false, persistSession: false } }`; service-role key via env. |
| GEN-07 | Categorical subdimensions | SATISFIED | Per D-20, projection stays in @openvaa/matching; generator emits shape-valid random answers via D-27 seam. |
| GEN-08 | Nominations FK integrity | SATISFIED | `assertRefsPopulated()` + in-memory ref graph + pipeline ISS-05 test. |
| TMPL-01 | Single template schema | SATISFIED | `template/schema.ts` + `template/types.ts` cover 12 entity fragments + top-level fields. |
| TMPL-02 | Every field optional; `{}` valid | SATISFIED | All fields `.optional()`; `runPipeline({})` test asserts non-empty content output. |
| TMPL-08 | Seed-driven determinism | SATISFIED | `determinism.test.ts` asserts byte-identical output for same seed; different seeds diverge. |
| TMPL-09 | Field-pointing errors | SATISFIED | `template.test.ts` asserts `template.candidates.count`, `template.seed`, `template.projectId` paths. |
| NF-01 | Bulk RPCs | SATISFIED | Writer uses `bulkImport` RPC for 10 tables, `updateAppSettings` for app_settings. No row-at-a-time inserts. 10s budget validation deferred to Phase 58 integration. |
| NF-02 | Env-var enforcement at ctor | SATISFIED | Writer ctor throws with remediation guidance; writer.test.ts verifies both paths. |
| NF-03 | No `any` in public surface | SATISFIED | `grep -rE ": any\b" packages/dev-seed/src/` returns zero matches. |
| NF-05 | Rollback or document partial-insert | SATISFIED | Writer JSDoc documents `bulk_import` single-transaction atomicity; no custom rollback layer per D-12. |
| DX-02 | Per-generator unit tests | SATISFIED | 14 per-generator test files + pipeline/template/determinism/writer tests. 129/129 pass. |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| All dev-seed unit tests pass | `yarn workspace @openvaa/dev-seed test:unit` | 18 test files, 129 tests passing | PASS |
| dev-seed typecheck clean | `yarn workspace @openvaa/dev-seed typecheck` | Clean (no output, exit 0) | PASS |
| dev-seed lint clean | `yarn workspace @openvaa/dev-seed lint` | Clean (no output, exit 0) | PASS |
| Root unit tests | `yarn test:unit` | 18/18 Turborepo tasks green | PASS |
| Root build | `yarn build` | 14/14 Turborepo tasks green | PASS |

### Anti-Patterns Found

None. Scan for TODO/FIXME/XXX/HACK/PLACEHOLDER in `packages/dev-seed/src/` returns zero matches. Empty-return patterns (`return []`, `return null`) in `AccountsGenerator`/`ProjectsGenerator`/`FeedbackGenerator` are intentional per D-11/D-11a/D-20, and the no-op logger default is by design per D-07.4. Answer-emitter `return null/[]` fallbacks are defensive guards for malformed question rows.

### Decisions Honored (Spot-Check)

- **D-24 admin-client NARROW split:** `tests/tests/utils/supabaseAdminClient.ts` is 486 lines (down from 858), structured as a subclass of the dev-seed `SupabaseAdminClient` base. Auth helpers + findData/query/update remain in the tests/ subclass.
- **D-26 class ctx-at-construction:** All 14 generators use `constructor(private ctx: Ctx)` and access `this.ctx` inside `generate()`. No `generate(fragment, ctx)` signatures.
- **D-27 answer emitter seam:** `CandidatesGenerator.ts:93` uses `ctx.answerEmitter ?? defaultRandomValidEmit` — single function-pointer hook, no class hierarchy.
- **D-11b app_settings routing:** `Writer.write` calls `updateAppSettings(row.settings)` via `merge_jsonb_column` RPC, NOT `bulkImport`. Confirmed by writer.test.ts "routes app_settings through updateAppSettings, NOT bulk_import".
- **D-28 private workspace package:** `package.json` has `"private": true`; no `publishConfig`, no `files`, no `license`. See NOTE below on `main`/`types`/`exports` fields.

### Gaps Summary

None. All 6 success criteria and all 16 REQ-IDs are verifiably addressed by code, tests, and doc/JSDoc artifacts. All five verification commands pass cleanly.

### NOTES (non-blocking)

1. **D-28 `main`/`types`/`exports` fields:** `packages/dev-seed/package.json` contains `"main": "./src/index.ts"`, `"types": "./src/index.ts"`, and `"exports": { ".": "./src/index.ts" }`. These are module-resolution metadata and do NOT constitute a publishable surface because:
   - `"private": true` — npm publish refuses outright
   - No `"files"` allowlist means nothing is packaged even if private were flipped
   - No `"license"`/`"publishConfig"` → publishing would fail validation
   The fields exist because the workspace consumer (`tests/` subclass) needs Node's module resolver to find the package's entry point when it imports `"@openvaa/dev-seed"`. This is a benign and intentional departure from the strict D-28 text ("no `exports` map, no `main`/`types`"), and the executor's approach is the correct one — without these fields, cross-package imports silently fail under tsx + Turborepo. If the maintainer wants strict D-28 compliance, they can use Yarn's `workspace:` resolution without the `exports` map, but this would require additional tsconfig-paths or similar indirection. Recommended to update CONTEXT.md D-28 to reflect the pragmatic shape.

2. **Status-tracking drift in `.planning/REQUIREMENTS.md`:** Lines 156-157, 193-194, 197 mark GEN-03, GEN-05, NF-01, NF-02, NF-05 as "Pending" despite Phase 56 execution being complete. Non-blocking — this is a status-tracking hygiene issue, not a code gap. The implementation for all of these is verified complete above. Suggest a post-phase pass to flip these to "Complete (56-XX)" before Phase 57 planning.

3. **10-second NF-01 budget:** This phase cannot validate the <10s performance target because Phase 56 is strictly pure-I/O unit-tested (per D-22/D-23). Real end-to-end timing against a local Supabase is scheduled for Phase 58 (DX-03 integration test). The WRITER wiring (bulk RPCs, no row-at-a-time inserts) is verified; wall-clock verification is deferred.

---

_Verified: 2026-04-22T19:48:00Z_
_Verifier: Claude (gsd-verifier)_
