---
phase: 189-documentation-and-closure
plan: "07"
subsystem: infra-docs
tags: [aws, cloudfront, alb, origin-header, secret-rotation, observations, operator-sitting]
status: complete

requires:
  - phase: 189 (CONTEXT E-03, H-01 (3))
    provides: the third operator sitting, one staging apply, and the origin-secret rehearsal it holds
  - phase: 183 (tools/attempt.sh)
    provides: the attempt file and the top-level binding of the operator's reply
provides:
  - "Step 19 of the staging AWS runbook, 'The origin header secret, rotated', under a new '## Secret rotation': a saved plan with -replace=module.frontend.random_password.origin_verify, a stop rule of exactly three changes, a once-a-second /api/health poller under caffeinate -i, the apply, a converged plan, the hash compare, Step 9's three direct requests and the recovery"
  - "One rotation observed on staging on 2026-11-20: stop rule met, Plan: 1 to add, 2 to change, 1 to destroy., apply exit 0 at 21:44:56Z, 5 403s over 5 seconds, no 5xx, health recovered, plan after reads No changes., value hash changed, CDN health 200"
  - "One dated Observations row in infra/envs/staging/aws/README.md citing 189-07-origin-rotation.md"
affects: [189-14]

actuals:
  tokens: 7444
  tasks: 3
  commits: 21 # measured from the ledger; 3 are this plan's, the other 18 are plans 189-11, 189-12, 189-17 and 189-18, committed between Task 1 and Task 3
plan_head_before: dc1659aa779a40dc24b955548c62011f19c627c0
plan_head_after: 62c564a2df5641da5c2c54ec9885a98850f9195b

tech-stack:
  added: []
  patterns:
    - "A rotation step computes its own stop rule from terraform show -json (exact address and action set) and applies the saved plan only when it prints met"
    - "An expected outage window is measured by a background poller writing <UTC time> <epoch> <status> once a second, reduced by awk to first/last non-200, counts and the largest gap"

key-files:
  created:
    - .planning/workstreams/deployment/phases/189-documentation-and-closure/evidence/189-07-origin-rotation.md
  modified:
    - infra/envs/staging/aws/README.md

key-decisions:
  - "Sitting 3 approved (attempt 20261120T163252Z.1971bfeb3, bound at top level). attempt.sh bound and has both exited 0 before anything was recorded. The paste had no answer_ lines; the orchestrator recorded answer_sitting=approve from the operator running the sitting and pasting its output, as the attempt file's note records"
  - "The three direct load balancer checks are recorded as observed, 000 with curl exit 28, never as 403: the security group admits CloudFront's prefix list only, so the listener rule's own 403 stays Step 9's observation"
  - "The rule's enforcement of the new value is evidenced by the 5 403s through the CDN while edges still sent the old value, then 200 through the CDN, and by the converged plan that refreshes both resources from AWS"

patterns-established: []

requirements-completed: [] # DOCS-06 is advanced, not met: the operations page's secret-rotation section (plan 189-14) cites this rotation

coverage:
  - id: D1
    description: "Step 19 is in the staging AWS runbook with the module address, a stop rule and a wake guard, and the runbook is Prettier-clean"
    requirement: DOCS-06
    verification:
      - kind: other
        ref: "Task 1 automated verify (previous executor, commits 932c9d4e0 and 1971bfeb3)"
        status: pass
    human_judgment: false
  - id: D2
    description: "The operator's Step 19 lines are bound and recorded as R1_ lines with one dated Observations row, formatted, and no 48-character value in the evidence"
    requirement: DOCS-06
    verification:
      - kind: other
        ref: "Task 3 automated verify, with R1_ORIGIN_NO_HEADER=403 and R1_ORIGIN_WRONG_HEADER=403 replaced by =000, exited 0"
        status: pass
    human_judgment: true

duration: about 15h wall clock, almost all of it waiting for the sitting
completed: 2026-11-21
---

# Phase 189 Plan 07: Sitting 3, the origin header secret rotated on staging Summary

R1_WINDOW_SECONDS=5
R1_HEALTH_403=5

**The operator ran Step 19 once, in a sitting they approved, and it rotated the origin header secret on staging in one apply. The plan replaced the password and updated the listener rule and the distribution, and nothing else, so the stop rule was met. The poller saw 5 403s over 5 seconds and no 5xx, and health recovered. A plan after the apply read `No changes.`, the value's hash changed, and `/api/health` through CloudFront answered 200. The three direct load balancer requests got no answer (`000`, curl exit 28), not 403. The security group admits CloudFront only, so those requests never reached the listener rule.**

## Performance

- **Duration:** Task 1 started 2026-11-20T16:22Z (ledger at `dc1659aa7`). The operator's apply completed at 21:44:56Z. Task 3 was committed at 2026-11-21T07:24Z. The span is the wait for the sitting, not work.
- **Tasks:** 3 (1 and 3 by executors, 2 by the operator)
- **Files modified:** 2

## Accomplishments

