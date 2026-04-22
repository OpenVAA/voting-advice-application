---
phase: 56-generator-foundations-plumbing
plan: 10
subsystem: testing
tags: [tests-workspace, admin-client, subclass, d-24, final-verification, module-resolution]

# Dependency graph
requires:
  - phase: 56-generator-foundations-plumbing
    provides: SupabaseAdminClient base class (Plan 02), bulk-write surface (bulkImport, bulkDelete, importAnswers, linkJoinTables, updateAppSettings), FindDataResult type, TEST_PROJECT_ID constant
provides:
  - tests/tests/utils/supabaseAdminClient.ts subclass of @openvaa/dev-seed's SupabaseAdminClient (D-24 split complete)
  - @openvaa/dev-seed package.json main/types/exports entrypoints (unblocks Node ESM resolution from tests/)
  - Writer JSDoc literally contains "single transaction" (NF-05 grep satisfies)
  - Phase 56 COMPLETE: 14 generators + pipeline + writer + admin-client split + template schema + answer emitter seam + 129 unit tests
affects: [phase-57-latent-factor, phase-58-templates-cli, phase-59-e2e-fixture-migration]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Subclass extends dev-seed base; auth/email + legacy E2E query helpers stay in tests/, bulk-write methods inherited"
    - "Private workspace package (D-28) exports source .ts via main/types/exports — consumed by tsx/vitest/playwright at runtime without build step"

key-files:
  created:
    - .planning/phases/56-generator-foundations-plumbing/56-10-SUMMARY.md
  modified:
    - tests/tests/utils/supabaseAdminClient.ts (858 → 486 lines; rewritten as subclass)
    - packages/dev-seed/package.json (add main/types/exports)
    - packages/dev-seed/src/writer.ts (JSDoc wording refined)

key-decisions:
  - "Subclass uses this.client / this.projectId inherited as protected (no second Supabase client)"
  - "Duplicated COLLECTION_MAP / FIELD_MAP / resolveCollectionName / resolveFieldName into subclass (20 lines) rather than re-exporting dev-seed private helpers — preserves dev-seed's narrow public surface"
  - "Array types migrated string[] → Array<string> / unknown[] → Array<unknown> in rewritten content to satisfy shared-config lint rule (file we touched is now lint-clean)"
  - "Added main/types/exports to dev-seed package.json pointing at ./src/index.ts — Node ESM resolver needs these fields; tsx resolves TS at runtime. Required for tests/ Playwright to import from @openvaa/dev-seed"

patterns-established:
  - "tests/ subclass pattern: extends dev-seed base, re-exports TEST_PROJECT_ID + FindDataResult for backward-compat, preserves constructor signature via inheritance"
  - "Private dev-seed workspace consumed from other workspaces requires explicit main/exports pointing at source .ts (no build step)"

requirements-completed: [GEN-05]

# Metrics
duration: ~15min
completed: 2026-04-22
---

# Phase 56 Plan 10: tests/ Admin Client Subclass + Final Verification Summary

**D-24 admin-client split complete: tests/tests/utils/supabaseAdminClient.ts is now a 486-line subclass of @openvaa/dev-seed's SupabaseAdminClient base, inheriting bulk-write methods while preserving auth/email + legacy E2E query helpers in tests/.**

## Performance

- **Duration:** ~15 min
- **Started:** 2026-04-22T15:51:41Z
- **Completed:** 2026-04-22T16:02:25Z
- **Tasks:** 2 (both green on first attempt after Rule 3 blocking fix)
- **Files modified:** 3 (supabaseAdminClient.ts rewrite, dev-seed package.json entrypoints, writer.ts JSDoc)

## Accomplishments

