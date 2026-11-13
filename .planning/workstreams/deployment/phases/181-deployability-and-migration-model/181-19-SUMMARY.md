---
phase: 181-deployability-and-migration-model
plan: 19
subsystem: testing
tags: [e2e, closing-gate, frozen-baseline, supabase, playwright]
status: complete

# Dependency graph
requires:
  - phase: 181-18
    provides: evidence/181-18-local-gates.md -- build, test:unit, lint:check and format:check all 0 on 58cf7a564
  - phase: 181-17
    provides: the frozen baseline (FREEZE_COMMIT 12c98aa5c) and the parity guard in frozen mode
  - phase: 181-16
    provides: the earlier E2E gate (341 passed) and the green pgTAP verdict
provides:
  - evidence/181-19-closing-e2e-gate.md -- the closing E2E gate green on 4c9fba56b: wrapper exit 0, 548 passed, 0 failed, 0 did not run, 0 skipped, tree clean before, at and after the run
affects: [189]

# Actuals (#2632)
# tokens is chars/4 over the record this plan committed (4598 characters) plus this summary.
# commits is git rev-list --count plan_head_before..HEAD when this summary was written (both attempts' commits).
actuals:
  tokens: 3500
  tasks: 3
  commits: 4
plan_head_before: d59be0e28f61642b31347b5379eb0615a7bd7087
plan_head_after: bcdae3e1b5e164d58402923b96acb9ce3f19166a

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "A red attempt stays committed in the record's git history; the next attempt starts from Task 1 with a new id and a new confirmation"

key-files:
  created:
    - .planning/workstreams/deployment/phases/181-deployability-and-migration-model/evidence/181-19-closing-e2e-gate.md
  modified: []

key-decisions:
  - "The first attempt's red (voter-pageview-only, 1 failed, 338 did not run) was the run environment, not the tree: the root .env lacked the three ANALYTICS_* keys .env.example declares; the operator added them and the plan's command ran unchanged"
  - "The stack-free checkpoint was answered by the operator's standing authorisation of 2026-10-20, recorded verbatim and bound to the new attempt id and HEAD"

patterns-established:
  - "Before a full E2E gate, diff the variable names of .env.example against .env (operator-side, the executor may not read .env): a missing key added by a later phase surfaces as a spec failure plus a did-not-run cascade"

requirements-completed: [SUPA-10]

coverage:
  - id: D1
    description: "The phase closes on a green local E2E suite on the frozen tree: wrapper exit 0, no failed and no did-not-run test"
    requirement: "SUPA-10"
    verification:
      - kind: e2e
        ref: "evidence/181-19-closing-e2e-gate.md#E2E_WRAPPER_EXIT=0, E2E_PASSED=548, E2E_FAILED=0, E2E_DID_NOT_RUN=0 (run dir tests/e2e-runs/181-19-20261021T064028Z.c8096615aa8f)"
        status: pass
    human_judgment: false
  - id: D2
    description: "The local gates describe the commit the suite ran on, and no deferred observation is outstanding"
    requirement: "SUPA-10"
    verification:
      - kind: other
        ref: "Task 3 verify commands 1-3, all exit 0 (frozen-mode parity guard green, git diff 58cf7a564..4c9fba56b outside .planning/ empty)"
        status: pass
    human_judgment: false

# Metrics
duration: about 12h wall clock (2026-10-20T19:04Z first attempt to 2026-10-21T06:57Z); the green run itself took 13m40s (06:42:06Z to 06:55:45Z)
completed: 2026-10-21
---

# Phase 181 Plan 19: Closing E2E Gate Summary

**Full local E2E suite green on the frozen tree at 4c9fba56b, with a database reset from the frozen baseline: wrapper exit 0, 548 passed, 0 failed, 0 did not run, after an earlier attempt failed because the root .env lacked the analytics keys.**

## Performance

- **Duration:** about 12h wall clock across two attempts; the green run took 13m40s
- **Started:** 2026-10-20T19:04:47Z (attempt 1)
- **Completed:** 2026-10-21T06:57Z (attempt 2)
- **Tasks:** 3 of 3 (Task 1 and Task 3 each ran twice, once per attempt)
- **Files modified:** 1 (the evidence record)

## Accomplishments

