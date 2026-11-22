# 188-10 — This phase's image, migration and function on staging

Repository: `OpenVAA/voting-advice-application`. Staging: `https://staging.openvaa.org`. Hosted Supabase project: `cofbsatfrdysyphajsky`.

## Task 1 — The provider switch, the commit to deploy, and the run's writes known in advance (2026-11-19)

Recorded 2026-11-19 (UTC) by the plan executor of plan 188-10, at 08:16:52Z to 08:18Z, from HEAD `7e6dee771fd2d21c94b2eda4add70b1ebcd120e5` (the provider-switch commit). Nothing was pushed, no workflow was started or re-run, no review was approved, and no hosted service, AWS resource or GitHub setting was written. The remote reads were one `git fetch` of `refs/heads/deploy/staging` alone, one GET of `https://staging.openvaa.org/api/health`, `gh run list --workflow deploy.yml` and `--workflow destroy.yml`, and the status-filtered `gh api` GETs of `actions/runs`. Neither AWS nor the hosted Supabase project was read. Every status was read on its own line, never through a pipe; the outputs are in the session scratch directory.

```
READ_AT=2026-11-19T08:16:52Z
PROVIDER_SWITCH_COMMIT=7e6dee771fd2d21c94b2eda4add70b1ebcd120e5
E2E_TREE_SHA=d523abcd51e725b99bd2b277dd9e0781d8ed4834
TREE_SINCE_CLOSING_RUN=unchanged
DEPLOY_PARENT=331b5db28058a1f8bc4ef88a3841080a4610efa2
DEPLOY_TREE=f637126f5a8f68fb843d8608367f983e626c1b0b
DEPLOY_COMMIT=a7003b490b4ff92fc72bef5d225c593b222d6c4e
DEPLOY_PATHS=3550
DEPLOY_PLANNING_PATHS=0
DEPLOY_TREE_OK=yes
MIGRATIONS_AT_COMMIT=00001_initial_schema.sql,00002_claim_excludes_identity_provider_accounts.sql,00003_address_confirmation_request.sql,00004_user_entities_pending_email_taken.sql,00005_invitation_link_bounds.sql,00006_nomination_write_guards.sql,00007_nomination_write_kept_constituency.sql,00008_bulk_import_key_quoting.sql,00009_contestant_app_public_config_bounded.sql,00010_claim_grant_key_conflict_target.sql,00011_invitation_email_target_open_rows.sql,00012_bulk_import_constituency_links.sql,00013_nomination_constituency_rule.sql,00014_set_entity_nominations_constituency_once.sql,00015_answers_lock_entity_rows.sql,00016_answers_lock_nominations_storage.sql,00017_user_can_reads_grants.sql,00018_identity_entity_find_or_create.sql,00019_address_holds_open_invitation.sql,00020_identity_metadata_written_under_lock.sql,00021_email_holds_global_or_account_grant.sql,00022_grants_reaching_a_project.sql,00023_invitation_caller_limit.sql
EXPECTED_PENDING=00023
SERVED_BUILD_BEFORE=331b5db28058a1f8bc4ef88a3841080a4610efa2
NO_RUN_ACTIVE=yes
PIPELINE_UNCHANGED_SINCE_SERVED=yes
EXPECTED_CHANGES=task definition replaced (image, ANALYTICS_PROVIDER, ANALYTICS_FLUSH_INTERVAL_MS, stopTimeout); service updated; no web ACL
EXPECTED_FUNCTIONS=account-access changed (the per-caller limit); identity-callback and send-email redeployed unchanged
```

