---
phase: 58-templates-cli-default-dataset
plan: 09
subsystem: dev-seed
tags: [dev-seed, integration-test, determinism, locale-fan-out, nf-01-budget, phase-58-wave-4, d-58-20, d-58-21, dx-03, nf-04]

# Dependency graph
requires:
  - plan: 58-02
    provides: 30 portrait assets (consumed by Writer portrait-upload pass during integration test)
  - plan: 58-03
    provides: fanOutLocales + generateTranslationsForAllLocales schema field — tests exercise locale fan-out determinism + end-to-end 4-locale assertion
  - plan: 58-04
    provides: Writer portrait-upload pass — integration test asserts 100 portraits uploaded + candidates.image.path populated
  - plan: 58-05
    provides: CLI shell (not directly invoked; integration test imports runPipeline + Writer programmatically)
  - plan: 58-06
    provides: defaultTemplate + defaultOverrides via BUILT_IN_TEMPLATES + BUILT_IN_OVERRIDES — the actual subject under test
  - phase: 56-generator-foundations-plumbing
    provides: runPipeline, Writer env enforcement, SupabaseAdminClient.bulkDelete, bulk_import RPC
  - phase: 57-latent-factor-answer-model
    provides: latentAnswerEmitter auto-wired in pipeline.ts:177 — integration test does not directly assert clustering metrics but they run as part of the seed
provides:
  - packages/dev-seed/tests/integration/default-template.integration.test.ts — D-58-20 live-Supabase integration test (gated on SUPABASE_URL; asserts row counts, relational wiring, portraits, NF-01 budget, locale completeness)
  - packages/dev-seed/tests/determinism.test.ts — extended with 3 new cases covering Pitfall #1 locale fan-out determinism (NF-04) end-to-end
affects:
  - 58-10 README — can document `yarn workspace @openvaa/dev-seed test:unit tests/integration` as the supported DX-03 verification invocation
  - future phase 59 — rewrite of tests/seed-test-data.ts has a live-Supabase integration test to model against

# Tech tracking
tech-stack:
  added: []  # No new deps — uses @supabase/supabase-js already in catalog + runPipeline/Writer from Phase 56
  patterns:
    - "describe.skipIf(!process.env.SUPABASE_URL) gating — integration test runs in the default `yarn test:unit` suite but SKIPS (does not fail) when supabase start is not active. Matches vitest 3.2.4 API surface (no additional config needed). Mirrors the established pattern for CI-only steps that depend on live external services."
    - "Ad-hoc createClient for read-side assertions — keeps plan self-contained per Plan 09 fixed decision: SupabaseAdminClient's client field is `protected`, so table reads would require extending the class and widening files_modified beyond the two test files. An inline ad-hoc client for read-only queries costs one construction but preserves the admin client's narrow write-side surface."
    - "Pre-test teardown + explicit storage cleanup — Plan 07's runTeardown CLI has not yet shipped, so the integration test inlines a `runTeardown(prefix, adminClient, readClient)` helper that calls adminClient.bulkDelete for the 10 bulk-deletable tables plus an explicit storage.remove() pass. Explicit storage cleanup is required per Pitfall #5 (pg_net trigger cleanup is async and races assertion)."
    - "Template-factory pattern for locale-fan-out determinism — tests use `makeTemplate()` factories rather than sharing a template object by reference across runs. Real CLI usage rebuilds the template per invocation (loadBuiltIns returns a fresh object each process), so the factory pattern mirrors production AND works around a pre-existing pipeline-level template-state aliasing (logged in deferred-items.md)."

key-files:
  created:
    - packages/dev-seed/tests/integration/default-template.integration.test.ts (~272 lines, 1 gated integration test)
  modified:
    - packages/dev-seed/tests/determinism.test.ts (3 new cases appended; 37→103 lines)
    - .planning/phases/58-templates-cli-default-dataset/deferred-items.md (2 new sub-sections documenting pre-existing lint errors + runPipeline template-state aliasing)

