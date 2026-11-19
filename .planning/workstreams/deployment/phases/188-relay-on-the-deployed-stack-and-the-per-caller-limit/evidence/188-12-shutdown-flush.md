# 188-12 — Queued events delivered in the shutdown flush of a stopped task

Staging: `https://staging.openvaa.org`. Cluster `openvaa-staging`, service `openvaa-staging-frontend`, account `471112560111`, region `eu-north-1`. The observation (CONTEXT B-04, B-05): a hand apply of the running digest with `ANALYTICS_FLUSH_INTERVAL_MS=600000` and a ceiling of one task, seven probe events through the relay, `aws ecs stop-task` of the one task outside any timer tick, exactly seven events at PostHog, and the restore by a plain apply.

## Task 1 — Readiness, read-only: the running digest, the task count, the expected changes (2026-11-19)

Recorded 2026-11-19 (UTC) by the plan executor of plan 188-12, at 10:14:09Z to 10:16Z, from HEAD `a391254d2`. Nothing was applied, planned, stopped or written on any hosted service, AWS resource or GitHub setting, and no attempt of `188-12-2` was opened. The reads were one GET of `https://staging.openvaa.org/api/health`; with `AWS_PROFILE=openvaa-admin` and `AWS_REGION=eu-north-1`, after `aws sts get-caller-identity --query Account` exit 0 and the account match against `471112560111` exit 0: `infra/scripts/running-image-digest.sh`, `aws ecs describe-services` and `aws ecs list-tasks` (counts and status fields only), `aws application-autoscaling describe-scalable-targets` (the two bounds only) and one `aws ecs describe-task-definition` whose `--query` selects the flush interval, the provider, the shutdown timeout and the stop timeout; `gh run list --workflow deploy.yml` and `--workflow destroy.yml`, and the status-filtered `gh api` GETs of `actions/runs`; and a `grep` of the staging tfvars. No secret value and no network address was read. Each status was read on its own line, never through a pipe; the outputs are in the session scratch directory.

```
READ_AT=2026-11-19T10:14:31Z
SERVED_BUILD=a7003b490b4ff92fc72bef5d225c593b222d6c4e
RUNNING_TASK_DEFINITION=arn:aws:ecs:eu-north-1:471112560111:task-definition/openvaa-staging-frontend:10
RUNNING_DIGEST=sha256:e35bde282307277ea7be9aed008b2bc5a31c0a27ff2738b9153e09bf1412182a
NO_RUN_ACTIVE=yes
TFVARS_OVERRIDES=0
RUNNING_TASKS=1
SERVICE_DESIRED=1
SERVICE_DEPLOYMENTS=1
SERVICE_ROLLOUT=COMPLETED
BASELINE_FLUSH_INTERVAL=2000
BASELINE_STOP_TIMEOUT=40
BASELINE_SHUTDOWN_TIMEOUT=25
BASELINE_FLOOR=1
BASELINE_CEILING=2
EXPECTED_OBS_CHANGES=update module.frontend.aws_ecs_service.app; delete-create module.frontend.aws_ecs_task_definition.app; update module.frontend.aws_appautoscaling_target.service
EXPECTED_OBS_PLAN_LINE=Plan: 1 to add, 2 to change, 1 to destroy.
EXPECTED_OBS_ENV_CHANGE=ANALYTICS_FLUSH_INTERVAL_MS 2000->600000, no other name or value
EXPECTED_OBS_CEILING=2->1
EXPECTED_RESTORE_CHANGES=the same three addresses and actions, back to ANALYTICS_FLUSH_INTERVAL_MS 2000 and ceiling 2
```

