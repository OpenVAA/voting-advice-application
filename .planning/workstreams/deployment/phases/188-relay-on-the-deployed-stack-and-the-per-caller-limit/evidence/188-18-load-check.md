# 188-18 — The voter-journey load check on the deployed stack

Staging: `https://staging.openvaa.org`. Cluster `openvaa-staging`, service `openvaa-staging-frontend`, account `471112560111`, region `eu-north-1`; hosted Supabase project `cofbsatfrdysyphajsky`. The observation (CONTEXT D-02 to D-06): one voter journey is recorded from a real browser run on staging and committed with methods, URLs and RPC bodies only; with provider `log` by a hand apply, `infra/scripts/load-check.sh` replays it in 5-minute steps up to `SUPABASE_STEP_CAP` of `evidence/188-09-posthog-setup.md`; the figure is the highest step that met page p95 < 1000 ms, relay p95 < 300 ms and errors < 1 %, in journeys per minute, with its date, commit, task count, task CPU and the bound; the stack is restored by a plain hand apply. The method is `infra/scripts/load-check/README.md`.

## Task 1 — One journey recorded on staging, committed without a header; the step plan (2026-11-19)

Recorded 2026-11-19 (UTC) by the plan executor of plan 188-18, 16:44:08Z to 16:58Z, from HEAD `2b35710a7`. Nothing was applied, planned, stopped or written on any hosted service, AWS resource or GitHub setting; no `terraform` command was run and no attempt of `188-18-2` was opened. The hosted traffic was one voter-only deployed smoke run (the requests every pipeline smoke run makes). The reads were: `GET https://staging.openvaa.org/api/health`; with `AWS_PROFILE=openvaa-admin` and `AWS_REGION=eu-north-1`, after `aws sts get-caller-identity --query Account` exit 0 and the account `471112560111` (the SSO session held), `aws ecs describe-services` (counts, status, task definition and rollout state only); `gh run list --workflow deploy.yml` and the status-filtered `gh api` GETs of `actions/runs`; `git ls-remote origin refs/heads/deploy/staging`; and `grep` and `git diff` of the staging tfvars. No secret value was read. Each status was read on its own line, never through a pipe.

```
READ_AT=2026-11-19T16:44:20Z
SERVED_BUILD=a7003b490b4ff92fc72bef5d225c593b222d6c4e
RUNNING_TASK_DEFINITION=openvaa-staging-frontend:20
RUNNING_TASKS=1
SERVICE_ROLLOUT=COMPLETED
NO_RUN_ACTIVE=yes
TFVARS_OVERRIDES=0
ANALYTICS_PROVIDER_AT_RECORDING=posthog
JOURNEY_TRACK_EVENTS=false
RECORD_RUN=tests/e2e-runs/188-18-record-20261119T164456Z
RECORD_AT=2026-11-19T16:44:56Z..2026-11-19T16:45:05Z
RECORD_SMOKE_EXIT=0
RECORD_VERDICT_EXIT=0
RECORD_PLAYWRIGHT=1.63.0
JOURNEY_EXTRACT_EXIT=0
JOURNEY_REQUESTS=77
JOURNEY_PAGES=14
JOURNEY_DATA=63
JOURNEY_DOCUMENTS=5
JOURNEY_FONT_FILES=9
JOURNEY_REST_READS=11
JOURNEY_RPC_POSTS=2
JOURNEY_RPC_BODIES=2
JOURNEY_STORAGE_READS=50
JOURNEY_RELAY_POSTS_REPLAYED=14
BROWSER_RELAY_POSTS=7
BROWSER_REDIRECTS=2
TRACE_DELETED=yes
JOURNEY_SECRET_FREE=yes
JOURNEY_WRAPPER_CHECK_EXIT=0
JOURNEY_PRETTIER_EXIT=0
LOAD_STEPS=2,5,10,20,40
LOAD_STEP_SECONDS=300
LOAD_MAX_RATE=40
LOAD_EXPECTED_MINUTES=25
LOAD_JOURNEYS_EXPECTED=390
EXPECTED_OBS_CHANGES=task definition replaced, service updated
EXPECTED_OBS_PLAN_LINE=Plan: 1 to add, 1 to change, 1 to destroy.
EXPECTED_OBS_CHANGED_VALUE=ANALYTICS_PROVIDER posthog -> log
EXPECTED_RESTORE_CHANGES=task definition replaced, service updated
EXPECTED_RESTORE_CHANGED_VALUE=ANALYTICS_PROVIDER log -> posthog
```

### The stack before the recording

