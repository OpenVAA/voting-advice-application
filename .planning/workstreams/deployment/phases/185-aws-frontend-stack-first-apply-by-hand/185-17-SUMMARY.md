---
phase: 185-aws-frontend-stack-first-apply-by-hand
plan: "17"
subsystem: infra
status: complete
tags: [aws, ecs, application-auto-scaling, scheduled-action, target-tracking, sigterm, runbook]
requires:
  - phase: 185-16
    provides: the restored staging AWS stack (revision 5, one task, plan with no change)
provides:
  - Step 12 of the staging AWS runbook observed, with the stack back to its plain shape
  - evidence/185-17-scaling.md, with the minute reads, the scaling activities and the scale-in's stop record
  - research A3 settled, with scale-in at idle measured under a minute, not 15 to 20
  - Step 12 corrected to keep the workstation awake for the minute reads and to read item 6 at once
affects: [185-18, 185-19, 185-20, election-day]
tech-stack:
  added: []
  patterns:
    - "A host suspend voids a per-minute poll as it voids an E2E run: the run is kept, not counted, and the step is run again; AWS's own activity and event records are second-resolution corroboration"
    - "Long local polls run under caffeinate -i, started before the loop and killed after it"
key-files:
  created:
    - .planning/workstreams/deployment/phases/185-aws-frontend-stack-first-apply-by-hand/evidence/185-17-scaling.md
  modified:
    - infra/envs/staging/aws/README.md
key-decisions:
  - "The first run's minute reads had 8- and 92-minute gaps from a lid-closed sleep, so they were not taken as the record. The first pair was removed with the removal's expected shape, and the step was run again with new times. The record lines are the second run's."
  - "BELOW_FLOOR_SEEN is judged on the desired count, as the runbook says. One read had the running count 1 against the raised floor 2, 33 seconds after the raise while the task was starting, and the evidence names it."
requirements-completed: [INFRA-07, INFRA-09]
duration: 134min (about 40 min of work and polling; about 92 min of it the host asleep in the first run)
completed: 2026-11-13
estimate_ref:
  tokens: 18000
  tasks: 2
actuals:
  tokens: 5400
  tasks: 2
  commits: 2
plan_head_before: 73e1ecfa5d95e96a7b8ed7353ac121847056ef4c
plan_head_after: 244810bfe2e7ca6fee66526e7f8144d9cd6b96fa
---

# Phase 185 Plan 17: The floor raised ahead of time and lowered again Summary

```
PAIR_APPLY_EXIT=0
COUNT_TWO_AT=2026-11-13T15:41:35Z
COUNT_ONE_AT=2026-11-13T15:50:59Z
SCALE_IN_MINUTES=0
MAX_RUNNING_SEEN=2
BELOW_FLOOR_SEEN=no
SCALE_IN_STOP_LINE_SIGNAL=SIGTERM
SCHEDULED_ACTIONS_AFTER=0
TARGET_BOUNDS_AFTER=1,2
PLAN_AFTER_EXIT=0
```

A known peak can be met ahead of time. Two `at()` scheduled actions, given as a command-line `-var`
for one apply, raised the floor to 2 at their minute and lowered it ten minutes later. The service
ran 2 tasks at the next minute read after the raise and 1 at the first read after the lowering.
Across 16 reads it never passed the ceiling 2, and the desired count never fell below the floor in
force. Research A3 expected the scale-in to take 15 to 20 minutes at idle. It took under a minute,
because the policy's low alarm has been in `ALARM` at idle CPU since the morning and acts as soon as
the floor comes down. The task the scale-in stopped exited 0, and its own stream holds the stop
record with `signal: 'SIGTERM'`, the second record of the stop signal. The removal apply took both
actions off, the scalable target reads 1 and 2, and a plan with `-detailed-exitcode` exits 0.

## What was done

Every Bash call set `AWS_PROFILE=openvaa-admin` with the key variables unset, in `eu-north-1`, and
asserted account 471112560111 before any AWS or Terraform call. Plans, plan JSON, apply logs, count
files and task lists stayed in a `umask 077` `$L`, which was removed at the end. No IP address is in
the evidence, and the one stream line that names a bind address was not copied. The pair never
reached the tracked `terraform.tfvars`.

- **Precondition:** one task, revision 5, `PRIMARY COMPLETED`, bounds `1,2`, no scheduled action,
  plan exit 0.
