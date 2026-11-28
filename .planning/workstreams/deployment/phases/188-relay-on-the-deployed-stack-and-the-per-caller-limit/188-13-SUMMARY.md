---
phase: 188-relay-on-the-deployed-stack-and-the-per-caller-limit
plan: "13"
subsystem: infra
tags: [analytics, relay, queue, backpressure, ecs, staging, cloudwatch]
status: complete

requires:
  - phase: 188 (plan 12)
    provides: staging restored to :14 (posthog, flush 2000, ceiling 2), the hand-apply and stop-task recipe, the timer-start lesson
  - phase: 188 (plan 10)
    provides: DEPLOY_COMMIT a7003b490 and BUILD_DIGEST sha256:e35bde28… on staging
provides:
  - "C-02 on the deployed stack: a burst of 1050 events into one task kept exactly 1000, dropped 60 with a count-only record, answered all 21 requests 204 at once"
  - "Memory flat under the full queue: 0.634 points over the one task's own baseline, read from AWS/ECS MemoryUtilization without Container Insights"
  - "A dated Observations row in infra/envs/staging/aws/README.md"
affects: [188-17, 188-19]

actuals:
  tokens: 35000
  tasks: 3
  commits: 2
plan_head_before: 09a891e2c864507c8805b4b9973d228825816dd3
plan_head_after: 1c33ea358b5b8ef561ab7518b3dd0aaf450091d2

tech-stack:
  added: []
  patterns:
    - "Wait until startedAt + 300 s before the burst, so the memory baseline's five minutes belong to the one task and the flush still lands before the earliest possible tick at startedAt + 600 s"
    - "The application logger prints a record one field per line, so a record's attribute is read with its own filter (`\"dropped:\"`), not from the message line"

key-files:
  created:
    - .planning/workstreams/deployment/phases/188-relay-on-the-deployed-stack-and-the-per-caller-limit/evidence/188-13-full-queue.md
  modified:
    - infra/envs/staging/aws/README.md

key-decisions:
  - "The memory baseline is the minutes the one task ran alone (8.887 %), not the literal five-minute window, whose 13:32Z point (14.99 %) is the rollout minute with two tasks; the stricter figure gives a rise of 0.634 points, the literal one a negative rise"
  - "A deployed smoke run was made right after the observation rollout as well as on the replacement task, so every rollout was followed by one"

requirements-completed: []

coverage:
  - id: D1
    description: "21 requests of 50 events all answered 204; the flush wrote exactly 1000 event lines and one drop record with dropped 60"
    verification:
      - kind: other
        ref: "evidence/188-13-full-queue.md: C02_POSTS_204=21, C02_EVENT_LINES_TOTAL=1000, C02_DROP_LINES=1, C02_DROPPED=60, C02_TIMER_TICK_IN_WINDOW=no; Task 3 verify exit 0"
        status: pass
    human_judgment: false
  - id: D2
    description: "Memory within 5 points of the baseline during and after the burst"
    verification:
      - kind: other
        ref: "C02_MEMORY_MAX_BEFORE=8.887, C02_MEMORY_MAX_DURING=9.521, C02_MEMORY_RISE_POINTS=0.634, C02_MEMORY_FLAT=yes"
        status: pass
    human_judgment: false
  - id: D3
    description: "Nothing at PostHog from the burst; stack restored by a plain apply, read back, plan after it empty, smoke green after each rollout"
    verification:
      - kind: other
        ref: "C02_POSTHOG_EVENTS=0 (five reads), RESTORE_PROVIDER=posthog, RESTORE_FLUSH_INTERVAL=2000, RESTORE_CEILING=2, RESTORE_PLAN_AFTER_EXIT=0, OBS_APPLY_SMOKE_VERDICT_EXIT=0, OBS_SMOKE_VERDICT_EXIT=0, RESTORE_SMOKE_VERDICT_EXIT=0"
        status: pass
    human_judgment: false

duration: about 35 min of work across two executor sittings (2026-11-19 13:15Z to 13:17Z readiness, 13:26Z to 13:52Z the sitting), plus the wait for the operator
completed: 2026-11-19
---

# Phase 188 Plan 13: The deployed relay's full queue drops instead of growing Summary

**A burst of 1050 `answer` events was sent to one staging task running provider `log` with a ten-minute flush interval. The relay answered all 21 requests 204 within two seconds. The stopped task's shutdown flush then wrote exactly 1000 event lines and one count-only record, `dropped: 60`, which is the 1060 events offered less the cap of 1000. Memory rose 0.634 points, PostHog counted nothing, and the stack was restored with every smoke run green.**

## Results (attempt `20261119T131829Z.bd2db93c8`)