- **D-24 admin-client split complete.** Bulk-write methods (bulkImport, bulkDelete, importAnswers, linkJoinTables, updateAppSettings) now live ONLY in `@openvaa/dev-seed`'s base class. The tests/ subclass adds 11 auth/email/legacy-E2E helpers on top. File shrunk 858 → 486 lines (43% reduction, within D-24's ~400-line target).
- **Phase 56 COMPLETE.** All 10 plans delivered: 14 generators + pipeline + writer + admin-client split + template schema + answer emitter seam + 18 test files + 129 unit tests + tests/ subclass rewrite.
- **Unblocked Node ESM resolution from tests/ workspace.** Added `main`/`types`/`exports` to `@openvaa/dev-seed/package.json` pointing at `./src/index.ts`. Playwright's list-tests walk now succeeds (89 tests discovered) where before it errored with `Cannot find package '@openvaa/dev-seed/package.json'`.
- **Every Phase 56 per-requirement verification command passes** (GEN-01, GEN-02, GEN-03, GEN-04, GEN-05, GEN-07, GEN-08, TMPL-01, TMPL-02, TMPL-08, TMPL-09, NF-01, NF-02, NF-03, NF-05, DX-02).

## Task Commits

1. **Task 1: Rewrite tests admin client as dev-seed subclass** — `83cd204c9` (`refactor`)
   - Bundled with Task 2's writer JSDoc fix and dev-seed package.json exports (the latter was Rule 3 blocking discovered during Task 1 playwright-list verification)

**Plan metadata commit:** (this SUMMARY + STATE/ROADMAP updates)

## Files Created/Modified

- **tests/tests/utils/supabaseAdminClient.ts** (modified, 858 → 486 lines) — Now `export class SupabaseAdminClient extends DevSeedAdminClient`; imports the base + TEST_PROJECT_ID + FindDataResult from `@openvaa/dev-seed`; retains 11 helpers (fixGoTrueNulls, safeListUsers, findData, query, update, setPassword, forceRegister, unregisterCandidate, sendEmail, sendForgotPassword, deleteAllTestUsers) with verbatim body semantics; removes constructor, bulk-write methods, createClient import, SUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY module constants (except SUPABASE_URL which is still used by sendEmail/sendForgotPassword for frontend-url rewriting). Duplicated COLLECTION_MAP/FIELD_MAP + resolveCollectionName/resolveFieldName helpers (~20 lines) locally since they're consumed by the subclass's findData/query/update methods and the dev-seed base doesn't re-export them.
- **packages/dev-seed/package.json** (modified, +5 lines) — Added `"main": "./src/index.ts"`, `"types": "./src/index.ts"`, `"exports": { ".": "./src/index.ts" }`. Required because the tests/ workspace imports `from '@openvaa/dev-seed'` and Playwright/Node ESM resolver checks these fields first; tsx resolves `.ts` at runtime so no build step is needed. Private workspace (D-28) — no npm publish implications.
- **packages/dev-seed/src/writer.ts** (modified, JSDoc reword only) — Line 109 now reads `single transaction write of 10 tables` (was `single-transaction`). Satisfies the literal `grep -q "single transaction"` check from NF-05 validation. No behavior change.

## Decisions Made

