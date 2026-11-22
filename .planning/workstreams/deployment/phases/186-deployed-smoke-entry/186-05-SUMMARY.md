---
phase: 186-deployed-smoke-entry
plan: "05"
subsystem: testing
tags: [playwright, deployed-smoke, negative-controls, gate, supabase, staging]
status: complete

requires:
  - phase: 186-deployed-smoke-entry
    provides: "186-02/186-03: tests/playwright.deployed.config.ts, tests/deployed-global-setup.ts, tests/tests/utils/deployedTarget.ts and the test:e2e:deployed root script"
provides:
  - "evidence/186-05-controls.md: the three negative controls of success criterion 2, each seen red on a real target with exactly its own FAIL line, plus the deployedTarget unit refusals run green beside them"
affects: [186-06 docs, 186-07 full suite, 186-08 hosted contestant run, 187 pipeline smoke]

actuals:
  tokens: 2145
  tasks: 2
  commits: 2
plan_head_before: a43a3ac9db308410bcf3752c392e725a65a824df
plan_head_after: 74e5e90c4c83a19ed41f373b59655161a775e6fe

tech-stack:
  added: []
  patterns:
    - "A negative control is a real target that differs from the green one in exactly one identity: wrong expected SHA against staging, a local production build of the deployed tree with another project id, or the same build pointed at the local stack"
    - "A local build carries the deployed identity by building with BUILD_SHA=<image_tag>, so the sha check passes and only the control's own check fails"

key-files:
  created:
    - .planning/workstreams/deployment/phases/186-deployed-smoke-entry/evidence/186-05-controls.md
  modified: []

key-decisions:
  - "Each control's server start, smoke run and stop ran inside one scratchpad script, so the key lived in one shell's variable for the life of the server and was unset right after the start"
  - "Research assumption A3 held: a production server on a project id with no rows answers / with 200 and still serves data-project-id and the env block"

patterns-established:
  - "Control run directories are tests/e2e-runs/186-05-<sha|project-id|ref>-<UTC stamp>"

requirements-completed: []

duration: 4min
completed: 2026-11-14
---

# Phase 186 Plan 05: Negative controls of the deployed smoke gate Summary

**The three negative controls of success criterion 2 seen red, each on its own gate check alone, before any spec: a wrong expected SHA against staging, and a wrong project id and a non-dedicated target from a local production build of the deployed tree (`BUILD_SHA=712947a1…`).**

## The three controls

```
CONTROL_SHA_EXIT=1
CONTROL_PROJECT_ID_EXIT=1
CONTROL_REF_EXIT=1
```

```
FAIL sha: observed 712947a1bd44a735f66ee8f51610f4748d76cd30, expected a43a3ac9db308410bcf3752c392e725a65a824df
FAIL project-id: observed 00000000-0000-0000-0000-0000000000ff, expected 00000000-0000-0000-0000-000000000001
FAIL ref: observed http://127.0.0.1:54321 (not https://<ref>.supabase.co), expected cofbsatfrdysyphajsky (https://cofbsatfrdysyphajsky.supabase.co)
```

Each run's other three checks were `PASS`, and each headline was `DEPLOYED SMOKE GATE FAILED — 1 of 4 checks failed`, thrown from global setup, so no spec ran. Every status was read directly from `$?`, never through a pipe.

- Control 1 ran against `https://staging.openvaa.org`, with `DEPLOYED_SHA` (`image_tag`) equal to `SERVED_BUILD` (from `/api/health`), both `712947a1bd44a735f66ee8f51610f4748d76cd30`, and `SMOKE_EXPECTED_SHA` set to HEAD `a43a3ac9…`. Run dir: `tests/e2e-runs/186-05-sha-20261114T231634Z`.
- Control 2 used the hosted URL and the hosted public anon key with `PUBLIC_PROJECT_ID=00000000-0000-0000-0000-0000000000ff`. Run dir: `tests/e2e-runs/186-05-project-id-20261114T231849Z`.
- Control 3 used `http://127.0.0.1:54321`, the local anon key and the dedicated project id `…0001`, which matched. Run dir: `tests/e2e-runs/186-05-ref-20261114T231900Z`.
- `SUPA09_UNIT_EXIT=0`: 76 of 76 cases of `deployedTarget.test.ts` passed. They refuse a made-up ref, the production ref `begckvkapaopoztbreqc`, local URLs, foreign hosts and a missing env block. They also refuse every environment key that might widen the ref. That the run cannot be pointed at a production project rests on these refusals.

