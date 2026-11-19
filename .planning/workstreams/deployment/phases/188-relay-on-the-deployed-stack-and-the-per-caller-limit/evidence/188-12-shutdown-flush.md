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
