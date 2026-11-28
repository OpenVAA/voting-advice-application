---
phase: 188-relay-on-the-deployed-stack-and-the-per-caller-limit
plan: "15"
subsystem: infra
tags: [analytics, relay, posthog, provider-none, ecs, staging, ecr]
status: complete

requires:
  - phase: 188 (plan 14)
    provides: staging restored to :18 (posthog, eu.i.posthog.com, flush 2000, ceiling 2), the hand-apply recipe, the empty-value plan-JSON reading
  - phase: 188 (plan 10)
    provides: DEPLOY_COMMIT a7003b490 and BUILD_DIGEST sha256:e35bde28… on staging
provides:
  - "B-07 on the deployed stack: ANALYTICS_PROVIDER=none applied by hand as a new task-definition revision (:19) of the same image digest, with no new registry image and no new deploy run"
  - "Zero events at PostHog from the rollout's completion to the restore (window and probe, read three times), with a control window of 11 events under posthog"
  - "The restore to posthog on :20 by a plain apply, a plan after it empty, a probe delivered after it"
  - "A dated Observations row in infra/envs/staging/aws/README.md"
affects: [188-17, 188-19]

actuals:
  tokens: 7000
  tasks: 3
  commits: 2
plan_head_before: f2f3361f6a25d79a49984e2f11a3091f840a1b4d
plan_head_after: 902191882eb7e21dc2d8fb5dc462e21f935638d7

tech-stack:
  added: []
  patterns:
    - "A service's task_definition change is unknown in the plan JSON's after, so the changed-keys reading takes the union of before and after keys, not after's keys alone"
    - "A silence read is paired with a control read of the same mode over a window with the provider on, so a zero is shown to be a reading and not a blind query"

key-files:
  created:
    - .planning/workstreams/deployment/phases/188-relay-on-the-deployed-stack-and-the-per-caller-limit/evidence/188-15-provider-none.md
  modified:
    - infra/envs/staging/aws/README.md

key-decisions:
  - "No rebuild is proved three ways: the new revision's digest equals the old one's, the registry's image count and newest image are unchanged, and the newest deploy.yml run is the one recorded before"
  - "The silence window is read from the deployment's updatedAt at COMPLETED, and once more over the override's whole span up to the restore apply's start"

requirements-completed: []

coverage:
  - id: D1
    description: "A hand apply with ANALYTICS_PROVIDER=none makes a new revision naming the same digest, and no image is built"
    verification:
      - kind: other
        ref: "evidence/188-15-provider-none.md: OBS_PLAN_MATCHES=yes, OBS_APPLY_EXIT=0, B07_DIGEST_UNCHANGED=yes, B07_REVISION_CHANGED=yes (:18 -> :19), B07_REGISTRY_IMAGES_BEFORE=5, B07_REGISTRY_IMAGES_AFTER=5, B07_NO_NEW_RUN=yes"
        status: pass
    human_judgment: false
  - id: D2
    description: "After the rollout PostHog receives no event: neither the smoke run's pageviews nor a probe sent through the relay, which answers 204"
    verification:
      - kind: other
        ref: "OBS_SMOKE_VERDICT_EXIT=0, B07_POST_STATUS=204, B07_WINDOW_EVENTS=0, B07_PROBE_EVENTS=0 (two reads and one after the restore), B07_CONTROL_WINDOW_EVENTS=11"
        status: pass
    human_judgment: false
  - id: D3
    description: "Restored by a plain apply, a probe delivered after it, the smoke run green after each rollout"
    verification:
      - kind: other
        ref: "RESTORE_PLAN_MATCHES=yes, RESTORE_APPLY_EXIT=0, RESTORE_PROVIDER=posthog, RESTORE_PLAN_AFTER_EXIT=0, RESTORE_SMOKE_VERDICT_EXIT=0, B07_AFTER_RESTORE_EVENTS=1; Task 3 verify exit 0"
        status: pass
    human_judgment: false

duration: about 40 min of work across two executor sittings (15:13Z to 15:16Z readiness, 15:21Z to 15:50Z the sitting), plus the wait for the operator
completed: 2026-11-19
---

# Phase 188 Plan 15: Switching the provider to `none` stops events with no rebuild Summary

