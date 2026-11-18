# 187-21 evidence: the first green pipeline deploy

## Task 1: readiness, read-only (2026-11-17)

The lines of this section were superseded on 2026-11-17 by plan 187-30, because attempt 2 records them again for the rebuilt commit.

Recorded 2026-11-17 (UTC) by the plan executor of plan 187-21, from HEAD `619505b3685c71ba315b587f2eb852415cb80f2b`, between 14:50Z and 14:58Z. Nothing was pushed, no workflow was started, and no hosted service or GitHub setting was written. The remote reads were `gh api` GETs (the `staging` environment's secret names, the repository's workflow runs), one `git ls-remote origin`, one GET of `https://staging.openvaa.org/api/health`, and, with `AWS_PROFILE=openvaa-admin`, `aws sts get-caller-identity` and `infra/scripts/running-image-digest.sh`, which only reads. Every status was read on its own line, never through a pipe.

### The commit

```
GREEN_COMMIT_SUPERSEDED=0a73bb6dfd7a06c904f40f0bfa0454d9b7fbc499
GREEN_REBUILT_SUPERSEDED=no
GREEN_TREE_OK_SUPERSEDED=yes
E2E_TREE_COVERS_GREEN_SUPERSEDED=yes
```

- **`GREEN_COMMIT=`.** `git rev-parse refs/evidence/187/green` prints `0a73bb6dfd7a06c904f40f0bfa0454d9b7fbc499`, the commit plan 187-19 rebuilt and pushed as `pr-evidence/187-head` (`PR_HEAD_PUSHED=` of `evidence/187-19-pr-plan.md`). Its tree is `fe42deb049d9dcbb43dc53aeecd17855862cc2dd`, and `git ls-tree refs/evidence/187/green -- .planning` lists nothing.
- **`GREEN_TREE_OK=yes`, `GREEN_REBUILT=no`.** `git diff --quiet refs/evidence/187/green HEAD -- . ':!.planning'` exit 0. The commits since the rebuild (`e2bcf829d` to `619505b36`) touch `.planning/` only, so the execution rules' rebuild did not run.
- **`E2E_TREE_COVERS_GREEN=yes`.** `E2E_TREE_SHA=450632a5c933ccb806506b83a5c29bca31cdc672` is the current line of `evidence/187-13-closing-e2e.md` (§ Re-run 2026-11-16, plan 187-28: 729 passed, 0 failed, 0 flaky, 0 did not run, 0 skipped). `git diff --quiet 450632a5c933ccb806506b83a5c29bca31cdc672..HEAD -- apps packages tests` exit 0.

### The contestant

```
CONTESTANT_READY_SUPERSEDED=yes
ENV_STAGING_SECRET_NAMES_SUPERSEDED=ALERT_EMAIL,SMOKE_CONTESTANT_EMAIL,SMOKE_CONTESTANT_PASSWORD,SUPABASE_ACCESS_TOKEN,SUPABASE_DB_PASSWORD
```

- `gh api repos/OpenVAA/voting-advice-application/environments/staging/secrets --jq '[.secrets[].name]|sort|join(",")'` exit 0, the five names above; no value was read. `evidence/187-17-smoke-contestant.md` holds `CONTESTANT_SECRETS_PRESENT=yes` (Task 3, 2026-11-15) and records the hosted contestant's full deployed smoke run green (`GREEN_SMOKE_EXIT=0`, `GREEN_VERDICT_EXIT=0`, `CREDENTIAL_LEAK_CHECK=clean`). The names are unchanged since then.

### The expected plan

```
PR_PLAN_AS_EXPECTED_SUPERSEDED=yes
RUNNING_TASK_DEFINITION_BEFORE_SUPERSEDED=arn:aws:ecs:eu-north-1:471112560111:task-definition/openvaa-staging-frontend:6
RUNNING_IMAGE_REFERENCE_BEFORE_SUPERSEDED=tag
RUNNING_IMAGE_DIGEST_BEFORE_SUPERSEDED=sha256:bab8fa75c6094a2cecab07282826bffa4d9746bf7ee56fc7231b8283ea937bea
```

- **`PR_PLAN_AS_EXPECTED=yes`.** `evidence/187-19-pr-plan.md` holds `PR_PLAN_SUMMARY=Plan: 1 to add, 1 to change, 1 to destroy.`, `PR_PLAN_MATCHES_EXPECTED=yes`, `PR_PLAN_SUBSCRIPTION_UNCHANGED=yes` and `PR_PLAN_IN_SUMMARY=yes`, made from this same commit (`PR_HEAD_PUSHED=0a73bb6df…`) at 14:34Z today: `module.frontend.aws_ecs_task_definition.app` replaced and `module.frontend.aws_ecs_service.app` updated in place, nothing else.
- **The state that plan was made on still stands.** `aws sts get-caller-identity --query Account` exit 0 (`471112560111`). `infra/scripts/running-image-digest.sh --cluster openvaa-staging --service openvaa-staging-frontend` exit 0 printed the three lines above, the same task definition, reference and digest as the plan job's digest step of run `44104573552`. No deploy run has run since (below). The green run's plan differs from the pull request's in one value only: its `image_digest` is the digest its own build pushes, not the running one, so the same two addresses change and the image is new.

### The migrations

```
MIGRATIONS_AT_COMMIT_SUPERSEDED=00001_initial_schema.sql,00002_claim_excludes_identity_provider_accounts.sql,00003_address_confirmation_request.sql,00004_user_entities_pending_email_taken.sql,00005_invitation_link_bounds.sql,00006_nomination_write_guards.sql,00007_nomination_write_kept_constituency.sql,00008_bulk_import_key_quoting.sql,00009_contestant_app_public_config_bounded.sql,00010_claim_grant_key_conflict_target.sql,00011_invitation_email_target_open_rows.sql,00012_bulk_import_constituency_links.sql,00013_nomination_constituency_rule.sql,00014_set_entity_nominations_constituency_once.sql,00015_answers_lock_entity_rows.sql,00016_answers_lock_nominations_storage.sql,00017_user_can_reads_grants.sql,00018_identity_entity_find_or_create.sql,00019_address_holds_open_invitation.sql,00020_identity_metadata_written_under_lock.sql,00021_email_holds_global_or_account_grant.sql,00022_grants_reaching_a_project.sql
EXPECTED_PENDING_SUPERSEDED=00002,00003,00004,00005,00006,00007,00008,00009,00010,00011,00012,00013,00014,00015,00016,00017,00018,00019,00020,00021,00022
MIGRATIONS_PENDING_COUNT_SUPERSEDED=21
MIGRATIONS_ON_STAGING_SUPERSEDED=00001
MIGRATION_00001_BLOB_SUPERSEDED=2b07ce7c378db9c59b09165762b2b0bf0af351cf
MIGRATIONS_PENDING_MATCH_187_27_SUPERSEDED=21
```

- **`MIGRATIONS_AT_COMMIT=`.** `git ls-tree --name-only refs/evidence/187/green apps/supabase/supabase/migrations/` exit 0, 22 files.
- **`EXPECTED_PENDING=` is not `none`.** The plan's assumption (only the baseline `00001` exists) does not hold at this commit: the rebase onto the -gsd stream (plan 187-27) brought `00002` to `00022`. The persistent project `cofbsatfrdysyphajsky` holds `00001` alone: `evidence/184-21-persistent-apply-push-functions.md` (phase 184) records the push of `00001` and a second run with `push_up_to_date=yes` and the drift report `history: database: 00001`, and no later row of the staging Supabase runbook's Observations records a push. So the green run's migrations step will push these 21 versions under the one `staging` approval (C-04), one-way.
- **`MIGRATION_00001_BLOB=`.** `git rev-parse refs/evidence/187/green:apps/supabase/supabase/migrations/00001_initial_schema.sql`, the blob 187-27 recorded for the version staging holds, so the baseline is unchanged and the push leaves it alone.
- **`MIGRATIONS_PENDING_MATCH_187_27=21`.** Each of the 21 files' blob at the green commit equals the `blob=` of its `MIGRATION_PENDING=` line in `evidence/187-27-ci-closure.md` § Task 2, which read every top-level statement and found none that needs a hosted step before a pooler `db push` (`MIGRATIONS_NEEDING_HAND_STEP=none`).

### For the reviewer of Task 2 (from the records of plan 187-27, not re-read on hosted services)

```
STAGING_SETTINGS_HAND_APPLY_SUPERSEDED=needed-before:187-21
STAGING_SETTINGS_HAND_APPLY_RECORDED_SUPERSEDED=no
MIGRATIONS_CALLTIME_PRIVILEGE_CHECKED_SUPERSEDED=no
```

- **`STAGING_SETTINGS_HAND_APPLY=needed-before:187-21`, `STAGING_SETTINGS_HAND_APPLY_RECORDED=no`.** `deferred-items.md` (2026-11-16, plan 187-27) and `evidence/187-27-ci-closure.md` § Task 2 require the operator to apply Step 18 of `infra/envs/staging/supabase/README.md` (`R=staging`) in the same sitting as this deploy, immediately before its approval: `mailer_otp_length` 6 to 10, and the redirect paths from `/api/auth/callback` to `/auth/confirm`. The functions this run deploys issue a sign-in link only when `/auth/confirm` is admitted, and `deploy.yml` sets no auth setting. The last row of that runbook's Observations is dated 2026-11-15, so no such apply is recorded yet. Without it the run can still be green (the smoke signs in with a password and mails nothing), but staging's mailed links would be refused after the deploy until the apply.
- **`MIGRATIONS_CALLTIME_PRIVILEGE_CHECKED=no`.** `00018_identity_entity_find_or_create.sql` and `00020_identity_metadata_written_under_lock.sql` define SECURITY DEFINER functions, owned by the pushing role, that update `auth.users` at call time. The push creates them without exercising that privilege; whether the hosted `postgres` role holds it is unread, as 187-27 left it for this review. Staging configures no identity provider, so neither function is called by what staging runs.

### The branch, the served build, the runs

```
GREEN_BRANCH_ABSENT_SUPERSEDED=yes
SERVED_BUILD_BEFORE_SUPERSEDED=712947a1bd44a735f66ee8f51610f4748d76cd30
NO_RUN_ACTIVE_SUPERSEDED=yes
```

- **`GREEN_BRANCH_ABSENT=yes`.** `git ls-remote origin refs/heads/deploy-evidence/187-green` exit 0, 0 bytes.
- **`SERVED_BUILD_BEFORE=`.** `curl -sS --max-time 20 https://staging.openvaa.org/api/health` exit 0, HTTP 200, body `{"status":"ok","build":"712947a1bd44a735f66ee8f51610f4748d76cd30"}`.
- **`NO_RUN_ACTIVE=yes`.** `gh run list --workflow deploy.yml` exit 0 lists two runs, `44088753181` (`deploy-evidence/187-red-2`) and `44042442257` (`deploy-evidence/187-red`), both `completed` `failure`. `destroy.yml` is not on the default branch, so `gh run list --workflow destroy.yml` answers 404; among the latest 100 runs of the repository (`actions/runs?per_page=100`, exit 0) none has the path `destroy.yml`, and none of any workflow is other than `completed`. The status-filtered counts are 0 for `in_progress`, `queued`, `waiting`, `requested` and `pending`; `action_required` counts 25, all `claude.yml` runs of 2026-11-14 pull-request review events, and 0 of `deploy.yml` or `destroy.yml`.

## Task 2: the operator's approval (2026-11-17)

The operator approved the push in the main session. The orchestrator bound the reply under key `187-21-2`, attempt id `20261117T145717Z.6854e9d6f`: `bash "$A" put 187-21-2`, `bash "$A" bound 187-21-2 OPERATOR_REPLY plan=187-21 task=2` and `bash "$A" has 187-21-2 '^answer_push=approve$'` each exited 0. The plan executor of Task 3 re-ran `bound` and `has` (both read-only) before recording anything below; both exited 0.

### Step 18 of the staging Supabase runbook, applied by hand before the approval

```
STAGING_SETTINGS_HAND_APPLY_RECORDED=yes
s18_plan_sha256=ba79191c11b6f7cbe211c05b11012ab2fd0bd02e37f9047cf602bae950185d97
s18_sha_matches=yes
s18_apply_exit=0
s18_apply="Apply complete! Resources: 0 added, 1 changed, 0 destroyed."
s18_second_plan_exit=0
s18_second_plan="No changes. Your infrastructure matches the configuration."
s18_auth_http=200
s18_auth.mailer_otp_length=10
s18_auth.uri_allow_list="https://staging.openvaa.org/auth/confirm,https://staging.openvaa.org/*/auth/confirm"
```

