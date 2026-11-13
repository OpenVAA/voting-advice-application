---
phase: 185-aws-frontend-stack-first-apply-by-hand
plan: "16"
subsystem: infra
status: complete
tags: [aws, ecs, circuit-breaker, rollback, eventbridge, sns, sigterm, cloudwatch-logs, runbook]
requires:
  - phase: 185-15
    provides: the restored staging AWS stack (revision 3, diagnostics false, XFF_DEPTH 2, plan with no change)
provides:
  - Steps 10 and 11 of the staging AWS runbook observed, with the stack restored
  - evidence/185-16-rollout-alert-signal.md, with the copied start-up and stop log lines
  - Step 10 item 5 corrected to list the cluster's stopped tasks and filter by revision and stop code
  - six Step 10 and 11 rows moved from "Not yet observed" to dated Observations
affects: [185-17, 185-19, 185-20]
tech-stack:
  added: []
  patterns:
    - "A failed rollout's tasks are found by listing the cluster's STOPPED tasks and filtering by revision and stopCode EssentialContainerExited, never by list-tasks --service-name"
    - "After a restore apply returns, the old task is read until STOPPED before its exit code and stop record are trusted"
key-files:
  created:
    - .planning/workstreams/deployment/phases/185-aws-frontend-stack-first-apply-by-hand/evidence/185-16-rollout-alert-signal.md
  modified:
    - infra/envs/staging/aws/README.md
key-decisions:
  - "The Task 2 checkpoint was not auto-approved even with _auto_chain_active true, because only the operator can see the mailbox; the reply's time is the event time in the pasted body, not a send time"
  - "FAILED_TASKS counts only the EssentialContainerExited tasks; the pending revision-4 task the rollback stopped is recorded apart"