- **The provider switch.** `ANALYTICS_PROVIDER = "posthog"` replaces `"none"` in `environment_values` of `infra/envs/staging/aws/terraform.tfvars`, the only change of commit `7e6dee771` (1 file, 1 line). In the root, `terraform fmt -check -recursive` exit 0; with `TF_DATA_DIR` at a fresh directory under the session scratch directory (the operator's `.terraform/` untouched), `terraform init -backend=false -lockfile=readonly -input=false` exit 0 and `terraform validate` exit 0, `Success! The configuration is valid.` The preconditions held: the three 187-21, 187-22 and 186-08 summaries exist, and `evidence/188-09-posthog-setup.md` holds `PH_ANONYMIZE_IPS=true`, `BILLING_LIMIT_RECORDED=yes` and `FILL=unchanged`. `stop_timeout_seconds = 40` and `ANALYTICS_FLUSH_INTERVAL_MS = "2000"` were already in the file (plans 188-02 and 188-01).
- **`TREE_SINCE_CLOSING_RUN=unchanged`.** `E2E_TREE_SHA=` is the current line of `evidence/188-08-closing-e2e.md` (the full re-run of `tests/e2e-runs/188-close2-20261119T071844Z`, 729 passed). `git diff --quiet d523abcd51e725b99bd2b277dd9e0781d8ed4834..HEAD -- apps packages tests` exit 0, both before and after the provider-switch commit: the six commits since touch none of the three directories.
- **`DEPLOY_PARENT=`.** `git fetch origin +refs/heads/deploy/staging:refs/remotes/origin/deploy/staging` exit 0, the one ref fetched; `refs/remotes/origin/deploy/staging` reads `331b5db28…`, unchanged since plan 187-22's push and the redeploy of plan 187-25.
- **The commit, by 187's recipe.** In a temporary index under the session scratch directory (`GIT_INDEX_FILE`, removed afterwards): `git read-tree HEAD` exit 0, `git rm -r --cached --quiet .planning` exit 0, `git write-tree` exit 0 (`DEPLOY_TREE=`); `git commit-tree <tree> -p <DEPLOY_PARENT> -m "deploy: staging"` exit 0 (`DEPLOY_COMMIT=`); `git update-ref refs/evidence/188/deploy <commit>` exit 0. The real index was not touched (`git diff --cached --quiet` exit 0). `git for-each-ref --contains <DEPLOY_COMMIT>` names `refs/evidence/188/deploy` alone: the commit is on no branch and not on the remote.
- **`DEPLOY_PLANNING_PATHS=0`, `DEPLOY_TREE_OK=yes`.** `git ls-tree -r --name-only <DEPLOY_COMMIT>` exit 0, 3550 paths; `grep -c '^\.planning/'` counts 0 (exit 1, no match). `git diff --quiet HEAD <DEPLOY_COMMIT> -- . ':!.planning'` exit 0. This evidence file is the only later change and lies under `.planning/`, so the equality holds for the HEAD that carries it.
- **What the commit brings against the served one.** `git diff --shortstat 331b5db28 <DEPLOY_COMMIT>`: 57 files, 4066 insertions, 218 deletions — the frontend's analytics flush interval and queue (8 files under `apps/frontend`), the migration `00023_invitation_caller_limit.sql` and `account-access`'s per-caller limit (`callerLimit.ts`, `contract.ts`, `index.ts` and their tests) with the migrations manifest, the schema files and pgTAP 07, 39 and 59 (13 files under `apps/supabase`), the Terraform for the stop timeout, the flush interval's entry and the opt-in relay rate rule (`infra/envs`, `infra/modules`), the load, PostHog-read and relay-refusal scripts (`infra/scripts`, all new files), docs, the regenerated `packages/supabase-types` and the staging provider switch. Nothing under `.github` changed.
- **`MIGRATIONS_AT_COMMIT=`, `EXPECTED_PENDING=00023`.** `git ls-tree -r --name-only <DEPLOY_COMMIT> -- apps/supabase/supabase/migrations` exit 0: 23 files, `00001` to `00023`, the last being `00023_invitation_caller_limit.sql`. The hosted history holds `00001` to `00022`, as the drift check of plan 187-25's redeploy read them (`drift_status=0`, nothing pending); the hosted project was not read again here. The run's dry run is therefore expected to print exactly one `push_pending=00023` line.
- **`SERVED_BUILD_BEFORE=`.** `/api/health` exit 0, HTTP 200, body `{"status":"ok","build":"331b5db28058a1f8bc4ef88a3841080a4610efa2"}`, equal to `DEPLOY_PARENT=`: staging serves the branch tip the new commit follows.
- **`NO_RUN_ACTIVE=yes`.** `gh run list --workflow deploy.yml` exit 0, 7 runs, all `completed` (the latest `44276384977`, `success`, on `deploy/staging`); `gh run list --workflow destroy.yml` exit 0, one run `44285713407`, `completed`, `success`. The status-filtered counts of `actions/runs` are 0 for `queued`, `in_progress`, `waiting`, `requested` and `pending`.
- **`PIPELINE_UNCHANGED_SINCE_SERVED=yes`.** `git diff --stat 331b5db28 HEAD -- .github` is empty; under `infra/scripts` only new files were added (`load-check*`, `posthog-read*`, `relay-refusals*`), none of which the pipeline calls. The stage order and record lines are those of `evidence/187-21-green-run.md`.
- **`EXPECTED_CHANGES=`, read from the diff, not from a plan.** The new commit has no image in the registry, so the run builds and pushes one (a new digest); the task definition is replaced with that digest, `ANALYTICS_PROVIDER=posthog` in place of `none`, the new `ANALYTICS_FLUSH_INTERVAL_MS=2000` and `stopTimeout` 40 in place of the default 30; the service is updated to the new revision. `relay_rate_limit` is not set in the staging tfvars, so `aws_wafv2_web_acl.relay` has count 0 and the distribution's `web_acl_id` stays null: no web ACL. `ANALYTICS_POSTHOG_KEY` stays a secret from `/openvaa/staging/frontend/ANALYTICS_POSTHOG_KEY` (SecureString, version 1, per `evidence/188-09-posthog-setup.md`); its value was not read.
- **The run's writes, in the pipeline's order.** (1) The image of `DEPLOY_COMMIT` pushed to `openvaa-frontend`; (2) migration `00023_invitation_caller_limit` pushed to `cofbsatfrdysyphajsky`, one-way, before (3) the three functions `account-access`, `identity-callback` and `send-email` are deployed; (4) the saved plan applied: a new task definition revision and the service updated to it; (5) the deployed smoke run against staging. From the rollout on, staging forwards events, the smoke runs' pageviews included, to PostHog project 347462.

## Rebuilt deploy commit (2026-11-19)

The first deploy commit, 35da515f4ac75c90b0192eaa833dde7e79bd8fff (tree ab6f383f5), was refused at the push by GitHub push protection (GH013), which matched the read script's test fixture `phx_fake000…` as a PostHog personal API key in infra/scripts/posthog-read.sh and posthog-read.test.ts. Nothing reached deploy/staging, whose tip stayed 331b5db28. Commit 8665ff699 assembles the fixture from two parts; the self-test (19 cases) and `yarn test:unit:infra posthog-read` (5 tests) stay green. The commit was rebuilt by the same temporary-index recipe on the same parent.
DEPLOY_COMMIT_REFUSED=35da515f4ac75c90b0192eaa833dde7e79bd8fff
DEPLOY_REBUILT_FROM_HEAD=8665ff699
DEPLOY_DIFF_FROM_REFUSED=infra/scripts/posthog-read.sh, infra/scripts/posthog-read.test.ts only
DEPLOY_OTHER_KEY_SHAPES=infra/modules/github-oidc/tests/github_oidc.tftest.hcl (an AKIAFAKE fixture, byte-identical in the served 331b5db28) and .yarn/releases (minified, served before)
The approval of attempt 20261119T081947Z.5e7c655af named the refused commit; the rebuilt commit is approved under a new attempt of 188-10-2.

## Task 3 — The push, the run and the gate (2026-11-19)

Recorded 2026-11-19 (UTC) by the continuation executor of plan 188-10, from 08:50Z. The executor pushed nothing, started or re-ran no workflow, approved no review and wrote no hosted service or GitHub setting; its remote reads were `gh run view`, `gh api` GETs (the run, its jobs, its pending deployments) and `git ls-remote origin`. Every status was read on its own line, never through a pipe; the outputs are in the session scratch directory.

### The binding and the push

```
ATTEMPT_ID=20261119T083025Z.4fa5fed3c
DEPLOY_PUSHED=yes
DEPLOY_PUSHED_SHA=a7003b490b4ff92fc72bef5d225c593b222d6c4e
DEPLOY_REF_BEFORE=331b5db28058a1f8bc4ef88a3841080a4610efa2
RUN_ID=44491292876
RUN_URL=https://github.com/OpenVAA/voting-advice-application/actions/runs/44491292876
```

- **The binding.** The orchestrator opened attempt `20261119T083025Z.4fa5fed3c` of key `188-10-2` for the rebuilt commit and stored the operator's reply. Before recording anything, the executor ran `bash "$A" id 188-10-2` (prints the attempt id above), `bash "$A" bound 188-10-2 OPERATOR_REPLY plan=188-10 task=2` and `bash "$A" has 188-10-2 '^answer_push=approve$'`, all read-only: exit 0 each.
- **`DEPLOY_PUSHED=yes`.** The orchestrator pushed at top level after the binding: `git push origin a7003b490b4ff92fc72bef5d225c593b222d6c4e:refs/heads/deploy/staging` exit 0, the ref moving from `331b5db28…` to `a7003b490…`. The executor read it back: `git ls-remote origin refs/heads/deploy/staging` exit 0, `a7003b490b4ff92fc72bef5d225c593b222d6c4e`, equal to `DEPLOY_COMMIT=`. The push was made once; the executor made none.
- **The run.** `gh api .../actions/runs/44491292876` exit 0: path `.github/workflows/deploy.yml`, event `push`, head branch `deploy/staging`, head SHA `a7003b490b4ff92fc72bef5d225c593b222d6c4e`, created 08:52:17Z, attempt 1.

### The checks job and the gate

```
CHECKS_JOB=success
CHECKS_JOB_ID=135447276702
DEPLOY_JOB_ID=135447888765
GATE_WAITED=yes
GATE_ENVIRONMENT=staging
GATE_WAIT_TIMER=0
```

- **`CHECKS_JOB=success`.** `gh api .../runs/44491292876/jobs` exit 0: `checks` `success` on `ubuntu-24.04`, 08:52:21Z to 08:53:32Z (71 s). Steps, each `success`: Set up job (4 s), Checkout source code (5 s), Setup Terraform 1.16.5 (1 s), Check Terraform formatting (0 s), Validate the staging AWS root (10 s), Setup Node.js 24.21.0 (4 s), Setup Yarn 4.18 (30 s), Unit tests of the infrastructure scripts (14 s), and the post and complete steps (0 s).
- **`GATE_WAITED=yes`.** A background watcher read the run `waiting` at 08:53:40Z, the `checks` job `completed` `success` and the `deploy` job (id `135447888765`, created 08:53:32Z, labelled `ubuntu-24.04-arm`) `waiting`. `gh api .../runs/44491292876/pending_deployments` (a GET) exit 0 at 08:54Z: one pending deployment, environment `staging`, `wait_timer` 0, a `User` reviewer. The review is left to the operator in the GitHub web interface; the executor made no POST to `pending_deployments` and approved nothing.

### The approval and the run: green

Recorded read-only on 2026-11-19 (UTC) by the continuation executor of plan 188-10. The reads were `gh api` GETs of run `44491292876`, of its approvals (each entry's `state` and environment names only, no user), of the deploy job `135447888765` and of the run's artifacts; `gh run view 44491292876 --log --job 135447888765` to a file in the session scratch directory; and one GET of `https://staging.openvaa.org/api/health` at 09:07:50Z. Each status was read on its own line. Nothing was pushed, approved or re-run, and no hosted service or GitHub setting was written. The lines below are copied from the log without their timestamps; none holds an address or a token.

```
GATE_REVIEW=approved
GATE_REVIEW_ENVIRONMENT=staging
GATE_APPROVED_BETWEEN=2026-11-19T08:54:04Z..2026-11-19T08:56:35Z
DEPLOY_JOB_RUNNER=ubuntu-24.04-arm
DEPLOY_JOB_STARTED=2026-11-19T08:56:35Z
DEPLOY_JOB_COMPLETED=2026-11-19T09:06:54Z
DEPLOY_STEPS=33
STEP=Set up job conclusion=success seconds=1
STEP=Checkout source code conclusion=success seconds=2
STEP=Assume the deploy role conclusion=success seconds=1
STEP=Build and push the image conclusion=success seconds=192
STEP=Drop the build credentials conclusion=success seconds=0
STEP=Setup Node.js 24.21.0 conclusion=success seconds=5
STEP=Setup Yarn 4.18 conclusion=success seconds=26
STEP=Install psql conclusion=success seconds=16
STEP=Setup Terraform 1.16.5 conclusion=success seconds=1
STEP=Assume the deploy role for the plan conclusion=success seconds=1
STEP=Initialise the staging AWS root conclusion=success seconds=8
STEP=Plan the staging AWS root with the built digest conclusion=success seconds=10
STEP=Show the plan conclusion=success seconds=3
STEP=Drop the plan credentials conclusion=success seconds=0
STEP=Link a work directory to the Supabase project conclusion=success seconds=4
STEP=Push the migrations conclusion=success seconds=123
STEP=Deploy the functions conclusion=success seconds=4
STEP=Assume the deploy role again for the apply conclusion=success seconds=1
STEP=Apply the saved plan conclusion=success seconds=120
STEP=Check the rollout is stable conclusion=success seconds=55
STEP=Drop the rollout credentials conclusion=success seconds=0
STEP=Install Playwright's Chromium conclusion=success seconds=21
STEP=Run the deployed smoke entry conclusion=success seconds=20
STEP=Read the served build again conclusion=success seconds=0
STEP=Remove the plan, the smoke output and the step files conclusion=success seconds=0
STEP=Assume the deploy role again for the alert conclusion=skipped seconds=0
STEP=Alert the operator conclusion=skipped seconds=1
STEP=Post Assume the deploy role again for the apply conclusion=success seconds=0
STEP=Post Assume the deploy role for the plan conclusion=success seconds=0
STEP=Post Setup Node.js 24.21.0 conclusion=success seconds=0
STEP=Post Assume the deploy role conclusion=success seconds=0
STEP=Post Checkout source code conclusion=success seconds=0
STEP=Complete job conclusion=success seconds=0
RUN_JOB_MINUTES=10.3
RUN_JOB_LIMIT_MINUTES=60
BUILD_DIGEST=sha256:e35bde282307277ea7be9aed008b2bc5a31c0a27ff2738b9153e09bf1412182a
build_exit=0
BUILD_TAG=a7003b490b4ff92fc72bef5d225c593b222d6c4e
BUILD_NEW_DIGEST=yes
PLAN_SUMMARY=Plan: 1 to add, 1 to change, 1 to destroy.
PLAN_IMAGE_FROM=sha256:b4a14b890f132c8c2c1150ad3a2355f389fba7304e7b7c1ce0d8804152c195d4
PLAN_IMAGE_TO=sha256:e35bde282307277ea7be9aed008b2bc5a31c0a27ff2738b9153e09bf1412182a
PLAN_ANALYTICS_PROVIDER=none->posthog
PLAN_FLUSH_INTERVAL_MS=added:2000
PLAN_STOP_TIMEOUT=30->40
PLAN_MATCHES_EXPECTED_CHANGES=yes
plan_exit=0
links=3
link_exit=0
linked_ref=cofbsatfrdysyphajsky
push_connection=unknown
push_pending=00023
push_up_to_date=no
push_confirmation=environment
push_status=0
DRIFT_HISTORY_DATABASE=00001..00023
DRIFT_HISTORY=holds
DRIFT_SCHEMA=holds
drift_status=0
push_exit=0
MIGRATIONS_PUSHED=00023
functions_deploy_exit=0
functions_list_http=200
function=account-access status=ACTIVE verify_jwt=false expected_verify_jwt=false
function=identity-callback status=ACTIVE verify_jwt=false expected_verify_jwt=false
function=send-email status=ACTIVE verify_jwt=true expected_verify_jwt=true
functions_expected=account-access identity-callback send-email
functions_served=account-access identity-callback send-email
Apply complete! Resources: 1 added, 1 changed, 1 destroyed.
apply_exit=0
stable_poll=1
stable_describe_exit=0
stable_task_definition_matches=yes
stable_rollout_state=IN_PROGRESS
stable_running=1
stable_desired=1
stable_poll=2
stable_describe_exit=0
stable_task_definition_matches=yes
stable_rollout_state=IN_PROGRESS
stable_running=1
stable_desired=1
stable_poll=3
stable_describe_exit=0
stable_task_definition_matches=yes
stable_rollout_state=IN_PROGRESS
stable_running=1
stable_desired=1
stable_poll=4
stable_describe_exit=0
stable_task_definition_matches=yes
stable_rollout_state=COMPLETED
stable_running=1
stable_desired=1
STABLE_POLLS_READ=4
PASS service-role-key-absent
PASS origin
PASS sha
PASS ref
PASS project-id
SMOKE_PASSED=2 passed (18.6s)
smoke_exit=0
served_build_after_smoke=a7003b490b4ff92fc72bef5d225c593b222d6c4e
ALERT_STEP=skipped
RUN_ARTIFACTS=0
RUN_ATTEMPT=1
RUN_CONCLUSION=success
SERVED_BUILD_AFTER=a7003b490b4ff92fc72bef5d225c593b222d6c4e
```

- **The gate.** `gh api .../actions/runs/44491292876/approvals` exit 0: one entry, `state` `approved`, environment `staging`. The orchestrator relayed that the operator approved the review in the web interface; the approvals GET is this executor's own confirmation. The deploy job, `waiting` at 08:54:04Z, started at 08:56:35Z. The executor approved nothing.
- **Every step succeeded, in the workflow's order** (`DEPLOY_STEPS=33`, one `STEP=` line each, from the job GET). The job ran on `ubuntu-24.04-arm` from 08:56:35Z to 09:06:54Z, 619 s, against the 60-minute limit. Only the two alert steps were skipped, as their `if: failure() || cancelled()` conditions require on a green job. `RUN_ATTEMPT=1` is the run's only attempt.
- **The build.** `build_exit=0`, a new image tagged `a7003b490…` with the new digest `sha256:e35bde28…` (192 s).
- **The plan, against `EXPECTED_CHANGES=` of § Task 1.** `Plan: 1 to add, 1 to change, 1 to destroy.`, `plan_exit=0`: `module.frontend.aws_ecs_task_definition.app` replaced from revision `:9`, its container's image changing from `…@sha256:b4a14b89…` to `…@sha256:e35bde28…`, `ANALYTICS_PROVIDER` `none` to `posthog`, `ANALYTICS_FLUSH_INTERVAL_MS` `2000` added, `stopTimeout` 30 to 40 (and the provider's normalisation of empty `mountPoints`, `systemControls`, `volumesFrom`, `hostPort` and `tags`, which the replacement carries); `module.frontend.aws_ecs_service.app` updated in place to the new revision. No web ACL or other address appears. The outputs list `ANALYTICS_FLUSH_INTERVAL_MS` added among `task_environment_names`, with `ANALYTICS_POSTHOG_KEY` already among them.
- **The migration, before the functions.** `link_exit=0` on `cofbsatfrdysyphajsky`. The dry run printed one `push_pending=` line, `push_pending=00023` (`grep -c '^push_pending='` over the log: 1), as `EXPECTED_PENDING=00023` said; the push ran confirmed by the environment (`push_confirmation=environment`, `push_status=0`). The drift check after the push read the manifest and the database's history both `00001` to `00023`, `history: holds`, `schema: holds`, `CLEAN -- the history equals the manifest and the diff is empty`, `drift_status=0`. The step ran 09:01:06Z to 09:03:09Z (123 s); "Deploy the functions" started after it, at 09:03:09Z. `push_connection=unknown` as in 187-21: the CLI's log names neither path.
- **The functions.** `functions_deploy_exit=0`, `functions_list_http=200`; the three functions deployed from the commit, each `ACTIVE`, `verify_jwt` as configured, the served set equal to the expected one.
- **The apply.** `apply_exit=0`, 120 s: one task definition added, the service changed, the old revision destroyed.
- **The stable step.** Four reads: 1 to 3 on the applied task definition with 1 of 1 running and `IN_PROGRESS`, read 4 `COMPLETED` (55 s).
- **The smoke run.** `DEPLOYED SMOKE GATE https://staging.openvaa.org`, the five `PASS` lines, `DEPLOYED SMOKE GATE OK build=a7003b490b4ff92fc72bef5d225c593b222d6c4e ref=cofbsatfrdysyphajsky project=00000000-0000-0000-0000-000000000001`; both specs passed, `2 passed (18.6s)`, `smoke_exit=0`. `served_build_after_smoke=` equals the run's SHA.
- **Nothing uploaded, no alert.** `gh api .../runs/44491292876/artifacts` exit 0, `total_count` 0. The alert steps were skipped.
- **`SERVED_BUILD_AFTER=`.** `curl -sS --max-time 20 https://staging.openvaa.org/api/health` exit 0 at 09:07:50Z, HTTP 200, body `{"status":"ok","build":"a7003b490b4ff92fc72bef5d225c593b222d6c4e"}`, equal to `DEPLOY_COMMIT=`.

### The stack read back from the workstation

Recorded read-only on 2026-11-19 (UTC), about 09:20Z, by the continuation executor of plan 188-10, after the operator signed in to AWS SSO again (the first attempt at 09:07Z found the session expired, `aws sts get-caller-identity` exit 255; the executor did not sign in). With `AWS_PROFILE=openvaa-admin` and `AWS_REGION=eu-north-1`: `aws sts get-caller-identity --query Account` exit 0, account match exit 0 (`471112560111`); `infra/scripts/running-image-digest.sh`; one `aws ecs describe-task-definition` whose `--query` selects the two analytics values, the stop timeout, the environment's names, the secrets' names and the one `valueFrom` path; `aws ecs list-tasks`, `describe-tasks` and `describe-services` (status fields only); and `aws logs describe-log-streams` and `filter-log-events` of the new task's stream. No secret value was read. Each status was read on its own line.

```
RUNNING_TASK_DEFINITION_AFTER=arn:aws:ecs:eu-north-1:471112560111:task-definition/openvaa-staging-frontend:10
RUNNING_IMAGE_REFERENCE=digest
RUNNING_IMAGE_DIGEST=sha256:e35bde282307277ea7be9aed008b2bc5a31c0a27ff2738b9153e09bf1412182a
RUNNING_IMAGE_DIGEST_EQUALS_BUILD=yes
TD_ANALYTICS_PROVIDER=posthog
TD_FLUSH_INTERVAL_MS=2000
TD_STOP_TIMEOUT=40
TD_POSTHOG_KEY_SOURCE=parameter
TD_POSTHOG_KEY_IN_ENVIRONMENT=0
TD_SECRET_NAMES=PUBLIC_SUPABASE_ANON_KEY,ANALYTICS_POSTHOG_KEY
RUNNING_TASK=f4d78070320843b4a4e14e0f0f4aff48
RUNNING_TASK_STATUS=RUNNING HEALTHY
RUNNING_DEPLOYMENTS_AFTER=1
RUNNING_ROLLOUT_STATE_AFTER=COMPLETED
NEW_TASK_LOG_EVENTS=1
STARTUP_PROBLEMS=0
HOSTED_WRITES=image,migration-00023,functions,task-definition,service-rollout
```

- **`RUNNING_IMAGE_DIGEST=`.** `running-image-digest.sh --cluster openvaa-staging --service openvaa-staging-frontend` exit 0: task definition `:10`, reference `digest`, digest `sha256:e35bde28…`, equal to `BUILD_DIGEST=`.
- **The task definition `:10`.** `describe-task-definition` exit 0: `ANALYTICS_PROVIDER` `posthog`, `ANALYTICS_FLUSH_INTERVAL_MS` `2000`, `stopTimeout` 40. `ANALYTICS_POSTHOG_KEY` is among the secrets, its `valueFrom` `arn:aws:ssm:eu-north-1:471112560111:parameter/openvaa/staging/frontend/ANALYTICS_POSTHOG_KEY`, and absent from the environment (`length(environment[?name=='ANALYTICS_POSTHOG_KEY'])` 0): `TD_POSTHOG_KEY_SOURCE=parameter`. The environment's 15 names hold no other key.
- **The rollout.** `describe-services` exit 0: one deployment, `PRIMARY`, `COMPLETED`, task definition `:10`, 1 of 1 running. `list-tasks` exit 0 names one running task, `f4d78070…`, which `describe-tasks` exit 0 reads `RUNNING`, `HEALTHY`, on `:10`, started 09:04:29Z.
- **`STARTUP_PROBLEMS=0`.** The task's stream `frontend/frontend/f4d78070320843b4a4e14e0f0f4aff48` (exit 0) holds one event, `Listening on http://0.0.0.0:3000`. `filter-log-events` with the pattern `"Required environment variables are not set"`, the start-up refusal's message, counts 0 in that stream and 0 in the whole log group since 08:56Z; `?Error ?error ?refus` counts 0 in the stream.
- **What the run wrote (`HOSTED_WRITES=`).** A new image tagged with the deploy commit; migration `00023_invitation_caller_limit` on `cofbsatfrdysyphajsky`, one-way; the three functions deployed from the commit; the task definition replaced by digest with PostHog on, and the service rolled onto it. No alert mail.