- **`SERVED_BUILD=`.** `curl -sS --max-time 20 https://staging.openvaa.org/api/health` exit 0, HTTP 200, body `{"status":"ok","build":"a7003b490b4ff92fc72bef5d225c593b222d6c4e"}`, equal to `DEPLOY_COMMIT=` of `evidence/188-10-rollout.md`. `git ls-remote --exit-code origin refs/heads/deploy/staging` exit 0 reads the same commit, and `git diff --quiet a7003b490… -- apps packages` exit 0, so this checkout's specs match the served application.
- **`RUNNING_TASK_DEFINITION=openvaa-staging-frontend:20`.** `aws ecs describe-services` exit 0: `ACTIVE`, running 1, desired 1, one deployment, `PRIMARY`, `COMPLETED`, on `:20`, the restore of 188-15 that 188-17's unset plan read as `No changes.`.
- **`NO_RUN_ACTIVE=yes`.** `gh run list --workflow deploy.yml` exit 0: the newest run `44491292876` (2026-11-19T08:52:17Z, head `a7003b490…`, `completed`, `success`). The status-filtered counts of `actions/runs` are 0 for `queued`, `in_progress`, `waiting`, `requested` and `pending`, each GET exit 0. Task 3 reads this again before its first plan.
- **`TFVARS_OVERRIDES=0`.** `grep -cE '^ *environment_overrides *=' infra/envs/staging/aws/terraform.tfvars` counts 0, and `git diff --quiet` of the file exit 0.
- **`JOURNEY_TRACK_EVENTS=false`.** Staging's `analytics.trackEvents` app setting is `false`, as the operator set it at 2026-11-19T10:59:26Z (188-CONTEXT.md, B-03 note). It was not changed. The voter app therefore showed no consent prompt, and the recorded browser sent pageviews only: its 7 relay POSTs carried no `answer` or other consented event. The relay posts are not part of the journey file in any case (the extractor drops `/api/usage`; the load script posts its own). **Consequence for the figure:** the relay load per journey this figure rests on is lower than on a deployment with `trackEvents` on, where a consenting voter's browser also sends an `answer` event per question and the other consented events. The replay posts one one-event `answer` batch after each page-kind request, 14 per journey (`JOURNEY_RELAY_POSTS_REPLAYED=14`), which is a fixed synthetic relay load rather than a recorded consented journey's.

### The recording

The run followed tests/README.md § Deployed smoke run, voter-only: the refused variables unset, `SMOKE_EXPECTED_SHA=a7003b490b4ff92fc72bef5d225c593b222d6c4e`, no contestant credentials read, and

```
PLAYWRIGHT_JSON_OUTPUT_FILE="$RUN/results.json" \
  yarn test:e2e:deployed tests/tests/deployed/voter.smoke.ts --trace on --output "$L/results"
```

under `caffeinate -i`, with `$L` a fresh `mktemp -d` directory of mode 700 outside the repository. The gate printed its five `PASS` lines and `DEPLOYED SMOKE GATE OK build=a7003b490b4ff92fc72bef5d225c593b222d6c4e ref=cofbsatfrdysyphajsky project=00000000-0000-0000-0000-000000000001`, then `1 passed (7.9s)`; `smoke_exit=0`. `node tests/scripts/e2e-spec-verdict.mjs "$RUN" --passed voter.smoke.ts --no-flaky` printed `VERDICT OK: 1 tests -- passed 1, failed 0, flaky 0, skipped 0, did not run 0`, exit 0. The run directory holds `results.json` and `smoke.log` only; neither holds a header, a key or a cookie (`grep -ciE 'apikey|authorization|eyJ…|cookie'` counts 0), and it is git-ignored.

### The extraction

The trace was unzipped under `$L` (`unzip -q` exit 0: `0-trace.network`, empty, and `1-trace.network`, 277 lines, plus `resources/`), and

```
cat "$L/trace"/*.network | node infra/scripts/load-check/journey-from-trace.mjs \
  --base https://staging.openvaa.org --supabase https://cofbsatfrdysyphajsky.supabase.co \
  --resources "$L/trace/resources" --route-id '/(voters)' --locale en \
  > infra/scripts/load-check/staging-journey.json
```

exited 0 and printed `journey_requests=77`. The README's form (an unzipped trace with `--resources`) was used, not the plan's `unzip -p … '*.network'`: the two RPC bodies are stored as resources, and without `--resources` the extractor exits 1 on them.