## Performance

- **Duration:** about 4 min (2026-11-14T23:16:26Z to 23:20Z)
- **Tasks:** 2 of 2
- **Files modified:** 1 (the evidence file)

## Accomplishments

- The build `BUILD_SHA=712947a1… TURBO_CACHE_DIR=tmp/186-05/turbo-cache yarn build --filter=@openvaa/frontend` exited 0, with 11 of 11 tasks and 0 cached. `version.json` holds the deployed SHA (`CONTROL_BUILD_EXIT=0`, `CONTROL_BUILD_VERSION=712947a1…`).
- Both servers were started with `env -i` and only the named variables, on `127.0.0.1:3186`. Each answered `/api/health` with 200 and the deployed build. Each was stopped with SIGTERM after its smoke status had been read: `wait` returned 0 and the log has its one shutdown line. Port 3186 was free before each start and after each stop (`CONTROL_PORT_FREE=yes`).
- `CONTROL_TREE_CLEAN=yes`: nothing was tracked as changed outside `.planning/`. No file under `apps/`, `packages/` or `tests/`, and no config file, was edited.
- The JWT-shape search (`eyJ[A-Za-z0-9_-]{10,}\.`) found 0 matches in each server log, under `tmp/186-05/`, in the three run directories and in the evidence file.

## Task Commits

1. **Task 1: Control 1 and the unit refusals.** `c564136a5` (docs). Tracer feedback gate: the automated verify was re-run and passed, so the plan went on to Task 2.
2. **Task 2: Controls 2 and 3 from a local production build.** `74e5e90c4` (docs).

## Files Created/Modified

- `.planning/workstreams/deployment/phases/186-deployed-smoke-entry/evidence/186-05-controls.md` holds the three controls, the build, the unit refusals and the after-checks.
- These are ignored and were kept: `tests/e2e-runs/186-05-*` (3 run dirs), `tmp/186-05/` (the turbo cache, build log, unit log, server logs and health bodies), and `apps/frontend/build/` (the build output, version `712947a1…`).

## Decisions Made

- One scratchpad script (`186-05-control.sh`, outside the repository) ran the key read, the server start, the health wait, the smoke run and the server stop for each control. The key therefore never left one shell's variables, and it was `unset` once the server had started.

## Deviations from Plan

**1. [Rule 2 - Secret hygiene] The output of `yarn db:status` was briefly written to a scratchpad file**
- **Found during:** Task 2 precondition check
- **Issue:** To read its status, the output of `yarn db:status` was redirected to a file in the session scratchpad. That file was outside the repository, but the rules say the output of `supabase status` is never written to a file.
- **Fix:** The same command deleted the file right after the status was read. The file was never read or printed. The `supabase status -o env` call that reads control 3's key only ever held its output in a shell variable.
- **Files modified:** none in the repository
- **Commit:** none

Otherwise the plan ran as written. Each control failed on its own check alone, so the stop rule for a control failing on more than its own check never applied.

## Issues Encountered

None.

## User Setup Required

None.

## Next Phase Readiness

- Success criterion 2 is observed. The documentation in 186-06 can cite the three FAIL lines and the run directories.
- SUPA-09 stays Pending until 186-08.

## Self-Check: PASSED

- FOUND: .planning/workstreams/deployment/phases/186-deployed-smoke-entry/evidence/186-05-controls.md
- FOUND: c564136a5, 74e5e90c4 (ancestors of HEAD)
- FOUND: tests/e2e-runs/186-05-sha-20261114T231634Z/smoke.log, tests/e2e-runs/186-05-project-id-20261114T231849Z/smoke.log, tests/e2e-runs/186-05-ref-20261114T231900Z/smoke.log
- Both Task 2 automated verifies and the Task 1 verify were re-run green after the evidence was written.