**Staging got `ANALYTICS_PROVIDER=none` through a hand apply of the running digest. The apply made task definition `:19`, which names the same image digest as `:18`. The registry still held the same 5 images, and the newest `deploy.yml` run was unchanged, so nothing was built. Under `none` the deployed smoke run was green and the relay answered a probe 204. PostHog counted no event from the rollout's completion to the restore, while the same query over the twenty minutes before the switch counted 11. A plain apply restored `posthog` on `:20`. A plan after it read `No changes.`, the smoke run was green, and a probe posted afterwards reached PostHog.**

## Results (attempt `20261119T151610Z.4ebcca7f3`)

| Stage | Result |
| ----- | ------ |
| Observation plan | `Plan: 1 to add, 1 to change, 1 to destroy.`: the task definition replaced and the service updated, nothing else. The only value that changed was `ANALYTICS_PROVIDER`, from `posthog` to `none`. The image was unchanged |
| Observation apply | Exit 0, stable on the first wait. One task on `:19`, provider `none`, rollout COMPLETED at 15:25:52Z |
| No rebuild | `:19` has digest `sha256:e35bde28…182a`, equal to `:18`'s. The registry held 5 images before and after. The newest deploy run is `44491292876` before and after |
| Smoke, provider `none` | Green, `2 passed`, verdict exit 0 |
| Relay post | 204 in 0.23 s |
| PostHog under `none` | Window 0 and probe 0 at 15:31:41Z and at 15:33:49Z. The whole override span read 0 again after the restore. The control window under `posthog` read 11 |
| Restore | Same two changes back. Apply exit 0, stable. `:20` reads posthog, `https://eu.i.posthog.com`, flush 2000, stop timeout 40, scaling 1 to 2. A plan after it shows `No changes.` |
| Smoke after restore | Green, `2 passed`, verdict exit 0 |
| PostHog, after-restore probe | 1 in three reads |

## Task Commits

1. **Task 1: Readiness** - `4ebcca7f3` (docs)
2. **Task 2: Operator approval** - no commit. The orchestrator bound it under attempt `20261119T151610Z.4ebcca7f3`. `bound` and `has '^answer_sitting=approve$'` were re-checked here, both exit 0.
3. **Task 3: Provider `none`, the same digest, silence, the restore** - `902191882` (docs)

## Deviations from Plan

### Process notes

**1. [Rule 1 - Reading] The service's changed key is unknown in the plan JSON**
- **Found during:** Task 3, step (1)
- **Issue:** The changed-keys reading carried over from 188-12 printed nothing for the service. It compares only `after`'s keys, and the plan JSON leaves `task_definition` out of `after` because it is unknown until apply (`after_unknown.task_definition=true`).
- **Fix:** I read the union of the `before` and `after` keys instead. That shows `task_definition` as the one changed attribute, the same result 188-14 recorded. The stop rule held.

**2. [Process] `caffeinate -i` coverage**
- Two stretches ran without their own `caffeinate -i`: the two one-second probe posts, and the first three minutes of the five-minute wait before the first PostHog read (15:26:50Z to 15:29:59Z).
- Every plan, apply, stability wait, read-back and smoke run ran under its own `caffeinate -i`. From 15:29:59Z a `caffeinate -i` covering the whole sitting was held.
- `pmset -g log` shows no sleep or wake entry from 15:13Z to 15:44Z, so no wait was cut short. The override was on the stack for about twelve minutes, 15:25Z to 15:37Z.

**Total deviations:** 2. **Impact on the result:** none. The prohibitions hold:
- The provider was switched by neither a tfvars commit nor the pipeline.
- The override is off the stack and was never written into the tfvars.
- No apply ran while a pipeline run was active.

## Known Stubs

None.

## Next Phase Readiness

- RELAY-04's clause "switching the provider to none stops events with no rebuild" has been observed on the deployed stack. RELAY-10's "with provider `none` nothing is sent" has been checked there too. Both stay open for the phase verifier.
- Staging is at task definition `:20`, which differs from the pipeline's revision only in revision number. A plan with nothing set shows no change.
- `trackEvents` is still `false` on staging.

## Self-Check: PASSED

- FOUND: evidence/188-15-provider-none.md, infra/envs/staging/aws/README.md
- FOUND: 4ebcca7f3, 902191882 (ancestors of HEAD)
- Task 1 verify exit 0, Task 3 verify exit 0, `bound 188-15-2 OPERATOR_REPLY plan=188-15 task=2` exit 0