- **The extractor was fixed first (deviation, Rule 1).** The first extraction gave both RPCs an empty body. Playwright 1.63 stores a POST body as `postData._file: "resources/<sha1>.json"` beside an empty `text`, and the extractor took the empty `text`. With `bc679d7ef` a named resource wins over `text`, and a name that would leave the resources directory counts as a missing body. Two new tests cover it; `yarn test:unit:infra` passes 420 tests in 16 files. The re-extraction gives `get_questions` and `get_nominations` their recorded bodies: the project id, the election id, the constituency id and `p_include_unconfirmed: false`.
- **What the trace held, by class**, read from the network lines before they were deleted. Only paths and counts were read; no header was printed:

  | Class | Requests in the trace | In the journey |
  | ----- | --------------------- | -------------- |
  | Documents on staging (`/`, `/intro`, `/elections` 307, `/constituencies` 307, `/questions`) | 5 | 5, `kind: page` |
  | Font files on staging (`/fonts/…`) | 9 | 9, `kind: page` |
  | Immutable assets (`/_app/immutable/`) | 193 | dropped |
  | Relay posts (`/api/usage`, all 204) | 7 | dropped |
  | PostgREST reads (`app_settings` 5, `elections` 2, `constituency_groups` 2, `constituencies` 2) | 11 | 11, `kind: data` |
  | RPC posts (`get_questions`, `get_nominations`) | 2 | 2, `kind: data`, with body |
  | Public storage reads (`/storage/v1/object/public/public-assets/…`) | 50 | 50, `kind: data` |

  The responses' transfer sizes: documents about 36 KB, fonts about 54 KB and PostgREST about 145 KB for the journey; the storage responses carry no size in the trace.
- **`TRACE_DELETED=yes`.** `rm -rf "$L"` exit 0, and `test -e "$L"` then exits 1. The trace zip, the unzipped trace and its resources were all under `$L`; `find` of the run directory counts 0 zip files, and Playwright's default output directory `tests/playwright-deployed-results` does not exist.
- **`JOURNEY_SECRET_FREE=yes`.** In `infra/scripts/load-check/staging-journey.json` (18,952 bytes before formatting):
  - `grep -ciE 'eyJ[A-Za-z0-9_-]{20,}|"apikey"|"authorization"'` counts 0;
  - the wider `grep -ciE 'apikey|authorization|bearer|cookie|sb_publishable|sb_secret|phc_|phx_|phs_|password|token|secret|AKIA|ghp_|github_pat|xox[bp]-|-----BEGIN'` counts 0, so no string GitHub push protection matches is in it;
  - every entry's keys are `kind,method,url` or `body,kind,method,url`, and its top level is `base,routeId,locale,requests`;
  - the query strings hold only `select`, `project_id`, `order`, `offset`, `limit` and `electionId`; no URL carries `apikey=`.
  The extractor's change adds no key-shaped literal either: its tests reuse the existing fixture body.
- **`JOURNEY_WRAPPER_CHECK_EXIT=0`.** The wrapper's own journey check (`JOURNEY_CHECK_JS` of `infra/scripts/load-check.sh`, run with node against the file and `https://staging.openvaa.org`) prints nothing and exits 0: the base matches, every page request is on the base host, every data request is on the one Supabase host, and no request reaches a refused path.
- **`JOURNEY_PRETTIER_EXIT=0`.** `prettier --write` then `prettier --check` of the file: clean.

### The step plan

Written before any approval is asked; Task 3 runs it only after `bound 188-18-2` and `has 188-18-2 '^answer_load=approve$'` both exit 0.