- **Inherit constructor unchanged.** The base's `constructor(url?, serviceRoleKey?, projectId?)` matches existing call sites' `new SupabaseAdminClient()` and `new SupabaseAdminClient(url, key, projectId)` calls. Subclass adds no constructor.
- **Duplicate collection/field maps locally** rather than export-from-base. The dev-seed base uses them internally in `bulkImport` and they are not part of its public surface. Tests/ subclass needs them for `findData` / `query` / `update`. Re-exporting would leak internal plumbing; duplication is ~20 lines and cheap.
- **Keep SUPABASE_URL const in subclass.** `sendEmail` and `sendForgotPassword` compute `SUPABASE_URL.replace('54321', '5173')` for the frontend-redirect URL. This is auth-flow specific, tests/-only behavior — does not belong in the dev-seed base.
- **Migrate array-type syntax.** Original file used `string[]` / `unknown[]` (19 lint errors on that file alone). Rewrite uses `Array<string>` / `Array<unknown>` so the rewritten file is lint-clean; the dev-seed base already uses the generic syntax so this also aligns styles.
- **Replace GoTrue-fix REST call's hardcoded service-role key** with `process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''` since the subclass no longer has the module-level constant. The REST call is best-effort (comment: "Ignore — the real fix is below") so the fallback is acceptable.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] @openvaa/dev-seed package.json missing entrypoints (main/types/exports)**
- **Found during:** Task 1 post-lint verification — `yarn playwright test --list` errored with `Cannot find package '/node_modules/@openvaa/dev-seed/package.json' imported from tests/tests/utils/supabaseAdminClient.ts` on every test file.
- **Issue:** Node.js ESM resolver needs `main` / `exports` fields to resolve bare-specifier imports of a package. `@openvaa/dev-seed/package.json` had neither (it was set up tsx-only per D-28 for internal consumption, but tests/ is the first external consumer). Without entrypoints, the import from `'@openvaa/dev-seed'` silently fails at runtime even though tsx and vitest (workspace-internal) had been resolving it fine.
- **Fix:** Added three fields to `packages/dev-seed/package.json`: `"main": "./src/index.ts"`, `"types": "./src/index.ts"`, `"exports": { ".": "./src/index.ts" }`. Points at the source `.ts` directly; tsx resolves TypeScript at runtime with no build step. Matches the D-28 "no build step" constraint.
- **Files modified:** packages/dev-seed/package.json
- **Verification:** `yarn playwright test --list -c tests/playwright.config.ts tests` now discovers 89 tests (previously errored with unresolvable-package on every test file). `yarn build` + `yarn test:unit` both green.
- **Committed in:** `83cd204c9` (bundled with Task 1)

**2. [Rule 2 - Missing Critical] Writer JSDoc wording for NF-05 grep**
- **Found during:** Task 2 per-requirement validation — `grep -q "single transaction" packages/dev-seed/src/writer.ts` returned non-zero.
- **Issue:** Plan 56-07 wrote `single-transaction` (hyphenated) and `single PL/pgSQL transaction`. Plan 56-10's NF-05 acceptance criterion checks for the literal two-word phrase `"single transaction"`. The behavior was correct (rollback atomicity documented) but the exact grep pattern didn't match.
- **Fix:** Reworded `single-transaction write of 10 tables` → `single transaction write of 10 tables` plus added a clarifying parenthetical. Semantic content unchanged; grep check now passes.
- **Files modified:** packages/dev-seed/src/writer.ts (one JSDoc line)
- **Verification:** `grep -q "single transaction" packages/dev-seed/src/writer.ts` exits 0.
- **Committed in:** `83cd204c9` (bundled with Task 1)

---

**Total deviations:** 2 auto-fixed (1 blocking, 1 missing critical)
**Impact on plan:** Both fixes were necessary for Phase 56 completeness (Rule 3: ESM resolution is a hard requirement for future E2E runs; Rule 2: NF-05 grep is an explicit acceptance criterion). No scope creep — both fixes are in-scope for "tests/ subclass works" and "Phase 56 NF-05 JSDoc documented."

## Issues Encountered

