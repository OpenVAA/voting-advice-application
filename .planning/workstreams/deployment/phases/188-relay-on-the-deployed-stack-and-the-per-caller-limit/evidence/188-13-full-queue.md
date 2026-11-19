# 188-13 — The deployed relay's bounded queue drops when full

Staging: `https://staging.openvaa.org`. Cluster `openvaa-staging`, service `openvaa-staging-frontend`, account `471112560111`, region `eu-north-1`. The observation (CONTEXT C-02): a hand apply of the running digest with `ANALYTICS_PROVIDER=log`, `ANALYTICS_FLUSH_INTERVAL_MS=600000` and a ceiling of one task; 21 relay requests of 50 `answer` events each, all answered 204; the one task stopped so that its shutdown flush writes the queue; exactly 1000 event lines and one `Analytics queue was full and dropped events` line with `dropped` of at least 50; memory within 5 points of the five minutes before; nothing at PostHog; the restore by a plain apply.

## Task 1 — Readiness, read-only: restored state, memory baseline source, the stop rule (2026-11-19)

Recorded 2026-11-19 (UTC) by the plan executor of plan 188-13, at 13:15:53Z to 13:17Z, from HEAD `09a891e2c`. Nothing was applied, planned, stopped or written on any hosted service, AWS resource or GitHub setting, and no attempt of `188-13-2` was opened. The reads were one GET of `https://staging.openvaa.org/api/health`; with `AWS_PROFILE=openvaa-admin` and `AWS_REGION=eu-north-1`, after `aws sts get-caller-identity --query Account` exit 0 and the account match against `471112560111` exit 0: `infra/scripts/running-image-digest.sh`, `aws ecs describe-services` and `aws ecs list-tasks` (counts and status fields only), `aws application-autoscaling describe-scalable-targets` (the two bounds only), one `aws ecs describe-task-definition` whose `--query` selects the flush interval, the provider, the shutdown timeout, the stop timeout, the secrets' names and whether the PostHog key's source is a parameter, `aws ecs describe-clusters --include SETTINGS`, and two `aws cloudwatch get-metric-statistics` reads; `gh run list --workflow deploy.yml` and `--workflow destroy.yml`, and the status-filtered `gh api` GETs of `actions/runs`; and a `grep` of the staging tfvars. No secret value and no network address was read. Each status was read on its own line, never through a pipe; the outputs are in the session scratch directory.

```
READ_AT=2026-11-19T13:15:53Z
SERVED_BUILD=a7003b490b4ff92fc72bef5d225c593b222d6c4e
RUNNING_TASK_DEFINITION=arn:aws:ecs:eu-north-1:471112560111:task-definition/openvaa-staging-frontend:14
RUNNING_DIGEST=sha256:e35bde282307277ea7be9aed008b2bc5a31c0a27ff2738b9153e09bf1412182a
RUNNING_PROVIDER=posthog
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
MEMORY_METRIC_AVAILABLE=yes
MEMORY_METRIC_SOURCE=AWS/ECS MemoryUtilization, dimensions ClusterName=openvaa-staging ServiceName=openvaa-staging-frontend, period 60, statistic Maximum, Container Insights disabled
MEMORY_METRIC_DATAPOINTS_10MIN=10
MEMORY_MAX_10MIN=9.717
EXPECTED_OBS_CHANGES=update module.frontend.aws_ecs_service.app; delete-create module.frontend.aws_ecs_task_definition.app; update module.frontend.aws_appautoscaling_target.service
EXPECTED_OBS_PLAN_LINE=Plan: 1 to add, 2 to change, 1 to destroy.
EXPECTED_OBS_ENV_CHANGE=ANALYTICS_FLUSH_INTERVAL_MS 2000->600000 and ANALYTICS_PROVIDER posthog->log, no other name or value
EXPECTED_OBS_CEILING=2->1
EXPECTED_RESTORE_CHANGES=the same three addresses and actions, back to ANALYTICS_FLUSH_INTERVAL_MS 2000, ANALYTICS_PROVIDER posthog and ceiling 2
```