- **Steps:** `LOAD_STEPS=2,5,10,20,40` journeys per minute, each held `LOAD_STEP_SECONDS=300`. `SUPABASE_STEP_CAP=40` (`SUPABASE_PLAN=pro`, `SUPABASE_NOTICE_NEEDED=no`, evidence/188-09) cuts none of them. `LOAD_MAX_RATE=40` is passed as `--max-rate`, so the wrapper refuses any step above the cap.
- **Duration:** `LOAD_EXPECTED_MINUTES=25` minutes of load (5 steps of 5 minutes), plus k6's start and the last step's 10 s graceful stop. The whole sitting, with the two rollouts, their stability waits, two smoke runs and the restore plan, is about an hour.
- **Abort:** k6 aborts the run when `http_req_failed` has been above 5 % for a minute (exit 99), and the steps after it then have no values.
- **The command** (Task 3, in the background, the anon key read from staging's served env block into `SUPABASE_ANON_KEY` inside the same command):

  ```
  infra/scripts/load-check.sh --base-url https://staging.openvaa.org \
    --confirm-target https://staging.openvaa.org \
    --journey infra/scripts/load-check/staging-journey.json \
    --steps 2,5,10,20,40 --max-rate 40 --out <dir under $L>
  ```

- **What one replayed journey sends.** The 77 recorded requests in their order, and one relay batch after each of the 14 page-kind requests. k6 follows redirects, so the journey's `/elections` (307 to `/constituencies`, 307 to `/questions`) and `/constituencies` (307 to `/questions`) entries add 3 document requests the browser did not make twice: 17 requests to staging's pages, 14 relay posts and 63 to Supabase (11 PostgREST reads, 2 RPCs, 50 public storage reads), 94 in all.
- **Load at the cap, 40 journeys a minute:** about 680 page and 560 relay requests a minute to staging (about 21 a second together), and about 2,520 a minute to the Supabase project (about 42 a second: 7 PostgREST reads or RPCs and 33 storage reads a second).
- **The whole run:** about `LOAD_JOURNEYS_EXPECTED=390` journeys (k6 starts `r·T/60 + 1` iterations per step, 188-07), so about 36,700 requests: about 12,100 to staging through CloudFront and about 24,600 to the Supabase project (about 5,100 PostgREST, of them 780 RPCs, and 19,500 storage reads). By the recorded transfer sizes, about 35 MB leaves CloudFront and about 57 MB of PostgREST responses leave Supabase. The storage responses' size is not in the trace; at an assumed 50 KB per portrait the storage egress would be about 1 GB.

### Cost and quota impact

- **PostHog:** none. The provider is `log` for the whole run (D-03), so no event reaches project 347462 and the 20 USD billing limit is not touched. Staging's own events during the override are written to CloudWatch, not forwarded.
- **Supabase (Pro):** no per-request charge for PostgREST or storage reads. The run's egress, about 0.06 GB from PostgREST and an estimated 1 GB or less from storage, is a small part of the egress the Pro plan includes. The project's compute is shared with every other staging use, so the smoke runs and any other user of `cofbsatfrdysyphajsky` see the load while it runs. No Auth and no Edge Function call is made, so the Auth rate limits and the per-caller limit of migration `00023` are not exercised. The Pro plan is not Team or Enterprise, so the two-week notice for heavy load tests does not apply (`SUPABASE_NOTICE_NEEDED=no`).
- **AWS:** about 12,100 CloudFront requests and 35 MB, within CloudFront's always-free monthly allowance, so about 0 USD. The service runs at its configured floor 1 and ceiling 2 (512 CPU units, 1024 MB each); if it scales out, a second Fargate task runs for at most the half hour of the load, a few US cents. Provider `log` writes each relay event into CloudWatch Logs, about 5,500 events over the run, a few MB of ingestion, well under 0.01 USD. The WAF rate rule is not on (188-17), so no WAF charge applies and no 429 from it can cut the run. AWS needs no approval for this load: it is far below 1 Gbps and CloudFront's 500,000 requests a second (README § Policies).
- **The two rollouts:** two new task-definition revisions (expected `:21` with provider `log` and `:22` restored), each followed by a deployed smoke run. During the override, staging's own pageviews go to CloudWatch, not PostHog.

## Plan Task 1 verify

Run verbatim, the plan's automated verify exits 1 at its node check, `if(!Array.isArray(j)||j.length===0)process.exit(1)`. The check was written for a journey that is a bare array; since 188-07 a journey file is one object `{ base, routeId, locale, requests }`, and `load-check.sh` refuses any other shape ("the journey is not an object"). Every other check passes: the six `grep -qx` lines, `JOURNEY_REQUESTS` above 0, the token and header-name grep, and `prettier --check`. The same node check applied to `j.requests` (every entry's keys `kind,method,url` or `body,kind,method,url`, the list not empty) exits 0. The verify was not edited.

## Task 3, sitting one — stopped before any plan: the AWS SSO session had expired (2026-11-19, attempt 20261119T165213Z.1312f24e7)

Recorded 2026-11-19 (UTC) by the continuation executor of plan 188-18. `bash "$A" bound 188-18-2 OPERATOR_REPLY plan=188-18 task=2` exit 0 and `bash "$A" has 188-18-2 '^answer_load=approve$'` exit 0 were read at 17:13:31Z. The pinned k6 image was pulled by its digest (exit 0, `Image is up to date`, the scratch `DOCKER_CONFIG` of 188-07) and `k6 version` read `k6 v2.4.0`. The anon key was confirmed readable from staging's served env block by its length and class only (208 characters, a JWT), never printed.

```
SITTING1_PRE_PLAN_ACTIVE_RUNS=0
SITTING1_ACCOUNT_READ_EXIT=0
SITTING1_INIT_EXIT=1
SITTING1_INIT_ERROR=failed to refresh cached credentials, refresh cached SSO token failed (SSO OIDC CreateToken, HTTP 400)
SITTING1_PLAN_EXIT=1
SITTING1_ROLE_CREDENTIALS_EXPIRE=2026-11-19T17:38:50Z
SITTING1_HOSTED_WRITES=none
SITTING1_PLAN_FILES_LEFT=0
```

- At 17:15:45Z, under `caffeinate -i`, the account check passed on the AWS CLI's cached role credentials, but `terraform init -lockfile=readonly` of the staging root exited 1: the S3 backend could not refresh the SSO token of session `openvaa` (`CreateToken` answered 400). The plan therefore exited 1 without a saved plan, and `show -json` had nothing to read. `find` of the session scratch directory finds no `tfplan*` and no plan JSON.
- The cached role credentials expire at 17:38:50Z, before a sitting of about an hour could end, so the sitting was not continued on them: an override left on the stack could not have been restored.
- Nothing was planned, applied or loaded; staging is still `:20`, provider `posthog`. The pre-plan read of the pipeline counts 0 active runs. A second read failed on the first try because the run-count script read `gh` from outside the checkout; it was fixed and read 0 again.
- The sitting needs a new SSO login (`aws sso login --sso-session openvaa`) before it runs again; whether it runs under this attempt or a new one is the orchestrator's call.

