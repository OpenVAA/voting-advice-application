---
phase: 186-deployed-smoke-entry
plan: "07"
subsystem: testing
tags: [e2e, gates, playwright, local-suite, sc4]
status: complete
requires:
  - phase: 186-04
    provides: "contestant grant script"
  - phase: 186-05
    provides: "negative controls"
  - phase: 186-06
    provides: "deployed smoke docs"
provides:
  - "evidence/186-07-final-gates.md: lint/format/unit exit 0, both deployed guards passed, SC4 diff empty, local list 548/127, deployed tree diff empty"
  - "evidence/186-07-closing-e2e.md: the phase's one full local E2E run, green, E2E_TREE_SHA=ac3d8d42bc20060f4c46825d51d2bcce3826dfc1"
affects: [186-08]
tech-stack:
  added: []
  patterns:
    - "Gate statuses written to <gate>.status by the next command and read from the file, never through a pipe"
key-files:
  created:
    - .planning/workstreams/deployment/phases/186-deployed-smoke-entry/evidence/186-07-final-gates.md
    - .planning/workstreams/deployment/phases/186-deployed-smoke-entry/evidence/186-07-closing-e2e.md
  modified: []
key-decisions:
  - "The local E2E run of record for phase 186 is tests/e2e-runs/186-close-20261114T233139Z at ac3d8d42b (548 passed, 0 failed/flaky/did-not-run); 186-08 must show nothing under apps/, packages/ or tests/ changed after E2E_TREE_SHA."
  - "The two deployed guards are evidenced by a second read-only verbose-reporter run of tests/vitest.config.ts, because the test:unit:tests default reporter prints only totals into a log file."
metrics:
  duration: "about 20 min"
  completed: 2026-11-14
actuals:
  tokens: 2000
  tasks: 2
  commits: 2
plan_head_before: 0ac8151e4a5fc2a003db02bbd776e22f8bcf5bce
plan_head_after: f462fe699988c2daf122ddd4a774f24417a1cde9
---

# Phase 186 Plan 07: Final gates and the one full local E2E run Summary

**E2E_GATE=green, E2E_TREE_SHA=ac3d8d42bc20060f4c46825d51d2bcce3826dfc1: 548 passed, 0 failed, 0 flaky, 0 did-not-run, 0 skipped (`tests/e2e-runs/186-close-20261114T233139Z`, wrapper exit 0, verdict `--no-flaky` exit 0, no void marker). Lint, format and unit gates exit 0 on the final tree; the local gate suite and its preflight are byte-identical to the phase base, the local list is still 548 tests in 127 files, and `apps/` and `packages/` still equal the deployed tree.**

## The record

```
E2E_GATE=green
E2E_TREE_SHA=ac3d8d42bc20060f4c46825d51d2bcce3826dfc1
E2E_PASSED=548  E2E_FAILED=0  E2E_FLAKY=0  E2E_DID_NOT_RUN=0  E2E_SKIPPED=0
E2E_WRAPPER_EXIT=0  E2E_VERDICT_EXIT=0  E2E_VOID_RUNS=0  RED_RUNS=0
lint:check exit=0
format:check exit=0
test:unit exit=0
GUARD_DEPLOYED_TARGET=passed      # 76 tests
GUARD_DEPLOYED_SMOKE=passed       # 11 tests
SC4_LOCAL_GATE_DIFF=empty         # vs a7a4222a8
LOCAL_LIST=Total: 548 tests in 127 files
DEPLOYED_TREE_DIFF=empty          # apps packages vs 712947a1b
```

## Tasks

| Task | Name | Commit | Files |
| ---- | ---- | ------ | ----- |
| 1 | The three repository gates and the unchanged-local-gate proofs (tracer) | ac3d8d42b | evidence/186-07-final-gates.md |
| 2 | The phase's one full local E2E run | f462fe699 | evidence/186-07-closing-e2e.md |

Tracer gate: Task 1's `<verify>` was re-run end to end after the commit's evidence was written and exited 0, so Task 2 went ahead.

## What was done

- Precondition: `yarn db:status` exit 0; the stack held this checkout's schema (`00001` only) and the edge runtime mounted this checkout's functions, so no restart was needed.
- Gates ran in sequence in the background under a private `TURBO_CACHE_DIR`, 23:28:35Z to 23:30:25Z, statuses read from files. Logs in `tmp/186-gates/186-07/`.
- E2E: `docker builder prune -af` (0B), `test -f .env` only, no listener on 5273, tree clean outside `.planning/`. One run, 23:31:43Z to 23:45:16Z, 548 passed (12.7m), preflight 1 success, 0 failures. `e2e-evidence.mjs` and `e2e-spec-verdict.mjs --no-flaky` both exit 0.
- F-02: no commit from `a7a4222a8` to HEAD touches `.planning/todos/`.

## Deviations from Plan

**1. [Rule 3 - Blocking] Guard file names taken from a second, verbose-reporter run**
- **Found during:** Task 1
- **Issue:** `yarn test:unit:tests` writes only `Test Files 12 passed (12)` / `Tests 276 passed (276)` into a log file, so the unit output did not name `deployedTarget.test.ts` and `deployedSmokeGuards.test.ts`.
- **Fix:** ran the same config once more with `--reporter=verbose` (read-only, exit 0, same 12 files / 276 tests); 76 `✓ deployedTarget.test.ts` and 11 `✓ deployedSmokeGuards.test.ts` lines, no failure. Recorded in the evidence.
- **Commit:** ac3d8d42b

**2. [Operator note - safest reversible option] The E2E wrapper ran under `caffeinate -i`**
- The operator is away overnight; `caffeinate -i` prevents idle sleep (which would void the run) and changes nothing the suite sees. Recorded as `HOST_SLEEP_GUARD` in the evidence.

**3. Turbo cache path:** a private `mktemp -d` directory under `tmp/186-gates/` (`turbo-cache.17q8AU`) rather than the literal `tmp/186-gates/turbo-cache`, so no earlier plan's cache entries can be reused. Same intent as the plan's rule.

## Follow-ups

- The -gsd worktree shares this stack: before it continues, run `yarn db:stop`, `yarn db:start`, then `yarn db:reset` from -gsd (the edge runtime mounts this worktree's functions).
- SUPA-09 stays Pending until 186-08; `requirements.mark-complete` was not run.

## Self-Check: PASSED

- FOUND: evidence/186-07-final-gates.md, evidence/186-07-closing-e2e.md
- FOUND: ac3d8d42b, f462fe699 (ancestors of HEAD)
- Both tasks' `<verify>` commands exit 0
