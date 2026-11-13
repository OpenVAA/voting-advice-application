---
phase: 181-deployability-and-migration-model
plan: 16
subsystem: testing
tags: [e2e, playwright, supabase, local-stack, edge-functions, verify-jwt, evidence]

# Dependency graph
requires:
  - phase: 181-15
    provides: evidence/181-15-local-gates.md, build, test:unit, lint:check and format:check all 0 on 3e3c828dd
  - phase: 181-05
    provides: "[functions.identity-callback] verify_jwt = false in apps/supabase/supabase/config.toml"
  - phase: 181-08
    provides: "PGTAP_EXIT=0 (not deferred)"
  - phase: 181-13
    provides: "LOGIN_LEG=run (not deferred)"
provides:
  - evidence/181-16-e2e-gate.md, the full local E2E suite green on 5a11cb4e4 with a database reset from this worktree (341 passed, 0 failed, 0 did not run, 0 skipped, not void)
  - the measurement of the identity-callback JWT setting before and after the stack was started from this worktree
affects: [181-17, 181-19, 184]

# Actuals (#2632)
# tokens is chars/4 over the lines added under .planning by this plan's three commits (7398 characters).
# commits is git rev-list --count plan_head_before..HEAD when this summary was written.
actuals:
  tokens: 1849
  tasks: 3
  commits: 3
plan_head_before: 6afc8da95d870dbdcda4cba09458c73eeaed23e6
plan_head_after: eb6f9d6f14f0570af5d3f330f3c3c9c275715282

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "A stack command that the permission layer refuses ends the attempt with ANSWER_VOIDED; the next attempt carries the reason as PREVIOUS_ANSWER_VOIDED and asks again only after the cause is removed"

key-files:
  created:
    - .planning/workstreams/deployment/phases/181-deployability-and-migration-model/evidence/181-16-e2e-gate.md
  modified: []

key-decisions:
  - "181-16: the pre-freeze tree (5a11cb4e4, no path outside .planning different from the local-gates commit 3e3c828dd) is green on the full local E2E suite: wrapper exit 0, 341 passed, 0 failed, 0 did not run, 0 skipped"
  - "181-16: the local stack honours [functions.identity-callback] verify_jwt = false: with no Authorization header the gateway answered 401 when started from a tree without the section, and the function itself answered 400 after a start from this worktree"

patterns-established:
  - "Stack-touching commands in this worktree are run exactly as the project allow rules name them: yarn db:stop on its own, bash tests/scripts/e2e-run.sh, no sh -c or nohup wrapper"

requirements-completed: []

coverage:
  - id: D1
    description: "The full local E2E suite is green on the pre-freeze tree, on a stack started and reset from this worktree, with nothing failed and nothing left unrun"
    requirement: "SUPA-10"
    verification:
      - kind: e2e
        ref: "bash tests/scripts/e2e-run.sh --run-dir tests/e2e-runs/181-16-20261016T160424Z.54dc259ada5d; node tests/scripts/e2e-evidence.mjs <run-dir>"
        status: pass
    human_judgment: false
  - id: D2
    description: "How the local stack serves identity-callback before and after the JWT setting was declared is measured"
    verification:
      - kind: other
        ref: "POST /functions/v1/identity-callback with no Authorization header: VERIFY_JWT_BEFORE_HTTP=401, VERIFY_JWT_AFTER_HTTP=400"
        status: pass
    human_judgment: false