## Task 3, sitting two — stopped before any plan on a token-lifetime rule (2026-11-19, attempt 20261119T165213Z.1312f24e7)

After the operator's new SSO login, `bound` and `has` were read again at 17:26:59Z (both exit 0). The coordinator's rule for that sitting asked for at least 70 minutes on the SSO access token; the cache's `expiresAt` was 18:25:47Z, 59 minutes away, so the sitting stopped before any plan. The coordinator then replaced the rule (the access token lives an hour and is refreshed for the session's length, about 8 hours from the 17:25Z login): a refresh proved by `terraform init -lockfile=readonly` and `aws sts get-caller-identity` right before the first apply, and the same check before the restore.

```
SITTING2_AT=2026-11-19T17:26:59Z
SITTING2_TOKEN_EXPIRES_AT=2026-11-19T18:25:47Z
SITTING2_STOP_RULE=70-minute token rule (coordinator), replaced by a proved refresh
SITTING2_HOSTED_WRITES=none
```

## Task 3, sitting three — provider `log`, the stepped load, the figure, the restore (2026-11-19, attempt 20261119T165213Z.1312f24e7)

Recorded 2026-11-19 (UTC) by the continuation executor of plan 188-18, 17:28:03Z to 18:04:19Z, from HEAD `6d21a6099` (then `f778834e0`, committed before the load). `bash "$A" bound 188-18-2 OPERATOR_REPLY plan=188-18 task=2` exit 0 and `bash "$A" has 188-18-2 '^answer_load=approve$'` exit 0 were read at 17:28:03Z, before the first plan. Every plan, apply, stability wait, read-back, smoke run and the load ran under `caffeinate -i`; `pmset -g log` has no `Sleep`, `DarkWake` or `Wake` entry from 17:13Z to 18:05Z, so no wait was cut short. Every AWS and Terraform command ran with `AWS_PROFILE=openvaa-admin` after the account check, `TF_VAR_alert_email` checked with `test -n` only, and `TF_DATA_DIR` a fresh directory under the session scratch directory against the root's S3 backend; the operator's `.terraform/` was not touched. Plans were saved under the session's `$L` (mode 700), read with `terraform show -json` through `jq` (addresses and actions, the environment's names, the one changed value), and each plan JSON was deleted as soon as it was read; each saved plan was deleted by its apply. Afterwards `find` of the session scratch directory finds no `tfplan*` and no plan JSON, and the plan and apply logs were deleted too. No plan output is copied here. Each status was read on its own line.

### The observation apply

```
OBS_PRE_PLAN_ACTIVE_RUNS=0
OBS_DIGEST=sha256:e35bde282307277ea7be9aed008b2bc5a31c0a27ff2738b9153e09bf1412182a
OBS_PLAN_LINE=Plan: 1 to add, 1 to change, 1 to destroy.
OBS_CHANGE=update module.frontend.aws_ecs_service.app
OBS_CHANGE=delete-create module.frontend.aws_ecs_task_definition.app
OBS_TD_IMAGE_UNCHANGED=yes
OBS_TD_ENV_NAMES_UNCHANGED=yes
OBS_TD_ENV_CHANGED_NAMES=ANALYTICS_PROVIDER
OBS_TD_PROVIDER=posthog->log
OBS_TD_SECRET_NAMES_UNCHANGED=yes
OBS_TD_STOP_TIMEOUT=40->40
OBS_TARGET=1->1 2->2, no changed key
OBS_SERVICE_CHANGED_KEYS=task_definition
OBS_PLAN_MATCHES=yes
OBS_PRE_APPLY_REFRESH_INIT_EXIT=0
OBS_PRE_APPLY_REFRESH_STS_EXIT=0
OBS_PRE_APPLY_ACTIVE_RUNS=0
OBS_APPLY_EXIT=0
OBS_APPLY_LINE=Apply complete! Resources: 1 added, 1 changed, 1 destroyed.
OBS_APPLY_WINDOW=2026-11-19T17:29:21Z..2026-11-19T17:31:15Z
OBS_WAIT_STABLE_EXIT=0
OBS_STABLE_AT=2026-11-19T17:32:03Z
OBS_TASK_DEFINITION=openvaa-staging-frontend:21
OBS_RUNNING_PROVIDER=log
OBS_RUNNING_TASKS=1
OBS_SMOKE_RUN_DIR=tests/e2e-runs/188-18-obs-20261119T173229Z
OBS_SMOKE_EXIT=0
OBS_SMOKE_VERDICT_EXIT=0
```