| Stage | Result |
| ----- | ------ |
| Observation plan | `Plan: 1 to add, 2 to change, 1 to destroy.`, exactly the three expected changes. Only `ANALYTICS_FLUSH_INTERVAL_MS` (2000 to 600000) and `ANALYTICS_PROVIDER` (posthog to log) changed, and only `max_capacity` (2 to 1) |
| Observation apply | Exit 0, stable on the first try. One task on `:15`, started 13:31:02Z |
| Smoke after the rollout | Green, `2 passed`, verdict exit 0 |
| Burst | 21 POSTs of 50 events (4548 bytes each) from 13:36:08Z to 13:36:10Z, all 204, 294 s before the earliest possible tick |
| Stop | `UserInitiated`, exit code 0. The shutdown flush ran at 13:36:59Z, 243 s before the earliest tick |
| Flush in the log | 1000 event lines (990 probe `answer`, 10 smoke `pageview`), 1 drop record, `dropped` 60, 0 forward failures |
| Smoke on the replacement task | Green, `2 passed`, verdict exit 0 |
| Memory (one-minute maximum) | 8.887 % before, 9.521 % at most in the five minutes from the first post, a rise of 0.634 points |
| PostHog | 0 for the probe in five reads, from 13:42Z to 13:50Z |
| Restore | Plan has the same three changes back. Apply exit 0, stable. `:16` reads posthog, 2000, ceiling 2 and stop timeout 40. A plan after it shows `No changes.` |
| Smoke after the restore | Green, `2 passed`, verdict exit 0 |

## Performance

- **Sitting:** 13:28:13Z (plan) to 13:50:12Z (last PostHog read). The override was on the stack from 13:30Z to 13:41Z.
- **Tasks:** 3 of 3
- **Files modified:** 2 (evidence, runbook)

## Task Commits

1. **Task 1: Readiness** - `bd2db93c8` (docs)
2. **Task 2: Operator approval** - no commit. The orchestrator bound it under attempt `20261119T131829Z.bd2db93c8`.
3. **Task 3: Burst, drop line, memory, restore** - `1c33ea358` (docs)

## Deviations from Plan

### Adjusted rule

**1. [Rule 1 - Bug] The plan's memory window included the rollout minute**
- **Found during:** Task 3, the memory read
- **Issue:** Read literally, "the five minutes before" the first post (13:31:08Z to 13:36:08Z) includes the observation rollout's minute, 13:32Z, at 14.99 %. In that minute the old task was draining and the new one was starting. Against that maximum the rise would be negative and the check could not fail.
- **Fix:** The baseline is the minutes when the one task ran alone (13:33Z to 13:35Z, 8.887 %). That gives a rise of 0.634 points. Both values are recorded (`C02_MEMORY_MAX_BEFORE_WINDOW=14.99` and `C02_MEMORY_MAX_BEFORE=8.887`), and the stricter one is the line the verify reads.

**2. [Rule 3 - Blocking] The drop count is on its own log line**
- **Found during:** Task 3, the log read
- **Issue:** The application logger's default sink prints a record one field per line, so the `Analytics queue was full and dropped events` event does not carry the number.
- **Fix:** The number was read from the one event that matches `"dropped:"` (shape `attributes: { dropped: N }`). It equals the arithmetic exactly: 1060 offered less 1000 kept.

### Process notes

- **Extra smoke run.** A smoke run was made right after the observation rollout as well as the plan's run on the replacement task, so every rollout was followed by one. That run's 10 pageviews were the queue's other events.
- **Burst timing.** The burst waited until `startedAt + 300 s` instead of going at the first chance. That way the five minutes before it belong to the one task, and the flush still fell before the earliest possible tick.
- **Terraform state.** The Terraform data directory was a fresh one under the session scratch directory, against the root's S3 backend. The operator's `.terraform/` was not touched.
- **SSO.** The AWS SSO session held throughout.

**Total deviations:** 2 (both rule fixes in reading). **Impact:** none on the result. The plan's prohibitions hold: no override is left on the stack or written into the tfvars, the burst ran with provider `log`, and no hand apply ran while a pipeline run was active.

## Known Stubs

None.

## Next Phase Readiness

- RELAY-09's full-queue clause has been observed on the deployed relay. RELAY-09 stays open for the phase verifier.
- Staging is at task definition `:16`, which differs from the pipeline's `:10` only in revision number. A plan with nothing set already shows no change, as plan 188-17 expects.
- `trackEvents` is still `false` on staging.

## Self-Check: PASSED

- FOUND: evidence/188-13-full-queue.md, infra/envs/staging/aws/README.md
- FOUND: bd2db93c8, 1c33ea358 (ancestors of HEAD)
- Task 1 verify exit 0, Task 3 verify exit 0, `bound 188-13-2 OPERATOR_REPLY plan=188-13 task=2` exit 0
