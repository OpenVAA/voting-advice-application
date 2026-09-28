---
phase: 165-review-stack-comment-remediation
plan: 28
subsystem: database
tags: [feedback, trigger, rls, pgtap, security, orphan-rows]

requires:
  - phase: 165-review-stack-comment-remediation
    provides: "165-01 instruments (hygiene-changed-files.sh, record-hygiene-read.sh, code-identity.mjs, e2e-verdict.mjs), 165-13's cleaned 22-content-policies feedback section, 165-27's migration read record"
provides:
  - "public.enforce_feedback_project () and the BEFORE INSERT trigger enforce_feedback_project on public.feedback"
  - "34-feedback-project-guard.test.sql, the orphan-feedback negative control"
affects: [165-24, 165-35, 165-36]

actuals:
  tokens: 2928
  tasks: 3
  commits: 3
plan_head_before: 7d3609a4633f7b4d2ab6a6ff041117f35e2d034f
plan_head_after: 1ec11070b6a267972106dc40b23c7fde016ee8a3

tech-stack:
  added: []
  patterns:
    - "An insert-time column requirement that RLS cannot carry for every caller is a SECURITY INVOKER BEFORE INSERT trigger raising not_null_violation with SCHEMA/TABLE/COLUMN diagnostics; the policy text stays as the content-policy suite asserts it"

key-files:
  created:
    - apps/supabase/supabase/tests/database/34-feedback-project-guard.test.sql
    - .planning/phases/165-review-stack-comment-remediation/scripts/hygiene-reads/165-28.tsv
  modified:
    - apps/supabase/supabase/schema/107-feedback.sql
    - apps/supabase/supabase/migrations/00001_initial_schema.sql
    - apps/supabase/supabase/tests/database/22-content-policies.test.sql
    - .planning/phases/165-review-stack-comment-remediation/165-LEDGER.md

key-decisions:
  - "The feedback project requirement is a BEFORE INSERT trigger (enforce_feedback_project), not a WITH CHECK (project_id IS NOT NULL) policy: the trigger also binds service_role, which bypasses RLS, and the INSERT policies keep the WITH CHECK (true) text 22-content-policies asserts"
  - "The trigger function is SECURITY INVOKER with no search_path setting, like the other enforce_* trigger functions: it reads only NEW and needs no owner rights"
  - "The negative control adds a service-role case beyond the plan's anon and authenticated cases, so a refusal cannot be credited to a policy"

patterns-established:
  - "Negative-control pgTAP files for a trigger pin the SQLSTATE and the exact message with throws_ok, and include one caller that bypasses RLS"

requirements-completed: [165-SC2, 165-SC3, 165-SC4, C-4080520167]

coverage:
  - id: D1
    description: "An insert into public.feedback without project_id fails with 23502 for anon, authenticated and service_role callers; a project-scoped insert succeeds; the project delete orphans the row"
    requirement: "C-4080520167"
    verification:
      - kind: other
        ref: "yarn workspace @openvaa/supabase supabase test db 00-helpers + 34-feedback-project-guard (exit 0, Files=2, Tests=17, Result: PASS; RED before the fix: 4/8 failed)"
        status: pass
    human_judgment: false
  - id: D2
    description: "Both feedback INSERT policies keep WITH CHECK (true) unchanged"
    requirement: "C-4080520167"
    verification:
      - kind: other
        ref: "git diff ship/v2.15-12-planning -- apps/supabase/supabase/schema/302-rls.sql | grep '^[+-].*CHECK (true)' (exit 1, no changed line); git diff HEAD~3 -- 302-rls.sql empty"
        status: pass
    human_judgment: false
  - id: D3
    description: "22-content-policies' feedback INSERT section names the trigger and the negative-control file, comment-only"
    requirement: "165-SC3"
    verification:
      - kind: other
        ref: "code-identity.mjs --blank-sql-literals 7d3609a46 WORKTREE 22-content-policies.test.sql (exit 0, 0 changed code)"
        status: pass
    human_judgment: false
  - id: D4
    description: "Full gate green after regenerate, reset and types"
    requirement: "165-SC4"
    verification:
      - kind: other
        ref: "yarn workspace @openvaa/supabase test:db (exit 0, Files=34, Tests=1254, Result: PASS)"
        status: pass
      - kind: other
        ref: "yarn db:lint:sql (exit 0, 0 errors, 3 pre-existing unindexed-FK warnings)"
        status: pass
      - kind: other
        ref: "TURBO_FORCE=true yarn lint:check (exit 0, 0 errors)"
        status: pass
      - kind: e2e
        ref: "tests/scripts/e2e-run.sh --run-dir tests/e2e-runs/165-28 --no-db-reset; e2e-verdict.mjs (VERDICT: GREEN, 165 expected, 0 failed, 0 flaky, 0 did-not-run)"
        status: pass
    human_judgment: false
  - id: D5
    description: "Every changed file passes the per-changed-file hygiene gate with current read records"
    requirement: "165-SC2"
    verification:
      - kind: other
        ref: "hygiene-changed-files.sh --check-reads --files <172 committed paths since ship/v2.15-12-planning> (167 in scope, VERDICT: CLEAN)"
        status: pass
    human_judgment: false