- The saved plan (`-var "image_digest=$DIGEST" -var 'environment_overrides={ANALYTICS_PROVIDER="log"}'`, plan and show exit 0) matched the stop rule of Task 1: `EXPECTED_OBS_CHANGES=`, `EXPECTED_OBS_PLAN_LINE=` and `EXPECTED_OBS_CHANGED_VALUE=`, the image, the environment's names, the secrets' names and the stop timeout unchanged. The service's changed key is `task_definition`, read from the union of `before` and `after` keys (it is unknown in `after`, as in 188-15); the scalable target is a no-op.
- The read before the apply first counted 2 active runs at 17:28:41Z. They were two `Claude Code` workflow runs on `main` (event `issue_comment`), neither `deploy.yml` nor `destroy.yml`, and both had `completed` by 17:28:55Z. A new read just before the apply counted 0 for all five statuses and for both workflows, and the apply started at 17:29:21Z.
- The SSO refresh was proved right before the apply (`init -lockfile=readonly` exit 0, `sts get-caller-identity` exit 0, 17:28:41Z).
- `running-image-digest.sh` after the rollout: `:21`, the same digest; `describe-task-definition` of `:21`: `ANALYTICS_PROVIDER` `log`; one deployment `COMPLETED` (17:31:58Z), running 1 of 1.
- The smoke run on `:21` (17:32:29Z to 17:32:48Z): the five `PASS` lines, `DEPLOYED SMOKE GATE OK build=a7003b490…`, `2 passed (16.7s)`, `VERDICT OK: 2 tests -- passed 2, failed 0, flaky 0, skipped 0, did not run 0`.

### The stepped load

```
LOAD_STARTED=2026-11-19T17:34:06Z
LOAD_ENDED=2026-11-19T17:59:13Z
LOAD_K6_EXIT=0
LOAD_ABORTED=no
LOAD_WRAPPER_EXIT=0
LOAD_STEPS_RUN=2,5,10,20,40
LOAD_MAX_RATE=40
LOAD_ITERATIONS=387
LOAD_HTTP_REQS=36378
LOAD_HTTP_REQ_FAILED=1
LOAD_DATA_RECEIVED_BYTES=11717574206
LOAD_DATA_SENT_BYTES=75272294
LOAD_GENERATOR_VM_CPUS=14
step=1 rate_per_min=2 page_p95_ms=288.4 relay_p95_ms=125.9 error_rate=0.0000 met=yes
step=2 rate_per_min=5 page_p95_ms=237.4 relay_p95_ms=105.1 error_rate=0.0000 met=yes
step=3 rate_per_min=10 page_p95_ms=201.4 relay_p95_ms=105.2 error_rate=0.0000 met=yes
step=4 rate_per_min=20 page_p95_ms=177.9 relay_p95_ms=96.9 error_rate=0.0001 met=yes
step=5 rate_per_min=40 page_p95_ms=202.6 relay_p95_ms=109.0 error_rate=0.0000 met=yes
figure_journeys_per_minute=40
figure_step=5
```

The command was `load-check.sh --base-url https://staging.openvaa.org --confirm-target https://staging.openvaa.org --journey infra/scripts/load-check/staging-journey.json --steps 2,5,10,20,40 --max-rate 40 --out <dir under $L>`, in the background, the anon key read from staging's served env block into `SUPABASE_ANON_KEY` inside the same command and never printed. k6 ran from the pinned image `grafana/k6:2.4.0@sha256:d41bb79c…a7e276`. The wrapper printed `k6_exit=0`: no threshold was crossed and the run was not aborted. Over the whole run one request of 36,378 failed (in step 4, error rate 0.0001).

Per step, the maxima of the one-minute samples (step windows from `LOAD_STARTED=`, 300 s each). The task's CPU and memory are `AWS/ECS` `CPUUtilization` and `MemoryUtilization` of the service at 60 s (the maximum statistic; `task_cpu_avg_max` is the largest per-minute average), read after the run for 17:32Z to 18:02Z (exit 0, 28 points each), the task count is `runningCount` of `describe-services` once a minute, the generator CPU is the k6 container's `docker stats` CPU divided by the VM's 14 CPUs (the raw percentage of one CPU beside it) with the host's own busy share from `top`, and the generator network is the larger of the in and out rates of the host's `en0` between samples, which counts all of the host's traffic. `data_p95_ms` is the per-step p95 of the Supabase requests, kept in the summary by the observe-only threshold of `f778834e0`:

