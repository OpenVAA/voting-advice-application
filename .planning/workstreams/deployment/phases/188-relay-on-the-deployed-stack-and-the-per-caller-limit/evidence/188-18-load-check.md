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