- **`SERVED_BUILD=`.** `curl -sS --max-time 20 https://staging.openvaa.org/api/health` exit 0, HTTP 200, body `{"status":"ok","build":"a7003b490b4ff92fc72bef5d225c593b222d6c4e"}`, equal to `DEPLOY_COMMIT=` of `evidence/188-10-rollout.md`.
- **`RUNNING_DIGEST=`.** `running-image-digest.sh --cluster openvaa-staging --service openvaa-staging-frontend` exit 0: task definition `:10`, `running_image_reference=digest`, the digest equal to `BUILD_DIGEST=` of `evidence/188-10-rollout.md`. Every plan of Task 3 is given it as `-var "image_digest=$DIGEST"`.
- **`NO_RUN_ACTIVE=yes`.** `gh run list --workflow deploy.yml` exit 0, 8 runs, none other than `completed` (the latest `44491292876`, `success`, plan 188-10's); `gh run list --workflow destroy.yml` exit 0, one run, `completed`. The status-filtered counts of `actions/runs` are 0 for `queued`, `in_progress`, `waiting`, `requested` and `pending`, each GET exit 0. Task 3 reads this again before each apply, because a pipeline run started between now and then would make a hand apply forbidden.
- **`TFVARS_OVERRIDES=0`.** `grep -cE '^ *environment_overrides *=' infra/envs/staging/aws/terraform.tfvars` counts 0 (exit 1, no match): the one mention of the name is the file's comment on line 5. `omit_environment`, `debug_ingress_cidrs` and `scheduled_floor_changes` have no assignment line either (count 0). The file sets `task_floor = 1`, `task_ceiling = 2`, `stop_timeout_seconds = 40` and `ANALYTICS_FLUSH_INTERVAL_MS = "2000"`.
- **`RUNNING_TASKS=1`.** `aws ecs describe-services` exit 0: status `ACTIVE`, running 1, desired 1, pending 0, one deployment, `COMPLETED`, on `:10`. `aws ecs list-tasks --desired-status RUNNING` exit 0, one task. The scaling floor is 1, so the service already runs the one task the ceiling of 1 will hold; the ceiling's purpose is that the CPU policy cannot add a second task, to which the relay's POST could be routed, inside the window.
- **The running values, read for the restore's read-back.** `describe-task-definition` of `:10` exit 0: `ANALYTICS_FLUSH_INTERVAL_MS` `2000`, `ANALYTICS_PROVIDER` `posthog`, `SHUTDOWN_TIMEOUT` `25`, `stopTimeout` 40. `describe-scalable-targets` exit 0: minimum 1, maximum 2. Task 3's `RESTORE_FLUSH_INTERVAL=2000` and `RESTORE_CEILING=2` must read these values again.
- **The stop rule of the observation plan, written before any plan is made.** The plan with `-var "image_digest=$DIGEST" -var 'environment_overrides={ANALYTICS_FLUSH_INTERVAL_MS="600000"}' -var task_ceiling=1` is applied only when its resource changes, read from the plan JSON with the runbook's `changes` function, are exactly the three of `EXPECTED_OBS_CHANGES=`; its `Plan:` line reads `EXPECTED_OBS_PLAN_LINE=` (the replaced task definition is one add and one destroy, the service and the scalable target the two changes); the container environment's names are unchanged; and the one changed environment value is `ANALYTICS_FLUSH_INTERVAL_MS`, `2000` to `600000`, with the image unchanged, because the digest is the running one. `max_capacity` is the target's only changed attribute (`aws_appautoscaling_target.service` sets `min_capacity` from `task_floor` and `max_capacity` from `task_ceiling`, both updatable in place). The CPU policy and the scheduled actions (none) must not appear. Any other change, any other address, or an image change is a stop: nothing is applied. The restore plan, with the digest alone, is read against the same three addresses and actions, back to the tfvars' values.

## Task 3 — Halted after the observation apply: the smoke run red, the stack restored (2026-11-19)

Recorded 2026-11-19 (UTC) by the continuation executor of plan 188-12, from 10:40Z. Key `188-12-2`, attempt `20261119T101633Z.4b30c500a`. The stored reply holds `answer_attempt=20261119T101633Z.4b30c500a` and `answer_sitting=approve`. `bash "$A" bound 188-12-2 OPERATOR_REPLY plan=188-12 task=2` exit 0 and `bash "$A" has 188-12-2 '^answer_sitting=approve$'` exit 0, both read before the first plan. Every AWS and Terraform command ran with `AWS_PROFILE=openvaa-admin` after the account check (exit 0, match exit 0), `TF_VAR_alert_email` checked with `test -n` only (exit 0), and `TF_DATA_DIR` at a fresh directory under the session scratch directory against the root's S3 backend (`init -lockfile=readonly` exit 0), so the operator's `.terraform/` was not touched. No plan output is shared here: the lines below are read from the plan JSON (addresses and actions, the environment's names and the changed values of the one override only). Each status was read on its own line.

The observation smoke run was red, so by the dispatch's stop rule ("if anything fails after the observation apply, restore first, then stop and report") the probe, the stop of the task and the PostHog read were **not** made, and the stack was restored at once. No `B04_*` line is recorded, because no B-04 observation was made.

### The observation apply

```
OBS_PRE_APPLY_ACTIVE_RUNS=0
OBS_DIGEST=sha256:e35bde282307277ea7be9aed008b2bc5a31c0a27ff2738b9153e09bf1412182a
OBS_PLAN_LINE=Plan: 1 to add, 2 to change, 1 to destroy.
OBS_CHANGE=update module.frontend.aws_appautoscaling_target.service
OBS_CHANGE=update module.frontend.aws_ecs_service.app
OBS_CHANGE=delete-create module.frontend.aws_ecs_task_definition.app
OBS_TD_IMAGE_UNCHANGED=yes
OBS_TD_ENV_NAMES_UNCHANGED=yes
OBS_TD_ENV_CHANGED_NAMES=ANALYTICS_FLUSH_INTERVAL_MS
OBS_TD_FLUSH=2000->600000
OBS_TD_SECRET_NAMES_UNCHANGED=yes
OBS_TARGET_MAX=2->1
OBS_TARGET_CHANGED_KEYS=max_capacity
OBS_PLAN_MATCHES=yes
OBS_APPLY_EXIT=0
OBS_APPLY_LINE=Apply complete! Resources: 1 added, 2 changed, 1 destroyed.
OBS_APPLY_WINDOW=2026-11-19T10:43:28Z..2026-11-19T10:45:42Z
OBS_WAIT_STABLE_EXIT=0
OBS_STABLE_AT=2026-11-19T10:46:28Z
OBS_RUNNING_TASKS=1
OBS_TASK_DEFINITION=openvaa-staging-frontend:11
OBS_RUNNING_FLUSH_INTERVAL=600000
OBS_RUNNING_CEILING=1
OBS_TASK=78e34ee2110040408fef20fdba4442ed
OBS_TASK_STARTED=2026-11-19T10:44:56Z
OBS_SMOKE_RUN_DIR=tests/e2e-runs/188-12-obs-20261119T104646Z
OBS_SMOKE_EXIT=1
OBS_SMOKE_VERDICT_EXIT=1
```

- **The plan** (made 10:40Z to 10:43Z with `-var "image_digest=$DIGEST" -var 'environment_overrides={ANALYTICS_FLUSH_INTERVAL_MS="600000"}' -var task_ceiling=1`, `plan_exit=0`, `show_exit=0`) matched Task 1's stop rule line for line: the three `EXPECTED_OBS_CHANGES=`, `EXPECTED_OBS_PLAN_LINE=`, the image unchanged, the environment's names and secrets' names unchanged, `ANALYTICS_FLUSH_INTERVAL_MS` the one changed value, `stopTimeout` 40 to 40, the scalable target's `max_capacity` its one changed key, `min_capacity` 1 to 1.
- **No run active.** The status-filtered `actions/runs` counts (queued, in_progress, waiting, requested, pending) summed 0 and no `deploy.yml` or `destroy.yml` run was other than `completed` at 10:43:10Z, each read exit 0.
- **The apply** of that saved file alone, in the background, exit 0; `aws ecs wait services-stable` exit 0 on its first try. The saved plan was removed after it. Read back at 10:46:49Z: one deployment `COMPLETED` on `:11`, one task `RUNNING` `HEALTHY`; `:11` holds `ANALYTICS_FLUSH_INTERVAL_MS` `600000`, `stopTimeout` 40 and the running digest; the scalable target reads minimum 1, maximum 1.
- **The smoke run: red.** `tests/README.md` § Deployed smoke run, `SMOKE_EXPECTED_SHA=a7003b490b4ff92fc72bef5d225c593b222d6c4e`, `git diff --quiet <sha> -- apps packages` exit 0, 10:46:46Z to 10:48:23Z. The gate held (the five `PASS` lines, `DEPLOYED SMOKE GATE OK build=a7003b490…`); `contestant.smoke.ts` passed; `voter.smoke.ts` failed on `Test timeout of 90000ms exceeded` at `locator.click` of the fifth `question-choice` of the first question, because `<div role="dialog" aria-modal="false" aria-label="Collecting Usage Data" …> subtree intercepts pointer events`. `e2e-spec-verdict.mjs … --no-flaky` printed `VERDICT FAIL: voter.smoke.ts … is failed, not passed`, exit 1. `pmset -g log` holds no `Sleep` or `DarkWake` entry inside the run's window (the last, 08:19Z), so the run is not void.

### The restore, made at once

```
RESTORE_PRE_APPLY_ACTIVE_RUNS=0
RESTORE_PLAN_LINE=Plan: 1 to add, 2 to change, 1 to destroy.
RESTORE_CHANGE=update module.frontend.aws_appautoscaling_target.service
RESTORE_CHANGE=update module.frontend.aws_ecs_service.app
RESTORE_CHANGE=delete-create module.frontend.aws_ecs_task_definition.app
RESTORE_TD_IMAGE_UNCHANGED=yes
RESTORE_TD_ENV_NAMES_UNCHANGED=yes
RESTORE_TD_ENV_CHANGED_NAMES=ANALYTICS_FLUSH_INTERVAL_MS
RESTORE_TD_FLUSH=600000->2000
RESTORE_TARGET_MAX=1->2
RESTORE_TARGET_CHANGED_KEYS=max_capacity
RESTORE_PLAN_MATCHES=yes
RESTORE_APPLY_EXIT=0
RESTORE_APPLY_LINE=Apply complete! Resources: 1 added, 2 changed, 1 destroyed.
RESTORE_APPLY_WINDOW=2026-11-19T10:49:13Z..2026-11-19T10:51:06Z
RESTORE_WAIT_STABLE_EXIT=0
RESTORE_STABLE_AT=2026-11-19T10:51:52Z
RESTORE_TASK_DEFINITION=openvaa-staging-frontend:12
RESTORE_RUNNING_DIGEST=sha256:e35bde282307277ea7be9aed008b2bc5a31c0a27ff2738b9153e09bf1412182a
RESTORE_RUNNING_TASKS=1
RESTORE_FLUSH_INTERVAL=2000
RESTORE_STOP_TIMEOUT=40
RESTORE_PROVIDER=posthog
RESTORE_FLOOR=1
RESTORE_CEILING=2
RESTORE_PLAN_AFTER_EXIT=0
RESTORE_SERVED_BUILD=a7003b490b4ff92fc72bef5d225c593b222d6c4e
RESTORE_TFVARS_OVERRIDES=0
RESTORE_SMOKE_RUN_DIR=tests/e2e-runs/188-12-restore-20261119T105211Z
RESTORE_SMOKE_EXIT=1
RESTORE_SMOKE_VERDICT_EXIT=1
HOSTED_WRITES=task-definition:11,service-rollout,scalable-target-max-1,task-definition:12,service-rollout,scalable-target-max-2
B04_NOT_OBSERVED=halted-by-red-observation-smoke
```

- **The restore plan**, with the running digest alone, matched the same three addresses and actions, back to the tfvars' values: `ANALYTICS_FLUSH_INTERVAL_MS` `600000` to `2000`, `max_capacity` 1 to 2, nothing else. No run was active at 10:49Z (counts 0, each read exit 0). The apply of that saved file, exit 0, then `services-stable` exit 0.
- **The read-back.** `running-image-digest.sh` exit 0: `:12`, by digest, the running digest unchanged. `describe-task-definition` of `:12` exit 0: `ANALYTICS_FLUSH_INTERVAL_MS` `2000`, `ANALYTICS_PROVIDER` `posthog`, `stopTimeout` 40. `describe-scalable-targets` exit 0: minimum 1, maximum 2. `describe-services` exit 0: one deployment, `COMPLETED`, running 1 of desired 1. A plan with the digest alone and `-detailed-exitcode` exit 0: no change. `/api/health` HTTP 200, build `a7003b490…`. The tfvars hold no `environment_overrides` assignment (count 0) and are unchanged in the working tree.
- **The restore's smoke run: red the same way.** 10:52:11Z to 10:53:48Z, the gate held, `contestant.smoke.ts` passed, `voter.smoke.ts` failed at the same locator, the same `Collecting Usage Data` dialog intercepting pointer events; verdict exit 1. No sleep in the window.
- **Why the smoke run is red, and why not because of this plan.** Both runs fail identically, one with the override and one without it, so the override is not the cause. The dialog is the voter app's consent prompt, which is shown since the operator set the staging project's `analytics.trackEvents` to `true` at 2026-11-19T09:30:36Z (CONTEXT B-03 note, plan 188-11). The last green deployed smoke run, the pipeline's at 09:06Z in plan 188-10, ran while it was `false`. `voter.smoke.ts` does not answer the prompt, and the prompt, a non-modal dialog fixed at the bottom of the viewport, covers the fifth answer choice of the first question on Desktop Chrome. Until either the spec answers the prompt or `trackEvents` is `false` again, every deployed smoke run, the pipeline's own included, is red; this blocks every later rollout of the phase, not only this plan.
- **What did not happen.** No probe event was posted, no task was stopped by hand, and PostHog was not read. The transient task definitions `:11` and `:12` and their two rollouts are the only hosted writes; the two smoke runs' pageviews were forwarded to PostHog project 347462 as every visit's are.