```
step1_window=17:34:06Z..17:39:06Z
step1_tasks=1
step1_task_cpu_max=17.84
step1_task_cpu_avg_max=7.33
step1_task_mem_max=13.48
step1_generator_cpu_max=0.06
step1_generator_container_cpu_raw_max=0.88
step1_generator_host_cpu_busy_max=48.06
step1_generator_mbit_max=9.3
step1_data_p95_ms=525.3
step2_window=17:39:06Z..17:44:06Z
step2_tasks=1
step2_task_cpu_max=17.25
step2_task_cpu_avg_max=15.54
step2_task_mem_max=17.14
step2_generator_cpu_max=0.06
step2_generator_container_cpu_raw_max=0.88
step2_generator_host_cpu_busy_max=22.28
step2_generator_mbit_max=21.25
step2_data_p95_ms=129.5
step3_window=17:44:06Z..17:49:06Z
step3_tasks=1
step3_task_cpu_max=29.24
step3_task_cpu_avg_max=24.92
step3_task_mem_max=17.33
step3_generator_cpu_max=1.49
step3_generator_container_cpu_raw_max=20.81
step3_generator_host_cpu_busy_max=99.78
step3_generator_mbit_max=46.4
step3_data_p95_ms=123.5
step4_window=17:49:06Z..17:54:06Z
step4_tasks=1
step4_task_cpu_max=40.61
step4_task_cpu_avg_max=34.8
step4_task_mem_max=19.87
step4_generator_cpu_max=4.93
step4_generator_container_cpu_raw_max=69.06
step4_generator_host_cpu_busy_max=100.0
step4_generator_mbit_max=87.05
step4_data_p95_ms=126.1
step5_window=17:54:06Z..17:59:06Z
step5_tasks=1
step5_task_cpu_max=44.86
step5_task_cpu_avg_max=43.52
step5_task_mem_max=20.46
step5_generator_cpu_max=1.31
step5_generator_container_cpu_raw_max=18.38
step5_generator_host_cpu_busy_max=37.87
step5_generator_mbit_max=170.24
step5_data_p95_ms=139.7
```

- The k6 container's own network counters read 11.3 GB in and 170 MB out at 17:58:48Z, the last sample; k6's `data_received` is 11.72 GB. At step 5 the container received about 20 MB a second (about 160 Mbit/s), which matches `step5_generator_mbit_max=170.24`.
- The host's CPU was near full in steps 3 and 4 (`generator_host_cpu_busy_max` 99.78 and 100.0) from other work on the workstation: `top` at 17:50Z showed a TypeScript typecheck (`tsgo`) at 126 % of one CPU, the window server and the Docker VM. The k6 container itself stayed under 70 % of one CPU (under 5 % of the VM). The page and relay p95s of steps 3 and 4 are no higher than those of the other steps, so the busy host did not show in the measurements.

### The figure and its bound

```
LOAD_FIGURE_JOURNEYS_PER_MINUTE=40
LOAD_FIGURE_STEP=5
LOAD_FIGURE_DATE=2026-11-19
LOAD_FIGURE_COMMIT=a7003b490b4ff92fc72bef5d225c593b222d6c4e
LOAD_FIGURE_TASKS=1
LOAD_FIGURE_TASK_CPU=44.86
LOAD_FIGURE_TASK_CPU_AVG=43.52
LOAD_FIGURE_TASK_MEMORY=20.46
LOAD_BOUND=none-reached
LOAD_FIGURE_IS_LOWER_BOUND=yes
JOURNEY_TRACK_EVENTS=false
SUMMARY_SECRET_FREE=yes
```

- **40 journeys a minute, a lower bound.** Every step met every threshold, so by the plan's rule the bound is `none-reached` and the figure is the highest step run, which is the step cap of the hosted project's plan (`SUPABASE_STEP_CAP=40`), not a capacity reached. At 40 a minute the one task ran at 44.86 % CPU at most (43.52 % as a one-minute average) and 20.46 % memory, and the service did not scale out (1 task in every step). Page p95 was 202.6 ms, relay p95 109.0 ms and data p95 139.7 ms.
- **What the figure rests on.** `JOURNEY_TRACK_EVENTS=false`: the recorded journey is a pageview-only browser's (Task 1), and the relay posts of the replay are one one-event `answer` batch after each of the 14 page-kind requests. A deployment with `trackEvents` on carries more relay load per journey (a consenting voter also sends an `answer` event per question and the other consented events), so the figure does not cover the relay at that load.
- **The busy shared resources were not reached.** The task's CPU stayed under 60 % at every step, the Supabase requests' p95 stayed between 123 ms and 140 ms from step 2 on (the 525 ms of step 1 is its first, cold requests), and the generator stayed far below 80 % of its CPU.
- **`SUMMARY_SECRET_FREE=yes`.** The k6 summary (11,616 bytes, top-level keys `load_check`, `metrics`, `options`, `root_group`, `state`) holds no `eyJ` token and no `apikey`, `bearer`, `authorization`, `PUBLIC_SUPABASE`, `sb_secret` or `sb_publishable` string (`grep -ciE` counts 0). It is copied to `evidence/188-18-load-summary.json`.

### The step plan's estimate, against the run

The run made 387 journeys and 36,378 requests, close to Task 1's 390 and about 36,700. The bytes received were not close: 11.72 GB against an estimate of about 1 GB. Task 1 assumed 50 KB a portrait, but the 50 public storage reads of each journey brought in about 30 MB together, about 0.6 MB each. Almost all of that is egress from the Supabase project's storage, about 11.5 GB for the run, which is still a small part of the egress the Pro plan includes, and the per-journey figure is what a real voter's browser loads too, when its cache is cold.

