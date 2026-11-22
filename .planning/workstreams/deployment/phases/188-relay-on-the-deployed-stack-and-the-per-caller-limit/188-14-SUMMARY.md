---
phase: 188-relay-on-the-deployed-stack-and-the-per-caller-limit
plan: "14"
subsystem: infra
tags: [analytics, relay, posthog, fail-open, ecs, staging, cloudwatch]
status: complete

requires:
  - phase: 188 (plan 13)
    provides: staging restored to :16 (posthog, eu.i.posthog.com, flush 2000, ceiling 2), the hand-apply recipe, the one-field-per-line log reading
  - phase: 188 (plan 10)
    provides: DEPLOY_COMMIT a7003b490 and BUILD_DIGEST sha256:e35bde28… on staging
provides:
  - "B-06 on the deployed stack: with ANALYTICS_POSTHOG_HOST unresolvable the smoke run was green, the relay answered 204 in 0.26 s, and each flush logged the failed forward as transport ENOTFOUND only"
  - "The restore by a plain apply, read back, a plan after it empty, a probe delivered to PostHog after it"
  - "A dated Observations row in infra/envs/staging/aws/README.md"
affects: [188-17, 188-19]

actuals:
  tokens: 6600
  tasks: 3
  commits: 2
plan_head_before: 83db3af5f463f989e10e6f2bcf70bf733c656b84
plan_head_after: 9092837b7fbd09be6912507180f060ed1b338469

tech-stack:
  added: []
  patterns:
    - "A waiter that returns non-zero across a host suspend is void: read the service's state, run the waiter again, and keep the long waits under caffeinate -i"
    - "The plan JSON's before of a task definition is the provider's read and its after the configuration, so empty-value differences (\"\" or [] against null, option order, the defaulted hostPort) are read and set aside, not taken as changes"

key-files:
  created:
    - .planning/workstreams/deployment/phases/188-relay-on-the-deployed-stack-and-the-per-caller-limit/evidence/188-14-fail-open.md
  modified:
    - infra/envs/staging/aws/README.md

key-decisions:
  - "The observation's services-stable waiter returned 255 after a 44-minute clamshell sleep of the host; the service read COMPLETED on :17 and the rerun waiter exited 0, so the wait was treated as void and the sitting went on instead of restoring at once"
  - "B06_FORWARD_FAILURES_ENOTFOUND counts the attribute lines, since the logger prints the message and the attribute as separate events; both counts (6 and 6) are recorded"

requirements-completed: []

coverage:
  - id: D1
    description: "With PostHog's host unresolvable the deployed smoke run is green and the relay answers 204 at once"
    verification:
      - kind: other
        ref: "evidence/188-14-fail-open.md: OBS_PLAN_MATCHES=yes, OBS_APPLY_EXIT=0, B06_SMOKE_VERDICT_EXIT=0, B06_POST_STATUS=204, B06_POST_SECONDS=0.259785, B06_HEALTH=200"
        status: pass
    human_judgment: false
  - id: D2
    description: "The task logs the failed forward by its transport code only, and nothing of the probe reaches PostHog"
    verification:
      - kind: other
        ref: "B06_FORWARD_FAILURES_ENOTFOUND=6, B06_FORWARD_FAILURES_STATUS=0, B06_STREAM_LINES_NAMING_A_HOST=0, B06_POSTHOG_EVENTS=0 (five reads)"
        status: pass
    human_judgment: false
  - id: D3
    description: "The stack restored by a plain apply, a probe delivered after it, the smoke run green"
    verification:
      - kind: other
        ref: "RESTORE_PLAN_MATCHES=yes, RESTORE_APPLY_EXIT=0, RESTORE_POSTHOG_HOST=https://eu.i.posthog.com, RESTORE_PLAN_AFTER_EXIT=0, RESTORE_SMOKE_VERDICT_EXIT=0, B06_AFTER_RESTORE_EVENTS=1; Task 3 verify exit 0"
        status: pass
    human_judgment: false

duration: about 25 min of work across two executor sittings (13:53Z to 13:56Z readiness, 14:03Z to 15:10Z the sitting, of which 14:07Z to 14:51Z the host slept), plus the wait for the operator
completed: 2026-11-19
---

# Phase 188 Plan 14: The deployed site keeps working when PostHog cannot be reached Summary

