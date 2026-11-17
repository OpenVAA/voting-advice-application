---
phase: 187-deploy-pipeline
plan: "28"
subsystem: infra
tags: [ci-evidence, rebase, e2e-tests, e2e-visual, workers, trace, dependency-audit, main-yaml, gap-closure, g-03]
status: complete
requirements-advanced: [SUPA-08, PIPE-02, PIPE-06]

requires:
  - phase: 187-27
    provides: "run 43938990256 read job by job, and the measurement (evidence/187-28-ci-measurement.md) that traced e2e-tests' and e2e-visual's failures to the 4-vCPU runner's oversubscription and to stale portrait baselines"
provides:
  - "`evidence/187-28-ci-closure.md`: the rebase readings, the deviation of the fix tip to cecf649d8, the gates, the evidence commits and the green scan, the void red build, the closing E2E window, the push under attempt 20261117T064156Z.a9f5a5bde, and run 44033456141 read job by job"
  - "Public: branch `ci-evidence/187-final-4` at 68a54299aa81b2a2f95fd2151031ab4e624ef01c, and run 44033456141 with every job green but the accepted dependency-audit"
  - "G-03 closed; plans 187-15, 187-26 and 187-27 closed by pointer and ticked"
  - "`.planning/todos/pending/2026-11-17-local-supabase-ports-in-ephemeral-range.md`"
affects: [187-15, 187-18, 187-26, 187-27, 189]

estimate:
  tokens: 120000
  tasks: 5
actuals:
  tokens: 23000
  tasks: 5
  commits: 8
plan_head_before: b39112fb7591aa541063e2b4cde5eeb3950ec1d1
plan_head_after: 36f89c1a2bacb7fd5d496220c919dc8ea505dc03

tech-stack:
  added: []
  patterns:
    - "A failure in a CI or local step that runs before the step under test (out of memory at `yarn install`, a host port already bound at `supabase start`) is ruled void by the operator and made once more; it is never counted as red or green, and never re-run until green"

key-files:
  created:
    - .planning/workstreams/deployment/phases/187-deploy-pipeline/evidence/187-28-ci-closure.md
    - .planning/todos/pending/2026-11-17-local-supabase-ports-in-ephemeral-range.md
  modified:
    - .planning/workstreams/deployment/phases/187-deploy-pipeline/187-28-PLAN.md
    - .planning/workstreams/deployment/phases/187-deploy-pipeline/evidence/187-12-evidence-commits.md
    - .planning/workstreams/deployment/phases/187-deploy-pipeline/evidence/187-13-closing-e2e.md
    - .planning/workstreams/deployment/phases/187-deploy-pipeline/187-15-SUMMARY.md
    - .planning/workstreams/deployment/phases/187-deploy-pipeline/187-26-SUMMARY.md
    - .planning/workstreams/deployment/phases/187-deploy-pipeline/187-27-SUMMARY.md
    - .planning/workstreams/deployment/ROADMAP.md

key-decisions:
  - "G-03 is closed on run 44033456141 (ci-evidence/187-final-4, 68a54299a): every job concluded success at job level except dependency-audit, accepted per the phase-189 todo with no new row; e2e-tests passed 729 of 729 on 4 workers"
  - "The fix tip moved from dfe9cae8b to cecf649d8 (-gsd, the trace comment's forced line break joined) after Task 1's first attempt stopped on lint:check; the branch was rebased again and only the verify commands naming the fix tip were amended"
  - "Two failures before the step under test were ruled void and made once more: the red archive build's out-of-memory at yarn install (orchestrator ruling), and e2e-visual's attempt-1 host-port collision at supabase start (operator ruling \"void + rerun\"; only that job re-run, attempt 2 green)"
  - "Plans 187-15, 187-26 and 187-27 keep status stopped and are closed by plan 187-28; SUPA-08, PIPE-02 and PIPE-06 are recorded advanced, not complete, because plans 187-18 to 187-25 still carry them"

