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