- Attempt `20261021T064028Z.c8096615aa8f`: the full suite ran via `tests/scripts/e2e-run.sh --run-dir tests/e2e-runs/181-19-20261021T064028Z.c8096615aa8f`, without `--no-db-reset`, on HEAD 4c9fba56b. Wrapper exit 0; `summary.json` total 548, passed 548, failed 0, flaky 0, skipped 0, didNotRun 0, void null; preflight failures 0, successes 1.
- The tree was clean before, at and after the run: `E2E_HEAD`, the run directory's own `head` and `E2E_HEAD_AFTER` are all 4c9fba56b. The wrapper's `worktree-status.txt` lists only two untracked files, which are not this plan's.
- The local gates of plan 181-18 (58cf7a564) describe 4c9fba56b: `git diff --quiet` outside `.planning/` exits 0. The frozen-mode parity guard is green (1 migration in the manifest; baseline 9556 lines; 16 fixtures).
- Passed count 548, compared with 341 at plan 181-16. No drop: the suite gained the phase-182 specs.
- No deferred observation was outstanding: plan 181-08 recorded `PGTAP_EXIT=0` and plan 181-13 recorded `LOGIN_LEG=run`.
- The stack was stopped before the run (`yarn db:stop` 0) and after it (`yarn db:stop` 0).

## Task Commits

Attempt 1 (red):
1. **Task 1: readiness on d59be0e28** - `a3399d845` (docs)
2. **Task 3: red record, 1 failed, 338 did not run** - `c8096615a` (docs)

Attempt 2 (green):
1. **Task 1: readiness on c8096615a, new attempt** - `4c9fba56b` (docs)
2. **Task 2: standing confirmation** - no commit (written to the attempt file only, per the plan)
3. **Task 3: green record, 548 passed** - `bcdae3e1b` (docs)

## Files Created/Modified

- `.planning/workstreams/deployment/phases/181-deployability-and-migration-model/evidence/181-19-closing-e2e-gate.md` - a byte copy of attempt `20261021T064028Z.c8096615aa8f`. The attempt-1 version is in git history at `c8096615a`.

## Decisions Made

- The red result of attempt 1 was not retried until green. The cause was found from the spec's own failure message: no pageview reached `/api/usage`, so the server was not running with `ANALYTICS_PROVIDER=log`. The operator confirmed the cause by diffing the variable names in `.env.example` and `.env`. The operator added the missing keys to `.env` (`ANALYTICS_PROVIDER=log`, `ANALYTICS_CONSENT_MODE=gated`, `ANALYTICS_VISIT_ID_MODE=memory`). The tree outside `.planning/` did not change between the two attempts.
- Task 2 used the operator's standing authorisation, quoted verbatim in the record, instead of an answer that named the attempt. The authorisation was recorded with this attempt's id and HEAD and passed the plan's answer check.

## Deviations from Plan

- **Attempt rule, normal flow:** attempt 1 ended red, and attempt 2 started again from Task 1, as the attempt protocol requires.
- **Task 2 answer form:** the plan's resume signal asks for "stack is free <attempt id>". The operator's standing words, "Please stop asking whether the stack is free. It will be", contain "stack is free" but no attempt id. The orchestrator relayed them as the operator's standing authorisation for every stack-free checkpoint, so they were recorded verbatim with that note. The answer line was bound to the attempt id and HEAD as the plan requires.

## Issues Encountered

- Attempt 1 failed in the environment: `.env` lacked keys that a later phase (182) added to `.env.example`. The executor did not read `.env` (secret guard). The cause and the remedy in the record are the operator's facts.

## User Setup Required

- The v2.16 (-gsd) session must run `yarn db:reset` from its own worktree before it continues. This run reset the shared `openvaa-local` database and left the stack stopped.

## Next Phase Readiness

- SUPA-10 is closed. Phase 181 has all 19 plan summaries and is ready for phase verification.

## Self-Check: PASSED

- FOUND: evidence/181-19-closing-e2e-gate.md (cmp with the attempt file: identical)
- FOUND: commits a3399d845, c8096615a, 4c9fba56b, bcdae3e1b (all ancestors of HEAD)
- FOUND: tests/e2e-runs/181-19-20261021T064028Z.c8096615aa8f/summary.json, no VOID-host-suspend.txt