- Step 19, "The origin header secret, rotated", under "## Secret rotation" in `infra/envs/staging/aws/README.md` (Task 1).
- The rotation on staging, recorded as `R1_` lines copied from the bound attempt file:
  - `R1_STOP_RULE=met`
  - `R1_PLAN_SUMMARY=Plan: 1 to add, 2 to change, 1 to destroy.`
  - `R1_CHANGE=` the distribution `update`, the listener rule `update` and the password `delete-create`
  - `R1_APPLY_EXIT=0`, `R1_APPLY_COMPLETE_AT=2026-11-20T21:44:56Z`
  - `R1_HEALTH_FIRST_NON200=2026-11-20T21:44:14Z`, `R1_HEALTH_LAST_NON200=2026-11-20T21:44:19Z`, `R1_WINDOW_SECONDS=5`
  - `R1_HEALTH_403=5`, `R1_HEALTH_5XX=0`, `R1_HEALTH_OTHER=0`
  - `R1_HEALTH_MAX_GAP_SECONDS=3` (no sleep in the poll, so the window is a measurement)
  - `R1_HEALTH_RECOVERED=yes`, `R1_AFTER_PLAN_NO_CHANGES=yes`, `R1_VALUE_CHANGED=yes`, `R1_CDN_HEALTH_AFTER=200`
  - `R1_ORIGIN_NO_HEADER=000`, `R1_ORIGIN_WRONG_HEADER=000`, `R1_ORIGIN_RIGHT_HEADER=000`, each `_CURL_EXIT=28`
  - `R1_RECOVERY=not-needed`
- One dated Observations row (2026-11-20) in the runbook, citing `189-07-origin-rotation.md`. Prettier reports both files clean, and `yarn assert:comment-hygiene` exited 0.

## Task Commits

1. **Task 1: Step 19 written from the mechanism, with its stop rule and its expected 403 window**: `932c9d4e0` and `1971bfeb3` (docs; previous executor)
2. **Task 2: The operator runs Step 19 on staging**: no commit. The reply is stored under attempt key `189-07-2`, attempt `20261120T163252Z.1971bfeb3`, and was bound at top level.
3. **Task 3: The rotation recorded: the plan, the window, the converged state**: `62c564a2d` (docs)

## Files Created/Modified

- `evidence/189-07-origin-rotation.md`: Task 1's readiness lines, then the Task 3 section with the binding check, the `R1_` lines, the reading of the window and the deviation.
- `infra/envs/staging/aws/README.md`: Step 19 (Task 1) and one Observations row (Task 3).

## Decisions Made

- Before anything was recorded, the binding was checked with `attempt.sh bound 189-07-2 OPERATOR_REPLY plan=189-07 task=2` and `has 189-07-2 '^answer_sitting=approve$'`. Both exited 0. Every value came from the attempt file. The executor ran no Terraform and made no AWS call.
- `R1_WINDOW_SECONDS` is the last non-200 time minus the first (21:44:19Z minus 21:44:14Z), which matches the block's own `s19_health_window_seconds=5`.

## Facts carried to later plans

- These are for plan 189-14's secret-rotation section:
  - Rotating the origin secret is one apply of the running digest with `-replace=module.frontend.random_password.origin_verify`. The plan reads `Plan: 1 to add, 2 to change, 1 to destroy.` (assumption A1 held: the listener rule changes in place).
  - The 403 window measured **5 seconds, 5 403s, no 5xx**, from the edge location the workstation reaches. It closed 37 seconds before `Apply complete!`, because the apply waits for the distribution to read `Deployed`. Another edge location can see a different window.
  - A request from outside never reaches the listener directly. The page must not claim that the direct checks return 403 after a rotation.

## Deviations from Plan

**1. [Rule 1 - Correctness of the record] The direct origin checks are recorded as `000`, not 403.**
- **Found during:** Task 1 (carried to the sitting), confirmed at Task 3
- **Issue:** The plan's must_haves truth 4 and Task 3's automated verify expect `R1_ORIGIN_NO_HEADER=403` and `R1_ORIGIN_WRONG_HEADER=403`. The load balancer's security group admits CloudFront's managed prefix list only, so all three direct requests from the operator's host timed out at connect (`000`, curl exit 28) and never reached the listener rule. Seeing the rule's 403 from outside takes Step 9's `/32`, which needs two more applies. H-01 (3)'s single apply and the stop rule's three changes rule that out.
- **Fix:** The observed values are recorded as `R1_ORIGIN_NO_HEADER=000`, `R1_ORIGIN_WRONG_HEADER=000` and `R1_ORIGIN_RIGHT_HEADER=000`, each with its curl exit, and never as 403. The evidence that the rule enforces the new value is the 5 403s through the CDN during propagation, then `R1_CDN_HEALTH_AFTER=200`, together with the converged plan. Task 3's automated verify was run with exactly one substitution: the two literals `R1_ORIGIN_NO_HEADER=403` and `R1_ORIGIN_WRONG_HEADER=403` were replaced by `R1_ORIGIN_NO_HEADER=000` and `R1_ORIGIN_WRONG_HEADER=000`. Nothing else was changed, and it exited 0. Step 19's text already expected `000` with `_curl_exit=28` (Task 1). The Observations row states what was observed. No text needed correcting.
- **Files modified:** the evidence file and the runbook's Observations row
- **Commit:** `62c564a2d`

**2. [Measurement note] `actuals.commits` is 21, not 3.** The ledger counts every commit since `dc1659aa7`. Plans 189-11, 189-12, 189-17 and 189-18 committed 18 times between Task 1 and Task 3. This plan's own commits are `932c9d4e0`, `1971bfeb3` and `62c564a2d`.

## Issues Encountered

None. The recovery was not needed (`s19_recovery=not-needed`, with no other `s19_recovery_` line).

## Known Stubs

None.

## Threat Flags

None. No new surface. The header value was never printed or recorded, and the evidence contains no standalone 48-character alphanumeric value (T-189-13). The plan matched the stop rule's three addresses exactly (T-189-15). There was no push to `deploy/staging`, no destroy, and no other apply.

## Self-Check: PASSED