- In the same sitting, immediately before approving, the operator applied Step 18 of `infra/envs/staging/supabase/README.md` with `R=staging` (ref `cofbsatfrdysyphajsky`) and pasted the record into the main session; the lines above are copied from it. The change was the single update in place of `module.supabase.supabase_settings.this`: `mailer_otp_length` 6 to 10, and `uri_allow_list` from the two `/api/auth/callback` paths to the two `/auth/confirm` paths. The go-ahead named the plan file's sha256, and the applied file matched it.
- Two earlier attempts in that sitting failed, and neither applied anything. Attempt 1's plan exited 1 with 401 `Invalid access token` on `supabase_project.this`; a stale plan file from an earlier sitting was found and removed unapplied, and the token was read again. Attempt 2's plan exited 0 with the same one update, but its apply exited 1 with `Error: Project Services Unhealthy` ("services did not become active within timeout"); the plan file was removed, the read-back still showed `mailer_otp_length=6` and the old `uri_allow_list`, and all eight services the provider waits on then read `ACTIVE_HEALTHY`. That the failure was transient is unconfirmed.
- The record is a dated 2026-11-17 row of that runbook's Observations, formatted with Prettier.

### Open item, accepted as non-blocking

```
MIGRATIONS_CALLTIME_PRIVILEGE_CHECKED=no
```

- Still open: whether the hosted `postgres` role holds UPDATE on `auth.users`, which the SECURITY DEFINER functions of `00018_identity_entity_find_or_create.sql` and `00020_identity_metadata_written_under_lock.sql` need at call time. The push creates them without exercising the privilege. The operator accepted it as non-blocking for this run, because staging configures no identity provider, so nothing staging runs calls either function.

## Task 3: the push and the run (2026-11-17)

The lines of this section were superseded on 2026-11-17 by plan 187-30, because attempt 2 records them again for the rebuilt commit.

### The push

```
GREEN_PUSHED_SUPERSEDED=yes
GREEN_PUSHED_SHA_SUPERSEDED=0a73bb6dfd7a06c904f40f0bfa0454d9b7fbc499
GREEN_RUN_ID_SUPERSEDED=44165083175
GREEN_RUN_URL_SUPERSEDED=https://github.com/OpenVAA/voting-advice-application/actions/runs/44165083175
```

- The orchestrator pushed at top level after the binding above: `git push origin 0a73bb6dfd7a06c904f40f0bfa0454d9b7fbc499:refs/heads/deploy-evidence/187-green` exit 0, and `git ls-remote origin refs/heads/deploy-evidence/187-green` read it back at that SHA. `git ls-remote` had printed nothing before the push, and no deploy run was active.
- `gh run view 44165083175 --json ...` exit 0: event `push`, head branch `deploy-evidence/187-green`, head SHA `0a73bb6dfd7a06c904f40f0bfa0454d9b7fbc499`. At 20:03Z its `checks` job (id `134328857709`) was in progress, its first six steps `success`.

### The checks job and the gate

```
CHECKS_JOB_SUPERSEDED=success
CHECKS_JOB_ID_SUPERSEDED=134328857709
DEPLOY_JOB_ID_SUPERSEDED=134329653364
GATE_WAITED_SUPERSEDED=yes
GATE_ENVIRONMENT_SUPERSEDED=staging
GATE_WAIT_TIMER_SUPERSEDED=0
```

- **`CHECKS_JOB=success`.** `gh api repos/OpenVAA/voting-advice-application/actions/jobs/134328857709` exit 0: `success`, 20:02:50Z to 20:04:03Z (73 s). Steps, each `success`: Set up job (4 s), Checkout source code (8 s), Setup Terraform 1.16.5 (1 s), Check Terraform formatting (1 s), Validate the staging AWS root (9 s), Setup Node.js 24.21.0 (4 s), Setup Yarn 4.18 (28 s), Unit tests of the infrastructure scripts (13 s), and the post and complete steps (0 s).
- **`GATE_WAITED=yes`.** At 20:04:10Z `gh run view 44165083175` read the run `waiting` and its `deploy` job (id `134329653364`, created 20:04:03Z) `waiting`. `gh api repos/OpenVAA/voting-advice-application/actions/runs/44165083175/pending_deployments` (a GET) exit 0: one pending deployment, environment `staging`, `wait_timer` 0, a `User` reviewer. The review is left to the operator in the GitHub web interface; the executor made no POST to `pending_deployments` and approved nothing.

## Task 3, attempt 1: approved, red at the plan step (2026-11-17)