### The restore

```
RESTORE_PRE_PLAN_REFRESH_STS_EXIT=0
RESTORE_PRE_PLAN_ACTIVE_RUNS=0
RESTORE_PLAN_LINE=Plan: 1 to add, 1 to change, 1 to destroy.
RESTORE_CHANGE=update module.frontend.aws_ecs_service.app
RESTORE_CHANGE=delete-create module.frontend.aws_ecs_task_definition.app
RESTORE_TD_IMAGE_UNCHANGED=yes
RESTORE_TD_ENV_NAMES_UNCHANGED=yes
RESTORE_TD_ENV_CHANGED_NAMES=ANALYTICS_PROVIDER
RESTORE_TD_PROVIDER=log->posthog
RESTORE_TD_SECRET_NAMES_UNCHANGED=yes
RESTORE_TD_STOP_TIMEOUT=40->40
RESTORE_SERVICE_CHANGED_KEYS=task_definition
RESTORE_PLAN_MATCHES=yes
RESTORE_PRE_APPLY_ACTIVE_RUNS=0
RESTORE_APPLY_EXIT=0
RESTORE_APPLY_LINE=Apply complete! Resources: 1 added, 1 changed, 1 destroyed.
RESTORE_APPLY_WINDOW=2026-11-19T18:00:55Z..2026-11-19T18:02:47Z
RESTORE_WAIT_STABLE_EXIT=0
RESTORE_STABLE_AT=2026-11-19T18:03:37Z
RESTORE_TASK_DEFINITION=openvaa-staging-frontend:22
RESTORE_RUNNING_DIGEST=sha256:e35bde282307277ea7be9aed008b2bc5a31c0a27ff2738b9153e09bf1412182a
RESTORE_RUNNING_TASKS=1
RESTORE_PROVIDER=posthog
RESTORE_POSTHOG_HOST=https://eu.i.posthog.com
RESTORE_FLUSH_INTERVAL=2000
RESTORE_STOP_TIMEOUT=40
RESTORE_SECRET_NAMES=PUBLIC_SUPABASE_ANON_KEY,ANALYTICS_POSTHOG_KEY
RESTORE_FLOOR=1
RESTORE_CEILING=2
RESTORE_PLAN_AFTER_EXIT=0
RESTORE_PLAN_AFTER_LINE=No changes. Your infrastructure matches the configuration.
RESTORE_SERVED_BUILD=a7003b490b4ff92fc72bef5d225c593b222d6c4e
RESTORE_TFVARS_OVERRIDES=0
RESTORE_SMOKE_RUN_DIR=tests/e2e-runs/188-18-restore-20261119T180406Z
RESTORE_SMOKE_EXIT=0
RESTORE_SMOKE_VERDICT_EXIT=0
OVERRIDE_ON_STACK=2026-11-19T17:31Z..2026-11-19T18:03Z
HOSTED_WRITES=task-definition:21,service-rollout,stepped-load,task-definition:22,service-rollout
PLAN_FILES_LEFT=0
```

- The credentials were checked again before the restore plan (`sts get-caller-identity` exit 0 at 18:00Z, and the plan's own `init` exit 0). The restore plan, with the digest alone, matched the same two addresses and actions back from `log` to `posthog` and nothing else. No run was active before the plan or before the apply.
- Read back after the stability wait: `:22` by the running digest; `ANALYTICS_PROVIDER` `posthog`, `ANALYTICS_POSTHOG_HOST` `https://eu.i.posthog.com`, `ANALYTICS_FLUSH_INTERVAL_MS` `2000`, `stopTimeout` 40, the two secrets' names; one deployment `COMPLETED`, running 1 of 1; scaling 1 to 2; `/api/health` 200 with build `a7003b490…`; no `environment_overrides` in the tfvars, which are unchanged (`git diff --quiet` exit 0); and a plan with the digest alone and `-detailed-exitcode` exit 0, `No changes. Your infrastructure matches the configuration.`
- The smoke run after the restore (18:04:06Z to 18:04:19Z): the five `PASS` lines, the gate's OK line, `2 passed (11.8s)`, `VERDICT OK: 2 tests -- passed 2, failed 0, flaky 0, skipped 0, did not run 0`.
- While the override was on, from about 17:31Z to 18:03Z, staging's analytics events, the smoke run's pageviews and the load's relay batches among them, went to CloudWatch Logs and not to PostHog, as D-03 requires.

### Two starts of the load

The first start, at 17:32:55Z, ran nothing: `load.sh` called `infra/scripts/load-check.sh`, which is not executable in the tree (mode 644), and the shell exited 126 before the wrapper ran, so no container started and no request was sent. The runner was changed to `bash infra/scripts/load-check.sh`, and the load started at 17:34:06Z.