duration: 16min
completed: 2026-09-28
status: complete
---

# Phase 165 Plan 28: Feedback Project Guard Summary

**A `BEFORE INSERT` trigger, `enforce_feedback_project`, now refuses a `public.feedback` row without `project_id` with SQLSTATE 23502 for every caller, service_role included, so `ON DELETE SET NULL` is the only way to get an orphaned row. The INSERT policies keep `WITH CHECK (true)`. `34-feedback-project-guard.test.sql` went from 4 failures out of 8 to 8/8, full pgTAP passes (1254 tests) and the full E2E suite is GREEN (165/0/0/0).**

## Performance

- **Duration:** about 16 min
- **Started:** 2026-09-28T01:01:16Z
- **Completed:** 2026-09-28T01:17:35Z
- **Tasks:** 3 of 3
- **Files modified:** 4 shipped files (1 new), 1 read record, the ledger

## RED run (before the trigger)

`yarn workspace @openvaa/supabase supabase test db supabase/tests/database/00-helpers.test.sql supabase/tests/database/34-feedback-project-guard.test.sql` exited 1:

```
# Failed test 1: "public.feedback carries the enforce_feedback_project trigger"
# Failed test 2: "an anon insert that omits project_id is refused with not_null_violation"
#       caught: no exception
#       wanted: 23502
# Failed test 3: "an authenticated insert with project_id NULL is refused with not_null_violation"
#       caught: no exception
#       wanted: 23502
# Failed test 4: "a service-role insert without a project is refused too: the rule does not depend on row-level security"
#       caught: no exception
#       wanted: 23502
# Looks like you failed 4 tests of 8
Files=2, Tests=17 ... Result: FAIL
```

Tests 5-8 (the project-scoped insert and the orphaning delete) passed at RED, as expected: they pin behaviour the trigger must keep.

## GREEN and gate outputs (status read directly, never through a pipe)

| Command | Exit | Output |
|---|---|---|
| `yarn schema:regenerate` | 0 | 26 schema files -> 6244 lines; migration diff = the 25 lines added to `107-feedback.sql` |
| `yarn db:reset` | 0 | finished |
| `yarn db:types` | 0 | `database.ts` unchanged: trigger functions are not in the generated `Functions` map |
| targeted pgTAP (00-helpers + 34) | 0 | `Files=2, Tests=17`, `Result: PASS` |
| `git diff ship/v2.15-12-planning -- 302-rls.sql` for changed `CHECK (true)` lines | grep 1 | none; 302 changed only in comments from other plans |
| `code-identity.mjs --blank-sql-literals 7d3609a46 WORKTREE 22-content-policies.test.sql` | 0 | `1 compared, 0 changed code` |
| `yarn workspace @openvaa/supabase test:db` | 0 | `Files=34, Tests=1254`, `Result: PASS` |
| `yarn db:lint:sql` | 0 | `No schema errors found`; lint-schema `0 error(s), 3 warning(s)` (pre-existing unindexed FKs) |
| `TURBO_FORCE=true yarn lint:check` | 0 | 0 errors (pre-existing warnings only) |
| `bash scripts/tip-proofs.sh` | 0 | all PASS |
| `bash scripts/ledger-check.sh` | 0 | 78 rows, `VERDICT: PASSED` |
| `hygiene-changed-files.sh --check-reads --files <172 committed paths>` | 0 | 167 in scope, `VERDICT: CLEAN` |
| `hygiene-changed-files.sh --base ship/v2.15-12-planning --check-reads` | 1 | the only item is the maintainer's uncommitted `MainContent.svelte` (unread), excluded under the phase rule |
| `tests/scripts/e2e-run.sh --run-dir tests/e2e-runs/165-28 --no-db-reset` | 0 | `165 passed (10.6m)`, preflight 1 success / 0 failures, HEAD `2852dc061` |
| `e2e-verdict.mjs tests/e2e-runs/165-28` | 0 | `VERDICT: GREEN (expected 165 >= 165, 0 failed, 0 flaky, 0 did-not-run)` |

## Accomplishments