- **Pre-existing `yarn lint:check` baseline dirty:** tests/ workspace has 74 ESLint errors + 100 warnings pre-existing across multiple files (`seed-test-data.ts`, spec files, debug files). Our rewrite of `supabaseAdminClient.ts` is individually lint-clean, reducing the count. Remaining errors are out of scope per scope-boundary rule (not caused by this plan's changes). Documented for Phase 58 (D-03 doc-sync companion) or Phase 59 housekeeping.
- **Pre-existing `@openvaa/supabase` SQL lint warnings:** `yarn workspace @openvaa/supabase lint` uses `supabase db lint --fail-on warning` and fails on pre-existing SQL linter warnings in migrations (`unused parameter`, `never read variable`). Unrelated to this plan. Documented for separate database-hygiene work.

## Phase 58 Handoff

**Documentation sync (D-03 — deferred from Phase 56 per CONTEXT §D-03):**
- `.planning/REQUIREMENTS.md` — GEN-05, GEN-10, CLI-01, CLI-02, CLI-03, DX-04 still reference `@openvaa/dev-tools` as the seeder home. Rename to `@openvaa/dev-seed`.
- `.planning/ROADMAP.md` — Phase 58 description mentions `dev-tools`. Rename to `dev-seed`.
- `.planning/PROJECT.md` — Target features bullet mentions `dev-tools` as seeder home. Rename to `dev-seed`.
- Suggested commit shape: single `docs: sync @openvaa/dev-tools → @openvaa/dev-seed references` commit before Phase 58 planning.

**Deferred to Phase 58 planning scope:**
- **TMPL-07 locale wiring** (`generateTranslationsForAllLocales: boolean`) — add to template schema via `.extend()`; generators consult the flag and either emit all `staticSettings.supportedLocales` or English-only.
- **CLI surface** — `yarn workspace @openvaa/dev-seed seed --template <name-or-path>` + `seed:teardown` + root shortcut `yarn dev:reset-with-data`.
- **Portrait seeding (GEN-09, GEN-10)** — candidate portrait URL generation; upload to Supabase Storage bucket.
- **Built-in templates** — `default` and `e2e` templates ship inside `@openvaa/dev-seed` and are selectable by name.

**Deferred to Phase 57 planning scope:**
- **Latent-factor answer emitter** drops into `ctx.answerEmitter` via the D-27 seam. `CandidatesGenerator` already consults `ctx.answerEmitter ?? defaultRandomValidEmit` — no changes to that generator needed in Phase 57.

**Deferred to Phase 59 planning scope:**
- **`tests/seed-test-data.ts` rewrite** — replace legacy JSON-fixture bulk-import with `runPipeline({ /* e2e template */ })` + `new Writer().write(...)`.
- **Legacy JSON fixture deletion** — `tests/tests/data/default-dataset.json`, `voter-dataset.json`, `candidate-addendum.json` retired after E2E parity verified.

## User Setup Required

None — no external service configuration required.

## Self-Check: PASSED

**File existence:**
- FOUND: tests/tests/utils/supabaseAdminClient.ts (486 lines)
- FOUND: packages/dev-seed/package.json (with main/types/exports)
- FOUND: packages/dev-seed/src/writer.ts (with "single transaction" JSDoc)
- FOUND: .planning/phases/56-generator-foundations-plumbing/56-10-SUMMARY.md

**Commits:**
- FOUND: 83cd204c9 refactor(56-10): rewrite tests admin client as dev-seed subclass

**Acceptance criteria:**
- Line count 486 ∈ [300, 550] ✓
- Imports `from '@openvaa/dev-seed'` ✓
- `extends DevSeedAdminClient` ✓
- Re-exports TEST_PROJECT_ID ✓
- Re-exports FindDataResult type ✓
- All 11 preserved methods present ✓
- All 5 bulk-write methods removed from subclass body ✓
- No `import { createClient` ✓
- No `const SUPABASE_SERVICE_ROLE_KEY =` ✓
- No `  constructor(` (inherited) ✓
- `yarn build` exit 0 ✓
- `yarn test:unit` exit 0 (18/18 workspaces; dev-seed 129/129 tests) ✓
- Dev-seed typecheck + lint clean ✓
- Playwright test --list discovers 89 tests (import resolution works) ✓

## Next Phase Readiness

- **Phase 56 COMPLETE.** All requirements satisfied; all 10 plans delivered.
- **Phase 57 ready to plan.** `ctx.answerEmitter` D-27 seam in place; `CandidatesGenerator` consults it; drop-in latent-factor emitter is all that's needed.
- **Phase 58 ready to plan** once D-03 doc-sync commit lands (rename `@openvaa/dev-tools` → `@openvaa/dev-seed` in REQUIREMENTS.md / ROADMAP.md / PROJECT.md).
- **Phase 59 blocked** on Phase 58 (template surface + CLI must exist before E2E migrates).

---
*Phase: 56-generator-foundations-plumbing*
*Completed: 2026-04-22*