Recorded read-only on 2026-11-17 (UTC) by plan 187-30, which fixed the cause. The reads were `gh api` GETs of run `44165083175`, of its approvals (each entry's `state` and environment names only, no user) and of the deploy job `134329653364`; `gh run view 44165083175 --log --job 134329653364` to a file; `gh run list --branch deploy-evidence/187-green`; one GET of `https://staging.openvaa.org/api/health` (HTTP 200); and, with `AWS_PROFILE=openvaa-admin`, `infra/scripts/running-image-digest.sh --cluster openvaa-staging --service openvaa-staging-frontend` (exit 0), which only reads. Each status was read on its own line; the outputs are under `tmp/187-30/a1/` (ignored). Nothing was pushed, approved or re-run.

```
A1_ATTEMPT=20261117T145717Z.6854e9d6f
A1_RUN_ID=44165083175
A1_RUN_HEAD=0a73bb6dfd7a06c904f40f0bfa0454d9b7fbc499
A1_RUN_ATTEMPT=1
A1_RUN_CONCLUSION=failure
A1_GATE_REVIEW=approved
A1_GATE_ENVIRONMENT=staging
A1_DEPLOY_STEPS=33
A1_STEP=Set up job conclusion=success seconds=1
A1_STEP=Checkout source code conclusion=success seconds=2
A1_STEP=Assume the deploy role conclusion=success seconds=1
A1_STEP=Build and push the image conclusion=success seconds=185
A1_STEP=Drop the build credentials conclusion=success seconds=0
A1_STEP=Setup Node.js 24.21.0 conclusion=success seconds=5
A1_STEP=Setup Yarn 4.18 conclusion=success seconds=23
A1_STEP=Install psql conclusion=success seconds=19
A1_STEP=Setup Terraform 1.16.5 conclusion=success seconds=1
A1_STEP=Assume the deploy role for the plan conclusion=success seconds=1
A1_STEP=Initialise the staging AWS root conclusion=success seconds=8
A1_STEP=Plan the staging AWS root with the built digest conclusion=failure seconds=1
A1_STEP=Show the plan conclusion=skipped seconds=0
A1_STEP=Drop the plan credentials conclusion=skipped seconds=0
A1_STEP=Link a work directory to the Supabase project conclusion=skipped seconds=0
A1_STEP=Push the migrations conclusion=skipped seconds=0
A1_STEP=Deploy the functions conclusion=skipped seconds=0
A1_STEP=Assume the deploy role again for the apply conclusion=skipped seconds=0
A1_STEP=Apply the saved plan conclusion=skipped seconds=0
A1_STEP=Check the rollout is stable conclusion=skipped seconds=0
A1_STEP=Drop the rollout credentials conclusion=skipped seconds=0
A1_STEP=Install Playwright's Chromium conclusion=skipped seconds=0
A1_STEP=Run the deployed smoke entry conclusion=skipped seconds=0
A1_STEP=Read the served build again conclusion=skipped seconds=0
A1_STEP=Remove the plan, the smoke output and the step files conclusion=success seconds=0
A1_STEP=Assume the deploy role again for the alert conclusion=success seconds=1
A1_STEP=Alert the operator conclusion=success seconds=1
A1_STEP=Post Assume the deploy role again for the alert conclusion=success seconds=0
A1_STEP=Post Assume the deploy role for the plan conclusion=success seconds=0
A1_STEP=Post Setup Node.js 24.21.0 conclusion=skipped seconds=0
A1_STEP=Post Assume the deploy role conclusion=success seconds=0
A1_STEP=Post Checkout source code conclusion=success seconds=1
A1_STEP=Complete job conclusion=success seconds=0
A1_JOB_MINUTES=4.2
A1_BUILD_EXIT_LINE=build_exit=0
A1_BUILD_DIGEST=sha256:da3001d2c059fea66e200cf67f47ebcac7772e215e02bea91ef286c6cb2fe9a7
A1_INIT_WARNED=yes
A1_FAILED_STEP=Plan the staging AWS root with the built digest
A1_FAILED_STEP_SECONDS=1
A1_PLAN_EXIT_LINE=plan_exit=1
A1_LATER_STAGES=skipped
A1_ALERT_STEP=Alert the operator conclusion=success
A1_ALERT_STAGE=plan
A1_ALERT_MESSAGE_ID=233a4f1d-5df1-5a81-a89a-2c6b9dc54eae
A1_INFRA_PLAN_RUN_ID=44165083297
A1_INFRA_PLAN_RUN_CONCLUSION=success
A1_SERVED_BUILD_AFTER=712947a1bd44a735f66ee8f51610f4748d76cd30
A1_RUNNING_TASK_DEFINITION_AFTER=arn:aws:ecs:eu-north-1:471112560111:task-definition/openvaa-staging-frontend:6
A1_RUNNING_IMAGE_REFERENCE_AFTER=tag
A1_RUNNING_IMAGE_DIGEST_AFTER=sha256:bab8fa75c6094a2cecab07282826bffa4d9746bf7ee56fc7231b8283ea937bea
A1_HOSTED_UNCHANGED=yes
A1_MIGRATIONS_PUSHED=none
A1_FUNCTIONS_DEPLOYED=none
A1_APPLIED=no
A1_HOSTED_WRITES=ecr-image,alert
A1_CAUSE=lock-without-linux_arm64
```

The log lines, as printed, without their timestamps:

```
Warning: Provider lock file not updated
Error: Required plugins are not installed
  - registry.terraform.io/hashicorp/aws: the cached package for registry.terraform.io/hashicorp/aws 6.68.0 (in .terraform/providers) does not match any of the checksums recorded in the dependency lock file
  - registry.terraform.io/hashicorp/random: the cached package for registry.terraform.io/hashicorp/random 3.9.1 (in .terraform/providers) does not match any of the checksums recorded in the dependency lock file
plan_exit=1
alert_stage=plan
```

- **The cause.** The deploy job runs on `ubuntu-24.04-arm`, and `infra/envs/staging/aws/.terraform.lock.hcl` held `h1:` hashes for linux_amd64, darwin_arm64 and darwin_amd64 only. `init -lockfile=readonly` installed the linux_arm64 packages, checked against the `zh:` hashes, but could not record their `h1:` hashes, and the plan then refused both providers. The fix (every root lock written for linux_amd64, linux_arm64, darwin_arm64 and darwin_amd64, guarded by the rules `arm-lock` and `lock-platforms`) and its proofs, the failure reproduced on linux/arm64 and the fixed lock green there, are in `evidence/187-30-arm64-lock.md`.
- **Not re-run.** Run `44165083175` was not re-run, and no job of it. `A1_RUN_ATTEMPT=1` above is its only attempt.
- **What the run wrote.** The build step pushed the image tagged with commit `0a73bb6df` (`image_tag=0a73bb6dfd7a06c904f40f0bfa0454d9b7fbc499`, digest `A1_BUILD_DIGEST`) to the registry, where it stays; no task definition names it, since the apply that would register one was skipped and the running task definition is still `openvaa-staging-frontend:6` at the digest it ran before. The alert step published one alert with `alert_stage=plan`. Every step from `Show the plan` to `Read the served build again` was skipped, so no migration was pushed, no function deployed and nothing applied.
- **The migrations.** The 21 migrations `00002` to `00022` are still pending on the persistent project; staging holds `00001` alone.
- **Still open.** Whether the hosted `postgres` role holds UPDATE on `auth.users` for the SECURITY DEFINER functions of `00018` and `00020` is still unchecked, as accepted in § Task 2 above; this attempt pushed no migration, so it neither raised nor settled the question.

## Task 1, attempt 2 (2026-11-17)

The lines of this section were superseded on 2026-11-18 by plan 187-21, attempt 2, because a later attempt records them again (§ Task 3, attempt 2, "The approval and the run: red at the link step").

Recorded 2026-11-17 (UTC) by the plan executor of plan 187-21, attempt 2, from HEAD `dd5878fb35db2369ffc23a32cc4a5638016c9cdd`, between 21:40Z and 21:50Z, after plan 187-30 left `READY_FOR_187_21_ATTEMPT_2=yes` in `evidence/187-30-arm64-lock.md`. Nothing was pushed, no workflow was started or re-run, no attempt of key `187-21-2` was opened, and no hosted service or GitHub setting was written. The remote reads were `gh api` GETs (the `staging` environment's secret names, the repository's workflow runs), one `git ls-remote origin`, one GET of `https://staging.openvaa.org/api/health`, and, with `AWS_PROFILE=openvaa-admin`, `aws sts get-caller-identity` and `infra/scripts/running-image-digest.sh`, which only reads; the profile's session was valid, so no sign-in was needed. Every status was read on its own line, never through a pipe.

### The commit

```
GREEN_COMMIT_SUPERSEDED=9d6a55ca36ea56a5d3883ad95a10b4619c2472ad
GREEN_REBUILT_SUPERSEDED=no
GREEN_TREE_OK_SUPERSEDED=yes
E2E_TREE_COVERS_GREEN_SUPERSEDED=yes
GREEN_PARENT_SUPERSEDED=340a200708c28fb7ed078d452138712f3400c789
```

- **`GREEN_COMMIT=`.** `git rev-parse refs/evidence/187/green` prints `9d6a55ca36ea56a5d3883ad95a10b4619c2472ad`, the commit plan 187-30 rebuilt (`evidence/187-12-evidence-commits.md` § Re-run 2026-11-17 (plan 187-30): `GREEN_COMMIT=9d6a55ca3…`, `GREEN_TREE=986dd2c11…`, green build exit 0; the red commit `1a3ee822f…`, build exit 1). Its tree is `986dd2c11429bec0a578ba809444d8c76ec4c1f3`, its one parent is `origin/main` (`340a20070`, `GREEN_PARENT=`), and `git ls-tree refs/evidence/187/green -- .planning` lists nothing.
- **`GREEN_TREE_OK=yes`, `GREEN_REBUILT=no`.** `git diff --quiet refs/evidence/187/green HEAD -- . ':!.planning'` exit 0. The commits since the rebuild's HEAD `f2b279747` (`35e9fab77`, `27508e4ca`, `dd5878fb3`) touch `.planning/` only (`git diff --name-only f2b279747 HEAD -- . ':!.planning'` exit 0, empty), so this plan's own rule did not have to rebuild once more.
- **`E2E_TREE_COVERS_GREEN=yes`.** `E2E_TREE_SHA=450632a5c933ccb806506b83a5c29bca31cdc672` is still the current line of `evidence/187-13-closing-e2e.md` (§ Re-run 2026-11-16, plan 187-28: 729 passed, 0 failed, 0 flaky, 0 did not run, 0 skipped). `git diff --quiet 450632a5c933ccb806506b83a5c29bca31cdc672..HEAD -- apps packages tests` exit 0, and `git diff --quiet 450632a5c933ccb806506b83a5c29bca31cdc672 refs/evidence/187/green -- apps packages tests` exit 0.
- **Against attempt 1's commit.** `git diff --name-only 0a73bb6df refs/evidence/187/green` names the eight root locks, `infra/README.md`, `infra/scripts/workflows.test.ts` and `infra/envs/staging/supabase/README.md`; over `'*.tf' '*.tfvars' .github` it names nothing. So the workflows and every Terraform configuration the run reads equal attempt 1's.

### The contestant

```
CONTESTANT_READY_SUPERSEDED=yes
ENV_STAGING_SECRET_NAMES_SUPERSEDED=ALERT_EMAIL,SMOKE_CONTESTANT_EMAIL,SMOKE_CONTESTANT_PASSWORD,SUPABASE_ACCESS_TOKEN,SUPABASE_DB_PASSWORD
```

- `gh api repos/OpenVAA/voting-advice-application/environments/staging/secrets --jq '[.secrets[].name]|sort|join(",")'` exit 0, the five names above; no value was read. They equal attempt 1's, and `evidence/187-17-smoke-contestant.md` still holds `CONTESTANT_SECRETS_PRESENT=yes` and the hosted contestant's green deployed smoke run.

### The expected plan

```
PR_PLAN_AS_EXPECTED_SUPERSEDED=yes
RUNNING_TASK_DEFINITION_BEFORE_SUPERSEDED=arn:aws:ecs:eu-north-1:471112560111:task-definition/openvaa-staging-frontend:6
RUNNING_IMAGE_REFERENCE_BEFORE_SUPERSEDED=tag
RUNNING_IMAGE_DIGEST_BEFORE_SUPERSEDED=sha256:bab8fa75c6094a2cecab07282826bffa4d9746bf7ee56fc7231b8283ea937bea
EXPECTED_PLAN_SUPERSEDED=Plan: 1 to add, 1 to change, 1 to destroy.
```

- **`PR_PLAN_AS_EXPECTED=yes`.** `evidence/187-19-pr-plan.md` holds `PR_PLAN_SUMMARY=Plan: 1 to add, 1 to change, 1 to destroy.` with `PR_PLAN_MATCHES_EXPECTED=yes`: `module.frontend.aws_ecs_task_definition.app` replaced and `module.frontend.aws_ecs_service.app` updated in place, nothing else. The rebuilt commit changes no `.tf`, `.tfvars` or workflow file against the commit that plan was made from (above), and the state it was made on still stands: `aws sts get-caller-identity --query Account` exit 0 (`471112560111`), and `infra/scripts/running-image-digest.sh --cluster openvaa-staging --service openvaa-staging-frontend` exit 0 printed the three `RUNNING_*_BEFORE` lines above, the same task definition, reference and digest as before attempt 1 (`A1_RUNNING_*_AFTER`). Attempt 1 applied nothing (`A1_APPLIED=no`). So the green run's plan is expected to be 187-19's, with its `image_digest` the digest its own build pushes.
- **The lock fix only lets the plan step run.** The staging AWS lock gained one linux_arm64 `h1:` hash per provider (`hashicorp/aws` 6.68.0, `hashicorp/random` 3.9.1), versions and constraints unchanged; this is what attempt 1's plan step on `ubuntu-24.04-arm` lacked (`A1_CAUSE=lock-without-linux_arm64`). `deploy.yml` still runs the deploy job on `ubuntu-24.04-arm` and the checks job on `ubuntu-24.04`.
- **A note for the reviewer: the Supabase lock `constraints` line.** Plan 187-30 also rewrote one line in each of the three Supabase root locks (`infra/envs/staging/supabase`, `infra/envs/scratch/supabase`, `infra/envs/example/supabase`): `constraints = "~> 1.11"` became `constraints = "1.11.0, ~> 1.11"`, next to one added linux_arm64 `h1:` hash. It is Terraform's own `providers lock` output for the roots' `version = "= 1.11.0"` pin (`infra/envs/staging/supabase/main.tf`) together with the module's `version = "~> 1.11"` (`infra/modules/supabase/main.tf`); the `version = "1.11.0"` line and every existing hash are kept. The orchestrator accepts it provisionally; the operator is asked to confirm it at Task 2. The deploy workflow initialises only the staging AWS root, so this run does not read those locks.

### The migrations

```
MIGRATIONS_AT_COMMIT_SUPERSEDED=00001_initial_schema.sql,00002_claim_excludes_identity_provider_accounts.sql,00003_address_confirmation_request.sql,00004_user_entities_pending_email_taken.sql,00005_invitation_link_bounds.sql,00006_nomination_write_guards.sql,00007_nomination_write_kept_constituency.sql,00008_bulk_import_key_quoting.sql,00009_contestant_app_public_config_bounded.sql,00010_claim_grant_key_conflict_target.sql,00011_invitation_email_target_open_rows.sql,00012_bulk_import_constituency_links.sql,00013_nomination_constituency_rule.sql,00014_set_entity_nominations_constituency_once.sql,00015_answers_lock_entity_rows.sql,00016_answers_lock_nominations_storage.sql,00017_user_can_reads_grants.sql,00018_identity_entity_find_or_create.sql,00019_address_holds_open_invitation.sql,00020_identity_metadata_written_under_lock.sql,00021_email_holds_global_or_account_grant.sql,00022_grants_reaching_a_project.sql
EXPECTED_PENDING_SUPERSEDED=00002,00003,00004,00005,00006,00007,00008,00009,00010,00011,00012,00013,00014,00015,00016,00017,00018,00019,00020,00021,00022
MIGRATIONS_PENDING_COUNT_SUPERSEDED=21
MIGRATIONS_ON_STAGING_SUPERSEDED=00001
MIGRATION_00001_BLOB_SUPERSEDED=2b07ce7c378db9c59b09165762b2b0bf0af351cf
MIGRATIONS_UNCHANGED_SINCE_ATTEMPT_1_SUPERSEDED=yes
MIGRATIONS_PENDING_MATCH_187_27_SUPERSEDED=21
```

- **`MIGRATIONS_AT_COMMIT=`.** `git ls-tree --name-only refs/evidence/187/green apps/supabase/supabase/migrations/` exit 0, 22 files.
- **`MIGRATIONS_UNCHANGED_SINCE_ATTEMPT_1=yes`.** `git diff --quiet 0a73bb6df refs/evidence/187/green -- apps/supabase/supabase/migrations` exit 0, so every blob equals attempt 1's, and with them the `blob=` of each `MIGRATION_PENDING=` line of `evidence/187-27-ci-closure.md` § Task 2 (`MIGRATIONS_PENDING_MATCH_187_27=21`, `MIGRATIONS_NEEDING_HAND_STEP=none` there).
- **`EXPECTED_PENDING=`, 21 versions.** The persistent project `cofbsatfrdysyphajsky` still holds `00001` alone: attempt 1 pushed no migration (`A1_MIGRATIONS_PUSHED=none`), and the staging Supabase runbook's last Observations row (2026-11-17) is the Step 18 hand apply, which writes auth settings only. So the green run's migrations step will push these 21 versions under the one `staging` approval (C-04), one-way. `MIGRATION_00001_BLOB=` is the blob staging's version was pushed from, so the push leaves `00001` alone.

### Carried from § Task 2 (not repeated)

- § Task 2's `STAGING_SETTINGS_HAND_APPLY_RECORDED=yes` and `MIGRATIONS_CALLTIME_PRIVILEGE_CHECKED=no` stay the current lines; they are not written again here, so each holds one value. The Step 18 hand apply of § Task 2 stands and is not repeated. Whether the hosted `postgres` role holds UPDATE on `auth.users` for the SECURITY DEFINER functions of `00018` and `00020` is still unchecked, as accepted in § Task 2: staging configures no identity provider, so nothing staging runs calls either function.

### The branch, the served build, the runs

```
GREEN_BRANCH_SUPERSEDED=deploy-evidence/187-green-2
GREEN_BRANCH_ABSENT_SUPERSEDED=yes
ATTEMPT_1_BRANCH_TIP_SUPERSEDED=0a73bb6dfd7a06c904f40f0bfa0454d9b7fbc499
SERVED_BUILD_BEFORE_SUPERSEDED=712947a1bd44a735f66ee8f51610f4748d76cd30
NO_RUN_ACTIVE_SUPERSEDED=yes
```

- **`GREEN_BRANCH_ABSENT=yes`.** `git ls-remote origin refs/heads/deploy-evidence/187-green-2 refs/heads/deploy-evidence/187-green` exit 0 printed one line only, `deploy-evidence/187-green` at `0a73bb6df…` (attempt 1's head, the head of run 44165083175, left as it is); `deploy-evidence/187-green-2` is absent.
- **`SERVED_BUILD_BEFORE=`.** `curl -sS --max-time 20 https://staging.openvaa.org/api/health` exit 0, HTTP 200, body `{"status":"ok","build":"712947a1bd44a735f66ee8f51610f4748d76cd30"}`, unchanged since attempt 1.
- **`NO_RUN_ACTIVE=yes`.** `gh run list --workflow deploy.yml` exit 0 lists three runs, `44165083175` (`deploy-evidence/187-green`), `44088753181` (`deploy-evidence/187-red-2`) and `44042442257` (`deploy-evidence/187-red`), each `completed` `failure`. `destroy.yml` is not on the default branch, so `gh run list --workflow destroy.yml` answers 404; among the latest 100 runs of the repository (`actions/runs?per_page=100`, exit 0) none has the path `destroy.yml`, and none is other than `completed`. The status-filtered counts are 0 for `in_progress`, `queued`, `waiting`, `requested` and `pending`; `action_required` counts 25, none of `deploy.yml` or `destroy.yml`.

## Task 3, attempt 2 (2026-11-18)

The lines of "The binding and the push" and "The checks job and the gate" were superseded on 2026-11-18 by plan 187-21, attempt 2, because a later attempt records them again; the `A2_` lines of "The approval and the run: red at the link step" below are current.

Recorded 2026-11-18 (UTC) by the plan executor of plan 187-21, attempt 2, from HEAD `3fed1eac0`. The executor pushed nothing, started or re-ran no workflow, approved no review and wrote no hosted service or GitHub setting; its remote reads were `gh run view`, `gh api` GETs and `git ls-remote origin`. Every status was read on its own line, never through a pipe.

### The binding and the push

```
GREEN_ATTEMPT_ID_SUPERSEDED=20261117T214942Z.3fed1eac0
GREEN_PUSHED_SUPERSEDED=yes
GREEN_PUSHED_SHA_SUPERSEDED=9d6a55ca36ea56a5d3883ad95a10b4619c2472ad
GREEN_PUSHED_BRANCH_SUPERSEDED=deploy-evidence/187-green-2
GREEN_RUN_ID_SUPERSEDED=44250710034
GREEN_RUN_URL_SUPERSEDED=https://github.com/OpenVAA/voting-advice-application/actions/runs/44250710034
GREEN_INFRA_PLAN_RUN_ID_SUPERSEDED=44250709928
SUPABASE_LOCK_CONSTRAINTS_CONFIRMED_SUPERSEDED=no
```

- **The binding.** The orchestrator opened attempt `20261117T214942Z.3fed1eac0` of key `187-21-2` and stored the operator's reply; `put`, `bash "$A" bound 187-21-2 OPERATOR_REPLY plan=187-21 task=2` and `bash "$A" has 187-21-2 '^answer_push=approve$'` each exited 0 at top level. The executor ran `bound` and `has` again before reading the run (both read-only): exit 0 and exit 0.
- **`GREEN_PUSHED=yes`.** The orchestrator pushed at top level after the binding: `git push origin 9d6a55ca36ea56a5d3883ad95a10b4619c2472ad:refs/heads/deploy-evidence/187-green-2` exit 0. Before the push `git ls-remote` printed nothing for the branch and no deploy run was active. The executor read it back: `git ls-remote origin refs/heads/deploy-evidence/187-green-2` exit 0, `9d6a55ca36ea56a5d3883ad95a10b4619c2472ad`, equal to `GREEN_COMMIT=` of § Task 1, attempt 2.
- **The run.** `gh run view 44250710034 --json ...` exit 0 at 06:22Z: event `push`, head branch `deploy-evidence/187-green-2`, head SHA `9d6a55ca36ea56a5d3883ad95a10b4619c2472ad`, created 06:21:17Z, `in_progress`, its `checks` job (id `134620417679`) started 06:21:19Z. The same push started `infra-plan.yml` run `44250709928`.
- **`SUPABASE_LOCK_CONSTRAINTS_CONFIRMED=no` (open).** The stored reply notes that the operator gave no separate answer on the Supabase lock `constraints` line (§ Task 1, attempt 2, "A note for the reviewer"), so it stays provisionally accepted by the orchestrator and is an open confirmation. This run does not read those locks.

### The checks job and the gate

```
CHECKS_JOB_SUPERSEDED=success
CHECKS_JOB_ID_SUPERSEDED=134620417679
DEPLOY_JOB_ID_SUPERSEDED=134620946555
GATE_WAITED_SUPERSEDED=yes
GATE_ENVIRONMENT_SUPERSEDED=staging
GATE_WAIT_TIMER_SUPERSEDED=0
```

- **`CHECKS_JOB=success`.** `gh api repos/OpenVAA/voting-advice-application/actions/jobs/134620417679` exit 0: `success`, 06:21:19Z to 06:22:37Z (78 s). Steps, each `success`: Set up job (1 s), Checkout source code (3 s), Setup Terraform 1.16.5 (1 s), Check Terraform formatting (0 s), Validate the staging AWS root (12 s), Setup Node.js 24.21.0 (5 s), Setup Yarn 4.18 (40 s), Unit tests of the infrastructure scripts (13 s), and the post and complete steps (0 s).
- **`GATE_WAITED=yes`.** A background watcher read the run `waiting` at 06:22:51Z, and at 06:22:58Z `gh run view 44250710034` read the run `waiting` and its `deploy` job (id `134620946555`, started 06:22:37Z) `waiting`. `gh api repos/OpenVAA/voting-advice-application/actions/runs/44250710034/pending_deployments` (a GET) exit 0: one pending deployment, environment `staging`, `wait_timer` 0, a `User` reviewer. The review is left to the operator in the GitHub web interface; the executor made no POST to `pending_deployments` and approved nothing.

### The approval and the run: red at the link step

Recorded read-only on 2026-11-18 (UTC) by the plan executor of plan 187-21, attempt 2, from HEAD `f76f69576`. The reads were `gh api` GETs of run `44250710034`, of its approvals (each entry's `state` and environment names only, no user), of the deploy job `134620946555`, of the run's artifacts, of `infra-plan.yml` run `44250709928` and of the `staging` environment's secret names and dates (no value); `gh run view 44250710034 --log --job 134620946555` to a file, byte-identical to the orchestrator's saved copy (`cmp` exit 0); `gh run list --branch deploy-evidence/187-green-2`; `git ls-remote origin refs/heads/deploy-evidence/187-green-2`; and one GET of `https://staging.openvaa.org/api/health`. Each status was read on its own line; the outputs are under `tmp/187-21/a2/` (ignored). Nothing was pushed, approved or re-run, and no hosted service or GitHub setting was written.

```
A2_ATTEMPT=20261117T214942Z.3fed1eac0
A2_RUN_ID=44250710034
A2_RUN_URL=https://github.com/OpenVAA/voting-advice-application/actions/runs/44250710034
A2_RUN_HEAD=9d6a55ca36ea56a5d3883ad95a10b4619c2472ad
A2_RUN_BRANCH=deploy-evidence/187-green-2
A2_RUN_ATTEMPT=1
A2_RUN_CONCLUSION=failure
A2_GATE_REVIEW=approved
A2_GATE_ENVIRONMENT=staging
A2_DEPLOY_JOB_ID=134620946555
A2_DEPLOY_JOB_RUNNER=ubuntu-24.04-arm
A2_DEPLOY_JOB_STARTED=2026-11-18T06:34:17Z
A2_DEPLOY_JOB_COMPLETED=2026-11-18T06:38:37Z
A2_DEPLOY_STEPS=33
A2_STEP=Set up job conclusion=success seconds=2
A2_STEP=Checkout source code conclusion=success seconds=2
A2_STEP=Assume the deploy role conclusion=success seconds=1
A2_STEP=Build and push the image conclusion=success seconds=181
A2_STEP=Drop the build credentials conclusion=success seconds=0
A2_STEP=Setup Node.js 24.21.0 conclusion=success seconds=5
A2_STEP=Setup Yarn 4.18 conclusion=success seconds=23
A2_STEP=Install psql conclusion=success seconds=15
A2_STEP=Setup Terraform 1.16.5 conclusion=success seconds=1
A2_STEP=Assume the deploy role for the plan conclusion=success seconds=1
A2_STEP=Initialise the staging AWS root conclusion=success seconds=9
A2_STEP=Plan the staging AWS root with the built digest conclusion=success seconds=11
A2_STEP=Show the plan conclusion=success seconds=2
A2_STEP=Drop the plan credentials conclusion=success seconds=0
A2_STEP=Link a work directory to the Supabase project conclusion=failure seconds=1
A2_STEP=Push the migrations conclusion=skipped seconds=0
A2_STEP=Deploy the functions conclusion=skipped seconds=0
A2_STEP=Assume the deploy role again for the apply conclusion=skipped seconds=0
A2_STEP=Apply the saved plan conclusion=skipped seconds=0
A2_STEP=Check the rollout is stable conclusion=skipped seconds=0
A2_STEP=Drop the rollout credentials conclusion=skipped seconds=0
A2_STEP=Install Playwright's Chromium conclusion=skipped seconds=0
A2_STEP=Run the deployed smoke entry conclusion=skipped seconds=0
A2_STEP=Read the served build again conclusion=skipped seconds=0
A2_STEP=Remove the plan, the smoke output and the step files conclusion=success seconds=0
A2_STEP=Assume the deploy role again for the alert conclusion=success seconds=1
A2_STEP=Alert the operator conclusion=success seconds=1
A2_STEP=Post Assume the deploy role again for the alert conclusion=success seconds=0
A2_STEP=Post Assume the deploy role for the plan conclusion=success seconds=0
A2_STEP=Post Setup Node.js 24.21.0 conclusion=skipped seconds=0
A2_STEP=Post Assume the deploy role conclusion=success seconds=1
A2_STEP=Post Checkout source code conclusion=success seconds=0
A2_STEP=Complete job conclusion=success seconds=0
A2_JOB_MINUTES=4.3
A2_BUILD_EXIT_LINE=build_exit=0
A2_BUILD_DIGEST=sha256:ccfaa5863a168dfd3d0a4f40257ede398255cb18c899419f68aa23a18b5638a3
A2_INIT_WARNED=no
A2_PLAN_EXIT_LINE=plan_exit=0
A2_PLAN_SUMMARY=Plan: 1 to add, 1 to change, 1 to destroy.
A2_PLAN_AS_EXPECTED=yes
A2_ARM_LOCK_FIX_OBSERVED=yes
A2_FAILED_STEP=Link a work directory to the Supabase project
A2_FAILED_STEP_SECONDS=1
A2_LINK_LINKS_LINE=links=3
A2_LINK_EXIT_LINE=link_exit=1
A2_LATER_STAGES=skipped
A2_ALERT_STEP=Alert the operator conclusion=success
A2_ALERT_STAGE=migrations
A2_ALERT_MESSAGE_ID=ff6741a6-64f5-57e7-ad91-22d12edf6008
A2_ARTIFACTS=0
A2_INFRA_PLAN_RUN_ID=44250709928
A2_INFRA_PLAN_RUN_CONCLUSION=success
A2_SERVED_BUILD_AFTER=712947a1bd44a735f66ee8f51610f4748d76cd30
A2_RUNNING_IMAGE_READ=owed
A2_HOSTED_UNCHANGED=yes
A2_MIGRATIONS_PUSHED=none
A2_MIGRATIONS_PENDING_COUNT=21
A2_FUNCTIONS_DEPLOYED=none
A2_APPLIED=no
A2_HOSTED_WRITES=ecr-image,alert
A2_SUPABASE_ACCESS_TOKEN_SECRET_UPDATED=2026-11-15T19:33:29Z
A2_CAUSE=supabase-access-token-rejected
A2_CAUSE_STATUS=diagnosis-unconfirmed
A2_CODE_FIX=none
A2_REMEDY=operator-updates-staging-secret-SUPABASE_ACCESS_TOKEN
```

The log lines of the failed step, as printed, without their timestamps:

```
links=3
link_exit=1
Unexpected error retrieving remote project status: {"message":"Invalid access token"}
Try rerunning the command with --debug to troubleshoot the error.
##[error]supabase link exited 1.
##[error]Process completed with exit code 1.
```

And of the plan and the alert:

```
  # module.frontend.aws_ecs_service.app will be updated in-place
  # module.frontend.aws_ecs_task_definition.app must be replaced
Plan: 1 to add, 1 to change, 1 to destroy.
plan_exit=0
alert_stage=migrations
```

- **The gate.** `gh api .../actions/runs/44250710034/approvals` exit 0: one entry, `state` `approved`, environment `staging`. The deploy job then ran on `ubuntu-24.04-arm` from 06:34:17Z to 06:38:37Z (260 s, `A2_JOB_MINUTES=4.3` against the 60-minute limit). `A2_RUN_ATTEMPT=1` is the run's only attempt.
- **Steps 1 to 14 succeeded, so the ARM lock fix of plan 187-30 is observed working on the runner (`A2_ARM_LOCK_FIX_OBSERVED=yes`).** The build pushed a new image tagged with the green commit (`image_tag=9d6a55ca36ea56a5d3883ad95a10b4619c2472ad`, `A2_BUILD_DIGEST=`). `Initialise the staging AWS root` ran `init -lockfile=readonly`, installed `hashicorp/random` v3.9.1 and `hashicorp/aws` v6.68.0 and printed no warning (`A2_INIT_WARNED=no`; attempt 1 printed `Warning: Provider lock file not updated`). `Plan the staging AWS root with the built digest` printed `plan_exit=0` and `Plan: 1 to add, 1 to change, 1 to destroy.`: `module.frontend.aws_ecs_task_definition.app` replaced, its container image changed from the tag `712947a1b…` to the new digest, and `module.frontend.aws_ecs_service.app` updated in place, its `task_definition` known after apply; nothing else. That is the plan Task 1, attempt 2 expected (187-19's, with this run's own digest), so `A2_PLAN_AS_EXPECTED=yes`. `Show the plan` succeeded.
- **Step 15 failed.** `Link a work directory to the Supabase project` made its three links (`links=3`), then `supabase link` exited 1 (`link_exit=1`): `Unexpected error retrieving remote project status: {"message":"Invalid access token"}`, the Management API's answer to the token, before anything was linked. The step's environment shows `SUPABASE_ACCESS_TOKEN` and `SUPABASE_DB_PASSWORD` masked, so both secrets were set and non-empty; no value was read.
- **Steps 16 to 24 were skipped** (`A2_LATER_STAGES=skipped`): `Push the migrations`, `Deploy the functions`, `Assume the deploy role again for the apply`, `Apply the saved plan`, `Check the rollout is stable`, `Drop the rollout credentials`, `Install Playwright's Chromium`, `Run the deployed smoke entry` and `Read the served build again`. The cleanup step and the alert ran: `alert_stage=migrations` (the link step's outcome is grouped under the migrations stage), one alert published (`A2_ALERT_MESSAGE_ID=`). The run uploaded no artifact (`total_count` 0). `infra-plan.yml` run `44250709928`, started by the same push, is `completed` `success`.
- **What the run wrote (`A2_HOSTED_WRITES=ecr-image,alert`).** The image tagged `9d6a55ca3…` at `A2_BUILD_DIGEST` stays in the registry; no task definition names it, since the apply that would register one was skipped. One alert mail. No migration was pushed (`A2_MIGRATIONS_PUSHED=none`): the 21 migrations `00002` to `00022` are still pending on the persistent project, which holds `00001` alone. No function was deployed, nothing was applied.
- **Staging after the run.** `curl -sS --max-time 20 https://staging.openvaa.org/api/health` exit 0, HTTP 200, body `{"status":"ok","build":"712947a1bd44a735f66ee8f51610f4748d76cd30"}`, the build it served before (`SERVED_BUILD_BEFORE_SUPERSEDED=` of § Task 1, attempt 2). `A2_HOSTED_UNCHANGED=yes` rests on that read and on the skipped apply.
- **`A2_RUNNING_IMAGE_READ=owed`.** The read-only `infra/scripts/running-image-digest.sh` read was not made: with `AWS_PROFILE=openvaa-admin`, `aws sts get-caller-identity` exit 255, `Token has expired and refresh failed`, and the executor did not sign in. Expected, when it is made: `openvaa-staging-frontend:6`, reference `tag`, digest `sha256:bab8fa75c6094a2cecab07282826bffa4d9746bf7ee56fc7231b8283ea937bea`, as `A1_RUNNING_*_AFTER` and `RUNNING_*_BEFORE_SUPERSEDED` of § Task 1, attempt 2.
- **The cause, a DIAGNOSIS, UNCONFIRMED (`A2_CAUSE_STATUS=diagnosis-unconfirmed`).** The `staging` environment secret `SUPABASE_ACCESS_TOKEN` holds a token Supabase rejects with 401. The secret was last written `2026-11-15T19:33:29Z` (`A2_SUPABASE_ACCESS_TOKEN_SECRET_UPDATED=`, from the secrets list GET; its `created_at` is the same). On 2026-11-17, in the Step 18 sitting, the operator's own local token was rejected with the same 401 `Invalid access token`, and a token read again worked (§ Task 2). The likely cause is that the token stored in the GitHub secret is an old or revoked one. That the secret's value is the token rejected on 2026-11-17 is not established: the value cannot be read, and the executor made no Management API call.
- **The remedy (`A2_CODE_FIX=none`).** No code fix applies: the link step, its arguments and the workflow did what they should. The operator updates the `staging` environment secret `SUPABASE_ACCESS_TOKEN` with a valid personal access token; a later attempt is then a new attempt of key `187-21-2` with a new push. Run `44250710034` is not re-run.
- **Still open.** `MIGRATIONS_CALLTIME_PRIVILEGE_CHECKED=no` of § Task 2 stays open, as accepted there; this attempt pushed no migration, so it neither raised nor settled the question. The Supabase lock `constraints` confirmation (`SUPABASE_LOCK_CONSTRAINTS_CONFIRMED_SUPERSEDED=no` above) stays open for the next attempt's approval.

## Task 1, attempt 3 (2026-11-18)

The lines of this section were superseded on 2026-11-18 by plan 187-31, because attempt 4 records them again for the rebuilt commit; each keeps its value under a `*_SUPERSEDED=` name.

Recorded 2026-11-18 (UTC) by the plan executor of plan 187-21, attempt 3, from HEAD `8915ec66e895e7557b8f8b46bd6165571538a390`, at 07:21Z to 07:23Z. Attempt 3 reuses Task 1 attempt 2's commit; the lines are read again here because attempt 2's were superseded. The orchestrator had pushed before this section was written (§ Task 3, attempt 3), so the two reads that must precede a push, the branch's absence and no active run, are the orchestrator's reads before its push, confirmed afterwards by the reads named below. The executor pushed nothing, approved nothing, and wrote no hosted service or GitHub setting; its remote reads were `gh api` GETs (the `staging` environment's secret names and dates, no value; the repository's workflow runs), `git ls-remote origin` and one GET of `https://staging.openvaa.org/api/health`. Every status was read on its own line, never through a pipe.

### The commit

```
GREEN_COMMIT_SUPERSEDED=9d6a55ca36ea56a5d3883ad95a10b4619c2472ad
GREEN_REBUILT_SUPERSEDED=no
GREEN_TREE_OK_SUPERSEDED=yes
E2E_TREE_COVERS_GREEN_SUPERSEDED=yes
GREEN_PARENT_SUPERSEDED=340a200708c28fb7ed078d452138712f3400c789
```

- **`GREEN_COMMIT=`.** `git rev-parse refs/evidence/187/green` prints `9d6a55ca36ea56a5d3883ad95a10b4619c2472ad`, attempt 2's commit; its tree is `986dd2c11429bec0a578ba809444d8c76ec4c1f3`, its one parent `340a20070…` is still `origin/main`, and `git ls-tree refs/evidence/187/green -- .planning` lists nothing.
- **`GREEN_TREE_OK=yes`, `GREEN_REBUILT=no`.** `git diff --quiet refs/evidence/187/green HEAD -- . ':!.planning'` exit 0. The commits since attempt 2's Task 1 HEAD `dd5878fb3` touch `.planning/` only (`git diff --name-only dd5878fb3 HEAD -- . ':!.planning'` exit 0, empty).
- **`E2E_TREE_COVERS_GREEN=yes`.** `E2E_TREE_SHA=450632a5c933ccb806506b83a5c29bca31cdc672` is still the current line of `evidence/187-13-closing-e2e.md`; `git diff --quiet 450632a5c..HEAD -- apps packages tests` exit 0 and `git diff --quiet 450632a5c… refs/evidence/187/green -- apps packages tests` exit 0.

### The contestant and the token

```
CONTESTANT_READY_SUPERSEDED=yes
ENV_STAGING_SECRET_NAMES_SUPERSEDED=ALERT_EMAIL,SMOKE_CONTESTANT_EMAIL,SMOKE_CONTESTANT_PASSWORD,SUPABASE_ACCESS_TOKEN,SUPABASE_DB_PASSWORD
SUPABASE_ACCESS_TOKEN_SECRET_UPDATED_SUPERSEDED=2026-11-18T07:19:41Z
```

- `gh api repos/OpenVAA/voting-advice-application/environments/staging/secrets` exit 0, the five names above; no value was read. The two contestant secrets are dated 2026-11-15 as before, and `evidence/187-17-smoke-contestant.md` still holds `CONTESTANT_SECRETS_PRESENT=yes`.
- **`SUPABASE_ACCESS_TOKEN_SECRET_UPDATED=`.** The operator updated the secret after attempt 2's red link step (`A2_CAUSE=supabase-access-token-rejected`): `updated_at` now reads `2026-11-18T07:19:41Z` (it read `2026-11-15T19:33:29Z` for attempt 2), its `created_at` unchanged. Only the date was read.

### The expected plan

```
PR_PLAN_AS_EXPECTED_SUPERSEDED=yes
EXPECTED_PLAN_SUPERSEDED=Plan: 1 to add, 1 to change, 1 to destroy.
RUNNING_IMAGE_READ_BEFORE_SUPERSEDED=owed
```

- **`PR_PLAN_AS_EXPECTED=yes`.** `evidence/187-19-pr-plan.md` holds `PR_PLAN_SUMMARY=Plan: 1 to add, 1 to change, 1 to destroy.` with `PR_PLAN_MATCHES_EXPECTED=yes`, and attempt 2's run made that same plan from this same commit at 06:34Z today (`A2_PLAN_SUMMARY=`, `A2_PLAN_AS_EXPECTED=yes`) and applied nothing (`A2_APPLIED=no`); no deploy run has run since (below).
- **`RUNNING_IMAGE_READ_BEFORE=owed`.** With `AWS_PROFILE=openvaa-admin`, `aws sts get-caller-identity` exit 255, `Token has expired and refresh failed`; the executor did not sign in, so `infra/scripts/running-image-digest.sh` was not run. The state the plan is made on is attested by attempt 2's own plan (above) and the unchanged served build (below).

### The migrations

```
MIGRATIONS_AT_COMMIT_SUPERSEDED=00001_initial_schema.sql,00002_claim_excludes_identity_provider_accounts.sql,00003_address_confirmation_request.sql,00004_user_entities_pending_email_taken.sql,00005_invitation_link_bounds.sql,00006_nomination_write_guards.sql,00007_nomination_write_kept_constituency.sql,00008_bulk_import_key_quoting.sql,00009_contestant_app_public_config_bounded.sql,00010_claim_grant_key_conflict_target.sql,00011_invitation_email_target_open_rows.sql,00012_bulk_import_constituency_links.sql,00013_nomination_constituency_rule.sql,00014_set_entity_nominations_constituency_once.sql,00015_answers_lock_entity_rows.sql,00016_answers_lock_nominations_storage.sql,00017_user_can_reads_grants.sql,00018_identity_entity_find_or_create.sql,00019_address_holds_open_invitation.sql,00020_identity_metadata_written_under_lock.sql,00021_email_holds_global_or_account_grant.sql,00022_grants_reaching_a_project.sql
EXPECTED_PENDING_SUPERSEDED=00002,00003,00004,00005,00006,00007,00008,00009,00010,00011,00012,00013,00014,00015,00016,00017,00018,00019,00020,00021,00022
MIGRATIONS_PENDING_COUNT_SUPERSEDED=21
MIGRATIONS_ON_STAGING_SUPERSEDED=00001
MIGRATION_00001_BLOB_SUPERSEDED=2b07ce7c378db9c59b09165762b2b0bf0af351cf
MIGRATIONS_UNCHANGED_SINCE_ATTEMPT_1_SUPERSEDED=yes
MIGRATIONS_PENDING_MATCH_187_27_SUPERSEDED=21
```

- `git ls-tree --name-only refs/evidence/187/green apps/supabase/supabase/migrations/` exit 0, 22 files; `git diff --quiet 0a73bb6df refs/evidence/187/green -- apps/supabase/supabase/migrations` exit 0; the `00001` blob is the one staging's version was pushed from. Attempts 1 and 2 pushed no migration (`A1_MIGRATIONS_PUSHED=none`, `A2_MIGRATIONS_PUSHED=none`), so the persistent project still holds `00001` alone and this run's migrations step is expected to push the 21 versions above, one-way, under the one `staging` approval.

### The branch, the served build, the runs

```
GREEN_BRANCH_SUPERSEDED=deploy-evidence/187-green-3
GREEN_BRANCH_ABSENT_SUPERSEDED=yes
SERVED_BUILD_BEFORE_SUPERSEDED=712947a1bd44a735f66ee8f51610f4748d76cd30
NO_RUN_ACTIVE_SUPERSEDED=yes
```

- **`GREEN_BRANCH_ABSENT=yes`.** The orchestrator's `git ls-remote origin refs/heads/deploy-evidence/187-green-3` printed nothing before its push. The name holds no further `/` and is not `deploy-evidence/destroy-staging`; `grep -n deploy-evidence .github/workflows/*.yml` shows that only `deploy.yml` (`deploy-evidence/**`, less `!deploy-evidence/destroy-staging`) and `infra-plan.yml` (`deploy-evidence/**`) start on it, `destroy.yml` only on `deploy-evidence/destroy-staging`.
- **`SERVED_BUILD_BEFORE=`.** `curl -sS --max-time 20 https://staging.openvaa.org/api/health` exit 0 at 07:21Z, while the run's `checks` job ran and before any gated step, HTTP 200, body `{"status":"ok","build":"712947a1bd44a735f66ee8f51610f4748d76cd30"}`.
- **`NO_RUN_ACTIVE=yes`.** The orchestrator found no deploy run active before its push. Afterwards, `actions/runs?per_page=100` (exit 0) lists one run that is not `completed`, this attempt's `44258126898` of `deploy.yml`, and none with a `destroy` path; `gh run list --workflow deploy.yml` (exit 0) lists the four earlier runs `44250710034`, `44165083175`, `44088753181` and `44042442257`, each `completed` `failure`.

### Carried (not repeated)

- § Task 2's `STAGING_SETTINGS_HAND_APPLY_RECORDED=yes` (the Step 18 hand apply) and `MIGRATIONS_CALLTIME_PRIVILEGE_CHECKED=no` stay the current lines and are not written again.

## Task 3, attempt 3 (2026-11-18)

The lines of the first two fences of this section, "The binding and the push" and "The checks job and the gate", were superseded the same way on 2026-11-18 by plan 187-31. The `A3_` lines below stay current, but for `A3_RUNNING_IMAGE_READ` and `A3_CAUSE_STATUS`, which § Attempt 3, settled read-only records again.

Recorded 2026-11-18 (UTC) by the plan executor of plan 187-21, attempt 3. The executor pushed nothing, started or re-ran no workflow, approved no review and wrote no hosted service or GitHub setting; its remote reads were `gh run view`, `gh api` GETs and `git ls-remote origin`. Every status was read on its own line, never through a pipe.

### The binding and the push

```
GREEN_ATTEMPT_ID_SUPERSEDED=20261118T072017Z.8915ec66e
SUPABASE_LOCK_CONSTRAINTS_CONFIRMED_SUPERSEDED=yes
GREEN_PUSHED_SUPERSEDED=yes
GREEN_PUSHED_SHA_SUPERSEDED=9d6a55ca36ea56a5d3883ad95a10b4619c2472ad
GREEN_PUSHED_BRANCH_SUPERSEDED=deploy-evidence/187-green-3
GREEN_RUN_ID_SUPERSEDED=44258126898
GREEN_RUN_URL_SUPERSEDED=https://github.com/OpenVAA/voting-advice-application/actions/runs/44258126898
GREEN_INFRA_PLAN_RUN_ID_SUPERSEDED=44258126878
GREEN_INFRA_PLAN_RUN_CONCLUSION_SUPERSEDED=success
```

- **The binding.** The orchestrator opened attempt `20261118T072017Z.8915ec66e` of key `187-21-2` right after the operator's reply, which was given for attempt 3 as the orchestrator described it, and stored the reply; `put`, `bash "$A" bound 187-21-2 OPERATOR_REPLY plan=187-21 task=2` and `bash "$A" has 187-21-2 '^answer_push=approve$'` each exited 0 at top level. The executor ran `bash "$A" id 187-21-2` (prints the attempt id above), `bound`, `has '^answer_push=approve$'` and `has '^answer_constraints=ok$'` again before recording anything (all read-only): exit 0 each.
- **`SUPABASE_LOCK_CONSTRAINTS_CONFIRMED=yes`.** The stored reply holds `answer_constraints=ok`: the operator confirms the Supabase lock `constraints` line rewrite of plan 187-30 (`constraints = "~> 1.11"` to `constraints = "1.11.0, ~> 1.11"` in the three Supabase root locks), which attempt 2 left open (`SUPABASE_LOCK_CONSTRAINTS_CONFIRMED_SUPERSEDED=no`).
- **The orchestrator's checks before the push.** The green ref `9d6a55ca3…` and its tree equal to HEAD's outside `.planning/`; the E2E-tree gate exit 0; `git ls-remote` showing `deploy-evidence/187-green-3` absent; no deploy run active; only `deploy.yml` and `infra-plan.yml` triggered on `deploy-evidence/**`.
- **`GREEN_PUSHED=yes`.** The orchestrator pushed at top level after the binding: `git push origin 9d6a55ca36ea56a5d3883ad95a10b4619c2472ad:refs/heads/deploy-evidence/187-green-3` exit 0. The executor read it back: `git ls-remote origin refs/heads/deploy-evidence/187-green-3` exit 0, `9d6a55ca36ea56a5d3883ad95a10b4619c2472ad`, equal to `GREEN_COMMIT=` of § Task 1, attempt 3.
- **The run.** `gh run view 44258126898 --json ...` exit 0 at 07:21Z: event `push`, head branch `deploy-evidence/187-green-3`, head SHA `9d6a55ca36ea56a5d3883ad95a10b4619c2472ad`, created 07:20:37Z, `in_progress`, its `checks` job (id `134644636892`) started 07:20:41Z. The same push started `infra-plan.yml` run `44258126878`, read `completed` `success` at 07:23Z.

### The checks job and the gate

```
CHECKS_JOB_SUPERSEDED=success
CHECKS_JOB_ID_SUPERSEDED=134644636892
DEPLOY_JOB_ID_SUPERSEDED=134645147625
GATE_WAITED_SUPERSEDED=yes
GATE_ENVIRONMENT_SUPERSEDED=staging
GATE_WAIT_TIMER_SUPERSEDED=0
```

- **`CHECKS_JOB=success`.** `gh api repos/OpenVAA/voting-advice-application/actions/jobs/134644636892` exit 0: `success` on `ubuntu-24.04`, 07:20:41Z to 07:21:50Z (69 s). Steps, each `success`: Set up job (4 s), Checkout source code (7 s), Setup Terraform 1.16.5 (1 s), Check Terraform formatting (0 s), Validate the staging AWS root (9 s), Setup Node.js 24.21.0 (5 s), Setup Yarn 4.18 (27 s), Unit tests of the infrastructure scripts (13 s), and the post and complete steps (0 s).
- **`GATE_WAITED=yes`.** A background watcher read the run `waiting` at 07:22:02Z, and at 07:22:12Z `gh run view 44258126898` read the run `waiting` and its `deploy` job (id `134645147625`, created 07:21:50Z) `waiting`. `gh api repos/OpenVAA/voting-advice-application/actions/runs/44258126898/pending_deployments` (a GET) exit 0: one pending deployment, environment `staging`, `wait_timer` 0, a `User` reviewer. The review is left to the operator in the GitHub web interface; the executor made no POST to `pending_deployments` and approved nothing.

### The approval and the run: red at the stable step

Recorded read-only on 2026-11-18 (UTC) by the plan executor of plan 187-21, attempt 3, from HEAD `43207da3f`. The reads were `gh api` GETs of run `44258126898`, of its approvals (each entry's `state` and environment names only, no user), of the deploy job `134645147625` and of the run's artifacts; `gh run view 44258126898 --log --job 134645147625` to a file; five GETs of `https://staging.openvaa.org/api/health` between 07:32Z and 07:36Z; and `aws sts get-caller-identity` with `AWS_PROFILE=openvaa-admin` (exit 255, the session expired; the executor did not sign in). Each status was read on its own line; the outputs are under `tmp/187-21/a3/` (ignored). Nothing was pushed, approved or re-run, and no hosted service or GitHub setting was written. The run's own record is kept under `A3_` names, and the log excerpts below are indented, so that no line of a red run can satisfy a later attempt's check.

```
A3_ATTEMPT=20261118T072017Z.8915ec66e
A3_RUN_ID=44258126898
A3_RUN_URL=https://github.com/OpenVAA/voting-advice-application/actions/runs/44258126898
A3_RUN_HEAD=9d6a55ca36ea56a5d3883ad95a10b4619c2472ad
A3_RUN_BRANCH=deploy-evidence/187-green-3
A3_RUN_ATTEMPT=1
A3_RUN_CONCLUSION=failure
A3_GATE_REVIEW=approved
A3_GATE_ENVIRONMENT=staging
A3_DEPLOY_JOB_ID=134645147625
A3_DEPLOY_JOB_RUNNER=ubuntu-24.04-arm
A3_DEPLOY_JOB_STARTED=2026-11-18T07:25:48Z
A3_DEPLOY_JOB_COMPLETED=2026-11-18T07:31:19Z
A3_DEPLOY_STEPS=34
A3_STEP=Set up job conclusion=success seconds=2
A3_STEP=Checkout source code conclusion=success seconds=2
A3_STEP=Assume the deploy role conclusion=success seconds=1
A3_STEP=Build and push the image conclusion=success seconds=3
A3_STEP=Drop the build credentials conclusion=success seconds=0
A3_STEP=Setup Node.js 24.21.0 conclusion=success seconds=4
A3_STEP=Setup Yarn 4.18 conclusion=success seconds=24
A3_STEP=Install psql conclusion=success seconds=14
A3_STEP=Setup Terraform 1.16.5 conclusion=success seconds=1
A3_STEP=Assume the deploy role for the plan conclusion=success seconds=1
A3_STEP=Initialise the staging AWS root conclusion=success seconds=8
A3_STEP=Plan the staging AWS root with the built digest conclusion=success seconds=12
A3_STEP=Show the plan conclusion=success seconds=2
A3_STEP=Drop the plan credentials conclusion=success seconds=0
A3_STEP=Link a work directory to the Supabase project conclusion=success seconds=4
A3_STEP=Push the migrations conclusion=success seconds=120
A3_STEP=Deploy the functions conclusion=success seconds=6
A3_STEP=Assume the deploy role again for the apply conclusion=success seconds=1
A3_STEP=Apply the saved plan conclusion=success seconds=112
A3_STEP=Check the rollout is stable conclusion=failure seconds=7
A3_STEP=Drop the rollout credentials conclusion=skipped seconds=0
A3_STEP=Install Playwright's Chromium conclusion=skipped seconds=0
A3_STEP=Run the deployed smoke entry conclusion=skipped seconds=0
A3_STEP=Read the served build again conclusion=skipped seconds=0
A3_STEP=Remove the plan, the smoke output and the step files conclusion=success seconds=0
A3_STEP=Assume the deploy role again for the alert conclusion=success seconds=2
A3_STEP=Alert the operator conclusion=success seconds=1
A3_STEP=Post Assume the deploy role again for the alert conclusion=success seconds=0
A3_STEP=Post Assume the deploy role again for the apply conclusion=success seconds=0
A3_STEP=Post Assume the deploy role for the plan conclusion=success seconds=0
A3_STEP=Post Setup Node.js 24.21.0 conclusion=skipped seconds=0
A3_STEP=Post Assume the deploy role conclusion=success seconds=0
A3_STEP=Post Checkout source code conclusion=success seconds=0
A3_STEP=Complete job conclusion=success seconds=0
A3_JOB_MINUTES=5.5
A3_BUILD_EXIT_LINE=build_exit=3
A3_BUILD_TAG_EXISTS=yes
A3_BUILD_DIGEST=sha256:ccfaa5863a168dfd3d0a4f40257ede398255cb18c899419f68aa23a18b5638a3
A3_BUILD_DIGEST_EQUALS_A2=yes
A3_PLAN_EXIT_LINE=plan_exit=0
A3_PLAN_SUMMARY=Plan: 1 to add, 1 to change, 1 to destroy.
A3_PLAN_AS_EXPECTED=yes
A3_LINK_EXIT_LINE=link_exit=0
A3_LINKED_REF=cofbsatfrdysyphajsky
A3_SUPABASE_TOKEN_ACCEPTED=yes
A3_PUSH_CONNECTION=unknown
A3_PUSH_PENDING=00002,00003,00004,00005,00006,00007,00008,00009,00010,00011,00012,00013,00014,00015,00016,00017,00018,00019,00020,00021,00022
A3_PUSH_PENDING_EQUALS_EXPECTED=yes
A3_PUSH_UP_TO_DATE=no
A3_PUSH_CONFIRMATION=environment
A3_PUSH_STATUS=0
A3_DRIFT_STATUS=0
A3_DRIFT_HISTORY_DATABASE=00001..00022
A3_PUSH_EXIT=0
A3_FUNCTIONS_DEPLOY_EXIT=0
A3_FUNCTIONS_LIST_HTTP=200
A3_FUNCTION=account-access status=ACTIVE verify_jwt=false expected_verify_jwt=false
A3_FUNCTION=identity-callback status=ACTIVE verify_jwt=false expected_verify_jwt=false
A3_FUNCTION=send-email status=ACTIVE verify_jwt=true expected_verify_jwt=true
A3_APPLY_LINE=Apply complete! Resources: 1 added, 1 changed, 1 destroyed.
A3_APPLY_EXIT=0
A3_APPLY_SERVICE_SECONDS=105
A3_STABLE_DESCRIBE_EXIT=0
A3_STABLE_TASK_DEFINITION_MATCHES=yes
A3_STABLE_ROLLOUT_STATE=IN_PROGRESS
A3_STABLE_RUNNING=1
A3_STABLE_DESIRED=1
A3_FAILED_STEP=Check the rollout is stable
A3_FAILED_STEP_SECONDS=7
A3_LATER_STAGES=skipped
A3_SMOKE_RUN=no
A3_ALERT_STEP=Alert the operator conclusion=success
A3_ALERT_STAGE=stable
A3_ALERT_MESSAGE_ID=573cd82a-2cae-551b-8518-bb5d7a2d9b2b
A3_ARTIFACTS=0
A3_INFRA_PLAN_RUN_ID=44258126878
A3_INFRA_PLAN_RUN_CONCLUSION=success
A3_SERVED_BUILD_AFTER=9d6a55ca36ea56a5d3883ad95a10b4619c2472ad
A3_SERVED_BUILD_READS=5
A3_RUNNING_IMAGE_READ_SUPERSEDED=owed
A2_RUNNING_IMAGE_READ_STILL=owed
A3_HOSTED_CHANGED=yes
A3_MIGRATIONS_PUSHED=00002..00022
A3_MIGRATIONS_PENDING_COUNT=0
A3_FUNCTIONS_DEPLOYED=account-access,identity-callback,send-email
A3_APPLIED=yes
A3_HOSTED_WRITES=migrations,functions,task-definition,service-rollout,alert
A3_CAUSE=stable-check-read-rollout-in-progress-once
A3_CAUSE_STATUS_SUPERSEDED=diagnosis-unconfirmed
A3_CODE_FIX=needed-new-plan
```

The log lines of the failed step, as printed, without their timestamps (indented here):

```
  stable_describe_exit=0
  stable_task_definition_matches=yes
  stable_rollout_state=IN_PROGRESS
  stable_running=1
  stable_desired=1
  ##[error]The primary deployment does not run the applied task definition with a completed rollout and at least 1 running tasks.
  ##[error]Process completed with exit code 1.
```

Of the build, the plan, the link, the migrations, the functions, the apply and the alert (the 21 `push_pending=` lines, `00002` to `00022`, are summed up in `A3_PUSH_PENDING=`; the apply's ten-second progress lines are left out):

```
  tag_exists=yes image_digest=sha256:ccfaa5863a168dfd3d0a4f40257ede398255cb18c899419f68aa23a18b5638a3
  build_exit=3
  # module.frontend.aws_ecs_service.app will be updated in-place
  # module.frontend.aws_ecs_task_definition.app must be replaced
  Plan: 1 to add, 1 to change, 1 to destroy.
  plan_exit=0
  links=3
  link_exit=0
  linked_ref=cofbsatfrdysyphajsky
  push_connection=unknown
  push_up_to_date=no
  push_confirmation=environment
  push_status=0
  check-drift.sh: history: manifest: 00001 00002 00003 00004 00005 00006 00007 00008 00009 00010 00011 00012 00013 00014 00015 00016 00017 00018 00019 00020 00021 00022
  check-drift.sh: history: database: 00001 00002 00003 00004 00005 00006 00007 00008 00009 00010 00011 00012 00013 00014 00015 00016 00017 00018 00019 00020 00021 00022
  check-drift.sh: history: holds
  check-drift.sh: schema: holds
  check-drift.sh: CLEAN -- the history equals the manifest and the diff is empty
  drift_status=0
  push_exit=0
  functions_deploy_exit=0
  functions_list_http=200
  functions_expected=account-access identity-callback send-email
  functions_served=account-access identity-callback send-email
  module.frontend.aws_ecs_task_definition.app: Destruction complete after 1s
  module.frontend.aws_ecs_task_definition.app: Creation complete after 0s [id=openvaa-staging-frontend]
  module.frontend.aws_ecs_service.app: Modifications complete after 1m45s
  Apply complete! Resources: 1 added, 1 changed, 1 destroyed.
  apply_exit=0
  alert_stage=stable
```

- **The gate.** `gh api .../actions/runs/44258126898/approvals` exit 0: one entry, `state` `approved`, environment `staging`; a poll read the deploy job `queued` at 07:25:48Z, the job's start time, after its last `waiting` read at 07:25:28Z. The deploy job ran on `ubuntu-24.04-arm` from 07:25:48Z to 07:31:19Z (331 s, `A3_JOB_MINUTES=5.5` against the 60-minute limit). `A3_RUN_ATTEMPT=1` is the run's only attempt.
- **Steps 1 to 19 succeeded.** The build step found the image tag `9d6a55ca3…` already in the registry, pushed there by attempt 2's build, and printed its digest (`build_exit=3`, `tag_exists=yes`), which the workflow accepts; `A3_BUILD_DIGEST=` equals `A2_BUILD_DIGEST=`. The plan was the expected one (`A3_PLAN_AS_EXPECTED=yes`). The link step, red in attempt 2, linked `cofbsatfrdysyphajsky` (`link_exit=0`): the updated `SUPABASE_ACCESS_TOKEN` secret is accepted, which bears out attempt 2's diagnosis (`A2_CAUSE=supabase-access-token-rejected`). The migrations step pushed the 21 expected versions `00002` to `00022` (`A3_PUSH_PENDING_EQUALS_EXPECTED=yes`, equal to `EXPECTED_PENDING=` of § Task 1, attempt 3) under the environment's approval, `push_status=0`, and the drift check read `history: holds`, `schema: holds`, `drift_status=0`. `push_connection=unknown`: the CLI's debug log named neither path, so the pooler is attested only by the step's `PGHOST`/`PGPORT=5432` settings that the drift check used, not by the CLI. The functions step deployed the three functions, each `ACTIVE` with `verify_jwt` as configured. The apply replaced the task definition and updated the service; the service's update returned after 1m45s (`wait_for_steady_state = true` in `infra/modules/frontend-service/service.tf`).
- **Step 20 failed.** `Check the rollout is stable` read `aws ecs describe-services` once, 0 s after the apply: the primary deployment runs the applied task definition (`stable_task_definition_matches=yes`) with `stable_running=1` of `stable_desired=1`, but its `rolloutState` was `IN_PROGRESS`, not `COMPLETED`, so the step exited 1.
- **Steps 21 to 24 were skipped** (`A3_LATER_STAGES=skipped`): `Drop the rollout credentials`, `Install Playwright's Chromium`, `Run the deployed smoke entry` and `Read the served build again`. No smoke run was made (`A3_SMOKE_RUN=no`). The cleanup step and the alert ran: `alert_stage=stable`, one alert published (`A3_ALERT_MESSAGE_ID=`). The run uploaded no artifact (`total_count` 0). `infra-plan.yml` run `44258126878` is `completed` `success`.
- **What the run wrote (`A3_HOSTED_WRITES=`), one-way.** Unlike attempts 1 and 2, this run changed staging: the 21 migrations are pushed and the persistent project's history now reads `00001` to `00022` (`A3_MIGRATIONS_PENDING_COUNT=0`); the three functions are deployed from the green commit; the task definition is replaced (the image by digest, per the plan) and the service rolled onto it; one alert mail. No new image was pushed (the tag existed).
- **Staging after the run.** Five GETs of `https://staging.openvaa.org/api/health`, at 07:32:17Z, 07:33:02Z, 07:34:03Z, 07:35:03Z and 07:36:03Z, each exit 0, HTTP 200 (first read) and body `{"status":"ok","build":"9d6a55ca36ea56a5d3883ad95a10b4619c2472ad"}`: staging serves the green commit, and over those four minutes no rollback to `712947a1b…` was seen.
- **`A3_RUNNING_IMAGE_READ=owed`, and attempt 2's read still owed.** With `AWS_PROFILE=openvaa-admin`, `aws sts get-caller-identity` exit 255 (at 07:21Z and again at 07:37Z), `Token has expired and refresh failed`; the executor did not sign in. So neither `infra/scripts/running-image-digest.sh` (expected now: reference `digest`, digest `A3_BUILD_DIGEST=`) nor a `describe-services` read of the deployment's present `rolloutState` was made. Attempt 2's owed read (`A2_RUNNING_IMAGE_READ=owed`, which expected the tag `712947a1b…`) can no longer be made as it was meant: the apply of this run has replaced that state.
- **The cause, a DIAGNOSIS, UNCONFIRMED (`A3_CAUSE_STATUS=diagnosis-unconfirmed`).** The stable step reads the deployment once, with no wait, right after the apply, and requires `rolloutState` `COMPLETED`. Terraform's `wait_for_steady_state` returned once the service was stable, and the step then saw the primary deployment on the applied task definition with `running` equal to `desired`, but `rolloutState` still `IN_PROGRESS`. The likely cause is that ECS sets a deployment's `rolloutState` to `COMPLETED` some time after the service is stable in the sense the provider waits for, so the step's single read raced it. Not established: whether the deployment has since reached `COMPLETED` (the AWS read is owed), whether a second deployment was still listed at the read (the step prints only the primary's fields), and exactly what condition the provider's wait checks for. The served build reading the green commit for four minutes afterwards is consistent with a rollout that completed, not proof of it.
- **The remedy (`A3_CODE_FIX=needed-new-plan`).** A fix is a code change to the stable step (for example, waiting for the primary deployment's `rolloutState` to leave `IN_PROGRESS` within a bound, failing on `FAILED` or on the bound), and so a new plan; it is not made here. Run `44258126898` is not re-run. Since staging now holds the migrations, the functions and the applied task definition, a later attempt's run would find no migration pending (`push_up_to_date=yes` expected) and a plan without the task definition's replacement unless the digest differs, so its expected lines differ from those of § Task 1, attempt 3.
- **Still open.** `MIGRATIONS_CALLTIME_PRIVILEGE_CHECKED=no` of § Task 2 stays open, as accepted there, but is now live: `00018` and `00020` are pushed, so their SECURITY DEFINER functions exist on the persistent project; staging configures no identity provider, so nothing staging runs calls either. The smoke gate's `PASS` lines, `served_build_after_smoke=`, `RUNNING_IMAGE_REFERENCE=digest` and `RUNNING_IMAGE_DIGEST=` are not observed for this run.

## Attempt 3, settled read-only (2026-11-18, plan 187-31)

Recorded by the plan executor of plan 187-31 from the orchestrator's read-only AWS reads, made after the operator signed in to the `openvaa-admin` session, from one GET of job `134645147625` (`gh api repos/OpenVAA/voting-advice-application/actions/jobs/134645147625`, exit 0), and from the executor's own optional read-only re-read with that session (`aws sts get-caller-identity` exit 0, then `infra/scripts/running-image-digest.sh` exit 0 and one `aws ecs describe-services` exit 0); the executor did not sign in and wrote nothing hosted. The outputs are under `tmp/187-31/a3/` (ignored).

```
A3_LATER_READ_BY=orchestrator
A3_LATER_READ_FILE=copied
A3_LATER_DEPLOYMENTS=1
A3_LATER_PRIMARY_ROLLOUT_STATE=COMPLETED
A3_LATER_PRIMARY_TASK_DEFINITION=arn:aws:ecs:eu-north-1:471112560111:task-definition/openvaa-staging-frontend:7
A3_LATER_PRIMARY_UPDATED_AT=2026-11-18T07:31:38.687Z
A3_LATER_RUNNING=1
A3_LATER_DESIRED=1
A3_STABLE_STEP_STARTED=2026-11-18T07:31:06Z
A3_STABLE_STEP_COMPLETED=2026-11-18T07:31:13Z
A3_COMPLETED_AFTER_STABLE_STEP_SECONDS=25-32
A3_RUNNING_TASK_DEFINITION_AFTER=arn:aws:ecs:eu-north-1:471112560111:task-definition/openvaa-staging-frontend:7
A3_RUNNING_IMAGE_REFERENCE_AFTER=digest
A3_RUNNING_IMAGE_DIGEST_AFTER=sha256:ccfaa5863a168dfd3d0a4f40257ede398255cb18c899419f68aa23a18b5638a3
A3_RUNNING_IMAGE_DIGEST_EQUALS_BUILD=yes
A3_RUNNING_IMAGE_READ=made
A3_CAUSE_STATUS=diagnosis-confirmed
A3_REREAD=made
A3_REREAD_RUNNING_IMAGE_DIGEST=sha256:ccfaa5863a168dfd3d0a4f40257ede398255cb18c899419f68aa23a18b5638a3
A3_EVENT=2026-11-18T07:31:38.716Z (service openvaa-staging-frontend) (deployment ecs-svc/8561824730520920110) deployment completed.
A3_EVENT=2026-11-18T07:31:38.717Z (service openvaa-staging-frontend) has reached a steady state.
```

- **The diagnosis, confirmed.** `updatedAt` is the deployment's last update, and the deployment is `COMPLETED` and the only one listed, so it is read as the time it went `COMPLETED`: 25 s after the stable step ended and 32 s after it started, in whole seconds. The re-read dates it directly: the service's event `deployment completed` was written at `07:31:38.716Z`, the same second. The step's single read, at 07:31:06Z to 07:31:13Z, saw the rollout `IN_PROGRESS` while it was still completing. The re-read's `describe-services` agrees with the orchestrator's on every field above: one deployment, `PRIMARY`, `COMPLETED`, task definition `:7`, 1 of 1 running, `updatedAt` `2026-11-18T07:31:38.687Z`.
- **The image runs by digest.** `running-image-digest.sh` printed reference `digest` and digest `sha256:ccfaa586…`, the one attempt 3's build step printed (`A3_BUILD_DIGEST=`), in the orchestrator's read and in the re-read alike.
- **Run `44258126898` is not re-run.** The fix is plan 187-31: the stable step reads the rollout again while it is `IN_PROGRESS`, within a bound.
- **Staging's new state.** The persistent project holds `00001` to `00022`, none pending; the three functions are those of `9d6a55ca3`; the service runs task definition `:7` by digest and serves `9d6a55ca3`.
- **Still open.** The call-time privilege question of § Task 2 (`MIGRATIONS_CALLTIME_PRIVILEGE_CHECKED=no` there) is still open, and it is now live: `00018` and `00020` are pushed, so their SECURITY DEFINER functions exist on the persistent project, and whether the hosted `postgres` role holds the privileges they need is still unread. Bank authentication is not configured on staging, which configures no identity provider, so nothing staging runs calls the functions of `00018` and `00020`.

## Task 1, attempt 4 (2026-11-18)

Recorded 2026-11-18 (UTC) by the plan executor of plan 187-21, attempt 4, from HEAD `04ef26389f3eab1d90e648469e1a5e8e06cf530f`, at 08:27Z to 08:29Z, after plan 187-31 (`READY_FOR_187_21_ATTEMPT_4=yes` in `evidence/187-31-stable-poll.md`). Nothing was pushed, no workflow was started or re-run, no review was approved, and no hosted service or GitHub setting was written. The remote reads were `gh api` GETs (the `staging` environment's secret names and dates, no value; the repository's workflow runs), `gh run list`, one `git ls-remote origin`, one GET of `https://staging.openvaa.org/api/health`, and, with `AWS_PROFILE=openvaa-admin` (the session was valid; the executor did not sign in), `aws sts get-caller-identity`, `infra/scripts/running-image-digest.sh` and one `aws ecs describe-services`, all of which only read. Every status was read on its own line, never through a pipe; the outputs are under `tmp/187-21/a4/` (ignored).

### The commit

```
GREEN_COMMIT=331b5db28058a1f8bc4ef88a3841080a4610efa2
GREEN_REBUILT=no
GREEN_TREE_OK=yes
E2E_TREE_COVERS_GREEN=yes
GREEN_PARENT=340a200708c28fb7ed078d452138712f3400c789
GREEN_DIFF_VS_A3=.github/workflows/deploy.yml,infra/README.md,infra/scripts/deploy-workflow.test.ts,infra/scripts/workflow-errexit.test.ts
```

- **`GREEN_COMMIT=`.** `git rev-parse refs/evidence/187/green` prints `331b5db28058a1f8bc4ef88a3841080a4610efa2`, the commit plan 187-31 rebuilt (`GREEN_COMMIT=` of `evidence/187-12-evidence-commits.md` § Re-run 2026-11-18 (plan 187-31)); its tree is `8bce93f9922d4cf4c9b780d0652fe3c3b2fcecd5`, its one parent `340a20070…` is `origin/main`, and `git ls-tree refs/evidence/187/green -- .planning` lists nothing.
- **`GREEN_TREE_OK=yes`, `GREEN_REBUILT=no`.** `git diff --quiet refs/evidence/187/green HEAD -- . ':!.planning'` exit 0, so this plan's own rule did not rebuild once more.
- **`E2E_TREE_COVERS_GREEN=yes`.** `E2E_TREE_SHA=450632a5c933ccb806506b83a5c29bca31cdc672` is still the current line of `evidence/187-13-closing-e2e.md` (§ Re-run 2026-11-16, plan 187-28); `git diff --quiet 450632a5c..HEAD -- apps packages tests` exit 0 and `git diff --quiet 450632a5c refs/evidence/187/green -- apps packages tests` exit 0.
- **`GREEN_DIFF_VS_A3=`.** `git diff --name-only 9d6a55ca3 refs/evidence/187/green` exit 0 names the four paths of plan 187-31's fix (`FIX_PATHS=` there) and nothing else.

### The contestant and the token

```
CONTESTANT_READY=yes
ENV_STAGING_SECRET_NAMES=ALERT_EMAIL,SMOKE_CONTESTANT_EMAIL,SMOKE_CONTESTANT_PASSWORD,SUPABASE_ACCESS_TOKEN,SUPABASE_DB_PASSWORD
SUPABASE_ACCESS_TOKEN_SECRET_UPDATED=2026-11-18T07:19:41Z
```

- `gh api repos/OpenVAA/voting-advice-application/environments/staging/secrets` exit 0, the five names above; no value was read. The two contestant secrets are dated 2026-11-15 as before, and `evidence/187-17-smoke-contestant.md` still holds `CONTESTANT_SECRETS_PRESENT=yes`.
- **`SUPABASE_ACCESS_TOKEN_SECRET_UPDATED=`.** Unchanged since attempt 3, whose link step accepted it (`A3_SUPABASE_TOKEN_ACCEPTED=yes`). Only the date was read.

### The expected plan

```
PR_PLAN_AS_EXPECTED=yes
EXPECTED_PLAN=Plan: 1 to add, 1 to change, 1 to destroy.
RUNNING_TASK_DEFINITION_BEFORE=arn:aws:ecs:eu-north-1:471112560111:task-definition/openvaa-staging-frontend:7
RUNNING_IMAGE_REFERENCE_BEFORE=digest
RUNNING_IMAGE_DIGEST_BEFORE=sha256:ccfaa5863a168dfd3d0a4f40257ede398255cb18c899419f68aa23a18b5638a3
RUNNING_IMAGE_DIGEST_BEFORE_EQUALS_A3_BUILD=yes
RUNNING_IMAGE_READ_BEFORE=made
RUNNING_DEPLOYMENTS_BEFORE=1
RUNNING_ROLLOUT_STATE_BEFORE=COMPLETED
```

- **The running state.** `aws sts get-caller-identity --query Account` exit 0 (`471112560111`). `infra/scripts/running-image-digest.sh --cluster openvaa-staging --service openvaa-staging-frontend` exit 0 printed task definition `:7`, reference `digest` and digest `sha256:ccfaa586…`, equal to `A3_BUILD_DIGEST=`, as the execution rules' note of 2026-11-18 expects. `aws ecs describe-services` exit 0: one deployment, `PRIMARY`, `rolloutState` `COMPLETED`, task definition `:7`, 1 of 1 running, `updatedAt` `2026-11-18T07:31:38.687Z`, as § Attempt 3, settled read-only recorded it. No deploy run has run since attempt 3 (below).
- **`PR_PLAN_AS_EXPECTED=yes`.** Read from attempt 3's plan and the running state, as the note says, not from 187-19's plan alone (made against `:6` by tag): attempt 3's plan was `A3_PLAN_SUMMARY=Plan: 1 to add, 1 to change, 1 to destroy.` with `A3_PLAN_AS_EXPECTED=yes`, and was applied. The green commit is a new commit and so a new tag, so the build is a new one (`build_exit=0`, not 3) with a new digest; the plan then replaces `module.frontend.aws_ecs_task_definition.app` again, its image changing from `…@sha256:ccfaa586…` to the new digest, and updates `module.frontend.aws_ecs_service.app` in place: `Plan: 1 to add, 1 to change, 1 to destroy.` The four changed paths touch no Terraform file (`TF_FILES_CHANGED=0` of plan 187-31).

### The migrations

```
MIGRATIONS_AT_COMMIT=00001_initial_schema.sql,00002_claim_excludes_identity_provider_accounts.sql,00003_address_confirmation_request.sql,00004_user_entities_pending_email_taken.sql,00005_invitation_link_bounds.sql,00006_nomination_write_guards.sql,00007_nomination_write_kept_constituency.sql,00008_bulk_import_key_quoting.sql,00009_contestant_app_public_config_bounded.sql,00010_claim_grant_key_conflict_target.sql,00011_invitation_email_target_open_rows.sql,00012_bulk_import_constituency_links.sql,00013_nomination_constituency_rule.sql,00014_set_entity_nominations_constituency_once.sql,00015_answers_lock_entity_rows.sql,00016_answers_lock_nominations_storage.sql,00017_user_can_reads_grants.sql,00018_identity_entity_find_or_create.sql,00019_address_holds_open_invitation.sql,00020_identity_metadata_written_under_lock.sql,00021_email_holds_global_or_account_grant.sql,00022_grants_reaching_a_project.sql
MIGRATIONS_ON_STAGING=00001..00022
EXPECTED_PENDING=none
MIGRATIONS_PENDING_COUNT=0
MIGRATIONS_UNCHANGED_SINCE_A3=yes
MIGRATION_00001_BLOB=2b07ce7c378db9c59b09165762b2b0bf0af351cf
```

- **`MIGRATIONS_AT_COMMIT=`.** `git ls-tree --name-only refs/evidence/187/green apps/supabase/supabase/migrations/` exit 0, 22 files; the `00001` blob is unchanged.
- **`MIGRATIONS_UNCHANGED_SINCE_A3=yes`.** `git diff --quiet 9d6a55ca3 refs/evidence/187/green -- apps/supabase/supabase/migrations` exit 0: the migrations are those attempt 3 pushed.
- **`MIGRATIONS_ON_STAGING=00001..00022`.** Read as Task 1 read it before, from the records, not on the hosted project: attempt 3's drift check, the last write of the persistent project's history, read `history: database: 00001` to `00022`, `history: holds`, `schema: holds`, `drift_status=0` (`A3_DRIFT_HISTORY_DATABASE=00001..00022`; the same line is in the saved job log `tmp/187-21/a3/deploy-job.log`, read again now). No deploy run has run since (below), and the staging Supabase runbook's Observations record no later push (its last row is dated 2026-11-17, the Step 18 hand apply).
- **`EXPECTED_PENDING=none`.** Every version at the commit is on the persistent project. In the run, expect `push_up_to_date=yes`, no `push_pending=` line and `drift_status=0`; no migration is pushed.

### The branch, the served build, the runs

```
GREEN_BRANCH=deploy-evidence/187-green-4
GREEN_BRANCH_ABSENT=yes
SERVED_BUILD_BEFORE=9d6a55ca36ea56a5d3883ad95a10b4619c2472ad
NO_RUN_ACTIVE=yes
```

- **`GREEN_BRANCH_ABSENT=yes`.** `git ls-remote origin refs/heads/deploy-evidence/187-green-4` exit 0, 0 bytes. The name holds no further `/` and is not `deploy-evidence/destroy-staging`. `grep -n deploy-evidence .github/workflows/*.yml`, and the `on:` blocks of every workflow, read again: only `deploy.yml` (`deploy-evidence/**`, less `!deploy-evidence/destroy-staging`) and `infra-plan.yml` (`deploy-evidence/**`) start on it; `destroy.yml` starts only on `deploy-evidence/destroy-staging`, `main.yaml` on `main` and `ci-evidence/**`, `docs.yml` and `release.yml` on `main`, and the three `claude*` workflows on no push.
- **`SERVED_BUILD_BEFORE=`.** `curl -sS --max-time 20 https://staging.openvaa.org/api/health` exit 0 at 08:27Z, HTTP 200, body `{"status":"ok","build":"9d6a55ca36ea56a5d3883ad95a10b4619c2472ad"}`.
- **`NO_RUN_ACTIVE=yes`.** `gh run list --workflow deploy.yml` exit 0 lists five runs, `44258126898`, `44250710034`, `44165083175`, `44088753181` and `44042442257`, each `completed` `failure`, none since attempt 3. `destroy.yml` is not on the default branch, so `gh run list --workflow destroy.yml` answers 404; among the latest 100 runs of the repository (`actions/runs?per_page=100`, exit 0) none has a `destroy` path and none is other than `completed`. The status-filtered counts are 0 for `in_progress`, `queued`, `waiting`, `requested` and `pending`; `action_required` counts 25, all `claude.yml`, and 0 of `deploy.yml` or `destroy.yml`.

### Expected in the run (attempt 4)

- The build: `build_exit=0`, a new digest. The plan: `Plan: 1 to add, 1 to change, 1 to destroy.`, the task definition replaced with the new image. The migrations: `push_up_to_date=yes`, `drift_status=0`. The functions: the three deployed from the green commit, each `ACTIVE`. The stable step: `stable_poll=<n>` before each read's lines, the last read `stable_rollout_state=COMPLETED`. Then the smoke run and the served-build re-read; the alert step skipped.
- The hosted writes: a new image, the three functions, the task definition replaced and the service rolled onto it; no migration.

### Carried (not repeated)

- § Task 2's `STAGING_SETTINGS_HAND_APPLY_RECORDED=yes` (the Step 18 hand apply) stands. `MIGRATIONS_CALLTIME_PRIVILEGE_CHECKED=no` stays open and live, outside this attempt's scope, as the execution rules' note of 2026-11-18 says. The operator's `answer_constraints=ok` of attempt 3 stands and is not asked again. `A2_RUNNING_IMAGE_READ_STILL=owed` stays as it is.
