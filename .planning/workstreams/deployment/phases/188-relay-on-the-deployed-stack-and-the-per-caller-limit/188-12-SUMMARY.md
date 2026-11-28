---
phase: 188-relay-on-the-deployed-stack-and-the-per-caller-limit
plan: "12"
subsystem: infra
tags: [analytics, relay, posthog, shutdown, sigterm, ecs, staging]
status: complete

requires:
  - phase: 188 (plan 10)
    provides: staging serving a7003b490 by digest sha256:e35bde28… with PostHog on, flush 2000, stop timeout 40
  - phase: 188 (plan 11)
    provides: the relay's POST shape and the PostHog probe-count read on the deployed stack
provides:
  - "B-04 on the deployed stack: seven events queued under a 600 s flush interval reached PostHog in the shutdown flush of a task stopped with stop-task, no timer tick possible in the window"
  - "B-05 on the deployed stack: the stopped task wrote the shutdown line with SIGTERM, exited by itself (exit 0) 11 s after the signal, inside the stop timeout of 40"
  - "A dated Observations row in infra/envs/staging/aws/README.md"
affects: [188-17, 188-19]

actuals:
  tokens: 32500
  tasks: 3
  commits: 6
plan_head_before: a391254d23028c7c286b88c7cba15b649717c077
plan_head_after: 04295bd94c197a2214eade6533dffc34aed93f78

tech-stack:
  added: []
  patterns:
    - "One backgrounded chain (apply, services-stable, smoke run, timing check, POST, stop-task) so the probe lands seconds after the smoke run, inside the tick-free part of the timer's first cycle"
    - "The queue timer's phase is bounded by the task's start and the smoke run's end, because the usage endpoint's module loads on its first request"

key-files:
  created:
    - .planning/workstreams/deployment/phases/188-relay-on-the-deployed-stack-and-the-per-caller-limit/evidence/188-12-shutdown-flush.md
  modified:
    - infra/envs/staging/aws/README.md

key-decisions:
  - "The first run (attempt 20261119T101633Z.4b30c500a) was halted after the observation apply because the deployed voter smoke was red under staging's analytics.trackEvents=true; the stack was restored at once and nothing was probed. The operator set trackEvents back to false (10:59:26Z) and approved a second attempt"
  - "The tick-free window is computed from both possible timer starts: the earliest tick is startedAt + 600 s, and the probe and stop came 493 s before it"

requirements-completed: []

coverage:
  - id: D1
    description: "Seven events queued under a 600 s interval delivered in the shutdown flush of a stopped task, no tick in the window"
    verification:
      - kind: other
        ref: "evidence/188-12-shutdown-flush.md: B04_EVENTS=7 (five reads), B04_TIMER_TICK_IN_WINDOW=no, B04_POST_STATUS=204; Task 3 verify exit 0"
        status: pass
    human_judgment: false
  - id: D2
    description: "The stopped task wrote the SIGTERM shutdown line, no forward failure, exited by itself inside the stop timeout"
    verification:
      - kind: other
        ref: "B04_STOP_CODE=UserInitiated, B04_EXIT_CODE=0, B04_SHUTDOWN_LINES=1, B04_FORWARD_FAILURES=0, B04_STOP_SECONDS=107"
        status: pass
    human_judgment: false
  - id: D3
    description: "The stack restored to its tfvars by a plain apply, read back, plan after it empty, smoke green after both rollouts"
    verification:
      - kind: other
        ref: "RESTORE_FLUSH_INTERVAL=2000, RESTORE_CEILING=2, RESTORE_PLAN_AFTER_EXIT=0, OBS_SMOKE_VERDICT_EXIT=0, RESTORE_SMOKE_VERDICT_EXIT=0"
        status: pass
    human_judgment: false

duration: about 3 h across three executor sittings (2026-11-19 10:13Z to 13:15Z, including the halted run and the wait for the operator)
completed: 2026-11-19
---

# Phase 188 Plan 12: Queued events delivered in the shutdown flush of a stopped staging task Summary

**Staging ran with a ten-minute flush interval and a ceiling of one task. Seven `answer` events were posted, and the one task was stopped 493 s before the earliest tick its timer could make. PostHog then counted exactly seven events, so they left in the shutdown flush. The task exited by itself (exit 0) 11 s after `SIGTERM`, and the stack was restored with the smoke run green.**

## Results (second run, attempt `20261119T105957Z.d854f44d5`)

