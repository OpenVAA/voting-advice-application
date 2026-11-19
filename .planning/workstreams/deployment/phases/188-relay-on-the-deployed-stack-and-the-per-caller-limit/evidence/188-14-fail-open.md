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
