---
phase: 187-deploy-pipeline
plan: "13"
subsystem: testing
tags: [closing-e2e, handoff, local-proof]
status: complete

requires:
  - phase: 187-12
    provides: "`GREEN_TREE=fa16b0c68…` of `evidence/187-12-evidence-commits.md`, the source tree every outward run pushes"
  - phase: 186-07
    provides: "the newest phase-186 `E2E_TREE_SHA=ee85b83a3…` (re-run after the review fixes)"
  - phase: 186-08
    provides: "`DEPLOYED_SHA=` and `SERVED_BUILD=` of `186-08-readiness.md`"
provides:
  - "`evidence/187-13-closing-e2e.md`: the phase's one full local E2E run, green (548 passed), `E2E_TREE_SHA=54e79823b1fa6a3548a82bdf2d27644e4b7af317`"
  - "`evidence/187-13-186-08-handoff.md`: `HANDOFF_TREE_REFERENCE` and `HANDOFF_SMOKE_EXPECTED_SHA` for plan 186-08, from local records only"
  - "`186-08-PLAN.md`: one inserted `## Superseded inputs (phase 187, 2026-11-15)` section, 8 lines added, 0 deleted"
affects: [186-08, 187-14, 187-17]

actuals:
  tokens: 2600
  tasks: 2
  commits: 2
plan_head_before: 54e79823b1fa6a3548a82bdf2d27644e4b7af317
plan_head_after: 96a3a9fcf4081e33fa5defb1d3bd674438c3b7ec

tech-stack:
  added: []
  patterns:
    - "Insertion-only edit to another phase's plan, proved by a blob-to-blob numstat with 0 deleted lines against the recorded NOTE_BASE_BLOB"

key-files:
  created:
    - .planning/workstreams/deployment/phases/187-deploy-pipeline/evidence/187-13-closing-e2e.md
    - .planning/workstreams/deployment/phases/187-deploy-pipeline/evidence/187-13-186-08-handoff.md
  modified:
    - .planning/workstreams/deployment/phases/186-deployed-smoke-entry/186-08-PLAN.md

key-decisions:
  - "Plan 186-08's tree reference is now this phase's closing run (54e79823b), not phase 186's (ee85b83a3); its expected SHA is 712947a1b from 186-08-readiness.md while staging serves it, then the tip of deploy/staging after a pipeline deploy"

requirements-completed: []

metrics:
  duration: 18min
  completed: 2026-11-15
---

# Phase 187 Plan 13: Closing local E2E run and the handoff to plan 186-08 Summary

**I ran the full local E2E suite once on the committed final tree and it passed: 548 of 548, no void run, no red run. Its tree outside `.planning/` is the green evidence commit's tree, and plan 186-08 now reads its two moved inputs from a handoff record that a dated note in its own plan file points to.**

```
E2E_GATE=green
E2E_TREE_SHA=54e79823b1fa6a3548a82bdf2d27644e4b7af317
E2E_WRAPPER_EXIT=0   E2E_VERDICT_EXIT=0
passed 548, failed 0, flaky 0, did not run 0, skipped 0
E2E_RUN_DIR=tests/e2e-runs/187-close-20261115T032900Z
```

Handoff values:

```
HANDOFF_TREE_REFERENCE=54e79823b1fa6a3548a82bdf2d27644e4b7af317   (HANDOFF_TREE_SINCE_REFERENCE=unchanged)
HANDOFF_SMOKE_EXPECTED_SHA=712947a1bd44a735f66ee8f51610f4748d76cd30   (read at 2026-11-14T23:47:45Z, = SERVED_BUILD)
```

The note's heading as written in `186-08-PLAN.md`: `## Superseded inputs (phase 187, 2026-11-15)`

## Performance

- **Duration:** about 18 min (E2E run 2026-11-15T03:28:52Z to 03:42:33Z)
- **Tasks:** 2
- **Files:** 2 created, 1 modified (all under `.planning/`)

## Accomplishments

- **The tree was checked before the run:** the working tree was clean and `.env` was present (`test -f` only). Every stack container was Up, with the edge runtime mounting this checkout's functions. Migrations were 1 against 1 and port 5273 was free. In a temporary index, the tree of HEAD without `.planning/` was `fa16b0c68…`, which is `GREEN_TREE`.
- **The one full-suite run of the phase:** `caffeinate -i tests/scripts/e2e-run.sh --run-dir tests/e2e-runs/187-close-20261115T032900Z --no-db-reset` printed `548 passed (12.8m)` and exited 0, with 0 preflight failures and no `VOID-host-suspend.txt`. `e2e-evidence.mjs` exited 0 and `e2e-spec-verdict.mjs --no-flaky` printed `VERDICT OK`. The count equals phase 186's closing run (548).
- **The handoff:** `HANDOFF_186_TREE_SHA=ee85b83a3…` is the newest phase-186 value. `HANDOFF_CHANGED_SINCE_186` lists only `tests/README.md`, with nothing under `apps/` or `packages/`. The tree reference is this run, and the expected SHA comes from the readiness record alone.
- **The note in `186-08-PLAN.md`:** inserted directly above `<tasks>`, it names the handoff file and both inputs and tells the executor that Task 1 must be made again. `NOTE_BASE_BLOB=8f182afc…` to the new blob shows `8 0` in numstat. `verify.plan-structure` still reports `valid: true` and `task_count: 3`. Its one warning (a one-way task with no preceding checkpoint:decision) is also there in the base blob.

## Task Commits

1. **Task 1: the phase's one full local E2E run:** `4ff51c078`
2. **Task 2: the handoff and the note in 186-08-PLAN.md:** `96a3a9fcf`

## Requirements coverage

PIPE-07 and SUPA-08: this plan shows locally that the tree every outward run will push passes the full local suite. I closed neither requirement here, because the operator notes leave them to the hosted plans 14–25, and I did not change REQUIREMENTS.md.

## Deviations from Plan

None. The plan ran as written. The handoff also says, for information, that phase 187's changes outside `apps/`, `packages/` and `tests/` (`.github/`, `infra/`, `scripts/`, the root `package.json` and `yarn.lock`) are covered too, because the closing run ran on the whole tree.

## Issues Encountered

None. The run was not void and not red, and I did not retry it.

## Notes for the orchestrator

- The -gsd worktree shares this Supabase stack. Before it continues, it must run `yarn db:stop`, `yarn db:start` and `yarn db:reset` from its own worktree. The stack is still running with this branch's schema.
- This plan made no request to a hosted service or to a remote. Plan 187-17 Task 1 does the live check that staging still serves `712947a1b…`.
- Nothing under `tests/e2e-runs/` was deleted.

## Self-Check: PASSED

- FOUND: evidence/187-13-closing-e2e.md, evidence/187-13-186-08-handoff.md, and the note in 186-08-PLAN.md
- FOUND: commits 4ff51c078 and 96a3a9fcf, both ancestors of HEAD
- Both tasks' `<automated>` verifies exited 0