| Stage | Result |
| ----- | ------ |
| Observation plan | `Plan: 1 to add, 2 to change, 1 to destroy.`, exactly the three expected changes; only `ANALYTICS_FLUSH_INTERVAL_MS` changed (2000 to 600000), and only `max_capacity` changed (2 to 1) |
| Observation apply | exit 0, stable; one task on `:13`, started 12:59:33Z |
| Observation smoke | green, `2 passed`, verdict exit 0 (`trackEvents` false again) |
| Window | POST 13:01:21Z, task stopped by 13:03:08Z; earliest possible tick 13:09:33Z |
| POST | one envelope of 7 `answer` events, 204 |
| Stop | `UserInitiated`, exit code 0, `SIGTERM` at 13:02:22Z (`drainMs` 1, 0 in flight), container stopped 13:02:33Z, `stoppedAt` 107 s after the call |
| Log | shutdown message 1, `reason`/`signal` `SIGTERM` 1 each, `Analytics forward to PostHog failed` 0 |
| PostHog | `B04_EVENTS=7`, the same in five reads from 13:03:42Z to 13:11:44Z |
| Restore plan and apply | the same three changes back to the tfvars; exit 0, stable; `:14`, flush 2000, ceiling 2, stop timeout 40; a plan after it shows no change |
| Restore smoke | green, `2 passed`, verdict exit 0 |

## Performance

- **Second run:** 12:58:12Z (plan) to 13:11:44Z (last PostHog read)
- **Tasks:** 3 of 3
- **Files modified:** 2 (evidence, runbook)

## Task Commits

1. **Task 1: Readiness** - `4b30c500a` (docs)
2. **Task 2: Operator approval** - no commit. The first approval was attempt `20261119T101633Z.4b30c500a` and the second was `20261119T105957Z.d854f44d5`, both bound by the orchestrator.
3. **Task 3, first run, halted** - `7fa3890b2` (docs), plus the STATE blocker `6cc07cb12`
4. **Task 3, second run** - `04295bd94` (docs)

`commits: 6` is measured from `plan_head_before`. It includes the orchestrator's `d854f44d5` and `26b83b6d1` (the trackEvents decision in CONTEXT B-03 and the smoke todo).

## Deviations from Plan

### Environment

**1. [Deviation - environment] The first run's observation smoke was red under `trackEvents=true`**
- **Found during:** Task 3, first run (10:46Z)
- **Issue:** Since 09:30:36Z, staging's `analytics.trackEvents` had been `true` (set for 188-11's consenting journey). The voter app's "Collecting Usage Data" prompt was intercepting the click on the fifth answer choice, and `voter.smoke.ts` does not answer it. The run went red the same way after the restore, so the override was not the cause.
- **Handling:** Under the stop rule I restored at once, before any probe or stop. The first run's lines are kept in the evidence under the `HALTED_RUN1_` prefix. The operator set `trackEvents` back to `false` (10:59:26Z) and approved a new attempt, and the second run is recorded as `TRACK_EVENTS_AT_RERUN=false`. The spec fix is the pending todo `2026-11-19-deployed-voter-smoke-fails-when-track-events-is-on.md`.

### Adjusted rule

**2. [Rule 1 - Bug] The plan measured the tick-free window from the wrong start**
- **Found during:** Task 3, first run
- **Issue:** The plan placed the window against multiples of 600 s after `startedAt`. The queue is built when `routes/api/usage/+server.ts` first loads, on the task's first `/api/usage` request, so the timer's phase can be later than `startedAt`.
- **Fix:** I bounded the first tick between `startedAt + 600 s` and `smoke end + 600 s`, then posted and stopped right after the smoke run. That was 493 s before the earliest possible tick, against the 240 s the rule requires.

### Process notes

- The Terraform data directory was a fresh one under the session scratch directory, against the root's S3 backend. The operator's `.terraform/` was not touched.
- I ran the restore while PostHog was still being read, which is earlier than the plan's order. The events had already left the stopped task, so the order does not affect the count, and the override ran for 7 minutes instead of about 15.

**Total deviations:** 2 (1 environment, 1 rule fix). **Impact:** none on the result. The plan's prohibitions hold: no override is left on the stack, no hand apply ran while a pipeline run was active, and the stop came outside any possible tick.

## Known Stubs

None.

## Next Phase Readiness

- RELAY-04's SIGTERM clause and B-05 have been observed on the deployed stack. RELAY-04 stays open for the phase verifier.
- Staging is at task definition `:14`, which differs from the pipeline's `:10` only in revision number. Plan 188-17's plan with nothing set should show no change, and a plan made here after the restore already does.
- `trackEvents` is `false` on staging. Until the voter smoke spec answers the consent prompt, turning it on again turns every deployed smoke run red.

## Self-Check: PASSED

- FOUND: evidence/188-12-shutdown-flush.md, infra/envs/staging/aws/README.md
- FOUND: 4b30c500a, 7fa3890b2, 6cc07cb12, 04295bd94 (ancestors of HEAD)
- Task 1 verify exit 0, Task 3 verify exit 0, `bound 188-12-2 OPERATOR_REPLY plan=188-12 task=2` exit 0
