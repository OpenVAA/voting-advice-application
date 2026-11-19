# 188-14 — The deployed site keeps working when PostHog cannot be reached

Staging: `https://staging.openvaa.org`. Cluster `openvaa-staging`, service `openvaa-staging-frontend`, account `471112560111`, region `eu-north-1`. The observation (CONTEXT B-06): a hand apply of the running digest with `ANALYTICS_POSTHOG_HOST=https://posthog.invalid`; the deployed smoke run green; one relay post answered 204 at once; the task logging `Analytics forward to PostHog failed` with `transport: ENOTFOUND`; nothing of that probe at PostHog; the restore by a plain apply, after which a probe reaches PostHog and the smoke run is green.

## Task 1 — Readiness, read-only: the restored state and the stop rule (2026-11-19)

Recorded 2026-11-19 (UTC) by the plan executor of plan 188-14, at 13:53:14Z to 13:56Z, from HEAD `83db3af5f`. Nothing was applied, planned, stopped or written on any hosted service, AWS resource or GitHub setting, and no attempt of `188-14-2` was opened. The reads were one GET of `https://staging.openvaa.org/api/health`; with `AWS_PROFILE=openvaa-admin` and `AWS_REGION=eu-north-1`, after `aws sts get-caller-identity --query Account` exit 0 and the account match against `471112560111` exit 0: `infra/scripts/running-image-digest.sh`, `aws ecs describe-services` (counts and status fields only), `aws application-autoscaling describe-scalable-targets` (the two bounds only), and one `aws ecs describe-task-definition` whose `--query` selects the provider, the PostHog host, the flush interval, the shutdown timeout, the stop timeout and the names of the environment and of the secrets; `gh run list --workflow deploy.yml` and `--workflow destroy.yml`, and the status-filtered `gh api` GETs of `actions/runs`; and a `grep` of the staging tfvars. No secret value was read. Each status was read on its own line, never through a pipe; the outputs are in the session scratch directory.

```
READ_AT=2026-11-19T13:53:14Z
SERVED_BUILD=a7003b490b4ff92fc72bef5d225c593b222d6c4e
RUNNING_TASK_DEFINITION=arn:aws:ecs:eu-north-1:471112560111:task-definition/openvaa-staging-frontend:16
RUNNING_DIGEST=sha256:e35bde282307277ea7be9aed008b2bc5a31c0a27ff2738b9153e09bf1412182a
RUNNING_PROVIDER=posthog
RUNNING_POSTHOG_HOST=https://eu.i.posthog.com
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
OVERRIDE_HOST_ACCEPTED=yes
EXPECTED_OBS_CHANGES=update module.frontend.aws_ecs_service.app; delete-create module.frontend.aws_ecs_task_definition.app
EXPECTED_OBS_PLAN_LINE=Plan: 1 to add, 1 to change, 1 to destroy.
EXPECTED_OBS_ENV_CHANGE=ANALYTICS_POSTHOG_HOST https://eu.i.posthog.com->https://posthog.invalid, no other name or value
EXPECTED_RESTORE_CHANGES=the same two addresses and actions, back to ANALYTICS_POSTHOG_HOST https://eu.i.posthog.com
```

