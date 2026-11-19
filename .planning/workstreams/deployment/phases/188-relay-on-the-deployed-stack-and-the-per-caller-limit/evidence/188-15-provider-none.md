# 188-15 — Switching the provider to `none` stops events with no rebuild

Staging: `https://staging.openvaa.org`. Cluster `openvaa-staging`, service `openvaa-staging-frontend`, account `471112560111`, region `eu-north-1`. The observation (CONTEXT B-07): a hand apply of the running digest with `ANALYTICS_PROVIDER=none`; a new task-definition revision naming the same image digest; no pipeline run and no new image in the registry; the deployed smoke run green; a relay post answered 204; no event at PostHog from the rollout's completion on; the restore by a plain apply, after which a probe reaches PostHog and the smoke run is green.

## Task 1 — Readiness, read-only: the digest and image count before, the stop rule (2026-11-19)

Recorded 2026-11-19 (UTC) by the plan executor of plan 188-15, at 15:13:15Z to 15:16Z, from HEAD `f2f3361f6`. Nothing was applied, planned, stopped or written on any hosted service, AWS resource or GitHub setting, and no attempt of `188-15-2` was opened. The reads were one GET of `https://staging.openvaa.org/api/health`; with `AWS_PROFILE=openvaa-admin` and `AWS_REGION=eu-north-1`, after `aws sts get-caller-identity --query Account` exit 0 and the account match against `471112560111` exit 0: `infra/scripts/running-image-digest.sh`, `aws ecs describe-services` (counts, status fields and the deployment's `updatedAt` only), one `aws ecs describe-task-definition` of `:18` whose `--query` selects the revision, the image, the stop timeout, the provider, the PostHog host, the flush interval and the names of the environment and of the secrets, and two `aws ecr describe-images` of `openvaa-frontend` (the image count, and the newest image's push time, digest and tag); `gh run list --workflow deploy.yml` and `--workflow destroy.yml`, and the status-filtered `gh api` GETs of `actions/runs`; and a `grep` of the staging tfvars. No secret value was read. Each status was read on its own line, never through a pipe; the outputs are in the session scratch directory.

```
READ_AT=2026-11-19T15:13:15Z
SERVED_BUILD=a7003b490b4ff92fc72bef5d225c593b222d6c4e
RUNNING_PROVIDER=posthog
NO_RUN_ACTIVE=yes
TFVARS_OVERRIDES=0
B07_TD_REVISION_BEFORE=openvaa-staging-frontend:18
B07_DIGEST_BEFORE=sha256:e35bde282307277ea7be9aed008b2bc5a31c0a27ff2738b9153e09bf1412182a
B07_REGISTRY_IMAGES_BEFORE=5
B07_REGISTRY_NEWEST_BEFORE=sha256:e35bde282307277ea7be9aed008b2bc5a31c0a27ff2738b9153e09bf1412182a pushed 2026-11-19T08:59:50Z tag a7003b490b4ff92fc72bef5d225c593b222d6c4e
B07_LAST_DEPLOY_RUN_BEFORE=44491292876
RUNNING_POSTHOG_HOST=https://eu.i.posthog.com
RUNNING_TASKS=1
SERVICE_DESIRED=1
SERVICE_DEPLOYMENTS=1
SERVICE_ROLLOUT=COMPLETED
SERVICE_ROLLOUT_UPDATED_AT=2026-11-19T15:03:54Z
BASELINE_FLUSH_INTERVAL=2000
BASELINE_STOP_TIMEOUT=40
BASELINE_ENV_NAMES=15
BASELINE_SECRET_NAMES=PUBLIC_SUPABASE_ANON_KEY,ANALYTICS_POSTHOG_KEY
OVERRIDE_PROVIDER_ACCEPTED=yes
EXPECTED_OBS_CHANGES=update module.frontend.aws_ecs_service.app; delete-create module.frontend.aws_ecs_task_definition.app
EXPECTED_OBS_PLAN_LINE=Plan: 1 to add, 1 to change, 1 to destroy.
EXPECTED_OBS_ENV_CHANGE=ANALYTICS_PROVIDER posthog->none, no other name or value
EXPECTED_RESTORE_CHANGES=the same two addresses and actions, back to ANALYTICS_PROVIDER posthog
```

