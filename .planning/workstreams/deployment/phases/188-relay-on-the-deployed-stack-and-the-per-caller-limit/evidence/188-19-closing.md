# 188-19 — The phase's end state, its requirement trace, and the read key

Staging: `https://staging.openvaa.org`. Cluster `openvaa-staging`, service `openvaa-staging-frontend`, account `471112560111`, region `eu-north-1`; CloudFront distribution `E3V7BYRXOVAFII`; Supabase project `cofbsatfrdysyphajsky`; PostHog EU project 347462. This record is where the phase verifier and phase 189 read phase 188 from. Task 1 below is read-only; Task 3 (the final plan and the read key's fate) is added after the operator's answer under key `188-19-2`.

## Task 1 — The end state, read-only, and the requirement trace (2026-11-19)

Recorded 2026-11-19 (UTC) by the plan executor of plan 188-19, 18:13:03Z to about 18:20Z, from HEAD `6792d15fb`. Nothing was applied, planned, stopped or written on any hosted service, AWS resource or GitHub setting. No `terraform` command was run, and no attempt of `188-19-2` was opened.

The reads were:
- one GET of `https://staging.openvaa.org/api/health`;
- with `AWS_PROFILE=openvaa-admin` and `AWS_REGION=eu-north-1`, after `aws sts get-caller-identity --query Account` exit 0 and the account `471112560111`:
  - `aws ecs describe-services` (status, counts, task definition, deployments and rollout state only);
  - `aws ecs describe-task-definition` of `:22` (the image, `stopTimeout`, the `ANALYTICS_*` value entries and the names of every environment and secret entry; no secret value exists in a task definition, and none was read);
  - `aws application-autoscaling describe-scalable-targets` (min and max only);
  - `infra/scripts/running-image-digest.sh`;
  - `aws cloudfront get-distribution-config --id E3V7BYRXOVAFII` (`WebACLId`, aliases, `Enabled`);
  - `aws wafv2 list-web-acls --scope CLOUDFRONT --region us-east-1` (count only);
- `gh run list --workflow deploy.yml` and `--workflow destroy.yml`, and the status-filtered `gh api` GETs of `actions/runs`;
- one public read of `analytics.trackEvents`: the served page's public anon key and project id, read and not printed, then an anon `GET /rest/v1/app_settings?select=updated_at,track:settings->analytics->trackEvents&project_id=eq.<id>`, the same read the voter app makes;
- `grep` and `git diff` of the staging tfvars and of the tree.

Each status was read on its own line, never through a pipe. The outputs are in the session scratch directory.

```
READ_AT=2026-11-19T18:13:03Z
SERVED_BUILD=a7003b490b4ff92fc72bef5d225c593b222d6c4e
SERVED_BUILD_EQUALS_DEPLOY_COMMIT=yes
FINAL_DIGEST=sha256:e35bde282307277ea7be9aed008b2bc5a31c0a27ff2738b9153e09bf1412182a
FINAL_DIGEST_EQUALS_BUILD_DIGEST=yes
FINAL_IMAGE_REFERENCE=digest
FINAL_TASK_DEFINITION=openvaa-staging-frontend:22
FINAL_RUNNING_TASKS=1
FINAL_DEPLOYMENTS=1
FINAL_ROLLOUT=COMPLETED
FINAL_PROVIDER=posthog
FINAL_POSTHOG_HOST=https://eu.i.posthog.com
FINAL_FLUSH_INTERVAL_MS=2000
FINAL_STOP_TIMEOUT=40
FINAL_FLOOR=1
FINAL_CEILING=2
FINAL_WEB_ACL=none
FINAL_CLOUDFRONT_WEB_ACLS=0
FINAL_SECRET_NAMES=PUBLIC_SUPABASE_ANON_KEY,ANALYTICS_POSTHOG_KEY
FINAL_POSTHOG_KEY_IN_ENVIRONMENT=0
FINAL_ENV_NAMES=15
TFVARS_PROVIDER=posthog
TFVARS_FLUSH_INTERVAL_MS=2000
TFVARS_STOP_TIMEOUT=40
TFVARS_FLOOR=1
TFVARS_CEILING=2
TFVARS_OVERRIDES=0
TFVARS_RELAY_RATE_LIMIT=unset
TFVARS_UNCOMMITTED=no
TF_CONFIG_SINCE_SERVED=unchanged
APPS_PACKAGES_TESTS_SINCE_SERVED=unchanged
APPS_PACKAGES_TESTS_SINCE_E2E_TREE_SHA=unchanged
NO_RUN_ACTIVE=yes
LAST_DEPLOY_RUN=44491292876
DESTROY_PATH_SINCE_188_10=no
TRACK_EVENTS_NOW=false
TRACK_EVENTS_UPDATED_AT=2026-11-19T10:59:26Z
LAST_PLAN_BEFORE_THIS_PLAN=No changes. (188-18 RESTORE_PLAN_AFTER_LINE, after the restore stable at 18:03:37Z)
FINAL_PLAN=pending Task 3 (operator approval under key 188-19-2)
```

- **`SERVED_BUILD=`.** `curl` exit 0, HTTP 200, body `{"status":"ok","build":"a7003b490b4ff92fc72bef5d225c593b222d6c4e"}`. That is `DEPLOY_COMMIT=` of `evidence/188-10-rollout.md`.
- **`FINAL_DIGEST=`.** `running-image-digest.sh` exit 0: `running_task_definition=…:22`, `running_image_reference=digest`, and the digest equal to `BUILD_DIGEST=` of `evidence/188-10-rollout.md`. The task definition's `image` is the ECR repository `@` that digest.
- **`FINAL_TASK_DEFINITION=openvaa-staging-frontend:22`.** `describe-services` exit 0: `ACTIVE`, running 1, desired 1, one deployment, `COMPLETED`. `:22` is `RESTORE_TASK_DEFINITION=` of `evidence/188-18-load-check.md`. It differs from the pipeline's `:10` in its revision number only, as each restore of 188-12 to 188-18 recorded.
- **The task definition's values.** `describe-task-definition` exit 0: `stopTimeout` 40; `ANALYTICS_PROVIDER` `posthog`, `ANALYTICS_POSTHOG_HOST` `https://eu.i.posthog.com`, `ANALYTICS_FLUSH_INTERVAL_MS` `2000`, `ANALYTICS_CONSENT_MODE` `gated`, `ANALYTICS_VISIT_ID_MODE` `memory`; 15 environment names, none of them `ANALYTICS_POSTHOG_KEY`; the secrets `PUBLIC_SUPABASE_ANON_KEY` and `ANALYTICS_POSTHOG_KEY`, so the key still comes from the parameter store.
- **`FINAL_FLOOR=1`, `FINAL_CEILING=2`.** `describe-scalable-targets` exit 0: one target, min 1, max 2.
- **`FINAL_WEB_ACL=none`.** `get-distribution-config` exit 0: `WebACLId` `""`, alias `staging.openvaa.org`, `Enabled` true. `list-web-acls` exit 0 counts 0 CLOUDFRONT web ACLs in the account (`CLOUDFRONT_WEB_ACLS_AFTER=0` of 188-17 still holds).
- **The tfvars.** `infra/envs/staging/aws/terraform.tfvars` reads `task_floor = 1`, `task_ceiling = 2`, `stop_timeout_seconds = 40`, `ANALYTICS_PROVIDER = "posthog"` and `ANALYTICS_FLUSH_INTERVAL_MS = "2000"`. `grep -cE '^ *environment_overrides *='` counts 0 and `grep -cE 'relay_rate_limit'` counts 0. `git diff --quiet` of the file exit 0. It is the root's only tfvars file. No `TF_VAR_relay_rate_limit` and no `TF_VAR_environment_overrides` is in this shell's environment (count 0).
- **`TF_CONFIG_SINCE_SERVED=unchanged`.** `git diff --quiet a7003b490 HEAD -- infra/envs/staging/aws infra/modules ':(exclude)infra/envs/staging/aws/README.md'` exit 0. Since the served commit, the staging root has changed only in its runbook's Observations rows. Task 3's plan therefore plans the configuration the pipeline applied.
- **`APPS_PACKAGES_TESTS_SINCE_SERVED=unchanged`, `APPS_PACKAGES_TESTS_SINCE_E2E_TREE_SHA=unchanged`.** `git diff --quiet a7003b490 HEAD -- apps packages tests` exit 0. `git diff --quiet d523abcd5..HEAD -- apps packages tests` exit 0. The full run `tests/e2e-runs/188-close2-20261119T071844Z` (729 passed) still stands for the tree. Outside `.planning/`, the changes since the served commit are under `infra/scripts/load-check*` (188-18) and the two staging runbooks only.
- **`NO_RUN_ACTIVE=yes`, `LAST_DEPLOY_RUN=44491292876`.** `gh run list --workflow deploy.yml` exit 0. Its newest run is `44491292876` (created 2026-11-19T08:52:17Z, head `a7003b490…`, `success`), the run of 188-10, so the pipeline has not run since. The status-filtered counts of `actions/runs` are 0 for `queued`, `in_progress`, `waiting`, `requested` and `pending`, each GET exit 0.
- **`DESTROY_PATH_SINCE_188_10=no`.** `gh run list --workflow destroy.yml` exit 0 lists one run: `44285713407`, created 2026-11-18T10:28:18Z, `success`. That is the 187-23 to 187-25 destroy of the plan's assumption, made before 188-10's run of 2026-11-19T08:52:17Z. Attempt 2 of `44276384977` (created 2026-11-18T09:29:26Z) redeployed the stack before this phase's deployed plans. No destroy has run since 188-10, so the end state above is read from the stack 188-10 rolled out.
- **`TRACK_EVENTS_NOW=false`.** The served page answered HTTP 200. The anon key (208 characters) and the project id (36 characters) were read from it inside one script and not printed, and the page copy was deleted. The REST read answered HTTP 200 with one row: `track` false, `updated_at` `2026-11-19T10:59:26.058396+00:00`. That is the operator's switch-off of the B-03 note in 188-CONTEXT.md. Nothing has changed the setting since.

### The trace

Each `TRACE_` line names evidence files (in this directory) and, in backticks, whole lines of those files that meet the clause in brackets. A plan summary named without a colon is supporting prose; its lines are not checked here. `TRACE_COMPLETE=yes` was written only after a check script found every backticked line, as a whole line, in the file named before it (see § The check).

```
TRACE_RELAY_04=[PostHog on, EU host] 188-10-rollout.md: `PLAN_ANALYTICS_PROVIDER=none->posthog` `TD_ANALYTICS_PROVIDER=posthog` `RUN_CONCLUSION=success` 188-11-capture-and-refusals.md: `B03_REGION_PROVEN=eu`; [key from the parameter store] 188-10-rollout.md: `TD_POSTHOG_KEY_SOURCE=parameter` `TD_POSTHOG_KEY_IN_ENVIRONMENT=0` `TD_SECRET_NAMES=PUBLIC_SUPABASE_ANON_KEY,ANALYTICS_POSTHOG_KEY` 188-09-posthog-setup.md: `KEY_PARAMETER_TYPE=SecureString`; [anonymous capture, every presence count 0] 188-09-posthog-setup.md: `PH_ANONYMIZE_IPS=true` `GEOIP_TRANSFORMATION=off` 188-11-capture-and-refusals.md: `CONSENT=accepted` `B03_EVENTS=12` `B03_IP_PRESENT=0` `B03_GEOIP_PRESENT=0` `B03_USER_AGENT_PRESENT=0` `B03_URL_PRESENT=0` `B03_REFERRER_PRESENT=0` `B03_HOST_PRESENT=0` `B03_PERSON_PROFILE_EVENTS=0` `B03_PERSONS=0` `B03_PAGEVIEW_SESSION_ID_PRESENT=0`; [five of five batched] 188-11-capture-and-refusals.md: `B08_STATUS=204` `B08_EVENTS=5`, with the queue's unit tests on the served tree (see 188-20-SUMMARY.md and 188-01-SUMMARY.md); [seven of seven at SIGTERM] 188-10-rollout.md: `TD_STOP_TIMEOUT=40` 188-12-shutdown-flush.md: `B04_POST_EVENTS=7` `B04_TIMER_TICK_IN_WINDOW=no` `B04_STOP_CODE=UserInitiated` `B04_SHUTDOWN_REASON=SIGTERM` `B04_EXIT_CODE=0` `B04_FORWARD_FAILURES=0` `B04_EVENTS=7` `RESTORE_SMOKE_VERDICT_EXIT=0`; [fail-open] 188-14-fail-open.md: `OBS_RUNNING_POSTHOG_HOST=https://posthog.invalid` `B06_SMOKE_VERDICT_EXIT=0` `B06_POST_STATUS=204` `B06_FORWARD_FAILURES_ENOTFOUND=6` `B06_STREAM_LINES_NAMING_A_HOST=0` `B06_HEALTH=200` `B06_POSTHOG_EVENTS=0` `B06_AFTER_RESTORE_EVENTS=1`; [none without rebuild] 188-15-provider-none.md: `OBS_TD_PROVIDER=posthog->none` `B07_DIGEST_UNCHANGED=yes` `B07_REGISTRY_IMAGES_AFTER=5` `B07_NO_NEW_RUN=yes` `B07_PROBE_FINAL=0 (read 15:43:39Z)` `B07_WINDOW_UNDER_NONE_FINAL=0 (15:25:52Z..15:34:40Z, read 15:43:38Z)` `B07_CONTROL_WINDOW_EVENTS=11 (15:03:57Z..15:23:10Z, provider posthog)` `B07_AFTER_RESTORE_EVENTS=1`
TRACE_RELAY_09=[unit and terraform tests] 188-08-local-gates.md: `UNIT_EXIT=0` `TF_MODULE_TEST_EXIT=0` `TF_EXAMPLE_TEST_EXIT=0` 188-06-local-refusals.md: `LOCAL_SCRIPT_EXIT=0` `LOCAL_REFUSED_REQUEST_EVENT_LINES=0` 188-08-closing-e2e.md: `E2E_TREE_SHA=d523abcd51e725b99bd2b277dd9e0781d8ed4834` `E2E_GATE=green`, with the flush interval's 15 cases (see 188-01-SUMMARY.md), the in-flight guard's 3 cases (see 188-20-SUMMARY.md) and the module's 38 runs (see 188-03-SUMMARY.md); [nine refusals on the deployed relay] 188-11-capture-and-refusals.md: `C01_EXIT=0` `c01_cross_site status=403 expected=403 result=PASS` `c01_foreign_origin status=403 expected=403 result=PASS` `c01_declared_33k status=413 expected=413 result=PASS` `c01_chunked_33k status=413 expected=413 result=PASS` `c01_envelope_destination status=400 expected=400 result=PASS` `c01_envelope_host status=400 expected=400 result=PASS` `c01_event_url status=204 expected=204 result=PASS` `c01_event_host status=204 expected=204 result=PASS` `c01_control status=204 expected=204 result=PASS` `c01_summary cases=9 failed=0` `C01_CONTROL_EVENTS=1` `C01_URL_EVENTS=0` `C01_HOST_EVENTS=0` `C01_REFUSED_CASE_EVENTS=0`; [full queue dropping with memory flat] 188-13-full-queue.md: `OBS_RUNNING_FLUSH_INTERVAL=600000` `OBS_RUNNING_CEILING=1` `C02_POSTS=21` `C02_POSTS_204=21` `C02_TIMER_TICK_IN_WINDOW=no` `C02_DROP_LINES=1` `C02_DROPPED=60` `C02_EVENT_LINES_TOTAL=1000` `C02_FORWARD_FAILURES=0` `C02_MEMORY_RISE_POINTS=0.634` `C02_MEMORY_FLAT=yes` `C02_POSTHOG_EVENTS=0`; [WAF off by default, planned on, costed] 188-17-waf-plan.md: `TFVARS_RELAY_RATE_LIMIT=unset` `UNSET_PLAN_EXIT=0` `UNSET_PLAN_LINE=No changes.` `ON_PLAN_EXIT=0` `ON_PLAN_LINE=Plan: 1 to add, 1 to change, 0 to destroy.` `ON_CHANGE=create module.frontend.aws_wafv2_web_acl.relay[0]` `ON_CHANGE=update module.frontend.aws_cloudfront_distribution.this` `ON_DISTRIBUTION_CHANGED=web_acl_id` `ON_ACL_SCOPE=CLOUDFRONT` `ON_RULE_AGGREGATE=IP` `ON_RULE_SCOPE_DOWN=/api/usage` `ON_RULE_RESPONSE=429` `APPLIED=no` `DISTRIBUTION_WEB_ACL_AFTER=none` `DEPLOY_ROLE_WAFV2_ACTIONS=0` `WAF_COST_READ_ON=2026-11-19` `WAF_ACL_USD_MONTH=5.00` `WAF_RULE_USD_MONTH=1.00` `WAF_USD_PER_MILLION=0.60` `WAF_INSPECTED=every request to the distribution` `WAF_COST_ESTIMATE_USD_MONTH=6.00`
TRACE_OBS_09=[decided from the OBS-04 header record: built, keyed on cf-connecting-ip behind Cloudflare] 188-16-hosted-limit.md: `BEHIND_CLOUDFLARE=true` `E06_PREREQUISITE=present`; [pgTAP] 188-04-local-schema.md: `RESET_EXIT=0` `MIGRATIONS_APPLIED=23` `PGTAP_EXIT=0` `EQUIVALENCE_EXIT=0`; [function tests] 188-08-local-gates.md: `UNIT_EXIT=0`, with the 795 account-access tests and the Deno typecheck exit 0 of the code-sign-in deviation (see 188-08-SUMMARY.md and 188-05-SUMMARY.md); [local proof] 188-05-local-limit.md: `LOCAL_200_COUNT=30` `LOCAL_31ST_STATUS=429` `LOCAL_RETRY_AFTER_PRESENT=yes` `LOCAL_OTHER_CALLER_STATUS=200` `LOCAL_NO_HEADER_STATUS=200` `LOCAL_GATEWAY_FORWARDS_HEADER=yes`; [on the hosted project] 188-10-rollout.md: `MIGRATIONS_PUSHED=00023` `drift_status=0` `function=account-access status=ACTIVE verify_jwt=false expected_verify_jwt=false`; [hosted, one caller limited and not another] 188-16-hosted-limit.md: `E06_CS_200=30` `E06_CS_FIRST_429=31` `E06_LIMIT_IN_FORCE=yes` `E06_WS_FIRST_STATUS=200` `E06_SAME_WINDOW=yes` `E06_WS_200=30` `E06_WS_FIRST_429=31` `E06_429_BODY=too-many-requests` `E06_WS_AFTER_WINDOW=200`
TRACE_OBS_11=[method] 188-07-local-dry-run.md: `K6_IMAGE_DIGEST=sha256:d41bb79cd8de5a7ad619b53570e3712633e8bff0937010a5c6c57a4747e7a276` `K6_IMAGE_DIGEST_MATCHES=yes`, with the method beside its script (see infra/scripts/load-check/README.md); [dry run] 188-07-local-dry-run.md: `DRY_RUN_K6_EXIT=0` `DRY_RUN_SUMMARY_PRESENT=yes` `figure_journeys_per_minute=1`; [figure with date and bound] 188-18-load-check.md: `OBS_TD_PROVIDER=posthog->log` `LOAD_STEPS_RUN=2,5,10,20,40` `LOAD_K6_EXIT=0` `LOAD_ABORTED=no` `LOAD_FIGURE_JOURNEYS_PER_MINUTE=40` `LOAD_FIGURE_DATE=2026-11-19` `LOAD_FIGURE_COMMIT=a7003b490b4ff92fc72bef5d225c593b222d6c4e` `LOAD_FIGURE_TASKS=1` `LOAD_FIGURE_TASK_CPU=44.86` `LOAD_BOUND=none-reached` `LOAD_FIGURE_IS_LOWER_BOUND=yes` `JOURNEY_TRACK_EVENTS=false` `RESTORE_PLAN_AFTER_LINE=No changes. Your infrastructure matches the configuration.`
```

### What the trace does not close: the open items, named

Each item below is on the record in its plan's evidence or SUMMARY. None of them is a gap in the four success criteria as observed. Each is something the phase verifier must judge, or a residual carried forward. The four requirements stay unticked in REQUIREMENTS.md; the phase verifier closes them.

1. **`BILLING_OTHER_PRODUCTS=operator-set` overrules A-02.** A-02 asked for every other PostHog product off or at its lowest amount. The operator deliberately left some above their lowest levels (clarification of 2026-11-19, recorded in 188-CONTEXT.md A-02). 188-09 Task 3's verify checks `^BILLING_OTHER_PRODUCTS=(off|lowest)$`, so it exits 1 on this line. The verify was not edited, and the failure stays as recorded. The Product analytics limit is 20 USD (`BILLING_LIMIT=20`), not the "about 10" of A-02. The plan allowed that amount, and it is recorded as given. `BILLING_TEXT=none found`: the billing page says nothing about what happens at the limit.
2. **The red 188-05 targeted run, accepted by the operator.** `tests/e2e-runs/188-05-contestant-identity-provider-20261118T182838Z`: wrapper exit 1, no VOID marker, 2 failed, 375 did not run. The two traces show `net::ERR_NETWORK_CHANGED`. The operator accepted it on 2026-11-19 (deferred-items.md § From 188-05 item 1), and it stays on record as a failure. The same tree ran green in `…-r2-20261118T183748Z`, and both full runs (`188-close-20261118T195528Z`, `188-close2-20261119T071844Z`) are green. Open for the verifier or the operator: whether the wrapper should detect a network change, or the host's cause be found.
3. **The 188-14 override stayed on staging for 57 minutes.** `OVERRIDE_ON_STACK=2026-11-19T14:06Z..2026-11-19T15:03Z`: the host went into clamshell sleep from 14:07:54Z to 14:51:34Z during the stability wait (`OBS_WAIT_STABLE_EXIT=255`, rerun 0). The operator had approved a few minutes. Staging's real events in that window were lost. From then on, every hosted sitting ran under `caffeinate -i` (dispatch operating notes). 188-15 still had two short stretches without their own `caffeinate`, with no sleep in `pmset -g log`.
4. **`analytics.trackEvents` and the voter smoke todo.** `TRACK_EVENTS_NOW=false` (above). It was `true` from 09:30:36Z to 10:59:26Z, for 188-11's consenting journey only. With it on, the deployed voter smoke fails because the consent prompt covers an answer control. That halted 188-12's first run and would turn the pipeline's smoke stage red. The fix is the pending todo `.planning/todos/pending/2026-11-19-deployed-voter-smoke-fails-when-track-events-is-on.md`, owned by a later phase. Until it is fixed, staging cannot run with `trackEvents` on without a red pipeline. The B-03 privacy counts rest on one consenting journey of 12 events (5 consented events and 7 pageviews).
5. **188-18's figure is a lower bound, measured on pageviews only.** `LOAD_BOUND=none-reached` and `LOAD_FIGURE_IS_LOWER_BOUND=yes`: every step met every threshold, and 40 journeys a minute is the step cap set from the hosted project's plan (`SUPABASE_STEP_CAP=40`), not a capacity that was reached. `JOURNEY_TRACK_EVENTS=false`: the recorded journey is a pageview-only browser's. The replay posts a fixed synthetic relay load of 14 one-event batches a journey. The figure does not cover the relay at a consented voter's load. The run ran with provider `log`, as D-03 decided, so PostHog's own ingest was not loaded. The generator received 11.7 GB, about ten times Task 1's estimate, nearly all of it portraits from Supabase storage.
6. **188-17 made more plans than were approved.** It made four plans in all: one unset plan and three rule-on plans (`EXTRA_PLANS=2`). The first rule-on plan exited 1, and its cause is unread because the log was removed before it was read. The second, an identical re-plan made to read the error and not approved as such, exited 0. The operator then approved a third under a new attempt, and that one is the `ON_*` record. None was applied, and no plan file or plan JSON is left. Also open: the CloudFront flat-rate Free plan's request allowance was not re-confirmed from the pages read.
7. **Plan-verify defects found during execution.** Each was recorded, and no verify was edited to pass:
   - **188-18 Task 1:** its verify checks `Array.isArray(j)` on the journey file. Since 188-07 the journey is the object `{base, routeId, locale, requests}`, which the wrapper requires, so the verbatim verify exits 1. The same check on `.requests` exits 0.
   - **188-09 Task 3:** the enum check of item 1 exits 1.
   - **188-03 Task 1:** its verify chains `terraform validate` of the module alone, which fails at HEAD before the plan with `Provider configuration not present`. The module was validated through both roots and its own test (deferred-items.md § From 188-03).
   - **188-12:** the plan measured the tick-free window from `startedAt`, but the queue's timer starts on the task's first `/api/usage` request. The window was re-bounded and is recorded.
   - **188-13:** the plan's "five minutes before" memory window took in the rollout minute (14.99 %), against which the check could not fail. The stricter baseline of the minutes the one task ran alone is the line the verify reads. Both values are recorded.
   - **188-15:** the changed-keys reading carried over from 188-12 printed nothing for the service, because `task_definition` is unknown in `after`. It now reads the union of `before` and `after`.
   - **188-08:** the plan's comparison count of 548 was superseded by the last full run's 729.
   - **188-02:** the planned assertion referenced a module resource from a root test, which Terraform refuses. It reads a module output instead.
   - **188-06:** the plan's dev-server command left the flush interval to the root `.env`. It was set explicitly.
   - **188-18:** the load wrapper `infra/scripts/load-check.sh` has mode 644 and is called through `bash`. The mode in the tree is unchanged.
8. **Smaller residuals carried forward:**
   - The take covers three operations (`check-code`, `request-link`, `request-recovery`). `code-sign-in` is outside it by the operator's ruling of 2026-11-19 (E-03 amended, deferred-items.md § From 188-05 item 2), bounded by the per-code budget and the auth sign-in limit. The shared auth sign-in budget stays a pre-launch risk.
   - The IPv6 /64 keying rests on pgTAP only (`E06_IPV6_NOTE`).
   - A caller with many addresses, callers sharing one address, and deployments not behind Cloudflare are left open in the closed todo.
   - The sequential scan of `invitation_link_request` is the pending todo `2026-11-15-invitation-link-request-sequential-scan.md`.
   - On the deployed relay, the chunked 33 KiB case's 413 may come from the declared-length check, since CloudFront may buffer the body (`C01_CHUNKED_NOTE`). The streaming path rests on the relay's unit tests and the local run.
   - `C02_DROPPED=60`, not the 50 C-02 expected, because the queue also held the 10 pageviews of the smoke run. 1060 offered less the cap of 1000 is 60.
   - The duplicate `distinct_id` placement stays (`B03_DISTINCT_ID_PLACEMENT=top-level`, CONTEXT deferred).

### The check

One node script in the session scratch directory (`188-19/trace-check.mjs`) read each `TRACE_` line of this file. In order, it took every `<file>.md:` token as the current file under this directory and checked every backticked span after it as a whole line of that file, the same test as `grep -qxF`. It exited 0. A negative control ran first: a copy of this file with `B03_PERSONS=0` changed to `1` and one file name changed to a file that does not exist. The script exited 1 on it and named all 4 misses. The plan's Task 1 `<verify>` was run verbatim after these lines were written.

```
TRACE_RELAY_04_LINES=48
TRACE_RELAY_04_FILES=6
TRACE_RELAY_09_LINES=55
TRACE_RELAY_09_FILES=6
TRACE_OBS_09_LINES=25
TRACE_OBS_09_FILES=5
TRACE_OBS_11_LINES=18
TRACE_OBS_11_FILES=2
TRACE_LINES_CHECKED=146
TRACE_LINES_MISSING=0
TRACE_CHECK_NEGATIVE_CONTROL_EXIT=1
TRACE_PRIVACY_ZERO_COUNTS=present
TRACE_COMPLETE=yes
```

- **`TRACE_PRIVACY_ZERO_COUNTS=present`.** This plan's prohibition requires plan 188-11's zero counts before the phase closes. All nine are among the checked lines: `B03_IP_PRESENT=0`, `B03_GEOIP_PRESENT=0`, `B03_USER_AGENT_PRESENT=0`, `B03_URL_PRESENT=0`, `B03_REFERRER_PRESENT=0`, `B03_HOST_PRESENT=0`, `B03_PERSON_PROFILE_EVENTS=0`, `B03_PERSONS=0` and `B03_PAGEVIEW_SESSION_ID_PRESENT=0`. They are counts over one consenting journey (item 4 above).

## Task 2 — The operator's answer (2026-11-19)

The orchestrator opened attempt `20261119T182037Z.9ce39a692` of key `188-19-2` and stored the reply. Before Task 3 the plan executor read `bash "$A" bound 188-19-2 OPERATOR_REPLY plan=188-19 task=2` (exit 0) and `bash "$A" has 188-19-2` for each answer: `^answer_attempt=20261119T182037Z.9ce39a692$`, `^answer_read_item=revoked$`, `^answer_settled_on=2026-11-19$` and `^answer_final_plan=approve$`, each exit 0.

```
ATTEMPT=20261119T182037Z.9ce39a692
ANSWER_READ_ITEM=revoked
ANSWER_SETTLED_ON=2026-11-19
ANSWER_FINAL_PLAN=approve
```

## Task 3 — The final plan reads no change, and the key's fate on record (2026-11-19)

Recorded 2026-11-19 (UTC) by the continuation executor of plan 188-19, 18:30:41Z to 18:31:09Z, from HEAD `9ce39a692`. One script ran under `caffeinate -i`, and `pmset -g log` has no sleep or wake entry in that window. It used `AWS_PROFILE=openvaa-admin` after the account check (exit 0, account match). `TF_VAR_alert_email` was checked with `test -n` only (exit 0), and no `TF_VAR_relay_rate_limit`, `TF_VAR_environment_overrides` or `TF_VAR_image_digest` was in its environment (count 0). `TF_DATA_DIR` was a fresh directory under the session scratch directory, against the root's S3 backend, and was removed afterwards, so the operator's `.terraform/` was not touched. The plan was saved under a mode-700 `mktemp -d` directory, read, and removed with that directory. No plan output is copied here, and nothing was applied. Each status was read on its own line.

```
FINAL_PRE_PLAN_ACTIVE_RUNS=0
FINAL_SSO_REFRESH_INIT_EXIT=0
FINAL_SSO_REFRESH_STS_EXIT=0
FINAL_PLAN_DIGEST=sha256:e35bde282307277ea7be9aed008b2bc5a31c0a27ff2738b9153e09bf1412182a
FINAL_PLAN_VARS=image_digest only
FINAL_PLAN_AT=2026-11-19T18:30:51Z..2026-11-19T18:30:58Z
FINAL_PLAN_EXIT=0
FINAL_PLAN_LINE=No changes.
FINAL_PLAN_LINE_FULL=No changes. Your infrastructure matches the configuration.
FINAL_PLAN_JSON_RESOURCE_CHANGES=0
FINAL_PLAN_JSON_OUTPUT_CHANGES=0
FINAL_PLAN_REMOVED=yes
FINAL_PLAN_FILES_LEFT=0
FINAL_APPLIED=no
READ_KEY=revoked
READ_KEY_SETTLED_ON=2026-11-19
READ_KEY_KEYCHAIN_ITEM=absent
READ_KEY_POSTHOG_SIDE=revoked by the operator's answer
PHASE_188_DEPLOYED_HALF=complete
```

- **`FINAL_PRE_PLAN_ACTIVE_RUNS=0`.** The status-filtered counts of `actions/runs` for `queued`, `in_progress`, `waiting`, `requested` and `pending` sum to 0, and each GET exited 0. They were read in the same script, right before the plan.
- **The SSO refresh.** `terraform init -input=false -lockfile=readonly` of `infra/envs/staging/aws` exited 0, so the S3 backend refreshed the session. `aws sts get-caller-identity` after it exited 0.
- **`FINAL_PLAN_DIGEST=`.** `infra/scripts/running-image-digest.sh --cluster openvaa-staging --service openvaa-staging-frontend` exited 0. The digest is `FINAL_DIGEST=` of Task 1 and `BUILD_DIGEST=` of 188-10. It was the plan's only `-var`.
- **`FINAL_PLAN_EXIT=0`, `FINAL_PLAN_LINE=No changes.`.** `terraform plan -input=false -detailed-exitcode -var "image_digest=$DIGEST" -out <dir>/final.tfplan` exited 0. With `-detailed-exitcode`, 0 means no changes and 2 would mean changes. The first summary line of its output is `No changes. Your infrastructure matches the configuration.` A second reading agrees: `terraform show -json` of the saved plan (exit 0), read with `jq`, counts 0 resource changes other than `no-op` or `read` and 0 output changes. So nothing of the phase's hand work remains on the stack, and staging is as its tfvars say.
- **`FINAL_PLAN_REMOVED=yes`, `FINAL_PLAN_FILES_LEFT=0`.** The plan file, its JSON, the plan and init logs, and the data directory were deleted. A `find` of the session scratch directory and of `$TMPDIR` for `*.tfplan` and the plan JSON finds none from this plan. A wider search for `tfplan*` and `*plan*.json` finds only files from other work, none of them from phase 188: PR-review `merge-plan.json` files, and `openvaa-bootstrap.T5fcmB/s9a-plan.json`, a Terraform plan JSON of 2026-11-16 (phase 187). They were left in place, and the last is reported to the orchestrator. One empty `openvaa-aws.*` directory of 2026-11-18 is also left, not from this plan.
- **`READ_KEY=revoked`, `READ_KEY_SETTLED_ON=2026-11-19`.** The operator answered `answer_read_item=revoked` on 2026-11-19. The local half: the orchestrator read `security find-generic-password -s openvaa-staging-posthog-read`, which exited 44 (item not found), and the executor read it again here, also exit 44, so `READ_KEY_KEYCHAIN_ITEM=absent`. The PostHog side, the personal `phx_` key scoped to project 347462 that replaced the `phs_` key in 188-09, rests on the operator's answer. Nothing here can read PostHog's key list without a key. Phase 189 needs a new read key if it is to read events. Research open question 3 is settled.
- **`PHASE_188_DEPLOYED_HALF=complete`.** Staging ends the phase as its tfvars say:
  - PostHog is on (B-01);
  - no hand state is left (A-03);
  - no web ACL (C-04);
  - every success criterion is traced (Task 1);
  - the read key is settled.

  The four requirements stay unticked in REQUIREMENTS.md until the phase verifier closes them, with the open items of Task 1.
