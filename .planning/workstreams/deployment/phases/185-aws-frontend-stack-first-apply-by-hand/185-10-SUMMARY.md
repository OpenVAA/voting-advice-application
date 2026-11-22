---
phase: 185-aws-frontend-stack-first-apply-by-hand
plan: "10"
subsystem: infra
status: complete
tags: [gates, lint, format, unit, terraform, ci, infra-validate]
requires:
  - phase: 185-01
    provides: the bootstrap root's code
  - phase: 185-02
    provides: the task-environment guard (taskEnvironment.test.ts)
  - phase: 185-03
    provides: the shutdown record (shutdownLog.test.ts)
  - phase: 185-05
    provides: build-push-image.sh and request-loop.sh with their tests
  - phase: 185-07
    provides: the infra-validate job's module-test step
  - phase: 185-09
    provides: the finished runbook, the last code-adjacent change before the apply
provides:
  - evidence/185-10-code-gates.md, the seven gate records at exit 0 on one code tree
  - a corrected infra-validate spec that requires the !cancelled() condition on each check step by name
affects: [185-11, 185-12]
tech-stack:
  added: []
  patterns:
    - "A CI job spec reads the job's steps by name and pins the steps after the first check, so a new step without the condition fails by name rather than by a count"
key-files:
  created:
    - .planning/workstreams/deployment/phases/185-aws-frontend-stack-first-apply-by-hand/evidence/185-10-code-gates.md
  modified:
    - packages/dev-seed/tests/infraValidateJobGate.test.ts
key-decisions:
  - "The red unit gate was fixed in the infra-validate spec, not in the job: the job's third !cancelled() step is what plan 185-07 required, and the spec's count of two was stale"
  - "The spec ties the condition to the three named steps after the formatting check rather than raising the count to three, so the gate is stronger than before"
  - "All three repository gates were run again on the fix commit, so the seven records describe one code tree"
patterns-established:
  - "Infra validation run locally gives each root and module its own fresh TF_DATA_DIR, as a fresh CI checkout would"
requirements-completed: [INFRA-05, INFRA-11]
duration: 13min
completed: 2026-11-12
actuals:
  tokens: 3100
  tasks: 2
  commits: 3
plan_head_before: a6b6e4c94c11f4d9d2bbe8559d5a001576de2103
plan_head_after: 5c971ab62c1fa054e912cc8fef742429389198c0
---

# Phase 185 Plan 10: The Gates on the Phase's Code Before the First Apply Summary

**All seven gates exit 0 on one code tree, `633d09151`: `lint:check`, `format:check`, `test:unit` (with the infra suite and the task-environment guard), and the four commands of the `infra-validate` job (fmt, 8 roots validated, 1 module tested with 32 runs, the settings types). Getting there took one fix to a stale CI spec that plan 185-07 had left red.**

## Performance

- **Duration:** about 13 min
- **Completed:** 2026-11-12T18:48Z
- **Tasks:** 2 of 2
- **Files:** 1 created (the evidence), 1 modified (the spec)

## Accomplishments

- The shared local stack held the other checkout's schema (`00001` to `00010`) and its edge functions mount. It was reset from this checkout, under the standing authorisation, to migration `00001`, with the edge runtime Up on this checkout's functions.
- Run 1 found a real defect: `@openvaa/dev-seed#test:unit` was red in `infraValidateJobGate.test.ts`. The spec counted two `if: ${{ !cancelled() }}` steps, and 185-07's module-test step made it three. The spec was fixed and a mutation check was run on it.
- Run 2 on the fix commit: `lint:check exit=0`, `format:check exit=0`, `test:unit exit=0` (turbo 25 of 25, dev-seed 1266 of 1266, frontend 5980 passed with 31 skipped, tests 189, infra 102).
- The named files were seen passing: `build-push-image.test.ts`, `request-loop.test.ts` and `probe-hosted.test.ts` (infra suite, verbose run), plus `taskEnvironment.test.ts` and `shutdownLog.test.ts` (frontend).
- The `infra-validate` commands: `infra_fmt exit=0`, `infra_validate exit=0` (8 roots), `infra_module_tests exit=0` (1 module, `32 passed, 0 failed`), `settings_types exit=0`.

## Task Commits

1. **Task 1: The three repository gates.** The fix is `633d09151` (fix); the evidence is `15f1cbc09` (docs).
2. **Task 2: The validation job's commands.** `5c971ab62` (docs).

## Files Created/Modified

- `.planning/workstreams/deployment/phases/185-aws-frontend-stack-first-apply-by-hand/evidence/185-10-code-gates.md`: the seven records, the commit ids, the dates, run 1's red and its cause, and the stack reset
- `packages/dev-seed/tests/infraValidateJobGate.test.ts`: a `jobSteps` reader, and a test that names the three steps after the formatting check and requires `if: ${{ !cancelled() }}` on each of them

## Decisions Made

See `key-decisions` in the frontmatter.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] The infra-validate spec was stale after 185-07's module-test step**
- **Found during:** Task 1, run 1 of `yarn test:unit`
- **Issue:** `tests/infraValidateJobGate.test.ts` expected exactly two `if: ${{ !cancelled() }}` conditions in the job. 185-07 (`4b27954cc`) added a third step, as its plan required, so `@openvaa/dev-seed#test:unit` failed with `expected [ 'if: ${{ !cancelled() }}', …(2) ] to have a length of 2 but got 3`.
- **Fix:** the spec now reads the job's steps by name. It pins the three steps after the formatting check and requires the condition on each of them, with the total count tied to those steps. A mutant with the condition deleted from the module-test step failed by that step's name, and `main.yaml` was restored afterwards.
- **Files modified:** `packages/dev-seed/tests/infraValidateJobGate.test.ts`. Not in the plan's `files_modified`, but the defect came from this phase's change to the job.
- **Commit:** `633d09151`

### Other differences

- **The stack reset before the gates.** `yarn db:status` exited 0, so the precondition held, but the stack carried the other checkout's ten migrations. `yarn db:stop` and `yarn db:reset` were run from this checkout, as in 185-03, so that the dev-seed integration tier tested this branch's schema.
- **The infra suite's file names come from a verbose run.** In a non-interactive shell the gate's root vitest runs print only their summary. So the three infra file names were read from `yarn test:unit:infra --reporter=verbose` on the same commit: exit 0, 102 tests, the gate's count.
- **A fresh `TF_DATA_DIR` per root and module** for the infra commands, so that the operator's backend records in `infra/bootstrap`, `staging/dns-mail` and `staging/supabase` were not touched. The commands were otherwise the job's own.

**Total deviations:** 1 auto-fixed (Rule 1). **Impact:** the gate the plan exists to run was red because of this phase. It is now green, and stronger than before.

## Issues Encountered

None beyond the deviation above.

## Known Stubs

None.

## User Setup Required

None.

## Next Phase Readiness

- The tree the image is built from (plan 185-12) is green on every repository gate and on the CI validation job's commands. The flagged prohibition, that no hosted plan starts on a red tree, is satisfied as of `5c971ab62`.
- Any commit after this one that touches code outside `.planning/` needs these gates run again before the image is built.

## Self-Check: PASSED

- FOUND: `.planning/workstreams/deployment/phases/185-aws-frontend-stack-first-apply-by-hand/evidence/185-10-code-gates.md`
- FOUND: `packages/dev-seed/tests/infraValidateJobGate.test.ts`
- FOUND: `633d09151`, `15f1cbc09`, `5c971ab62` (ancestors of HEAD)