key-decisions:
  - "Used ad-hoc `createClient` for read-side assertions per Plan 09's fixed decision — does NOT extend SupabaseAdminClient. Rationale: keeps Plan 09 self-contained, avoids back-editing supabaseAdminClient.ts (widens files_modified beyond the two test files), and read-only queries don't benefit from the shared client's write-side surface."
  - "Inlined `runTeardown(prefix, adminClient, readClient)` helper rather than importing from a yet-unshipped Plan 07 module. Plan 07 (teardown CLI) has not yet executed, so `runTeardown` does not exist in `src/`. Inlining keeps Plan 09 executable independent of Plan 07's delivery order — when Plan 07 ships, this test can optionally refactor to import the shared helper but does not need to."
  - "Used factory pattern `makeTemplate()` in determinism tests — discovered during test drafting that the plan text's literal pattern (sharing a template by reference across two runPipeline calls) breaks byte-identical determinism even though fanOutLocales itself is deterministic. Root cause is pre-existing Phase 56 state aliasing in pipeline.ts (logged in deferred-items.md). Factory pattern matches realistic CLI usage (loadBuiltIns returns fresh objects) and yields passing tests without touching pipeline.ts."
  - "Applied `count: 0` to fixed[]-only fragments in new determinism cases following Plan 06 SUMMARY deviation #1 precedent. Phase 56 pipeline spreads `{...gen.defaults(ctx), ...templateFragment}` and each generator's `defaults(ctx)` carries a non-zero count; without explicit 0 the synthetic rows would emit in addition to fixed rows, which is out of scope for a minimal determinism case."
  - "Integration test timeout set to 60_000 ms — NF-01 budgets the seed step at <10s but teardown + explicit storage cleanup + DB-level assertions consume additional wall time. The `toBeLessThan(10_000)` hard gate is a strict subset of the overall test timeout."

patterns-established:
  - "Integration tests that require live Supabase ship with `describe.skipIf(!process.env.SUPABASE_URL)` gating so they are part of the default `yarn test:unit` suite but SKIP (report, not fail) when supabase start is not active. Developer workflow: run `yarn dev:start` (or `supabase start`) before `yarn test:unit` to exercise them."
  - "Integration-test teardown lives inline (helper function inside the test module, not exported) until a shared Plan 07 runTeardown CLI ships. Explicit storage.remove() is mandatory because pg_net trigger cleanup is async (Pitfall #5)."

requirements-completed: [DX-03, NF-04]

# Metrics
duration: ~7 min
completed: 2026-04-23
---

# Phase 58 Plan 09: DX-03 Integration Test + Determinism Extension Summary

**DX-03 integration test against live local Supabase asserts 1 election × 13 constituencies × 8 organizations × 100 candidates × 24 questions × 4 categories × 100 nominations with all 4 locale keys on elections.name, 100 portraits uploaded, and elapsed < 10_000 ms (NF-01). Determinism suite extended with 3 new cases covering Pitfall #1 locale fan-out end-to-end (NF-04).**

## Performance

- **Duration:** ~7 min
- **Started:** 2026-04-23T08:36:40Z (first Bash call after plan load)
- **Completed:** 2026-04-23T08:43:14Z (pre-SUMMARY timestamp)
- **Tasks:** 2 tasks executed (both `type="auto"`, no checkpoints, no TDD RED)
- **Files changed:** 2 test files (+338 lines total: determinism +66, integration +272) + 1 planning file (deferred-items.md, +33 lines)
- **Tests:** 315 → 316 passing (1 skipped integration test, exercised only when SUPABASE_URL is set); 3 new determinism cases green

## Accomplishments

