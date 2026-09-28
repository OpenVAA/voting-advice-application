---
phase: 165-review-stack-comment-remediation
plan: 24
subsystem: testing
tags: [gate, pgtap, e2e, prettier, comment-hygiene, supabase]

requires:
  - phase: 165-review-stack-comment-remediation
    provides: waves 2-6 (165-02 .. 165-23) and the 165-01 instruments (e2e-verdict.mjs, hygiene-changed-files.sh, record-hygiene-read.sh, code-identity.mjs)
provides:
  - 165-24-GATE.md, the interim D-06 gate record, every command with its exit status
  - A tip where format:check passes (the ten pre-existing prettier failures fixed)
  - Hygiene-clean rewrites of the five files the formatting commit brought into the branch's changed set
affects: [165-25, 165-35, 165-36]

actuals:
  tokens: 21118
  tasks: 3
  commits: 7
plan_head_before: f1cee1572ee8e2b45eb9dc7d632d48f09f3c31fc
plan_head_after: 6cbd332665b30605e95645e45388bc13f977922b

tech-stack:
  added: []
  patterns:
    - "Measure db:types drift against a freshly reset database: pgTAP leaves its helpers as public functions, so db:types straight after test:db generates types for them"
    - "A formatting-only commit puts every touched file into the branch's changed set, so each needs a hygiene read and, if dirty, a rewrite"

key-files:
  created:
    - .planning/phases/165-review-stack-comment-remediation/165-24-GATE.md
    - .planning/phases/165-review-stack-comment-remediation/scripts/hygiene-reads/165-24.tsv
  modified:
    - apps/supabase/supabase/tests/database/07-rpc-security.test.sql
    - apps/supabase/supabase/tests/database/21-entity-organization.test.sql
    - apps/supabase/supabase/tests/database/24-legacy-removal.test.sql
    - apps/supabase/supabase/schema/300-auth-tables.sql
    - apps/supabase/supabase/migrations/00001_initial_schema.sql
    - apps/supabase/supabase/functions/invite-candidate/index.ts
    - apps/supabase/supabase/functions/invite-candidate/entityGrant.test.ts
    - apps/supabase/supabase/functions/identity-callback/entityGrant.test.ts
    - apps/frontend/src/lib/server/admin/requireAdminIdentity.test.ts
    - apps/frontend/src/lib/contexts/voter/filters/filterRelevance.test.ts
    - scripts/assert-project-scoped-queries.mjs
    - .planning/phases/165-review-stack-comment-remediation/deferred-items.md

key-decisions:
  - "165-24 formats all ten prettier failures, not only the four SQL files deferred-items.md listed: yarn format:check is a D-06 gate over the whole repo, and all ten fail at the phase base too"
  - "The gate of record for db:types drift is the run after a fresh db:reset. pgTAP's persistent helper functions make a db:types run straight after test:db drift for a reason unrelated to the schema"
  - "requireAdminIdentity.test.ts keeps its transcribed safeGetSession: the frontend's adapter-boundary rule forbids $lib/supabase imports outside the adapter. Its docstring now gives that as the reason"
  - "The plan's literal --base hygiene command stays red on exactly one path, the maintainer's uncommitted MainContent.svelte, which the orchestrator said must get no read row; the gate of record is the same check over the 159 committed changes"

patterns-established:
  - "Re-run the E2E suite after any post-run source edit, so the gate of record covers the final tree"

requirements-completed: [165-SC3, 165-SC4]

coverage:
  - id: D1
    description: "The comment-rewritten schema applies and the whole pgTAP estate, the SQL lint and the types drift check pass"
    requirement: "165-SC4"
    verification:
      - kind: integration
        ref: "yarn db:reset (exit 0); yarn workspace @openvaa/supabase test:db (Files=32, Tests=1204, Result: PASS)"
        status: pass
      - kind: other
        ref: "yarn db:lint:sql (exit 0); yarn db:types && git diff --exit-code HEAD -- packages/supabase-types/src/database.ts (exit 0 after a fresh reset)"
        status: pass
    human_judgment: false
  - id: D2
    description: "Build, lint, format and unit pass repo-wide with forced turbo execution, on the final tree"
    requirement: "165-SC4"
    verification:
      - kind: other
        ref: "TURBO_FORCE=true yarn build / lint:check / test:unit (exit 0, 0 cached); yarn format:check (exit 0, 0 [warn])"
        status: pass
      - kind: unit
        ref: "TURBO_FORCE=true yarn test:unit (3349 tests, 0 failed)"
        status: pass
    human_judgment: false
  - id: D3
    description: "The full E2E suite is green on the final tree"
    requirement: "165-SC4"
    verification:
      - kind: e2e
        ref: "node .planning/phases/165-review-stack-comment-remediation/scripts/e2e-verdict.mjs tests/e2e-runs/165-24-gate-run02 (exit 0: expected=165 unexpected=0 flaky=0 skipped=0)"
        status: pass
    human_judgment: false
  - id: D4
    description: "Every file changed on the branch passes the hygiene gate with a current read"
    requirement: "165-SC3"
    verification:
      - kind: other
        ref: "hygiene-changed-files.sh --check-reads --files <159 committed changes since ship/v2.15-12-planning> (exit 0, VERDICT: CLEAN)"
        status: pass
    human_judgment: false