duration: 8h15min (wall clock 2026-11-16T23:20Z to 2026-11-17T07:36Z, including the orchestrator's rulings, the push and the CI run)
completed: 2026-11-17
---

# Phase 187 Plan 28: The rebased branch carried to a green CI run, and G-03 closed Summary

```
CI_RUN_URL=https://github.com/OpenVAA/voting-advice-application/actions/runs/44033456141
SECRET_SCAN=success
FRONTEND_AND_SHARED_MODULE_VALIDATION=success
E2E_TESTS=success
E2E_VISUAL=success
INFRA_VALIDATE=success
DEPENDENCY_AUDIT=failure (accepted per the phase-189 todo)
CI_E2E_WORKERS=4
```

**The rebased final tree, carrying the -gsd CI fix, is green in CI. `e2e-tests` passed 729 of 729 on 4 workers, and `e2e-visual` passed 8 of 8 on its re-run. Every other job succeeded, apart from `dependency-audit`, whose 17 third-party rows are the phase-189 todo's. That closes G-03, and with it plans 187-15, 187-26 and 187-27.**

## What was done

- **Task 1: the rebase and the gates.**
  - The first attempt was made on the tree rebased onto `dfe9cae8b`. It stopped on `lint:check`: the comment-hygiene guard failed on `tests/playwright.config.ts:1622`, a forced line break that -gsd commit `2934f0c67` exposed.
  - -gsd fixed it in `cecf649d8`, and the branch was rebased again.
  - On the second attempt the source delta against `backup/infra-pre-rebase-2026-11-17` is exactly `9cd30f7a5..cecf649d8`. Both diffs have patch-id `d0d9a1159a07…`.
  - Every gate exited 0: lint, format, typecheck, unit, workflows, the wrapper's self-test, infra vitest (323 tests), tests vitest (358 tests) and the Terraform loops.
- **Task 2: the evidence commits and the scan.**
  - Green commit `68a54299a`: HEAD's tree without `.planning/`, with parent `origin/main` (`340a20070`). It builds from its archive.
  - Red commit `3250ba0e8`: it fails at the frontend build, naming the missing module.
  - The red build's first attempt ran out of memory at `yarn install` and was ruled void.
  - The green commit scans 0 results at trufflehog 3.97.9. It differs from `ci-evidence/187-final-3` by exactly the fix branch's six paths.
- **Task 3: the closing E2E window.**
  - The full local suite ran on the functions env template, with the developer's file moved aside: 729 passed, 0 failed, 0 flaky, 0 did not run, not void.
  - That equals the last full run's count; the summed deltas are 0.
  - The developer's file is back with the same inode, size and mtime.
  - `READY_TO_PUSH=yes`.
- **Task 4: the push.**
  - The orchestrator pushed `ci-evidence/187-final-4` at 06:44:28Z on a fresh operator approval, attempt `20261117T064156Z.a9f5a5bde`.
  - All four checks exited 0 just before it.
- **Task 5: the run, job by job.**
  - Run 44033456141 was read job by job.
  - `e2e-visual`'s attempt 1 failed before any visual test ran: `supabase start` found host port 54326 already bound on the runner. The operator ruled it "void + rerun", and only that job was re-run; attempt 2 passed.
  - The closure followed: pointers, `requirements-advanced` lines, ROADMAP ticks, and one todo for the ports' place in the ephemeral range.

## Deviations from Plan

### Auto-fixed Issues

None in code. Nothing outside `.planning/` changed.

### Recorded deviations

**1. The fix tip moved from `dfe9cae8b` to `cecf649d8`**
- **Found during:** Task 1, on the first attempt (`lint:check` exit 1, owner -gsd).
- **Resolution:** -gsd fixed the comment and the branch was rebased again. I amended only the verify commands that name the fix tip, in Task 1 and Task 2, in commit `6d1ad7ed5`.
- **Record:** the first attempt's lines are kept as `*_SUPERSEDED=`.

**2. The void red build**
- **Found during:** Task 2. The red archive build exited 102 at `yarn install` with "cannot allocate memory".
- **Resolution:** the orchestrator ruled it void and made one new attempt after `yarn db:stop` of this checkout's stack. That attempt exited 1 at the frontend build, as expected.
- **Record:** its lines are `*_VOID=`. Its log was overwritten by the new attempt, so it survives only in the evidence.

**3. The void e2e-visual attempt 1 (Task 5)**
- **Found during:** Task 5. `supabase start` could not bind host port 0.0.0.0:54326.
- **Resolution:** the operator ruled "void + rerun", and only that job was re-run, as run attempt 2, job 133887903492: `8 passed (40.5s)`.
- **Record:** the attempt-1 lines are `*_VOID=`, and the stop lines are `*_SUPERSEDED=`.
- **Follow-up:** filed as `.planning/todos/pending/2026-11-17-local-supabase-ports-in-ephemeral-range.md`.

## Known Stubs

None.

## Next

- Plan 187-18 can start, on a tree that CI has read green.
- The -gsd worktree shares the local stack, and must reset it from its own worktree before it continues (`GSD_SESSION_MUST_RESET=yes`).

## Self-Check: PASSED

- The files exist: `evidence/187-28-ci-closure.md`, the todo, and this file.
- Every commit is an ancestor of HEAD: `494bfa63b`, `6d1ad7ed5`, `246f5dc8b`, `78ebbc563`, `450632a5c`, `a9f5a5bde`, `53859170b` and `36f89c1a2`.
- The verifies of Tasks 1, 2, 3 and 5 each exit 0 at `36f89c1a2`.