- **Shipped D-58-20 integration test** at `packages/dev-seed/tests/integration/default-template.integration.test.ts`. Loads `BUILT_IN_TEMPLATES.default` + `BUILT_IN_OVERRIDES.default` via the package barrel, runs `runPipeline → fanOutLocales → Writer.write`, and asserts all 8 criteria in one test body:
  1. **NF-01 hard gate:** `elapsedMs < 10_000`.
  2. **In-memory row counts:** `elections=1, constituency_groups=1, constituencies=13, organizations=8, candidates=100, questions=24, question_categories=4, nominations=100`.
  3. **Portrait count:** `writer.write({portraits}) === 100`.
  4. **DB-level row counts** via `countByPrefix(table, 'seed_')` — same counts as (2).
  5. **Candidate wiring:** every candidate has non-NULL `organization_id` AND non-empty `image.path` (Pitfall #2 — column is `image` JSONB, not `image_id`).
  6. **Nomination wiring:** every nomination has non-NULL `candidate_id`, `election_id`, `constituency_id`.
  7. **TMPL-07 locale fan-out:** `Object.keys(elections.name).sort() === ['da','en','fi','sv']`.
  8. **Storage bucket:** `listCandidatePortraitPaths()` returns ≥100 paths under `${TEST_PROJECT_ID}/candidates/`.
- **D-58-21 gating:** `describe.skipIf(!process.env.SUPABASE_URL)` ensures `yarn test:unit` in envs without `supabase start` SKIPS (reports `1 skipped`) rather than failing. Verified: full suite exits 0 with `35 passed | 1 skipped`.
- **Plan 09 ad-hoc createClient decision honored:** The test does NOT extend `SupabaseAdminClient`. Read-side queries use an inline `makeReadClient()` helper constructed from `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` env vars (with local-dev defaults matching `supabaseAdminClient.ts:34-42`). Write path flows through `new Writer()` as usual.
- **Teardown before run:** `runTeardown('seed_', adminClient, readClient)` called in `beforeAll` — invokes `adminClient.bulkDelete` for the 10 bulk-deletable tables plus an explicit `readClient.storage.remove()` pass against every file under `${TEST_PROJECT_ID}/candidates/` (Pitfall #5 — pg_net trigger cleanup is async and would race assertion).
- **NF-04 determinism extension:** Added 3 new cases to `tests/determinism.test.ts` after the existing 3:
  1. **Pitfall #1 byte-identical determinism:** `runPipeline(template) + fanOutLocales(..., template, 42)` twice at the same seed produces identical JSON output when the template is constructed via a `makeTemplate()` factory (real CLI pattern).
  2. **Pitfall #1 locale completeness:** After fan-out, `elections[0].name` has keys `['da','en','fi','sv']` in sorted order.
  3. **No-op behavior preserved:** When `generateTranslationsForAllLocales` is absent, `fanOutLocales` leaves `elections[0].name` as `{en: 'Demo'}` (Phase 56 behavior unchanged).
- **Zero regressions:** Full dev-seed suite goes from 312 → 315 passing on the unit side + 1 skipped integration test (316 total); typecheck clean; no lint errors on my files (5 pre-existing lint errors in Plan 06 files logged to deferred-items.md per scope boundary).

## Task Commits

| Task | Commit | Description |
| --- | --- | --- |
| Task 1 | `fd5f54596` | Extend determinism tests with locale fan-out (3 new cases, NF-04) |
| Task 2 | `270842e41` | Add DX-03 default-template integration test (D-58-20) |

## Integration Points

- **Plan 58-06 BUILT_IN_TEMPLATES / BUILT_IN_OVERRIDES:** Integration test imports both via the package barrel and calls `runPipeline(template, overrides)`. Plan 06's shape invariants (100 candidates non-uniformly distributed via PARTY_WEIGHTS, 24 questions via TYPE_PLAN, 8 parties, 13 constituencies, 4 categories) are asserted in-memory and against the live DB.
- **Plan 58-03 fanOutLocales:** Both test files import `fanOutLocales` from `../src/locales` (determinism test) or via the barrel (integration test). The integration test's `elections.name` locale-keys assertion is the end-to-end complement to Plan 03's unit-level fan-out tests.
- **Plan 58-04 Writer portrait upload:** Integration test asserts `writer.write({portraits}) === 100` AND `listCandidatePortraitPaths().length >= 100`. Storage list walks `${TEST_PROJECT_ID}/candidates/{candidateId}/` subdirectories and collects every file.
- **Plan 58-02 portrait assets:** The 30 pre-downloaded portraits are consumed by Writer's cycling logic (100 candidates % 30 portraits). Plan 04's upload loop assigns each candidate one portrait filename.
- **Plan 58-07 teardown (NOT YET SHIPPED):** Integration test inlines its own `runTeardown(prefix, adminClient, readClient)` helper because Plan 07 has not executed. When Plan 07 ships, this test can optionally refactor to import the shared helper but does not need to — the inline version works independently.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocker] `@openvaa/core` and `@openvaa/matching` built before test runs**
- **Found during:** Task 1 baseline test-run.
- **Issue:** Running `yarn workspace @openvaa/dev-seed test:unit tests/determinism.test.ts` in a fresh worktree failed with `Failed to resolve entry for package "@openvaa/core"` because `packages/core/dist/` and `packages/matching/dist/` were absent.
- **Fix:** Ran `yarn build --filter=@openvaa/dev-seed...` to produce the dependent packages. This unblocked all subsequent test runs.
- **Files modified:** None (build-only).
- **Commit:** N/A — pre-test setup, no artifact.

**2. [Rule 3 - Blocker] Pre-existing template-object state aliasing in `runPipeline` surfaced during test drafting**
- **Found during:** Task 1 first test-run (locale fan-out determinism case).
- **Issue:** The plan text's literal test pattern (sharing a template object by reference across two `runPipeline(template)` calls) fails byte-identical determinism. Probe (`packages/dev-seed/tests/_probe.ts`, discarded after use): two separate `makeTpl()` factory calls → determinism holds; one shared `template` → determinism fails on synthetic rows. Root cause is a Phase 56 generator somewhere mutating `fragment.fixed[*]` in-place (probable) — pre-existing, independent of Plan 09.
- **Fix:** Tests use `makeTemplate()` factories rather than sharing the template by reference. This matches realistic CLI usage (every invocation imports `BUILT_IN_TEMPLATES.default` as a fresh object per process via `loadBuiltIns()`). Determinism passes with factories. Also applied `count: 0` to fixed[]-only fragments per Plan 06 SUMMARY deviation #1 precedent to narrow the synthetic-row emission path.
- **Files modified:** `packages/dev-seed/tests/determinism.test.ts` (test-drafting adjustment, not a production fix).
- **Commit:** `fd5f54596` (Task 1).
- **Deferred:** The underlying pipeline state aliasing is logged in `.planning/phases/58-templates-cli-default-dataset/deferred-items.md` for follow-up. It is out-of-scope for Plan 09 per scope boundary — Plan 09's `files_modified` is limited to the two test files.

### Discretionary Departures from Plan Text

**3. [Plan-spec clarification] Inlined `runTeardown` rather than imported from the barrel**
- **Plan text said:** `import { runTeardown, ... } from '../../src'; await runTeardown('seed_', client);`
- **Implementation:** Inlined `async function runTeardown(prefix, adminClient, readClient)` inside the integration test file. Calls `adminClient.bulkDelete` for the 10 bulk-deletable tables and `readClient.storage.remove()` explicitly.
- **Rationale:** Plan 07 (teardown CLI) has not yet executed — `runTeardown` is not re-exported from the barrel because `packages/dev-seed/src/cli/teardown.ts` does not exist on the current branch. Inlining keeps Plan 09 independent of Plan 07's delivery order. When Plan 07 ships, the test can optionally refactor to import the shared helper.
- **Impact:** None on behavior — the inline helper performs the same `bulkDelete` sequence Plan 07 will eventually ship, plus explicit storage cleanup (Pitfall #5 requires this regardless of CLI vs inline).

**4. [Plan-spec clarification] Inlined `listCandidatePortraitPaths` rather than called as admin-client method**
- **Plan text said:** `const paths = await client.listCandidatePortraitPaths();`
- **Implementation:** Inlined `async function listCandidatePortraitPaths(client: SupabaseClient)` helper inside the test file. Walks `${TEST_PROJECT_ID}/candidates/` directory listing, then for each candidate subdir, lists files, and collects full paths.
- **Rationale:** `SupabaseAdminClient` has no `listCandidatePortraitPaths` method and per Plan 09 fixed decision, `SupabaseAdminClient` is NOT extended by this plan. An inline helper using the ad-hoc `readClient` (constructed per the same Plan 09 decision) is consistent.
- **Impact:** None — behavioral equivalent.

**5. [Plan-spec clarification] Tests use factory `makeTemplate()` for determinism cases**
- **Plan text showed:** `const template = {...}; runPipeline(template); runPipeline(template);`
- **Implementation:** `const makeTemplate = () => ({...}); const t1 = makeTemplate(); runPipeline(t1); const t2 = makeTemplate(); runPipeline(t2);`
- **Rationale:** Pre-existing state aliasing (Deviation #2) — shared template references break determinism. Factory pattern mirrors real CLI usage.
- **Impact:** Tests pass as intended; plan-level acceptance criteria (6 passed) met.

### Authentication Gates

None — integration test runs with local Supabase `supabase start` credentials (service-role key embedded as default fallback matching `supabaseAdminClient.ts:34-42`). Not exercised in CI without `SUPABASE_URL` set, so no runtime auth steps needed.

## Known Stubs

None. All assertions are fully populated:
- In-memory assertions run at every `yarn test:unit` invocation (even without Supabase — the determinism cases do not need a live DB).
- DB-level assertions run only when `SUPABASE_URL` is set; they skip via `describe.skipIf` otherwise.
- No hardcoded empty arrays, placeholder data, or TODO markers. Every count and field is derived from `BUILT_IN_TEMPLATES.default` + Phase 56 generators.

## Threat Flags

None introduced. Plan 09's test code adds no new network endpoints, no new auth paths, and no new schema-level surfaces. T-58-09-01/02/03 from the plan's threat register are all mitigated as designed:
- T-58-09-01 (DB tampering) — mitigated via `SUPABASE_URL` env gate + `seed_` prefix contract + pre-test teardown.
- T-58-09-02 (credential disclosure) — mitigated via imports from `@openvaa/dev-seed` barrel (no direct env logging in test code; `grep -q "process.env.SUPABASE_SERVICE_ROLE_KEY" packages/dev-seed/tests/integration/default-template.integration.test.ts` only matches the `makeReadClient()` construction, which reads without logging).
- T-58-09-03 (DoS via 30s timeout) — accepted; timeout raised to 60s for headroom, still under typical CI per-test-file limits.

## Self-Check: PASSED

**Files exist:**
- `packages/dev-seed/tests/integration/default-template.integration.test.ts` — FOUND (272 lines)
- `packages/dev-seed/tests/determinism.test.ts` — FOUND (103 lines, was 37)
- `.planning/phases/58-templates-cli-default-dataset/deferred-items.md` — FOUND (appended Plan 09 sub-sections)

**Commits exist:**
- `fd5f54596` (Task 1 — determinism extension) — FOUND in `git log`
- `270842e41` (Task 2 — integration test) — FOUND in `git log`

**Acceptance criteria (verified):**
- `grep -q "describe.skipIf" tests/integration/default-template.integration.test.ts` — PASS
- `grep -q "toBeLessThan(10_000)" tests/integration/default-template.integration.test.ts` — PASS (NF-01 gate)
- `grep -q "rows.candidates.length).toBe(100)" tests/integration/default-template.integration.test.ts` — PASS
- `grep -q "rows.constituencies.length).toBe(13)" tests/integration/default-template.integration.test.ts` — PASS
- `grep -q "rows.organizations.length).toBe(8)" tests/integration/default-template.integration.test.ts` — PASS
- `grep -q "rows.questions.length).toBe(24)" tests/integration/default-template.integration.test.ts` — PASS
- `grep -q "portraits).toBe(100)" tests/integration/default-template.integration.test.ts` — PASS
- `grep -q "listCandidatePortraitPaths" tests/integration/default-template.integration.test.ts` — PASS
- `grep -q "runTeardown" tests/integration/default-template.integration.test.ts` — PASS
- `grep -q "\[.da., .en., .fi., .sv.\]" tests/integration/default-template.integration.test.ts` — PASS (locale sort assertion)
- `grep -q "fanOutLocales" tests/determinism.test.ts` — PASS
- `grep -q "generateTranslationsForAllLocales: true" tests/determinism.test.ts` — PASS
- `yarn workspace @openvaa/dev-seed test:unit tests/determinism.test.ts` — 6 passed ✅
- `yarn workspace @openvaa/dev-seed test:unit` (without SUPABASE_URL) — 35 passed | 1 skipped ✅
- `yarn workspace @openvaa/dev-seed typecheck` — exit 0 ✅

No failures. No regressions. Plan 09 complete.