**Staging was given `ANALYTICS_POSTHOG_HOST=https://posthog.invalid` by a hand apply of the running digest. With that host unresolvable the deployed smoke run was green, and a relay request was answered 204 in 0.26 s. The task logged each failed forward as `Analytics forward to PostHog failed` with `transport: 'ENOTFOUND'` and nothing else, six times. PostHog counted nothing of the probe. A plain apply restored the host, a plan after it read `No changes.`, the smoke run was green again and a probe posted afterwards reached PostHog.**

## Results (attempt `20261119T135532Z.c17803d57`)

| Stage | Result |
| ----- | ------ |
| Observation plan | `Plan: 1 to add, 1 to change, 1 to destroy.`: the task definition replaced and the service updated, nothing else. The only changed value was `ANALYTICS_POSTHOG_HOST`, from `https://eu.i.posthog.com` to `https://posthog.invalid` |
| Observation apply | Exit 0. The waiter returned 255 across a host sleep and exited 0 on a rerun. One task on `:17`, provider `posthog`, host `https://posthog.invalid` |
| Smoke, PostHog unreachable | Green, `2 passed`, verdict exit 0 |
| Relay post | 204 in 0.259785 s |
| Log | 6 `Analytics forward to PostHog failed` lines and 6 `transport: 'ENOTFOUND'` lines. No status failure, no timeout, and no line naming a host |
| Health | 200 |
| PostHog, first probe | 0 in five reads, 15:01Z to 15:08Z |
| Restore | Same two changes back. Apply exit 0, stable. `:18` reads posthog, `https://eu.i.posthog.com`, flush 2000, stop timeout 40, scaling 1 to 2. A plan after it shows `No changes.` |
| Smoke after restore | Green, `2 passed`, verdict exit 0 |
| PostHog, after-restore probe | 1 in four reads |

## Task Commits

1. **Task 1: Readiness** - `c17803d57` (docs)
2. **Task 2: Operator approval** - no commit. The orchestrator bound it under attempt `20261119T135532Z.c17803d57`.
3. **Task 3: Unreachable host, logged failure, restore** - `9092837b7` (docs)

## Deviations from Plan

### Process notes

**1. [Rule 3 - Blocking] The observation's stability wait was voided by a host sleep**
- **Found during:** Task 3, step (1)
- **Issue:** `aws ecs wait services-stable` started at 14:07:17Z, after the apply exited 0. The host went into clamshell sleep at 14:07:54Z and woke at 14:51:34Z (`pmset -g log`), and the waiter returned 255 at 14:51:43Z.
- **Fix:** `describe-services` showed one deployment, `COMPLETED`, on `:17`, with no failed task. The waiter was run again and exited 0. Both exits are recorded (`OBS_WAIT_STABLE_EXIT=255`, `OBS_WAIT_STABLE_VOID=`, `OBS_WAIT_STABLE_RERUN_EXIT=0`). The coordinator's rule was "if anything fails after the observation apply, restore first". The stack had not failed: the waiter had been suspended with the host. So the sitting went on, and the restore and the long reads after it ran under `caffeinate -i`.
- **Impact:** the override stayed on the stack for 57 minutes, 14:06Z to 15:03Z, instead of a few. Staging's events in that window were lost, which the operator approved for "a few minutes". The SSO session held throughout.

**2. [Rule 1 - Reading] Empty-value differences in the plan JSON**
- The plan JSON's `before` and `after` for the task definition also differ in values that hold nothing:
  - `""` against `null` (`ipc_mode`, `pid_mode`, `task_role_arn`);
  - `{}` and `[]` against `null`;
  - the order of the `awslogs` options;
  - the API-defaulted `hostPort`.
- Each was read and holds no value, and the restore plan shows the same set. The stop rule's checks (addresses, actions, image, names, the one value) matched exactly.

**Total deviations:** 2. **Impact on the result:** none. The prohibitions hold: the override is off the stack and was never written into the tfvars, and no apply ran while a pipeline run was active.

## Known Stubs

None.

## Next Phase Readiness

- RELAY-04's fail-open clause has been observed on the deployed stack. RELAY-04 stays open for the phase verifier.
- Staging is at task definition `:18`, which differs from the pipeline's revision only in revision number. A plan with nothing set shows no change.
- `trackEvents` is still `false` on staging.

## Self-Check: PASSED

- FOUND: evidence/188-14-fail-open.md, infra/envs/staging/aws/README.md
- FOUND: c17803d57, 9092837b7 (ancestors of HEAD)
- Task 1 verify exit 0, Task 3 verify exit 0, `bound 188-14-2 OPERATOR_REPLY plan=188-14 task=2` exit 0