- **`SERVED_BUILD=`.** `curl -sS --max-time 20 https://staging.openvaa.org/api/health` exit 0, HTTP 200, body `{"status":"ok","build":"a7003b490b4ff92fc72bef5d225c593b222d6c4e"}`, equal to `DEPLOY_COMMIT=` of `evidence/188-10-rollout.md`.
- **`RUNNING_DIGEST=`.** `running-image-digest.sh --cluster openvaa-staging --service openvaa-staging-frontend` exit 0: task definition `:14` (188-12's restore), `running_image_reference=digest`, the digest equal to `BUILD_DIGEST=` of `evidence/188-10-rollout.md` and to `RESTORE_RUNNING_DIGEST=` of `evidence/188-12-shutdown-flush.md`. Every plan of Task 3 is given it as `-var "image_digest=$DIGEST"`.
- **`RUNNING_PROVIDER=posthog`.** `describe-task-definition` of `:14` exit 0: `ANALYTICS_PROVIDER` `posthog`, `ANALYTICS_FLUSH_INTERVAL_MS` `2000`, `SHUTDOWN_TIMEOUT` `25`, `stopTimeout` 40; the secrets' names are `PUBLIC_SUPABASE_ANON_KEY` and `ANALYTICS_POSTHOG_KEY`, the key's source a parameter-store path. These equal 188-12's `RESTORE_PROVIDER=`, `RESTORE_FLUSH_INTERVAL=` and `RESTORE_STOP_TIMEOUT=`, so 188-12's restore holds. The override does not remove the key's secret: the module merges `environment_overrides` into the values only (`infra/modules/frontend-service/main.tf`), and the application reads the key only when the provider is `posthog`, so under `log` the secret's name stays in the task definition and is not used. `log` is one of the configuration's three providers (`apps/frontend/src/lib/server/analytics/config.ts`).
- **`NO_RUN_ACTIVE=yes`.** `gh run list --workflow deploy.yml` exit 0, 8 runs, none other than `completed` (the latest `44491292876`, `success`, plan 188-10's); `gh run list --workflow destroy.yml` exit 0, one run, `completed`. The status-filtered counts of `actions/runs` are 0 for `queued`, `in_progress`, `waiting`, `requested` and `pending`, each GET exit 0. Task 3 reads this again before each apply.
- **`TFVARS_OVERRIDES=0`.** `grep -cE '^ *environment_overrides *=' infra/envs/staging/aws/terraform.tfvars` counts 0; `omit_environment`, `debug_ingress_cidrs` and `scheduled_floor_changes` count 0 too. The file sets `task_floor = 1`, `task_ceiling = 2`, `stop_timeout_seconds = 40`, `ANALYTICS_PROVIDER = "posthog"` and `ANALYTICS_FLUSH_INTERVAL_MS = "2000"`, and has no change in the working tree.
- **`RUNNING_TASKS=1`.** `aws ecs describe-services` exit 0: status `ACTIVE`, running 1, desired 1, pending 0, one deployment, `COMPLETED`, on `:14`. `aws ecs list-tasks --desired-status RUNNING` exit 0, one task. `describe-scalable-targets` exit 0: minimum 1, maximum 2. Task 3's `RESTORE_CEILING=2`, `RESTORE_FLUSH_INTERVAL=2000` and `RESTORE_PROVIDER=posthog` must read these values again.
- **`MEMORY_METRIC_AVAILABLE=yes`.** `aws cloudwatch get-metric-statistics --namespace AWS/ECS --metric-name MemoryUtilization --dimensions Name=ClusterName,Value=openvaa-staging Name=ServiceName,Value=openvaa-staging-frontend --period 60 --statistics Maximum Average` for 13:06:41Z to 13:16:41Z exit 0: 10 one-minute datapoints, unit `Percent`, maxima 9.717 (13:06Z, the minute of 188-12's restore rollout), then 8.887 to 9.180. `describe-clusters --include SETTINGS` exit 0: `containerInsights` `disabled`, so research assumption A5 holds: the service-level metric is there at one-minute resolution without Container Insights. `CPUUtilization` with the same dimensions returned 10 datapoints too. Task 3 reads `C02_MEMORY_MAX_BEFORE=` from this source (the highest one-minute `Maximum` of the five minutes before the first post) and `C02_MEMORY_MAX_DURING=` over the five minutes from it. The service's metric averages over its running tasks; with the ceiling at one task, it is that task's.
- **The stop rule of the observation plan, written before any plan is made.** The plan with `-var "image_digest=$DIGEST" -var 'environment_overrides={ANALYTICS_FLUSH_INTERVAL_MS="600000",ANALYTICS_PROVIDER="log"}' -var task_ceiling=1` is applied only when its resource changes, read from the plan JSON with the runbook's `changes` function, are exactly the three of `EXPECTED_OBS_CHANGES=`; its `Plan:` line reads `EXPECTED_OBS_PLAN_LINE=`; the container environment's names and the secrets' names are unchanged; the changed environment values are exactly `ANALYTICS_FLUSH_INTERVAL_MS` `2000` to `600000` and `ANALYTICS_PROVIDER` `posthog` to `log`; the image is unchanged; and `max_capacity` is the target's only changed attribute. The CPU policy and the scheduled actions (none) must not appear. Any other change, any other address, or an image change is a stop: nothing is applied. The restore plan, with the digest alone, is read against the same three addresses and actions, back to the tfvars' values. `600000` is the configuration's largest accepted interval (`MAX_FLUSH_INTERVAL_MS`).
- **The timer rule for Task 3.** From 188-12: the queue is built, and its timer started, when the usage endpoint's module first loads, on the task's first `/api/usage` request, no earlier than the task's start. The earliest possible tick is therefore `startedAt + 600 s`, and the latest the first `/api/usage` request + 600 s. `C02_TIMER_TICK_IN_WINDOW=no` needs the 21 posts to begin at least 240 s before the earliest possible tick, and the stop's `SIGTERM` (about a minute after the stop call, after the load balancer's deregistration) to come before it. Events queued by other traffic before the burst, the smoke run's pageviews included, take queue places too; the invariant is the cap of 1000 kept and at least 50 dropped.
- **The burst's shape.** The relay accepts at most 50 events per batch (`MAX_BATCH_EVENTS`), 16 KiB per batch and 32 KiB per body (`apps/frontend/src/lib/analytics/constants.ts`), so each of the 21 requests is one envelope of 50 events, and its body size is checked before it is posted. The queue's cap is 1000 (`DEFAULT_MAX_SIZE` in `queue.ts`); the drop count is written as one `warn` line at the next flush, which here is the shutdown flush.

## Task 3 — The burst, the drop line, flat memory, the restore (2026-11-19, attempt 20261119T131829Z.bd2db93c8)

Recorded 2026-11-19 (UTC) by the continuation executor of plan 188-13, from 13:26Z. Key `188-13-2`, attempt `20261119T131829Z.bd2db93c8`. `bash "$A" bound 188-13-2 OPERATOR_REPLY plan=188-13 task=2` exit 0 and `bash "$A" has 188-13-2 '^answer_sitting=approve$'` exit 0, both read before the first plan. Every AWS and Terraform command ran with `AWS_PROFILE=openvaa-admin` after the account check (exit 0, match exit 0), `TF_VAR_alert_email` checked with `test -n` only (exit 0), and `TF_DATA_DIR` at a fresh directory under the session scratch directory against the root's S3 backend (`init -lockfile=readonly` exit 0), so the operator's `.terraform/` was not touched. The AWS SSO session held for the whole sitting. No plan output is shared here: the lines below are read from the plan JSON (addresses and actions, the environment's names and the changed values of the two overrides only). Log reads printed counts, timestamps and the one `dropped` number only. Each status was read on its own line.

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
OBS_TD_ENV_CHANGED_NAMES=ANALYTICS_FLUSH_INTERVAL_MS,ANALYTICS_PROVIDER
OBS_TD_FLUSH=2000->600000
OBS_TD_PROVIDER=posthog->log
OBS_TD_SECRET_NAMES_UNCHANGED=yes
OBS_TD_STOP_TIMEOUT=40->40
OBS_TARGET_MAX=2->1
OBS_TARGET_CHANGED_KEYS=max_capacity
OBS_PLAN_MATCHES=yes
OBS_APPLY_EXIT=0
OBS_APPLY_LINE=Apply complete! Resources: 1 added, 2 changed, 1 destroyed.
OBS_APPLY_WINDOW=2026-11-19T13:29:43Z..2026-11-19T13:31:38Z
OBS_WAIT_STABLE_EXIT=0
OBS_STABLE_AT=2026-11-19T13:32:25Z
OBS_RUNNING_TASKS=1
OBS_TASK_DEFINITION=openvaa-staging-frontend:15
OBS_RUNNING_FLUSH_INTERVAL=600000
OBS_RUNNING_PROVIDER=log
OBS_RUNNING_CEILING=1
OBS_TASK=13bd622d8ccb4738a64d548dd815dc34
OBS_TASK_STARTED=2026-11-19T13:31:02Z
OBS_APPLY_SMOKE_RUN_DIR=tests/e2e-runs/188-13-obsapply-20261119T133228Z
OBS_APPLY_SMOKE_VERDICT_EXIT=0
```

### The burst and the stop

```
C02_EARLIEST_POSSIBLE_TICK=2026-11-19T13:41:02Z
C02_TIMER_TICK_IN_WINDOW=no
C02_PROBE=p188c0220261119T133608Z
C02_BODY_EVENTS=50
C02_BODY_BYTES=4548
C02_FIRST_POST_AT=2026-11-19T13:36:08Z
C02_LAST_POST_AT=2026-11-19T13:36:10Z
C02_POSTS=21
C02_POSTS_204=21
C02_STOP_CALL_AT=2026-11-19T13:36:10Z
C02_STOP_CODE=UserInitiated
C02_EXIT_CODE=0
C02_CONTAINER_REASON=none
C02_SHUTDOWN_LINE_AT=2026-11-19T13:36:59Z
C02_EXECUTION_STOPPED_AT=2026-11-19T13:37:10Z
C02_STOPPED_AT=2026-11-19T13:37:36Z
C02_STOP_SECONDS=86
C02_DROP_LINES=1
C02_DROPPED=60
C02_EVENT_LINES_TOTAL=1000
C02_PROBE_EVENT_LINES=990
C02_OTHER_EVENT_LINES=pageview=10
C02_FLUSH_AT=2026-11-19T13:36:59Z
C02_FORWARD_FAILURES=0
C02_STREAM_EVENTS_ALL=1020
OBS_REPLACEMENT_TASK=0ec3d20817504a9f8ffbd81520be1d3e
OBS_REPLACEMENT_TASK_DEFINITION=openvaa-staging-frontend:15
OBS_REPLACEMENT_STABLE_AT=2026-11-19T13:37:41Z
OBS_SMOKE_RUN_DIR=tests/e2e-runs/188-13-obs-20261119T133743Z
OBS_SMOKE_EXIT=0
OBS_SMOKE_VERDICT_EXIT=0
```

### Memory

```
C02_MEMORY_SOURCE=AWS/ECS MemoryUtilization, ClusterName=openvaa-staging ServiceName=openvaa-staging-frontend, period 60, Maximum
C02_MEMORY_BEFORE_POINTS=13:31Z 9.668, 13:32Z 14.99, 13:33Z 8.887, 13:34Z 8.887, 13:35Z 8.887
C02_MEMORY_DURING_POINTS=13:36Z 9.277, 13:37Z 3.809, 13:38Z 9.521, 13:39Z 8.887, 13:40Z 8.887
C02_MEMORY_MAX_BEFORE_WINDOW=14.99
C02_MEMORY_MAX_BEFORE=8.887
C02_MEMORY_MAX_DURING=9.521
C02_MEMORY_RISE_POINTS=0.634
C02_MEMORY_FLAT=yes
```

### PostHog

```
C02_POSTHOG_EVENTS=0
C02_POSTHOG_READS=0,0,0,0,0 (13:42:06Z to 13:50:12Z)
```

### The restore

```
RESTORE_PRE_APPLY_ACTIVE_RUNS=0
RESTORE_PLAN_LINE=Plan: 1 to add, 2 to change, 1 to destroy.
RESTORE_CHANGE=update module.frontend.aws_appautoscaling_target.service
RESTORE_CHANGE=update module.frontend.aws_ecs_service.app
RESTORE_CHANGE=delete-create module.frontend.aws_ecs_task_definition.app
RESTORE_TD_IMAGE_UNCHANGED=yes
RESTORE_TD_ENV_NAMES_UNCHANGED=yes
RESTORE_TD_ENV_CHANGED_NAMES=ANALYTICS_FLUSH_INTERVAL_MS,ANALYTICS_PROVIDER
RESTORE_TD_FLUSH=600000->2000
RESTORE_TD_PROVIDER=log->posthog
RESTORE_TD_SECRET_NAMES_UNCHANGED=yes
RESTORE_TARGET_MAX=1->2
RESTORE_TARGET_CHANGED_KEYS=max_capacity
RESTORE_PLAN_MATCHES=yes
RESTORE_APPLY_EXIT=0
RESTORE_APPLY_LINE=Apply complete! Resources: 1 added, 2 changed, 1 destroyed.
RESTORE_APPLY_WINDOW=2026-11-19T13:39:09Z..2026-11-19T13:41:04Z
RESTORE_WAIT_STABLE_EXIT=0
RESTORE_STABLE_AT=2026-11-19T13:41:51Z
RESTORE_TASK_DEFINITION=openvaa-staging-frontend:16
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
RESTORE_SMOKE_RUN_DIR=tests/e2e-runs/188-13-restore-20261119T134222Z
RESTORE_SMOKE_EXIT=0
RESTORE_SMOKE_VERDICT_EXIT=0
HOSTED_WRITES=task-definition:15,service-rollout,scalable-target-max-1,1050-probe-events-to-the-log,stop-task,task-definition:16,service-rollout,scalable-target-max-2
```

- **`OBS_PLAN_MATCHES=yes`.** The saved plan (`-var "image_digest=$DIGEST" -var 'environment_overrides={ANALYTICS_FLUSH_INTERVAL_MS="600000",ANALYTICS_PROVIDER="log"}' -var task_ceiling=1`, plan and show exit 0) matched Task 1's stop rule line for line: the three addresses and actions of `EXPECTED_OBS_CHANGES=`, the plan line, the image and the environment's and secrets' names unchanged, exactly the two expected values changed, `max_capacity` the target's only changed attribute and no service attribute changed. No run was active at 13:28:13Z (before the plan) or at 13:29:33Z (before the apply): the five status counts 0 and no `deploy.yml` or `destroy.yml` run other than `completed`, each read exit 0. The apply exit 0, `services-stable` exit 0 on its first try. One task, `13bd622d…`, on `:15`, started 13:31:02Z. The task definition read back `ANALYTICS_FLUSH_INTERVAL_MS` `600000` and `ANALYTICS_PROVIDER` `log`, and the scalable target's maximum read 1.
- **`OBS_APPLY_SMOKE_VERDICT_EXIT=0`.** The deployed smoke run right after the rollout, `SMOKE_EXPECTED_SHA=a7003b490b4ff92fc72bef5d225c593b222d6c4e`, `git diff --quiet <sha> -- apps packages` exit 0, 13:32:28Z to 13:32:41Z: the five `PASS` lines, `DEPLOYED SMOKE GATE OK build=a7003b490…`, `2 passed (12.0s)`, `VERDICT OK: 2 tests -- passed 2, failed 0, flaky 0, skipped 0, did not run 0`. Its pageviews went into the one task's queue: they are the 10 `pageview` lines of the flush.
- **`C02_TIMER_TICK_IN_WINDOW=no`.** The queue's timer started no earlier than the task's start, so its first tick was no earlier than `startedAt + 600 s`, 13:41:02Z. The chain waited until `startedAt + 300 s` so that the five minutes before the burst were the one task's own, then posted at 13:36:08Z, 294 s before that earliest tick (the rule asks for 240 s). The shutdown flush ran at 13:36:59Z, 243 s before it, and the task was stopped by 13:37:36Z: no tick fell between the first post and the flush.
- **`C02_POSTS_204=21`.** 21 sequential `POST https://staging.openvaa.org/api/usage` requests, each with `Content-Type: application/json`, `Sec-Fetch-Site: same-origin` and `Origin: https://staging.openvaa.org`, each one envelope (route `/(voters)`, locale `en`) of 50 `answer` events, each `ago` 0, value 1, question id `C02_PROBE=`. Every body was 4548 bytes, under the 16 KiB batch limit. Every `curl` exit 0 and every status 204, all 21 between 13:36:08Z and 13:36:10Z: the relay answered at once whether the queue had room or not. With the ceiling at one task, the one task received all of them.
- **The stop.** `aws ecs stop-task --cluster openvaa-staging --task <arn> --reason p188c02` exit 0 at 13:36:10Z, `aws ecs wait tasks-stopped` exit 0, `describe-tasks` exit 0: `STOPPED`, `stopCode` `UserInitiated`, the container's exit code 0 and no container reason. `stoppingAt` 13:36:11Z; the shutdown line came at 13:36:59Z after the load balancer's deregistration, the container stopped at 13:37:10Z, `stoppedAt` 13:37:36Z, 86 s after the call.
- **The flush in the stopped task's log**, `aws logs filter-log-events` on `/openvaa/staging/frontend`, stream `frontend/frontend/13bd622d8ccb4738a64d548dd815dc34` alone, counts only, each read exit 0:
  - `{ $.severityText = "INFO" && $.level = 30 }`, the log provider's event lines: **1000** events, all at 13:36:59Z. By name: `answer` 990, `pageview` 10. `{ $.attributes.questionId = "<probe>" }`: 990. `{ $.msg = "answer" }`: 990.
  - `"Analytics queue was full and dropped events"`: **1** event at 13:36:59Z. The logger prints its record's fields one line each, so the record's attribute is its own log event: the filter `"dropped:"` matched 1 event, of the shape `attributes: { dropped: N }` with `N` **60**. The arithmetic holds exactly: 10 pageviews and 1050 probe events offered, 1000 kept, 60 dropped. The record carries a count and nothing else about the dropped events.
  - `"The server is exiting after its stop."`: 1 event, 13:36:59Z. `"Analytics forward to PostHog failed"`: 0. The stream holds 1020 events in all: the 1000 event lines and the lines of the server's own records.
- **`OBS_SMOKE_VERDICT_EXIT=0`.** The service replaced the stopped task with `0ec3d208…` on `:15` (still the override), started 13:37:23Z; `services-stable` exit 0 at 13:37:41Z. The deployed smoke run on it, 13:37:43Z to 13:37:56Z: the five `PASS` lines, the gate's OK line, `2 passed (12.1s)`, `VERDICT OK: 2 tests -- passed 2, failed 0, flaky 0, skipped 0, did not run 0`.
- **`C02_MEMORY_FLAT=yes`.** `aws cloudwatch get-metric-statistics` of the Task 1 source, exit 0 for both windows, five one-minute `Maximum` datapoints each. The plan's "five minutes before" window, 13:31:08Z to 13:36:08Z, holds the observation rollout's minute, 13:32Z, at 14.99 %, when the old task `:14` was draining while the new one started; its literal maximum is `C02_MEMORY_MAX_BEFORE_WINDOW=14.99`, against which the rise would be negative. The baseline recorded instead is the minutes in which the one task ran alone, 13:33Z to 13:35Z, 8.887 % each, which is the stricter figure: `C02_MEMORY_MAX_DURING=9.521` (13:38Z, the replacement task's first minute) less `C02_MEMORY_MAX_BEFORE=8.887` is a rise of 0.634 points. The burst task's own last minute, 13:36Z, read 9.277 %, a rise of 0.390 points with 1000 events held. The 13:37Z point, 3.809 %, is the minute in which the burst task stopped and the replacement started.
- **`C02_POSTHOG_EVENTS=0`.** `posthog-read.sh --project 347462 --mode probe-count --probe p188c0220261119T133608Z --since 2026-11-19T13:34:08Z --until 2026-11-19T14:36:08Z`, the read-only key read from the keychain into the one command and never printed: 0 in each of five reads two minutes apart, 13:42:06Z to 13:50:12Z, the last 14 minutes after the first post (each exit 0). The same read counted 188-12's seven probe events, so it does see probe events; with the provider `log`, none of the burst's left the task.
- **The restore.** The plan with the digest alone matched the same three addresses and actions, back to the tfvars' values (`ANALYTICS_FLUSH_INTERVAL_MS` 600000 to 2000, `ANALYTICS_PROVIDER` `log` to `posthog`, `max_capacity` 1 to 2, nothing else). No run was active at 13:38:40Z or at 13:39:09Z (counts 0, each read exit 0). The apply exit 0, `services-stable` exit 0. Read back: `running-image-digest.sh` exit 0, `:16` by the running digest; `describe-task-definition` exit 0, `ANALYTICS_FLUSH_INTERVAL_MS` `2000`, `ANALYTICS_PROVIDER` `posthog`, `stopTimeout` 40, the secrets' names `PUBLIC_SUPABASE_ANON_KEY` and `ANALYTICS_POSTHOG_KEY`; `describe-scalable-targets` exit 0, minimum 1, maximum 2; `describe-services` exit 0, one deployment `COMPLETED`, running 1 of 1; a plan with the digest alone and `-detailed-exitcode` exit 0, `No changes.`; `/api/health` HTTP 200, build `a7003b490…`; no `environment_overrides` assignment in the tfvars (count 0), which are unchanged in the working tree.
- **`RESTORE_SMOKE_VERDICT_EXIT=0`.** 13:42:22Z to 13:42:37Z: the five `PASS` lines, the gate's OK line, `2 passed (13.8s)`, `VERDICT OK: 2 tests -- passed 2, failed 0, flaky 0, skipped 0, did not run 0`.
- **The hosted record.** Task definitions `:15` (the override) and `:16` (the restore), their two rollouts, the scalable target's maximum 1 and back to 2, one task stopped by hand and replaced by the service, 1000 event lines and the drop record in CloudWatch, nothing at PostHog from the burst, and the three smoke runs' pageviews (the first two to the log, the third to PostHog). The stack ran the override from 13:30Z to 13:41Z.