- **`SERVED_BUILD=`.** `curl -sS --max-time 20 https://staging.openvaa.org/api/health` exit 0, HTTP 200, body `{"status":"ok","build":"a7003b490b4ff92fc72bef5d225c593b222d6c4e"}`, equal to `DEPLOY_COMMIT=` of `evidence/188-10-rollout.md`.
- **`B07_TD_REVISION_BEFORE=`, `B07_DIGEST_BEFORE=`.** `running-image-digest.sh --cluster openvaa-staging --service openvaa-staging-frontend` exit 0: task definition `:18` (188-14's restore), `running_image_reference=digest`, the digest equal to `BUILD_DIGEST=` of `evidence/188-10-rollout.md` and to `RESTORE_RUNNING_DIGEST=` of `evidence/188-14-fail-open.md`. `describe-task-definition` of `:18` exit 0 reads revision 18 and the image `…/openvaa-frontend@sha256:e35bde28…182a`, the same digest. Every plan of Task 3 is given it as `-var "image_digest=$DIGEST"`, so the observation's new revision is compared against these two lines.
- **`RUNNING_PROVIDER=posthog`.** The same `describe-task-definition`: `ANALYTICS_PROVIDER` `posthog`, `ANALYTICS_POSTHOG_HOST` `https://eu.i.posthog.com`, `ANALYTICS_FLUSH_INTERVAL_MS` `2000`, `stopTimeout` 40; fifteen environment names, `ANALYTICS_PROVIDER` among them; the secrets' names `PUBLIC_SUPABASE_ANON_KEY` and `ANALYTICS_POSTHOG_KEY`. These equal 188-14's `RESTORE_PROVIDER=`, `RESTORE_POSTHOG_HOST=`, `RESTORE_FLUSH_INTERVAL=` and `RESTORE_STOP_TIMEOUT=`, so 188-14's restore holds.
- **`B07_REGISTRY_IMAGES_BEFORE=5`.** `aws ecr describe-images --repository-name openvaa-frontend --query 'length(imageDetails)'` exit 0, 5. The newest image by `imagePushedAt` (read exit 0) is the running digest, pushed 2026-11-19T08:59:50Z with tag `a7003b490…`, plan 188-10's build. Task 3 reads the count and the newest image again after the observation rollout; a build would add an image.
- **`B07_LAST_DEPLOY_RUN_BEFORE=44491292876`.** `gh run list --workflow deploy.yml` exit 0, 8 runs, all `completed`; the newest `44491292876` (created 2026-11-19T08:52:17Z, head `a7003b490…`, `success`), plan 188-10's.
- **`NO_RUN_ACTIVE=yes`.** The same list has no run other than `completed`; `gh run list --workflow destroy.yml` exit 0, one run, `completed`. The status-filtered counts of `actions/runs` are 0 for `queued`, `in_progress`, `waiting`, `requested` and `pending`, each GET exit 0. Task 3 reads this again before each apply.
- **`TFVARS_OVERRIDES=0`.** `grep -cE '^ *environment_overrides *=' infra/envs/staging/aws/terraform.tfvars` counts 0, and `git diff --quiet` of the file exit 0. The file sets `task_floor = 1`, `task_ceiling = 2` and `ANALYTICS_PROVIDER = "posthog"`.
- **`RUNNING_TASKS=1`.** `aws ecs describe-services` exit 0: status `ACTIVE`, running 1, desired 1, pending 0, one deployment, `PRIMARY`, `COMPLETED`, on `:18`, no failed task, `updatedAt` 2026-11-19T15:03:54Z (188-14's restore). The observation changes no scaling bound, so the scalable target must not appear in either plan.
- **`OVERRIDE_PROVIDER_ACCEPTED=yes`.** `none` is one of `PROVIDERS` (`apps/frontend/src/lib/server/analytics/config.ts`), so the override is read as configured, not as a problem. With provider `none`, `createEnqueue` returns a function that keeps nothing (`runtime.ts`), so no queue, timer or shutdown listener is built, and the relay answers 204 as its first step (`relay.ts`), before any other check. `git diff --quiet a7003b490 -- apps/frontend/src/lib/server/analytics` exit 0, so the served build carries this code. Task 3's `B07_POST_STATUS=204` is therefore the relay's answer under `none`, and the post's event is never queued.
- **The stop rule of the observation plan, written before any plan is made.** The plan with `-var "image_digest=$DIGEST" -var 'environment_overrides={ANALYTICS_PROVIDER="none"}'` is applied only when its resource changes, read from the plan JSON with the runbook's `changes` function, are exactly the two of `EXPECTED_OBS_CHANGES=`; its `Plan:` line reads `EXPECTED_OBS_PLAN_LINE=`; the container environment's names and the secrets' names are unchanged; the one changed environment value is `ANALYTICS_PROVIDER`, from `posthog` to `none`; the image (the digest of `B07_DIGEST_BEFORE=`) and the stop timeout are unchanged; the service's one changed attribute is `task_definition`. The override goes through `merge(var.environment_values, var.environment_overrides)` (`infra/modules/frontend-service/main.tf`), so it replaces the one value and adds no name. The scalable target, the CPU policy and any scheduled action must not appear. Any other change, any other address, or an image change is a stop: nothing is applied. The empty-value differences 188-14 read in the plan JSON (`""` or `[]` or `{}` against `null`, the `awslogs` option order, the API-defaulted `hostPort`) are read and set aside, not taken as changes. The restore plan, with the digest alone, is read against the same two addresses and actions, back to `posthog`, and a plan after it shows `No changes.`.
- **Reading rules for Task 3, from 188-12 to 188-14.**
  - The whole sitting, from the first apply to the end of the restore's reads, runs under `caffeinate -i`, so a host sleep cannot hold the override on the stack (188-14's 57 minutes).
  - `B07_ROLLOUT_COMPLETED=` is the observation deployment's `updatedAt` once its rollout state reads `COMPLETED`, after `services-stable`. The old task's last flush lands before the rollout completes (the plan's assumption, from 188-12's shutdown flush), so a window starting there holds only events sent under `none`.
  - The probe post is made only after `services-stable`, so the old task, still on `posthog`, has drained and cannot receive it. Each rollout is followed by the deployed smoke run.
  - `B07_WINDOW_EVENTS=` is `posthog-read.sh --mode window-count` from `B07_ROLLOUT_COMPLETED=` to the read, and `B07_PROBE_EVENTS=` is `--mode probe-count` for the probe; each is read five minutes after the post and again two minutes later. The after-restore probe read with the same tool shows the reads see probe events.
