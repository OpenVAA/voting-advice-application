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

## Task 3 — Provider `none` by hand apply, the same digest, silence at PostHog, the restore (2026-11-19, attempt 20261119T151610Z.4ebcca7f3)

Recorded 2026-11-19 (UTC) by the continuation executor of plan 188-15, from 15:21Z. Key `188-15-2`, attempt `20261119T151610Z.4ebcca7f3`. `bash "$A" bound 188-15-2 OPERATOR_REPLY plan=188-15 task=2` exit 0 and `bash "$A" has 188-15-2 '^answer_sitting=approve$'` exit 0, both read before the first plan. Every AWS and Terraform command ran with `AWS_PROFILE=openvaa-admin` after the account check (exit 0, match exit 0), `TF_VAR_alert_email` checked with `test -n` only (exit 0), and `TF_DATA_DIR` at a fresh directory under the session scratch directory against the root's S3 backend (`init -lockfile=readonly` exit 0), so the operator's `.terraform/` was not touched. Every plan, apply, stability wait, read-back and smoke run ran under its own `caffeinate -i`, and a sitting-wide `caffeinate -i` assertion was held from 15:29:59Z to the end of the reads; the two one-second probe posts and the first three minutes of the five-minute wait before the first PostHog read (15:26:50Z to 15:29:59Z) ran without one; `pmset -g log` shows no `Sleep`, `DarkWake` or `Wake` entry from 15:13Z to 15:44Z. The AWS SSO session held throughout. No plan output is shared here: the lines below are read from the plan JSON (addresses and actions, the environment's names and the changed value of the override only). Each status was read on its own line.

### The observation apply

```
OBS_PRE_PLAN_ACTIVE_RUNS=0
OBS_PRE_APPLY_ACTIVE_RUNS=0
OBS_DIGEST=sha256:e35bde282307277ea7be9aed008b2bc5a31c0a27ff2738b9153e09bf1412182a
OBS_PLAN_LINE=Plan: 1 to add, 1 to change, 1 to destroy.
OBS_CHANGE=update module.frontend.aws_ecs_service.app
OBS_CHANGE=delete-create module.frontend.aws_ecs_task_definition.app
OBS_TD_IMAGE_UNCHANGED=yes
OBS_TD_IMAGE_AFTER=sha256:e35bde282307277ea7be9aed008b2bc5a31c0a27ff2738b9153e09bf1412182a
OBS_TD_ENV_NAMES_UNCHANGED=yes
OBS_TD_ENV_CHANGED_NAMES=ANALYTICS_PROVIDER
OBS_TD_PROVIDER=posthog->none
OBS_TD_SECRET_NAMES_UNCHANGED=yes
OBS_TD_STOP_TIMEOUT=40->40
OBS_SERVICE_CHANGED_KEYS=task_definition
OBS_TARGET_CHANGED=no
OBS_PLAN_MATCHES=yes
OBS_APPLY_EXIT=0
OBS_APPLY_LINE=Apply complete! Resources: 1 added, 1 changed, 1 destroyed.
OBS_APPLY_WINDOW=2026-11-19T15:23:10Z..2026-11-19T15:25:09Z
OBS_WAIT_STABLE_EXIT=0
OBS_STABLE_AT=2026-11-19T15:25:57Z
B07_ROLLOUT_COMPLETED=2026-11-19T15:25:52Z
OBS_SERVICE_ROLLOUT=COMPLETED
OBS_RUNNING_TASKS=1
OBS_RUNNING_PROVIDER=none
```

### The same image, no build

```
B07_TD_REVISION_AFTER=openvaa-staging-frontend:19
B07_DIGEST_AFTER=sha256:e35bde282307277ea7be9aed008b2bc5a31c0a27ff2738b9153e09bf1412182a
B07_DIGEST_UNCHANGED=yes
B07_REVISION_CHANGED=yes
B07_REGISTRY_IMAGES_AFTER=5
B07_REGISTRY_NEWEST_AFTER=sha256:e35bde282307277ea7be9aed008b2bc5a31c0a27ff2738b9153e09bf1412182a pushed 2026-11-19T08:59:50Z
B07_LAST_DEPLOY_RUN_AFTER=44491292876
B07_NO_NEW_RUN=yes
```

### Silence at PostHog under `none`

```
OBS_SMOKE_RUN_DIR=tests/e2e-runs/188-15-obs-20261119T152619Z
OBS_SMOKE_EXIT=0
OBS_SMOKE_VERDICT_EXIT=0
B07_PROBE=p188b0720261119T152640Z
B07_POST_AT=2026-11-19T15:26:40Z
B07_POST_STATUS=204
B07_POST_SECONDS=0.230813
B07_HEALTH=200
B07_WINDOW_EVENTS=0
B07_PROBE_EVENTS=0
B07_WINDOW_READS=0,0 (15:31:41Z, 15:33:49Z, each from 15:25:52Z to the read)
B07_PROBE_READS=0,0 (15:31:41Z, 15:33:49Z)
B07_WINDOW_UNDER_NONE_FINAL=0 (15:25:52Z..15:34:40Z, read 15:43:38Z)
B07_PROBE_FINAL=0 (read 15:43:39Z)
B07_CONTROL_WINDOW_EVENTS=11 (15:03:57Z..15:23:10Z, provider posthog)
```

### The restore

```
RESTORE_PRE_PLAN_ACTIVE_RUNS=0
RESTORE_PRE_APPLY_ACTIVE_RUNS=0
RESTORE_PLAN_LINE=Plan: 1 to add, 1 to change, 1 to destroy.
RESTORE_CHANGE=update module.frontend.aws_ecs_service.app
RESTORE_CHANGE=delete-create module.frontend.aws_ecs_task_definition.app
RESTORE_TD_IMAGE_UNCHANGED=yes
RESTORE_TD_ENV_NAMES_UNCHANGED=yes
RESTORE_TD_ENV_CHANGED_NAMES=ANALYTICS_PROVIDER
RESTORE_TD_PROVIDER=none->posthog
RESTORE_TD_SECRET_NAMES_UNCHANGED=yes
RESTORE_TD_STOP_TIMEOUT=40->40
RESTORE_SERVICE_CHANGED_KEYS=task_definition
RESTORE_PLAN_MATCHES=yes
RESTORE_APPLY_EXIT=0
RESTORE_APPLY_LINE=Apply complete! Resources: 1 added, 1 changed, 1 destroyed.
RESTORE_APPLY_WINDOW=2026-11-19T15:34:40Z..2026-11-19T15:36:36Z
RESTORE_WAIT_STABLE_EXIT=0
RESTORE_STABLE_AT=2026-11-19T15:37:23Z
RESTORE_TASK_DEFINITION=openvaa-staging-frontend:20
RESTORE_RUNNING_DIGEST=sha256:e35bde282307277ea7be9aed008b2bc5a31c0a27ff2738b9153e09bf1412182a
RESTORE_RUNNING_TASKS=1
RESTORE_PROVIDER=posthog
RESTORE_POSTHOG_HOST=https://eu.i.posthog.com
RESTORE_FLUSH_INTERVAL=2000
RESTORE_STOP_TIMEOUT=40
RESTORE_FLOOR=1
RESTORE_CEILING=2
RESTORE_REGISTRY_IMAGES=5
RESTORE_PLAN_AFTER_EXIT=0
RESTORE_PLAN_AFTER_LINE=No changes. Your infrastructure matches the configuration.
RESTORE_SERVED_BUILD=a7003b490b4ff92fc72bef5d225c593b222d6c4e
RESTORE_TFVARS_OVERRIDES=0
RESTORE_SMOKE_RUN_DIR=tests/e2e-runs/188-15-restore-20261119T153810Z
RESTORE_SMOKE_EXIT=0
RESTORE_SMOKE_VERDICT_EXIT=0
B07_AFTER_RESTORE_PROBE=p188b07r20261119T153826Z
B07_AFTER_RESTORE_POST_STATUS=204
B07_AFTER_RESTORE_POST_SECONDS=0.196954
B07_AFTER_RESTORE_EVENTS=1
B07_AFTER_RESTORE_READS=1,1,1 (15:40:17Z to 15:43:38Z)
HOSTED_WRITES=task-definition:19,service-rollout,one-probe-event-dropped,task-definition:20,service-rollout,one-probe-event-to-posthog
OVERRIDE_ON_STACK=2026-11-19T15:25Z..2026-11-19T15:37Z
```

- **`OBS_PLAN_MATCHES=yes`.** The saved plan (`-var "image_digest=$DIGEST" -var 'environment_overrides={ANALYTICS_PROVIDER="none"}'`, plan and show exit 0) matched Task 1's stop rule: the two addresses and actions of `EXPECTED_OBS_CHANGES=`, the plan line of `EXPECTED_OBS_PLAN_LINE=`, the image (the digest of `B07_DIGEST_BEFORE=` in the configuration's `after`), the environment's names, the secrets' names and the stop timeout unchanged, `ANALYTICS_PROVIDER` the one changed value, from `posthog` to `none`. The service's one changed attribute is `task_definition`, which the plan JSON carries as unknown in `after` (`after_unknown.task_definition=true`), so it is read from the union of `before` and `after` keys; the scalable target appears only as a no-op (minimum 1, maximum 2, no changed key). The task definition's other differences are the empty-value ones of Task 1's stop rule: `""` against `null` for `ipc_mode`, `pid_mode` and `task_role_arn`, `{}` against `null` for `tags`, `[]` against `null` for `mountPoints`, `systemControls` and `volumesFrom`, the API-defaulted `hostPort`, and the computed `arn`, `id`, `revision` and `enable_fault_injection`. No run was active at 15:21:58Z (before the plan) or at 15:22:52Z (before the apply): the five status counts 0 and no `deploy.yml` or `destroy.yml` run other than `completed`, each read exit 0.
- **`OBS_APPLY_EXIT=0`, `B07_ROLLOUT_COMPLETED=2026-11-19T15:25:52Z`.** The apply ran in the background, exit 0 at 15:25:09Z; `aws ecs wait services-stable` exit 0 on its first try at 15:25:57Z. `describe-services` exit 0: one deployment, `PRIMARY`, `COMPLETED`, on `:19`, running 1 of 1, no failed task, `updatedAt` 15:25:52Z, which is `B07_ROLLOUT_COMPLETED=`. `describe-task-definition` of `:19` exit 0: `ANALYTICS_PROVIDER` `none`, every other read value as before.
- **`B07_DIGEST_UNCHANGED=yes`, `B07_REVISION_CHANGED=yes`.** `running-image-digest.sh` exit 0 after the rollout: task definition `:19`, `running_image_reference=digest`, digest `sha256:e35bde28…182a`, equal to `B07_DIGEST_BEFORE=`; the revision moved from `:18` to `:19`. The provider was switched by a new revision of the same image.
- **`B07_REGISTRY_IMAGES_AFTER=5`, `B07_NO_NEW_RUN=yes`.** `aws ecr describe-images` of `openvaa-frontend` exit 0, 5 images, equal to `B07_REGISTRY_IMAGES_BEFORE=`; the newest is still the running digest, pushed 08:59:50Z. `gh run list --workflow deploy.yml` exit 0: the newest run is `44491292876`, `B07_LAST_DEPLOY_RUN_BEFORE=`. No image was built and no pipeline ran. The same reads after the restore found 5 images and the same newest run.
- **`OBS_SMOKE_VERDICT_EXIT=0`.** The deployed smoke run on the `:19` task, `SMOKE_EXPECTED_SHA=a7003b490b4ff92fc72bef5d225c593b222d6c4e`, `git diff --quiet <sha> -- apps packages` exit 0, 15:26:19Z to 15:26:34Z: the five `PASS` lines, `DEPLOYED SMOKE GATE OK build=a7003b490…`, `2 passed (13.8s)`, `VERDICT OK: 2 tests -- passed 2, failed 0, flaky 0, skipped 0, did not run 0`. The site works with the provider off.
- **`B07_POST_STATUS=204`.** One `POST https://staging.openvaa.org/api/usage` at 15:26:40Z with `Content-Type: application/json`, `Sec-Fetch-Site: same-origin` and `Origin: https://staging.openvaa.org`, one envelope (route `/(voters)`, locale `en`) of one `answer` event, `ago` 0, value 1, question id `B07_PROBE=`; `curl` exit 0, 204 in 0.23 s. Under `none` the relay answers 204 as its first step and keeps nothing. `/api/health` answered 200 after it.
- **`B07_WINDOW_EVENTS=0`, `B07_PROBE_EVENTS=0`.** `posthog-read.sh --project 347462`, the read-only key read from the keychain into the one command and never printed. At 15:31:41Z, five minutes after the post, and again at 15:33:49Z: `--mode window-count --since 2026-11-19T15:25:52Z --until <the read's time>` 0 and `--mode probe-count --probe p188b0720261119T152640Z` over the same window 0, each exit 0. After the restore, the window of the whole override, 15:25:52Z to 15:34:40Z (the restore apply's start), read 0 at 15:43:38Z, and the probe over an hour from 15:25:52Z read 0 at 15:43:39Z. The smoke run's pageviews and the probe both fell inside the window, and none reached PostHog. The same `window-count` over 15:03:57Z to 15:23:10Z, when the provider was `posthog`, read 11 (exit 0), and the after-restore probe read 1, so the reads see events when there are any.
- **The restore.** The plan with the digest alone (plan and show exit 0) matched the same two addresses and actions, back from `none` to `posthog`, nothing else, the same empty-value differences. No run was active at 15:34:01Z (before the plan) or at 15:34:35Z (before the apply), each read exit 0. The apply exit 0 at 15:36:36Z, `services-stable` exit 0 on its first try at 15:37:23Z. Read back: `running-image-digest.sh` exit 0, `:20` by the running digest; `describe-task-definition` exit 0, `ANALYTICS_PROVIDER` `posthog`, `ANALYTICS_POSTHOG_HOST` `https://eu.i.posthog.com`, `ANALYTICS_FLUSH_INTERVAL_MS` `2000`, `stopTimeout` 40, 15 environment names, the secrets' names `PUBLIC_SUPABASE_ANON_KEY` and `ANALYTICS_POSTHOG_KEY`; `describe-services` exit 0, one deployment `COMPLETED` on `:20`, running 1 of 1; `describe-scalable-targets` exit 0, minimum 1, maximum 2; `/api/health` HTTP 200, build `a7003b490…`; no `environment_overrides` assignment in the tfvars (count 0), which are unchanged in the working tree (`git diff --quiet` exit 0); a plan with the digest alone and `-detailed-exitcode` exit 0, `No changes. Your infrastructure matches the configuration.`
- **`RESTORE_SMOKE_VERDICT_EXIT=0`.** 15:38:10Z to 15:38:26Z: the five `PASS` lines, the gate's OK line, `2 passed (15.0s)`, `VERDICT OK: 2 tests -- passed 2, failed 0, flaky 0, skipped 0, did not run 0`.
- **`B07_AFTER_RESTORE_EVENTS=1`.** One event posted in the same form with probe `p188b07r20261119T153826Z` at 15:38:26Z, 204 in 0.20 s; `probe-count` over 15:36:26Z to 16:38:26Z read 1 in three reads from 15:40:17Z to 15:43:38Z, each exit 0. Forwarding resumed after the restore.
- **The hosted record.** Task definitions `:19` (provider `none`) and `:20` (the restore) and their two rollouts; staging's analytics events from 15:25Z to 15:37Z kept by nothing, by design of the observation, the smoke run's pageviews and the probe among them; one probe event in PostHog after the restore, and the restore smoke run's pageviews. The override was on the stack for about twelve minutes.