duration: 40min
completed: 2026-09-27
status: complete
---

# Phase 165 Plan 24: Interim Full Gate Summary

**Every D-06 gate passes at `1513025a8`: pgTAP 1204/1204 on the freshly applied schema, SQL lint, no types drift, forced build/lint/format/unit (3349 tests), and the full E2E suite at 165 passed / 0 failed / 0 flaky / 0 did-not-run. Getting there took one formatting commit for ten files that already failed prettier at the phase base, and hygiene rewrites of the five of them that the commit brought into the branch's changed set.**

## Performance

- **Duration:** about 40 min
- **Started:** 2026-09-27T22:28:03Z
- **Completed:** 2026-09-27T23:07:55Z
- **Tasks:** 3 of 3
- **Files modified:** 14 (11 source, 3 planning records)

## Accomplishments

- The first unscoped measurement of waves 2-6 is green on every D-06 gate. Evidence is in `165-24-GATE.md`, and each status was read directly.
- `yarn format:check` passes at the tip. The ten pre-existing prettier failures are fixed in a formatting-only commit, and `00001_initial_schema.sql` was regenerated so schema-migration parity holds.
- The five files that commit brought into scope are hygiene-clean. Planning ids, review ids, threat ids and before/after narrative were replaced with statements of each invariant. The four non-test-code files are proven code-identical. pgTAP passes again after the description literals changed.
- 12 hygiene reads were recorded under `165-24`. The branch-wide check reports `VERDICT: CLEAN` over all 159 committed changes.

## Task Commits

1. **Pre-gate: formatting-only fix of the ten format:check failures** - `ba2631e3a` (style)
2. **Task 1: schema apply, pgTAP, SQL lint, types drift (tracer)** - `9337e5427` (docs; gate record)
3. **Task 2: build, lint, format, unit** - `4bb1be919` (docs; gate record)
4. **Task 3: E2E and hygiene gate**
   - `7f4b95895` (fix): requireAdminIdentity spec through createSafeGetSession, with its comments restated. Superseded by the next commit
   - `52aa4d9a6` (docs): comment hygiene for index.ts, both entityGrant specs and the 21/24 pgTAP files
   - `1513025a8` (fix): restore the transcribed safeGetSession with the true reason, after the forced lint:check caught the adapter-boundary violation
   - `6cbd33266` (docs): E2E and hygiene gate record, read log, deferred-items update

**Plan metadata:** see the final `docs(165-24)` commit.

## Files Created/Modified

- `.planning/phases/165-review-stack-comment-remediation/165-24-GATE.md` - the interim gate record: every command, its exit status, both E2E run directories
- `.planning/phases/165-review-stack-comment-remediation/scripts/hygiene-reads/165-24.tsv` - 12 read rows
- `.planning/phases/165-review-stack-comment-remediation/deferred-items.md` - § From 165-24: which entries are resolved and who owns the rest
- `apps/supabase/supabase/tests/database/{07-rpc-security,21-entity-organization,24-legacy-removal}.test.sql` - prettier; 21 and 24 also have their comments and description literals rewritten
- `apps/supabase/supabase/schema/300-auth-tables.sql`, `migrations/00001_initial_schema.sql` - the prettier split of one GRANT, regenerated
- `apps/supabase/supabase/functions/invite-candidate/index.ts`, `*/entityGrant.test.ts` - prettier and comment hygiene; the two spec copies are still byte-identical
- `apps/frontend/src/lib/server/admin/requireAdminIdentity.test.ts` - prettier, comment hygiene, and a truthful transcription rationale
- `apps/frontend/src/lib/contexts/voter/filters/filterRelevance.test.ts`, `scripts/assert-project-scoped-queries.mjs` - prettier only

