---
phase: 188-relay-on-the-deployed-stack-and-the-per-caller-limit
plan: "08"
subsystem: testing
tags: [e2e, playwright, gates, prettier, terraform-test, local-half-close]

requires:
  - phase: 188 (plans 01-07, 20)
    provides: the relay flush interval and queue, the per-caller limit (migration 00023, account-access wiring), the relay rate rule and Terraform changes, the load and read scripts
provides:
  - "E2E_TREE_SHA=9789bbcf6fc51885748972b84d8631a0e9c36f2b, the reference that plans 188-10 to 188-19 check apps/, packages/ and tests/ against"
  - "The phase's one full local E2E run, green: 729 passed, 0 failed, flaky, did not run or skipped"
  - "Every repository gate green on that tree (GATES_HEAD = E2E_TREE_SHA)"
affects: [188-10, 188-11, 188-12, 188-13, 188-14, 188-15, 188-16, 188-17, 188-18, 188-19]

actuals:
  tokens: 3400
  tasks: 2
  commits: 4
plan_head_before: f4b6a83114682e4885aeca26d583d4f088a85ce3
plan_head_after: 8ba3bfceba1bed58fcb152fc85750655aafc61c2

tech-stack:
  added: []
  patterns:
    - "Hold a task's evidence commit until the full E2E run has ended, so the run's HEAD is exactly the gated head"

key-files:
  created:
    - .planning/workstreams/deployment/phases/188-relay-on-the-deployed-stack-and-the-per-caller-limit/evidence/188-08-local-gates.md
    - .planning/workstreams/deployment/phases/188-relay-on-the-deployed-stack-and-the-per-caller-limit/evidence/188-08-closing-e2e.md
  modified:
    - apps/supabase/supabase/tests/database/59-invitation-caller-limit.test.sql
    - apps/docs/src/routes/(content)/developers-guide/backend/edge-functions/+page.md

key-decisions:
  - "Phase 188 local half closed: E2E_TREE_SHA=9789bbcf6fc51885748972b84d8631a0e9c36f2b, full suite 729/729 green, no project delta against 187-28-close; plan 188-10 diffs apps/, packages/ and tests/ against it before its push"
  - "The plan's comparison against 187-13's 548 is read as the last full run, 729 (187-28-close, the current lines of 187-13-closing-e2e.md), under the 2026-11-09 ruling"

requirements-completed: []

coverage:
  - id: D1
    description: "Every repository gate exits 0 on the closing tree: lint, format, unit (stack running), build, module and example terraform test"
    verification:
      - kind: other
        ref: "evidence/188-08-local-gates.md (statuses from tmp/188-08/gates/*.status)"
        status: pass
    human_judgment: false
  - id: D2
    description: "The phase's one full local E2E run, green and not void, on the gated tree"
    verification:
      - kind: e2e
        ref: "FRONTEND_PORT=5273 caffeinate -i tests/scripts/e2e-run.sh --run-dir tests/e2e-runs/188-close-20261118T195528Z --no-db-reset (729 passed; VERDICT OK --no-flaky)"
        status: pass
    human_judgment: false

duration: 27min
completed: 2026-11-18
status: complete
---

# Phase 188 Plan 08: The Local Half's Gates and Full E2E Run Summary

**E2E_TREE_SHA=9789bbcf6fc51885748972b84d8631a0e9c36f2b — 729 passed.** The full local suite is green on the gated tree: 0 failed, 0 flaky, 0 did not run, 0 skipped, and the run is not void. Every repository gate also passed on that tree, after two whitespace-only Prettier fixes in the files of 188-04 and 188-05.

## Performance

- **Duration:** about 27 min, 19 min of it the E2E run
- **Started:** 2026-11-18T19:48:57Z
- **Completed:** 2026-11-18T20:15:26Z
- **Tasks:** 2
- **Files modified:** 4 (2 evidence files, 2 whitespace fixes)

## Accomplishments

- **Gates (Task 1), on GATES_HEAD=9789bbcf6:** all exit 0, each read from its own status file.
  - lint, format and build.
  - unit, with the stack running.
  - The module's terraform test, 38/0, and the example root's, 1/0. Both ran offline with a scratch `TF_DATA_DIR`.