- `107-feedback.sql`: `public.enforce_feedback_project ()` (`LANGUAGE plpgsql SECURITY INVOKER`) raises `feedback.project_id must name a project` with `ERRCODE = 'not_null_violation'` and `SCHEMA`/`TABLE`/`COLUMN` diagnostics when `NEW.project_id IS NULL`. `CREATE TRIGGER enforce_feedback_project BEFORE INSERT ... FOR EACH ROW` attaches it. The header's `project_id` paragraph now says a NULL project arises only through `ON DELETE SET NULL`.
- `34-feedback-project-guard.test.sql` (`plan (8)`): the trigger exists; NULL-project inserts throw `23502` with the pinned message for anon (column omitted), authenticated `candidate_a` (explicit NULL) and service_role; an anon insert naming a project succeeds and names it; deleting that project leaves the row with `project_id IS NULL`.
- `22-content-policies.test.sql` section 11 says where the project requirement is enforced and asserted.

## Task Commits

1. **Task 1 (tracer): the orphan insert, red, then the trigger**: `a732305a9` (fix). Tracer gate: automated verify re-run, 17/17 PASS, then expanded.
2. **Task 2: content-policy suite note, full pgTAP and lint**: `2852dc061` (docs)
3. **Task 3: hygiene closure and the full E2E suite**: `1ec11070b` (chore)

Every commit carries `Review-Comment: C-4080520167` and stages explicit paths only.

## Review-comment dispositions

| Comment | Disposition | Commits | Evidence | Draft reply |
|---|---|---|---|---|
| C-4080520167 (#877 `107-feedback.sql:27`, Copilot) | fix | `a732305a9`, `2852dc061` | `34-feedback-project-guard.test.sql` 8/8 (RED 4/8 before the fix); full pgTAP 1254/1254; E2E GREEN 165/0/0/0 | Fixed in a732305a9: a `BEFORE INSERT` trigger, `enforce_feedback_project`, now refuses a feedback row without `project_id` (SQLSTATE 23502) for every caller, so orphaned rows arise only through `ON DELETE SET NULL`; the INSERT policies keep `WITH CHECK (true)`, because a trigger also covers service_role, which bypasses RLS; a `WITH CHECK (project_id IS NOT NULL)` policy is a one-line swap per role if preferred. |

The same row is filled in `165-LEDGER.md`.

## Files Created/Modified

- `apps/supabase/supabase/schema/107-feedback.sql`: trigger function, trigger, header sentence (blob `65e15195`).
- `apps/supabase/supabase/migrations/00001_initial_schema.sql`: regenerated (blob `7e1fcb79`).
- `apps/supabase/supabase/tests/database/34-feedback-project-guard.test.sql`: new (blob `3176704f`).
- `apps/supabase/supabase/tests/database/22-content-policies.test.sql`: one comment sentence (blob `10452513`).
- `.planning/phases/165-review-stack-comment-remediation/scripts/hygiene-reads/165-28.tsv`: four rows at the blobs above.

## Allowlist rows

None. The gate reported zero hits, so `hygiene-allow/165-28.tsv` was not created.

## Decisions Made

See `key-decisions` in the frontmatter.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing critical functionality] Service-role case in the negative control**
- **Found during:** Task 1
- **Issue:** The plan's anon and authenticated cases both run under RLS, so they cannot show whether the trigger or a policy is refusing the insert.
- **Fix:** Added a third `throws_ok` as `service_role`, which bypasses RLS, plus a `has_trigger` structural assertion. `plan (8)` in total.
- **Files modified:** `34-feedback-project-guard.test.sql`
- **Commit:** `a732305a9`

**Not a deviation, recorded for the verifier:** `packages/supabase-types/src/database.ts` is in the plan's `files_modified` but `yarn db:types` left it unchanged, because `RETURNS TRIGGER` functions are not in the generated types. Nothing was committed for it.

**Total deviations:** 1 auto-fixed (a stronger negative control). **Impact:** none on scope.

## Issues Encountered

- The hygiene gate's `--files` call with a derived path list needs bash 3.2-compatible array building (no `mapfile`) and a bash subshell, because the Bash tool's shell is zsh, which does not word-split an unquoted variable.

## Known Stubs

None.

## Threat Flags

None. The change narrows the existing INSERT surface (T-165-46, T-165-47 mitigated as planned) and adds no endpoint.

## User Setup Required

None.

## Next Phase Readiness

- The gate plans (165-24, 165-35, 165-36) find the four shipped files recorded in `hygiene-reads/165-28.tsv` at their current blobs. Any later edit to the migration voids its row.

## Self-Check: PASSED

- `34-feedback-project-guard.test.sql`, `107-feedback.sql`, the migration, `22-content-policies.test.sql` and `hygiene-reads/165-28.tsv` exist on disk.
- Commits `a732305a9`, `2852dc061` and `1ec11070b` are in `git log`.
- `git rev-list --count 7d3609a46..HEAD` = 3 before this SUMMARY commit.
- `git status --short` lists only the ledger (committed with this SUMMARY), the maintainer's unstaged `MainContent.svelte` and the untracked `.planning/milestone.lock`.
