---
plan: 56-07
status: complete
completed: 2026-04-22
commits:
  - ea2e215ab
  - b5e6c84fb
  - 5ddac329d
requirements-completed: [GEN-03, GEN-05, NF-01, NF-02, NF-05]
---

# Plan 56-07 — Pipeline + Writer + Public API Barrel — SUMMARY

**Status:** ✅ Complete

## What was built

Three new files in `packages/dev-seed/src/`:

- **`pipeline.ts`** (commit `ea2e215ab`) — `runPipeline(template?, overrides?, ctxOverride?)`
  orchestrator. Validates the template via zod first (TMPL-09 field-path errors surface
  before any generator runs). Builds the `Ctx` once, then executes generators in a fixed
  topo order that mirrors `bulk_import`'s `processing_order`, with one deliberate
  refinement: **questions run before candidates** so `ctx.answerEmitter` can read
  `ctx.refs.questions` per D-27. After all generators finish, a post-topo pass
  populates the `_constituencyGroups` / `_constituencies` / `_elections` sentinel
  fields from `ctx.refs` so `linkJoinTables` can resolve them later. Implements the
  D-25 / D-26 class ↔ function bridge: built-ins are instantiated once with
  `new XGenerator(ctx)` (ctx-at-construction per D-26) and called as
  `generate(fragment)`; overrides are called as `overrides[table]?.(fragment, ctx)`
  per D-25 and fully replace the built-in when present.

- **`writer.ts`** (commit `b5e6c84fb`) — `Writer` class with env-var pre-flight in
  its constructor per D-15 / NF-02: reads `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY`
  from `process.env` and throws a descriptive error if either is missing. Pure
  generators remain env-free so `yarn test:unit` needs no env fixture. The
  `write(rows)` method routes each table per D-11 / D-11a / D-11b:
  - **bulk_import path** (11 tables): elections, constituency_groups, constituencies,
    organizations, alliances, factions, question_categories, questions, candidates,
    nominations, and the paired `importAnswers` + `linkJoinTables` two-pass for
    answer JSONB + join-table wiring
  - **updateAppSettings path** (D-11b): each `app_settings` row's `settings` JSONB
    is deep-merged via `merge_jsonb_column` RPC — avoids the UNIQUE(project_id)
    conflict flagged in RESEARCH.md Pitfall 5
  - **Feedback WARN-AND-SKIP** (D-11a): if `rows.feedback?.length > 0`, logs a
    warning that Phase 56 skips feedback writes and discards the rows. No direct
    upsert in Phase 56
  - **accounts / projects pass-through** (D-11): ctx.refs-only, no write path
  JSDoc on `write()` documents NF-05 / D-12: "`bulk_import`'s single PL/pgSQL
  transaction rolls back atomically on any collection-level failure; partial
  writes are impossible within a single `bulkImport` call. Generators
  pre-validate refs in memory (GEN-08) so most orphan-FK errors are caught
  client-side before reaching the DB."

- **`index.ts`** (commit `5ddac329d`) — public API barrel. Exports `runPipeline`,
  `Writer`, `SupabaseAdminClient`, `TEST_PROJECT_ID`, `defaultRandomValidEmit`,
  `validateTemplate`, and the public types `Template`, `Overrides`, `AnswerEmitter`,
  `Fragment`, `Ctx`. All 14 generator classes stay internal — overrides use the
  map shape `{ [table]: (fragment, ctx) => Rows[] }`, not class imports.

## Acceptance verification (post-timeout)

- `yarn workspace @openvaa/dev-seed typecheck` — **TYPECHECK:OK**
- `yarn workspace @openvaa/dev-seed lint` — **LINT:OK**
- `yarn workspace @openvaa/dev-seed test:unit` — **TEST:OK** (no tests yet; `--passWithNoTests` per Plan 01)
- Working tree clean after all three commits.

## Deviations

Executor hit an upstream stream idle timeout after the three implementation commits
landed (SUMMARY step did not execute). The SUMMARY above was written by the
orchestrator based on the committed artifacts. No behavioral deviations from the plan.

## Wave 4 complete — Wave 5 unblocked

Pipeline + Writer + barrel are in place. Plan 56-08 (per-generator unit tests) and
Plan 56-09 (cross-cutting tests: pipeline, writer, determinism, template validator)
can now proceed.