## Decisions Made

See `key-decisions` in the frontmatter.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] format:check failed on ten pre-existing files, five of them not in deferred-items.md**
- **Found during:** pre-gate check for Task 2
- **Issue:** `yarn format:check` exited 1 on the four SQL files 165-04 logged, on `scripts/assert-project-scoped-queries.mjs` (logged by 165-07, owner 165-26), and on five files no one had logged. All ten fail at `ship/v2.15-12-planning` too.
- **Fix:** `prettier --write` on all ten, plus `yarn schema:regenerate`.
- **Verification:** `yarn format:check` exit 0. `assert-schema-migration-parity.mjs` exit 0. pgTAP `Result: PASS` after the change.
- **Committed in:** `ba2631e3a`

**2. [Rule 1 - Bug] The plan's command order makes db:types drift**
- **Found during:** Task 1
- **Issue:** `yarn db:types` run after `test:db` added 13 `test_*` / `set_test_*` / `reset_role` functions to `database.ts`. pgTAP installs them as persistent public functions.
- **Fix:** Discarded the drift, reset again, and ran `db:types` first (no drift), then SQL lint and pgTAP.
- **Verification:** `git diff --exit-code HEAD -- packages/supabase-types/src/database.ts` exit 0.
- **Committed in:** none (no file change; recorded in `165-24-GATE.md`)

**3. [Rule 2 - Missing critical] The formatting commit put five hygiene-dirty files into the branch's changed set**
- **Found during:** Task 3 (the hygiene gate: 60 items, 12 unread)
- **Issue:** D-04 requires every changed file to be hygiene-clean.
- **Fix:** Comment and description-literal rewrites, proven code-identical, then reads recorded.
- **Verification:** the hygiene gate is `VERDICT: CLEAN` over 159 files. pgTAP passes. `assert-edge-env-defaults.mjs` passes (the copies are identical).
- **Committed in:** `52aa4d9a6`, `7f4b95895`, `1513025a8`

**4. [Rule 1 - Bug] My own `7f4b95895` broke the adapter-boundary lint rule**
- **Found during:** the Task 2 re-run on the final tree
- **Issue:** importing `$lib/supabase/safeGetSession` in a `lib/server/admin` spec violates the frontend's `no-restricted-imports` rule. A root-level eslint run had not applied the frontend config, so it did not catch it.
- **Fix:** restored the transcription. The docstring now names the real reason and the one difference, the per-token memo.
- **Verification:** `TURBO_FORCE=true yarn lint:check` exit 0; the spec passes 25/25.
- **Committed in:** `1513025a8`

---

**Total deviations:** 4 auto-fixed (2 bug, 1 blocking, 1 missing critical)
**Impact on plan:** All were needed for the gates to pass. The only scope beyond the plan is the formatting of ten files, which D-06's `format:check` requires.

## Issues Encountered

- The plan's literal `hygiene-changed-files.sh --base ship/v2.15-12-planning --check-reads` exits 1 on one path, the maintainer's uncommitted `MainContent.svelte`. The orchestrator forbids a read row for that file. The same check over the 159 committed changes exits 0, and `165-24-GATE.md` records both results. Plans 165-35 and 165-36 will hit the same state until the maintainer commits or drops that edit.
- Lint warnings (15 in dev-seed, 1 in frontend, 2 in tests) do not fail the gate. Every one is in a blob that predates the phase, or in a file whose phase edits touched only comments.

## Known Stubs

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- The branch is cardinal-green before the schema behaviour plans (165-25 onward), so a later red is attributable to those plans.
- Still open in `deferred-items.md` for 165-36: `adminJobsAuthorization.test.ts` (transcription rationale and planning labels), `metrics.type.ts`, `infoGeneration.ts`, `hooks.client.ts`, and the app-shared schema line anchors. None of these files is changed on the branch.

## Self-Check: PASSED

- FOUND: `165-24-GATE.md`, `scripts/hygiene-reads/165-24.tsv`
- FOUND commits: `ba2631e3a`, `9337e5427`, `4bb1be919`, `7f4b95895`, `52aa4d9a6`, `1513025a8`, `6cbd33266`
- `e2e-verdict.mjs` on the latest run directory exits 0; the scoped hygiene gate exits 0; `ledger-check.sh` exits 0

---
*Phase: 165-review-stack-comment-remediation*
*Completed: 2026-09-27*