- **`SERVED_BUILD=`.** `curl -sS --max-time 20 https://staging.openvaa.org/api/health` exit 0, HTTP 200, body `{"status":"ok","build":"a7003b490b4ff92fc72bef5d225c593b222d6c4e"}`, equal to `DEPLOY_COMMIT=` of `evidence/188-10-rollout.md`.
- **`RUNNING_DIGEST=`.** `running-image-digest.sh --cluster openvaa-staging --service openvaa-staging-frontend` exit 0: task definition `:16` (188-13's restore), `running_image_reference=digest`, the digest equal to `BUILD_DIGEST=` of `evidence/188-10-rollout.md` and to `RESTORE_RUNNING_DIGEST=` of `evidence/188-13-full-queue.md`. Every plan of Task 3 is given it as `-var "image_digest=$DIGEST"`.
- **`RUNNING_PROVIDER=posthog`, `RUNNING_POSTHOG_HOST=https://eu.i.posthog.com`.** `describe-task-definition` of `:16` exit 0: `ANALYTICS_PROVIDER` `posthog`, `ANALYTICS_POSTHOG_HOST` `https://eu.i.posthog.com`, `ANALYTICS_FLUSH_INTERVAL_MS` `2000`, `SHUTDOWN_TIMEOUT` `25`, `stopTimeout` 40. Fifteen environment names, `ANALYTICS_POSTHOG_HOST` among them; the secrets' names are `PUBLIC_SUPABASE_ANON_KEY` and `ANALYTICS_POSTHOG_KEY`. These equal 188-13's `RESTORE_PROVIDER=`, `RESTORE_FLUSH_INTERVAL=` and `RESTORE_STOP_TIMEOUT=`, so 188-13's restore holds. The host is an environment value, not a secret, and the tfvars set it to the same value (`ANALYTICS_POSTHOG_HOST = "https://eu.i.posthog.com"`).
- **`OVERRIDE_HOST_ACCEPTED=yes`.** The configuration reduces the host to its origin when it is an `https:` URL (`toAllowedOrigin` in `apps/frontend/src/lib/server/analytics/config.ts`), so `https://posthog.invalid` is accepted as configured and the provider stays `posthog`; it is not refused as invalid. A failed forward is logged as `Analytics forward to PostHog failed` with `{ transport: <code> }`, the code read from the error's cause (`transportCode` in `providers/posthog.ts`), or with `{ status }` for an HTTP error. `git diff --quiet a7003b490 -- apps/frontend/src/lib/server/analytics` exit 0, so the served build carries this code.
- **`NO_RUN_ACTIVE=yes`.** `gh run list --workflow deploy.yml` exit 0, 8 runs, none other than `completed` (the latest `44491292876`, `success`, plan 188-10's); `gh run list --workflow destroy.yml` exit 0, one run, `completed`. The status-filtered counts of `actions/runs` are 0 for `queued`, `in_progress`, `waiting`, `requested` and `pending`, each GET exit 0. Task 3 reads this again before each apply.
- **`TFVARS_OVERRIDES=0`.** `grep -cE '^ *environment_overrides *=' infra/envs/staging/aws/terraform.tfvars` counts 0, and `git diff --quiet` of the file exit 0. The file sets `task_floor = 1`, `task_ceiling = 2`, `stop_timeout_seconds = 40`, `ANALYTICS_PROVIDER = "posthog"`, `ANALYTICS_POSTHOG_HOST = "https://eu.i.posthog.com"` and `ANALYTICS_FLUSH_INTERVAL_MS = "2000"`.
- **`RUNNING_TASKS=1`.** `aws ecs describe-services` exit 0: status `ACTIVE`, running 1, desired 1, pending 0, one deployment, `COMPLETED`, on `:16`. `describe-scalable-targets` exit 0: minimum 1, maximum 2. The observation changes neither bound, so the scalable target must not appear in either plan.
- **The stop rule of the observation plan, written before any plan is made.** The plan with `-var "image_digest=$DIGEST" -var 'environment_overrides={ANALYTICS_POSTHOG_HOST="https://posthog.invalid"}'` is applied only when its resource changes, read from the plan JSON with the runbook's `changes` function, are exactly the two of `EXPECTED_OBS_CHANGES=`; its `Plan:` line reads `EXPECTED_OBS_PLAN_LINE=`; the container environment's names and the secrets' names are unchanged; the one changed environment value is `ANALYTICS_POSTHOG_HOST`, from `https://eu.i.posthog.com` to `https://posthog.invalid`; the image and the stop timeout are unchanged. The override goes through `merge(var.environment_values, var.environment_overrides)` (`infra/modules/frontend-service/main.tf`), so it replaces the one value and adds no name. The scalable target, the CPU policy and any scheduled action must not appear. Any other change, any other address, or an image change is a stop: nothing is applied. The restore plan, with the digest alone, is read against the same two addresses and actions, back to the tfvars' host, and a plan after it shows `No changes.`.
- **Reading rules for Task 3, from 188-12 and 188-13.**
  - The queue and its timer start on the task's first `/api/usage` request; with the flush interval at 2000 ms, a forward is attempted within about two seconds of the first event the new task queues. The smoke run's pageviews after the observation rollout are such events, so forward failures may be logged before the probe post; `B06_FORWARD_FAILURES_ENOTFOUND=` counts every one on the observation task's stream.
  - The application logger prints a record one field per line, so `transport: ENOTFOUND` may be its own log event, apart from the `Analytics forward to PostHog failed` message line. `B06_FORWARD_FAILURES_ENOTFOUND=` is read from the observation task's stream with a filter for `ENOTFOUND` next to the message's own count, and both counts are recorded, together with any forward failure of another code or with a status.
  - The probe post is made only after `services-stable`, so the old task, whose host still resolves, has drained and cannot receive it. Each rollout is followed by the deployed smoke run.

## Task 3 — PostHog unreachable, the site green, the failure logged, the restore (2026-11-19, attempt 20261119T135532Z.c17803d57)

Recorded 2026-11-19 (UTC) by the continuation executor of plan 188-14, from 14:03Z. Key `188-14-2`, attempt `20261119T135532Z.c17803d57`. `bash "$A" bound 188-14-2 OPERATOR_REPLY plan=188-14 task=2` exit 0 and `bash "$A" has 188-14-2 '^answer_sitting=approve$'` exit 0, both read before the first plan. Every AWS and Terraform command ran with `AWS_PROFILE=openvaa-admin` after the account check (exit 0, match exit 0), `TF_VAR_alert_email` checked with `test -n` only (exit 0), and `TF_DATA_DIR` at a fresh directory under the session scratch directory against the root's S3 backend (`init -lockfile=readonly` exit 0), so the operator's `.terraform/` was not touched. The AWS SSO session held for the whole sitting, through the host's sleep. No plan output is shared here: the lines below are read from the plan JSON (addresses and actions, the environment's names and the changed value of the override only). Log reads printed counts, timestamps and the attribute line's shape only. Each status was read on its own line.

### The observation apply

```
OBS_PRE_APPLY_ACTIVE_RUNS=0
OBS_DIGEST=sha256:e35bde282307277ea7be9aed008b2bc5a31c0a27ff2738b9153e09bf1412182a
OBS_PLAN_LINE=Plan: 1 to add, 1 to change, 1 to destroy.
OBS_CHANGE=update module.frontend.aws_ecs_service.app
OBS_CHANGE=delete-create module.frontend.aws_ecs_task_definition.app
OBS_TD_IMAGE_UNCHANGED=yes
OBS_TD_ENV_NAMES_UNCHANGED=yes
OBS_TD_ENV_CHANGED_NAMES=ANALYTICS_POSTHOG_HOST
OBS_TD_HOST=https://eu.i.posthog.com->https://posthog.invalid
OBS_TD_SECRET_NAMES_UNCHANGED=yes
OBS_TD_STOP_TIMEOUT=40->40
OBS_SERVICE_CHANGED_KEYS=task_definition
OBS_PLAN_MATCHES=yes
OBS_APPLY_EXIT=0
OBS_APPLY_LINE=Apply complete! Resources: 1 added, 1 changed, 1 destroyed.
OBS_APPLY_WINDOW=2026-11-19T14:05:23Z..2026-11-19T14:07:17Z
OBS_WAIT_STABLE_EXIT=255
OBS_WAIT_STABLE_VOID=host clamshell sleep 2026-11-19T14:07:54Z..2026-11-19T14:51:34Z (pmset -g log)
OBS_WAIT_STABLE_RERUN_EXIT=0
OBS_STABLE_AT=2026-11-19T14:59:17Z
OBS_SERVICE_ROLLOUT=COMPLETED
OBS_RUNNING_TASKS=1
OBS_TASK_DEFINITION=openvaa-staging-frontend:17
OBS_RUNNING_PROVIDER=posthog
OBS_RUNNING_POSTHOG_HOST=https://posthog.invalid
OBS_RUNNING_FLUSH_INTERVAL=2000
OBS_RUNNING_CEILING=2
OBS_TASK_STARTED=2026-11-19T14:06:36Z
```

### The site with PostHog unreachable

```
B06_SMOKE_RUN_DIR=tests/e2e-runs/188-14-obs-20261119T145930Z
B06_SMOKE_EXIT=0
B06_SMOKE_VERDICT_EXIT=0
B06_PROBE=p188b0620261119T145959Z
B06_POST_AT=2026-11-19T14:59:59Z
B06_POST_STATUS=204
B06_POST_SECONDS=0.259785
B06_FORWARD_FAILURE_MESSAGE_LINES=6
B06_FORWARD_FAILURES_ENOTFOUND=6
B06_FORWARD_FAILURE_TIMES=14:59:36Z 14:59:38Z 14:59:40Z 14:59:42Z 14:59:44Z 15:00:00Z
B06_FORWARD_FAILURE_ATTRIBUTE_LINE=attributes: { transport: 'ENOTFOUND' }
B06_FORWARD_FAILURES_STATUS=0
B06_FORWARD_FAILURES_TIMEOUT=0
B06_STREAM_LINES_NAMING_A_HOST=0
B06_HEALTH=200
B06_POSTHOG_EVENTS=0
B06_POSTHOG_READS=0,0,0,0,0 (15:01:24Z to 15:08:35Z)
```

### The restore

```
RESTORE_PRE_APPLY_ACTIVE_RUNS=0
RESTORE_PLAN_LINE=Plan: 1 to add, 1 to change, 1 to destroy.
RESTORE_CHANGE=update module.frontend.aws_ecs_service.app
RESTORE_CHANGE=delete-create module.frontend.aws_ecs_task_definition.app
RESTORE_TD_IMAGE_UNCHANGED=yes
RESTORE_TD_ENV_NAMES_UNCHANGED=yes
RESTORE_TD_ENV_CHANGED_NAMES=ANALYTICS_POSTHOG_HOST
RESTORE_TD_HOST=https://posthog.invalid->https://eu.i.posthog.com
RESTORE_TD_SECRET_NAMES_UNCHANGED=yes
RESTORE_TD_STOP_TIMEOUT=40->40
RESTORE_SERVICE_CHANGED_KEYS=task_definition
RESTORE_PLAN_MATCHES=yes
RESTORE_APPLY_EXIT=0
RESTORE_APPLY_LINE=Apply complete! Resources: 1 added, 1 changed, 1 destroyed.
RESTORE_APPLY_WINDOW=2026-11-19T15:01:15Z..2026-11-19T15:03:10Z
RESTORE_WAIT_STABLE_EXIT=0
RESTORE_STABLE_AT=2026-11-19T15:03:57Z
RESTORE_TASK_DEFINITION=openvaa-staging-frontend:18
RESTORE_RUNNING_DIGEST=sha256:e35bde282307277ea7be9aed008b2bc5a31c0a27ff2738b9153e09bf1412182a
RESTORE_RUNNING_TASKS=1
RESTORE_PROVIDER=posthog
RESTORE_POSTHOG_HOST=https://eu.i.posthog.com
RESTORE_FLUSH_INTERVAL=2000
RESTORE_STOP_TIMEOUT=40
RESTORE_FLOOR=1
RESTORE_CEILING=2
RESTORE_PLAN_AFTER_EXIT=0
RESTORE_SERVED_BUILD=a7003b490b4ff92fc72bef5d225c593b222d6c4e
RESTORE_TFVARS_OVERRIDES=0
RESTORE_SMOKE_RUN_DIR=tests/e2e-runs/188-14-restore-20261119T150441Z
RESTORE_SMOKE_EXIT=0
RESTORE_SMOKE_VERDICT_EXIT=0
B06_AFTER_RESTORE_PROBE=p188b06r20261119T150501Z
B06_AFTER_RESTORE_POST_STATUS=204
B06_AFTER_RESTORE_POST_SECONDS=0.141381
B06_AFTER_RESTORE_EVENTS=1
B06_AFTER_RESTORE_READS=1,1,1,1 (15:06:01Z to 15:08:35Z)
HOSTED_WRITES=task-definition:17,service-rollout,one-probe-event-lost,task-definition:18,service-rollout,one-probe-event-to-posthog
OVERRIDE_ON_STACK=2026-11-19T14:06Z..2026-11-19T15:03Z
```

- **`OBS_PLAN_MATCHES=yes`.** The saved plan (`-var "image_digest=$DIGEST" -var 'environment_overrides={ANALYTICS_POSTHOG_HOST="https://posthog.invalid"}'`, plan and show exit 0) matched Task 1's stop rule: the two addresses and actions of `EXPECTED_OBS_CHANGES=`, the plan line of `EXPECTED_OBS_PLAN_LINE=`, the image, the environment's names, the secrets' names and the stop timeout unchanged, `ANALYTICS_POSTHOG_HOST` the one changed value, and `task_definition` the service's one changed attribute; the scalable target does not appear. The plan JSON's `before` of the task definition is the provider's read of the registered revision and its `after` the configuration, so it also differs in values that do not change: `""` against `null` for `ipc_mode`, `pid_mode` and `task_role_arn`, `{}` against `null` for `tags`, `[]` against `null` for `mountPoints`, `systemControls` and `volumesFrom`, the order of the `awslogs` options, and the `hostPort` the API fills in from `containerPort`. Each was read, none carries a value, and the restore plan shows the same set. No run was active at 14:04:08Z (before the plan) or at 14:05:17Z (before the apply): the five status counts 0 and no `deploy.yml` or `destroy.yml` run other than `completed`, each read exit 0.
- **`OBS_WAIT_STABLE_EXIT=255`, a void wait.** The apply exited 0 at 14:07:17Z and `aws ecs wait services-stable` started then. `pmset -g log` shows `Entering Sleep state due to 'Clamshell Sleep'` at 14:07:54Z and the next wake at 14:51:34Z; the waiter returned 255 at 14:51:43Z. Read at 14:58:44Z, `describe-services` exit 0 showed one deployment, `PRIMARY`, `COMPLETED`, on `:17`, running 1 of 1, no failed task, and the waiter run again returned 0 at 14:59:17Z. The task on `:17` had started at 14:06:36Z. The 255 is the host's suspend, not the stack's: the observation went on from the rerun. Because of the sleep, the override stayed on the stack for 57 minutes instead of a few; the restore and the reads that followed were run with `caffeinate -i`.
- **`B06_SMOKE_VERDICT_EXIT=0`.** The deployed smoke run on the observation task, `SMOKE_EXPECTED_SHA=a7003b490b4ff92fc72bef5d225c593b222d6c4e`, `git diff --quiet <sha> -- apps packages` exit 0, 14:59:30Z to 14:59:42Z: the five `PASS` lines, `DEPLOYED SMOKE GATE OK build=a7003b490…`, `2 passed (11.3s)`, `VERDICT OK: 2 tests -- passed 2, failed 0, flaky 0, skipped 0, did not run 0`.
- **`B06_POST_STATUS=204`, `B06_POST_SECONDS=0.259785`.** One `POST https://staging.openvaa.org/api/usage` with `Content-Type: application/json`, `Sec-Fetch-Site: same-origin` and `Origin: https://staging.openvaa.org`, one envelope (route `/(voters)`, locale `en`) of one `answer` event, `ago` 0, value 1, question id `B06_PROBE=`; `curl` exit 0, the total time from curl's `time_total`. The relay answered in a quarter of a second while every forward behind it was failing.
- **`B06_FORWARD_FAILURES_ENOTFOUND=6`.** `aws logs filter-log-events` on `/openvaa/staging/frontend`, stream `frontend/frontend/<task id>` of the `:17` task alone, read at 15:00:13Z, 12 s after the post, counts only, each read exit 0: `"Analytics forward to PostHog failed"` 6, `ENOTFOUND` 6, `transport` 6, all at the same six seconds; `"status:"` 0, `TIMEOUT` 0; 43 events in the stream. The logger prints a record one field per line, so the message line and the attribute line are separate events in the same second; the attribute line reads `attributes: { transport: 'ENOTFOUND' }` and carries nothing else. The first five failures, two seconds apart, are the flushes of the smoke run's pageviews, and the sixth, at 15:00:00Z, the flush of the probe. No event of the stream contains `posthog.invalid` or `eu.i.posthog`: the failure is logged by its transport code only, never by the host. With the flush interval at 2000 ms, each failure came within about two seconds of its events, and none waited for the 10-second forward timeout.
- **`B06_HEALTH=200`.** `curl https://staging.openvaa.org/api/health`, HTTP 200, after the log read.
- **`B06_POSTHOG_EVENTS=0`.** `posthog-read.sh --project 347462 --mode probe-count --probe p188b0620261119T145959Z --since 2026-11-19T14:57:59Z --until 2026-11-19T15:59:59Z`, the read-only key read from the keychain into the one command and never printed: 0 in five reads from 15:01:24Z to 15:08:35Z, each exit 0. The same reads counted the after-restore probe as 1, so they see probe events; the first probe never left the task.
- **The restore.** The plan with the digest alone matched the same two addresses and actions, back to the tfvars' host (`https://posthog.invalid` to `https://eu.i.posthog.com`, nothing else, the same empty-value differences as above). No run was active at 15:00:46Z (counts 0, each read exit 0). The apply exit 0, `services-stable` exit 0 at 15:03:57Z. Read back: `running-image-digest.sh` exit 0, `:18` by the running digest; `describe-task-definition` exit 0, `ANALYTICS_PROVIDER` `posthog`, `ANALYTICS_POSTHOG_HOST` `https://eu.i.posthog.com`, `ANALYTICS_FLUSH_INTERVAL_MS` `2000`, `stopTimeout` 40, 15 environment names, the secrets' names `PUBLIC_SUPABASE_ANON_KEY` and `ANALYTICS_POSTHOG_KEY`; `describe-services` exit 0, one deployment `COMPLETED`, running 1 of 1; `describe-scalable-targets` exit 0, minimum 1, maximum 2; `/api/health` HTTP 200, build `a7003b490…`; no `environment_overrides` assignment in the tfvars (count 0), which are unchanged in the working tree; a plan with the digest alone and `-detailed-exitcode` exit 0, `No changes. Your infrastructure matches the configuration.`
- **`RESTORE_SMOKE_VERDICT_EXIT=0`.** 15:04:41Z to 15:04:55Z: the five `PASS` lines, the gate's OK line, `2 passed (13.1s)`, `VERDICT OK: 2 tests -- passed 2, failed 0, flaky 0, skipped 0, did not run 0`.
- **`B06_AFTER_RESTORE_EVENTS=1`.** One event posted in the same form with probe `p188b06r20261119T150501Z` at 15:05:01Z, 204 in 0.14 s; `probe-count` over 15:03:01Z to 16:05:01Z read 1 in four reads from 15:06:01Z to 15:08:35Z, each exit 0. Forwarding resumed after the restore.
- **The hosted record.** Task definitions `:17` (the override) and `:18` (the restore) and their two rollouts; the forward failures in CloudWatch; staging's analytics events from 14:06Z to 15:03Z lost by design of the observation, the smoke run's pageviews and the probe among them; one probe event in PostHog after the restore, and the restore smoke run's pageviews.