requirements-completed: [INFRA-05, INFRA-09, INFRA-04]
duration: 133min (about 25 min of work; the rest was waiting for the operator's reply)
completed: 2026-11-13
estimate_ref:
  tokens: 28000
  tasks: 3
actuals:
  tokens: 10400
  tasks: 3
  commits: 2
plan_head_before: 7604097ac4103ba9840bf43c392579ff16889977
plan_head_after: 7857107a0f0c9905713603a3946e616c79d4f6dc
---

# Phase 185 Plan 16: A rollout that fails, its rollback, its alert, the restore and the stop signal Summary

```
ROLLBACK=yes
ALERT_MAIL=arrived
STOP_LINE_SIGNAL=SIGTERM
```

A bad deployment cannot take the site down, and the operator hears when one fails. The test revision
left out `ORIGIN`. Each of its tasks threw
`Error: Required environment variables are not set: ORIGIN` before it listened and exited 1, and
the line is in each task's own stream. At the third failed task the circuit breaker failed the
deployment (`ECS deployment circuit breaker: tasks failed to start.`, 11:35:51Z). It rolled the
service back to revision 3 by itself, and the service was steady 72 seconds later. Meanwhile the old
task's target stayed `healthy` in all 13 reads, and 692 requests through the public URL all
answered 200. The rule fired once, the topic delivered once, and the operator received the mail
naming `SERVICE_DEPLOYMENT_FAILED` and the service. The restore apply exited 0. The task it stopped
received `SIGTERM` 35 seconds after its deregistration began, with nothing in flight, and exited 0.
Its stop record is in its own stream, the 214 requests during the restore all answered 200, and the
plan afterwards shows no change.

## What was done

Every Bash call set `AWS_PROFILE=openvaa-admin` with the key variables unset, in `eu-north-1`, and
asserted account 471112560111 before each AWS and Terraform call. Plans, plan JSON, apply logs, poll
and loop files stayed in a `umask 077` `$L`, which was removed at the end. The old task's address was
held in `$L` only to match its target and was never printed, and the alert address was checked with
`test -n` only.

- **Task 1 (tracer), Step 10.**
  - **Precondition:** met, with one `PRIMARY COMPLETED` deployment on revision 3 and the breaker's
    rollback on.
  - **Plan:** the saved plan with `-var 'omit_environment=["ORIGIN"]'` read
    `Plan: 1 to add, 1 to change, 1 to destroy.` and held exactly the task definition's
    `delete-create` and the service's `update`. Its JSON differed by `ORIGIN` removed and
    normalisation only.
  - **Apply:** `FAULT_APPLY_EXIT=1` (expected), 11:28:49Z to 11:36:10Z.
  - **Polling:** 13 reads, rolled back at the 11th.
  - **Logs:** three start-up lines copied with stream and time.
  - **Metrics:** `TriggeredRules` 1, `Invocations` 1, `NumberOfNotificationsDelivered` 1,
    `NumberOfNotificationsFailed` 0, read again past five minutes with the same values.
  - The tracer re-run of the verify passed before expanding.
- **Task 2 (checkpoint):**
  - **Attempt:** `20261113T114336Z.6497623a9`.
  - **Reply:** the operator pasted the mail body, the EventBridge event, which holds no address. The
    orchestrator gave the reply lines.
  - **Storing it:** `attempt.sh put` exit 0, then `OPERATOR_REPLY=received …` appended, and `bound`
    exits 0.
- **Task 3, Step 11.**
  - **Plan:** the plain plan held the same two changes, putting back
    `ORIGIN=https://staging.openvaa.org`.
  - **Apply:** exit 0, 13:33:55Z to 13:36:08Z. It returned while the old task was still `STOPPING`,
    so the task was read until `STOPPED` (13:36:58Z).
  - **Stopped task:** `STOPPED_TASK_REASON=Scaling activity initiated by (deployment ecs-svc/2903866395985344103)`
    and exit 0.
  - **Stop record:** 12 events in that task's stream, `signal: 'SIGTERM'`, `inFlightAtSignal: 0`,
    `drainMs: 1`.
  - **Afterwards:** `PLAN_AFTER_EXIT=0`. The service is on revision 5, with `ORIGIN`,
    `DEPLOYMENT_DIAGNOSTICS=false`, `XFF_DEPTH=2` and one task. Revision 4 is `INACTIVE`.
  - **Runbook:** Prettier is clean, and six rows moved to Observations.

## Commits

| Task | Commit | Message |
| ---- | ------ | ------- |
| 1 | 6497623a9 | docs(185-16): record the failed rollout, its rollback and the viewer's count |
| 3 | 7857107a0 | docs(185-16): record the alert mail, the restore and the stop signal |

Task 2 is a checkpoint and has no commit of its own; its record lines are in Task 3's commit.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Step 10 item 5 listed no stopped task**
- **Found during:** Task 1
- **Issue:** `aws ecs list-tasks --cluster … --service-name … --desired-status STOPPED` exited 0 and
  listed no task, so the runbook's `s10_failed_tasks` would read 0. Its count also took every
  stopped task of the failed revision. That includes the pending task the rollback stopped
  (`ServiceSchedulerInitiated`, no exit code), so even with the list fixed it would read 4 against 3
  streams.
- **Fix:**
  - Item 5 now lists the cluster's STOPPED tasks.
  - It counts `s10_new_revision_stopped_tasks` and, apart from it, `s10_failed_tasks` of
    `stopCode == "EssentialContainerExited"`.
  - Its failed-id list uses the same filter, and its Expected line names the difference.
  - The evidence's numbers were taken this way.
- **Files modified:** infra/envs/staging/aws/README.md
- **Commit:** 7857107a0

**2. [Orchestrator ruling] The reply's time**
- The operator gave no send time. As the orchestrator directed, `answer_alert_mail_utc` is the event
  time in the mail body, 11:35:51Z, and the evidence says it is not a send time.

## Observations beyond the plan

- The fault apply's destroy deregistered revision 3 at 11:29:03Z, so it reads `INACTIVE`, and the
  rollback ran it all the same.
- The failed tasks' targets were registered and deregistered before they became healthy. The
  load balancer never routed to them, and the loop counted no non-2xx answer.
- In Step 11, ECS logged `has stopped 1 running tasks` (13:35:37Z) before `deregistered 1 targets`
  (13:35:47Z). The signal followed the deregistration by 35 seconds, after the 30-second delay.

## Known Stubs

None.

## Next Phase Readiness

The stack is as 185-15 left it except that the task definition is now at revision 5. The plan shows
no change, and Step 12 (the floor raised and lowered) can start. Stopped tasks from this plan stay
listed for about an hour.

## Self-Check: PASSED

- FOUND: .planning/workstreams/deployment/phases/185-aws-frontend-stack-first-apply-by-hand/evidence/185-16-rollout-alert-signal.md
- FOUND: infra/envs/staging/aws/README.md
- FOUND: 6497623a9
- FOUND: 7857107a0