- **Full E2E run (Task 2):** `tests/e2e-runs/188-close-20261118T195528Z`.
  - Wrapper exit 0, preflight 1 success and 0 failures, `restore: ok`.
  - The heartbeat's worst lateness was 190 ms, so the run is not void.
  - The run's HEAD was GATES_HEAD both before and after it.
- **Against the last full run** (`187-28-close-20261116T234457Z`, 729): no project's count moved across all 129 projects, and no title was added or lost. The sum of the per-plan deltas, 0, is now measured rather than just reported.

## Task Commits

1. **Gate fix, format (188-04's pgTAP file)** - `ea2d660f3` (style)
2. **Gate fix, format (188-05's docs page)** - `9789bbcf6` (style)
3. **Task 1: the repository's gates on the closing tree** - `40cac26f1` (docs)
4. **Task 2: the phase's one full local E2E run** - `8ba3bfceb` (docs)

## Files Created/Modified

- `evidence/188-08-local-gates.md`: GATES_HEAD, TREE_CLEAN and the seven exit lines, plus the two red runs that came before.
- `evidence/188-08-closing-e2e.md`: E2E_TREE_SHA, the run directory, the counts, the verdict and the deltas.
- `apps/supabase/supabase/tests/database/59-invitation-caller-limit.test.sql`: one call wrapped to Prettier's print width.
- `apps/docs/src/routes/(content)/developers-guide/backend/edge-functions/+page.md`: two table rows padded to the column width.

## Decisions Made

- The record's line `E2E_PASSED_VS_187_CLOSE` compares against **729**, not the plan's 548. 729 is the last full run (the current lines of 187-13-closing-e2e.md), and 548 is superseded there.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] `yarn format:check` was red on 188-04's pgTAP file**
- **Found during:** Task 1, first gate run (HEAD f4b6a8311)
- **Issue:** One `invitation_caller_take` call in `59-invitation-caller-limit.test.sql` ran past Prettier's print width.
- **Fix:** Ran `prettier --write`. The change is whitespace only; the SQL statement is unchanged.
- **Commit:** ea2d660f3

**2. [Rule 1 - Bug] The docs workspace's format check was red on 188-05's docs page**
- **Found during:** Task 1, second gate run. The script chains the docs check after the root check with `&&`, so run 1 never reached it.
- **Issue:** Two rows of the operations table in `edge-functions/+page.md` were not padded to the column width.
- **Fix:** Ran `prettier --write`. The change is whitespace only.
- **Commit:** 9789bbcf6

After each fix every gate was run again on the fixed tree; the third run is the run of record.

**3. [Process] The tree was not literally clean**
- The precondition asks that `git status --porcelain` list nothing. It listed the two planning files the orchestrator owns, which the dispatch leaves uncommitted: `config.json` (`_auto_chain_active`) and `.verification-ledger.json`.
- Nothing outside `.planning/` differed from HEAD. The evidence records this next to `TREE_CLEAN=yes`, as 187-13's record did for the ledger.

**4. [Process] Task 1's evidence was committed after the E2E run**
- Task 2 requires HEAD to equal GATES_HEAD during the run, so Task 1's evidence file was written during the run and committed after it.
- As a result, `E2E_HEAD = E2E_TREE_SHA = GATES_HEAD`.

**Total deviations:** 2 auto-fixed (whitespace only, in earlier plans' files) and 2 process notes. **Impact:** none on scope; no gate was weakened.

## Issues Encountered

None beyond the two format reds.

## Next Phase Readiness

- Plans 188-10 to 188-19 check against `E2E_TREE_SHA=9789bbcf6fc51885748972b84d8631a0e9c36f2b`. `git diff --quiet 9789bbcf6..HEAD -- apps packages tests` exits 0 at the end of this plan.
- The shared stack is running and holds this branch's 23 migrations. The -gsd worktree must reset it from its own checkout before it continues.
- Requirements stay open: the dispatch says the deployed plans and the phase verifier close them.

## Self-Check: PASSED

- FOUND evidence/188-08-local-gates.md and evidence/188-08-closing-e2e.md
- FOUND commits ea2d660f3, 9789bbcf6, 40cac26f1, 8ba3bfceb on HEAD
- Task 1 verify exit 0; Task 2 verify exit 0 (VERDICT OK: 729 tests); acceptance `git diff --quiet "$S"..HEAD -- apps packages tests` exit 0