# Metrics
duration: about 35 min of work over two days (2026-10-14T21:56Z to 2026-10-16T16:22Z, mostly waiting for the operator's window)
completed: 2026-10-16
status: complete
---

# Phase 181 Plan 16: Local E2E Gate on the Pre-Freeze Tree Summary

**On commit 5a11cb4e4, the full local Playwright suite passed: 341 passed, 0 failed, 0 did not run and 0 skipped, on a stack reset from this branch's migration. The `identity-callback` gateway check is now off locally: the request without an auth header got 401 from the gateway before, and 400 from the function itself after.**

## Performance

- **Duration:** about 35 min of work. The wall clock from 2026-10-14T21:56Z to 2026-10-16T16:22Z was spent mostly waiting for the operator's window.
- **Started:** 2026-10-14T21:56:36Z (attempt 1)
- **Completed:** 2026-10-16T16:22Z
- **Tasks:** 3, plus one voided attempt
- **Files modified:** 1 (the record)

## Accomplishments

- **E2E gate green.**
  - Command: `bash tests/scripts/e2e-run.sh --run-dir tests/e2e-runs/181-16-20261016T160424Z.54dc259ada5d`, with a database reset.
  - Wrapper: exit 0, "341 passed (8.2m)", preflight 0 failures and 1 success.
  - `summary.json` from `e2e-evidence.mjs`: total 341, passed 341, failed 0, flaky 0, skipped 0, didNotRun 0, `void` null.
  - Run conditions: 6 workers, 0 retries, largest heartbeat lateness 39 ms.
- **Tree stable throughout.** `E2E_HEAD`, `E2E_RUN_HEAD` and `E2E_HEAD_AFTER` are all `5a11cb4e4…`, and the three tree lines are all `yes`. The run's `worktree-status.txt` lists only the orchestrator's three untracked files.
- **Local gates describe the run commit.** `git diff --quiet 3e3c828dd 5a11cb4e4` over every path outside `.planning` exits 0, and `181-15-local-gates.md` is still the copy of its current attempt.
- **JWT setting measured (SUPA-05).** The request was a POST with no Authorization header.

  | When | Stack started from | HTTP status | Body | Who answered |
  |------|--------------------|-------------|------|--------------|
  | Before | the `-gsd` tree (no `[functions.*]` section) | 401 | `UNAUTHORIZED_NO_AUTH_HEADER` | the gateway |
  | After | this worktree (`verify_jwt = false`) | 400 | `Missing or invalid id_token` | the function itself |

  So the local stack honours the declaration. Nothing local is left for phase 184; the hosted gateway is not observed here.
- **Deferred observations: none.** 181-08 recorded `PGTAP_EXIT=0` and 181-13 recorded `LOGIN_LEG=run`, so this record writes `PGTAP_EXIT=not-deferred` and `LOGIN_POST_HTTP=not-deferred`.

## Task Commits

1. **Task 1, attempt 1** (`20261014T215636Z.6afc8da95d87`): readiness record, `54dc259ad` (docs).
2. **Task 2, attempt 1:** you replied "stack is free 20261014T215636Z.6afc8da95d87", and the answer check exited 0.
   - Task 3 measured `VERIFY_JWT_BEFORE_HTTP`, then step 2 (`yarn db:stop`) was **refused by the auto-mode permission classifier** ("Interfere With Workloads"). Nothing ran and the stack was untouched.
   - The attempt ended with `ANSWER_VOIDED=`. No tracked file was written, as for a stop at step 0.
3. **Task 1, attempt 2** (`20261016T160424Z.54dc259ada5d`): readiness record with `PREVIOUS_ANSWER_VOIDED=` carried over, `5a11cb4e4` (docs).
4. **Task 2, attempt 2:** you replied "stack is free 20261016T160424Z.54dc259ada5d (the other session doesn't need the db rn)", recorded as `yes`.
5. **Task 3, attempt 2:** answer check 0, then `TASK3_STARTED`, then `yarn db:stop`, the wrapper run, the JWT check after the restart, `yarn db:stop`, and the record. Commit `eb6f9d6f1` (docs).

All five verify commands (two for Task 1, three for Task 3) were run as written and exited 0.

## Files Created/Modified

- `.planning/workstreams/deployment/phases/181-deployability-and-migration-model/evidence/181-16-e2e-gate.md`: the record, a byte-for-byte copy of attempt `20261016T160424Z.54dc259ada5d`.
- Not tracked:
  - `tests/e2e-runs/181-16-20261016T160424Z.54dc259ada5d/` (ignored run directory, with `summary.json`, `provenance.txt` and no void marker);
  - `tmp/181-evidence/181-16-e2e-gate.*` (attempt files, pointer, status and output files).

## Decisions Made

None beyond the plan.

## Deviations from Plan

- **The first attempt was voided by the permission layer, not by the plan.**
  - What was refused: step 2's `yarn db:stop`. The rule for that case (an answer used with no wrapper run started) was applied: `ANSWER_VOIDED`, a new attempt, and `PREVIOUS_ANSWER_VOIDED`.
  - What was done about it: you then added project allow rules for `yarn db:stop`, `yarn db:reset` and `bash tests/scripts/e2e-run.sh *`. Attempt 2 ran the commands exactly in those forms.
  - Effect on the record: `git log` of the record shows the attempt-1 readiness commit followed by attempt 2. Attempt 1 has no run directory.
- **The `.env` name check was not made.**
  - What was refused: the check for the four variable names, by the secret-read guard hook. It was not retried in any form.
  - What was recorded instead: `ENV_FILE=present`, from a plain file test.
  - Before the first reply, the orchestrator relayed that you confirmed the four keys are in the file.
- **Readiness keys not named by the plan:** `FRONTEND_PORT_WRAPPER`, `FRONTEND_PORT_LISTENER`, `PLAYWRIGHT_INSTALL_EXIT` and `OPENVAA_LOCAL_RUNNING`. Each is written once.

## Issues Encountered

- **Refused commands:**
  - attempt 1: a `nohup sh -c` wrapper around `yarn playwright install`, refused by the rm-safety check. I ran the plan's plain form instead.
  - attempt 1: the `.env` name grep, refused by the secret-read guard.
  - attempt 1: `yarn db:stop`, refused by the auto-mode classifier.

  None was reworded. Nothing was refused in attempt 2.
- **The stack was restarted from `-gsd` between the attempts,** at 2026-10-16T14:25Z. That is why the "before" JWT measurement is of a stack started from the `-gsd` tree, which has no `[functions.*]` section. I confirmed this from the edge runtime's mount source.

## User Setup Required

**The v2.16 session must run `yarn db:reset` from its own worktree (`voting-advice-application-gsd`) before it uses the database again.** The shared `openvaa-local` stack is stopped, and its database was rebuilt from this branch's migration.

## Next Phase Readiness

- Plan 181-17 (freeze) can start from `eb6f9d6f1`. Plan 181-19 runs this gate again after the freeze, as a new attempt with its own confirmation.
- SUPA-10 stays open until the last plan of the phase. `requirements.mark-complete` was not run.

## Self-Check: PASSED

- FOUND: `evidence/181-16-e2e-gate.md`, a byte copy (`cmp` 0) of the attempt file the pointer names.
- FOUND: `tests/e2e-runs/181-16-20261016T160424Z.54dc259ada5d/summary.json`; no `VOID-host-suspend.txt`.
- FOUND: commits `54dc259ad`, `5a11cb4e4` and `eb6f9d6f1` are ancestors of HEAD. `commits: 3` is `git rev-list --count 6afc8da95..eb6f9d6f1`.