- **First run (13:42Z to 15:34Z):**
  - **Plan and apply:** the plan read `Plan: 2 to add, 0 to change, 0 to destroy.` with exactly the
    two `create`s, and the apply exited 0.
  - **Host sleep:** the workstation went into a lid-closed sleep at 13:49:50Z, on battery, and was
    fully awake again only at 15:31:29Z. The minute reads have gaps of 8 and 92 minutes, and the loop
    woke after its end. They are kept and not counted.
  - **AWS's record:** the scaling activities and the service's events kept the whole run. The raise
    came 42 seconds after its time and the lowering 15 seconds after its. The desired count went to
    1 35 seconds after the lowering, and the raise's task was stopped. Its stream holds the stop
    record with `SIGTERM`. By 15:32Z the task had aged out of `describe-tasks` (`MISSING`).
  - **Removal:** the first pair was taken off with item 7, with the plan `0 to add, 0 to change,
    2 to destroy`, apply exit 0, no action left, bounds `1,2`, plan exit 0.
- **Second run (15:34Z to 15:53Z), the record:**
  - **Plan and apply:** the same plan shape, apply exit 0.
  - **Reads:** 16 minute reads under `caffeinate -i`, 62 to 68 seconds apart, with no sleep in the
    power log.
  - **Raise:** at 15:40:00.4Z. Desired was 2 by the 15:40:33Z read and running 2 by 15:41:35Z.
  - **Lowering:** at 15:50:48Z. Desired was set to 1 at 15:50:50Z, and the count read 1 at 15:50:59Z.
  - **Stopped task:** the raise's task `2923e7ca…`, read until `STOPPED`, then
    `Scaling activity initiated by (deployment …)`, exit 0. Its stream holds 13 events, with
    `msg: 'The server is exiting after its stop.'` and `signal: 'SIGTERM'` at 15:52:03Z,
    `inFlightAtSignal` 0.
- **Task 2:**
  - **Removal:** the plan read `Plan: 0 to add, 0 to change, 2 to destroy.` with exactly the two
    `delete`s. The apply exited 0, and no action is listed for the service or anywhere in the `ecs`
    namespace. The bounds read `1,2`, and `-detailed-exitcode` gives 0 with `No changes.`
  - **Runbook:** three "Not yet observed" rows moved to five dated Observations rows. Prettier is
    clean.

## Commits

| Task | Commit | Message |
| ---- | ------ | ------- |
| 1 | f64048087 | docs(185-17): record the floor raised and lowered, the count and the scale-in's stop signal |
| 2 | 244810bfe | docs(185-17): record the pair removed and Step 12's observations |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] A host suspend voided the first run's minute reads**
- **Found during:** Task 1
- **Issue:** The workstation slept with its lid closed during item 4, so INFRA-07's "read every
  minute" had gaps of 8 and 92 minutes. It was confirmed in `pmset -g log`.
- **Fix:**
  - The first run's AWS-side record and stop line were kept as corroboration.
  - The first pair was removed, using the removal's expected plan shape.
  - The step was run again with new times under `caffeinate -i`.
  - The record lines are the second run's. There were four applies in all (two pairs, two removals),
    each plan checked against its expected shape, and none inside a raise-to-lower window.
- **Files modified:** evidence/185-17-scaling.md
- **Commit:** f64048087

**2. [Rule 1 - Bug] Step 12 told the operator the scale-in is slow, and gave no guard against sleep**
- **Found during:** Task 1 and Task 2
- **Issue:**
  - The introduction said target tracking scales in "slowly", but it is under a minute at idle.
  - Nothing kept the workstation awake for the minute reads.
  - Nothing warned that a stopped task ages out of `describe-tasks` within about an hour.
- **Fix:**
  - The introduction now states the measured behaviour and keeps the 30-minute wait only for a
    stack that is not idle.
  - The step now says to keep the workstation awake, notes that `caffeinate -i` does not stop a
    lid-closed sleep on battery, and says to run item 6 at once.
  - Item 4's loop now runs under `caffeinate -i & CAF=$!`, with `kill "$CAF"` after it.
- **Files modified:** infra/envs/staging/aws/README.md
- **Commit:** 244810bfe

## Observations beyond the plan

- The scale-in removed the newer task, the raise's task, and kept the older one in both runs.
- The `at()` actions fired between 0.4 and 48 seconds after their times.
- From deregistration to the stop signal took 56 to 57 seconds, against 35 in 185-16's Step 11.
  Nothing was in flight either time.

## Known Stubs

None.

## Next Phase Readiness

The stack is as 185-16 left it: revision 5, one task, bounds `1,2`, no scheduled action, and a plan
with no change. Step 13 can start.

## Self-Check: PASSED

- FOUND: .planning/workstreams/deployment/phases/185-aws-frontend-stack-first-apply-by-hand/evidence/185-17-scaling.md
- FOUND: infra/envs/staging/aws/README.md
- FOUND: f64048087
- FOUND: 244810bfe
