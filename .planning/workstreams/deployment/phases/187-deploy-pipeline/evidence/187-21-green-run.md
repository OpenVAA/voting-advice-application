# 187-21 evidence: the first green pipeline deploy

## Task 1: readiness, read-only (2026-11-17)

Recorded 2026-11-17 (UTC) by the plan executor of plan 187-21, from HEAD `619505b3685c71ba315b587f2eb852415cb80f2b`, between 14:50Z and 14:58Z. Nothing was pushed, no workflow was started, and no hosted service or GitHub setting was written. The remote reads were `gh api` GETs (the `staging` environment's secret names, the repository's workflow runs), one `git ls-remote origin`, one GET of `https://staging.openvaa.org/api/health`, and, with `AWS_PROFILE=openvaa-admin`, `aws sts get-caller-identity` and `infra/scripts/running-image-digest.sh`, which only reads. Every status was read on its own line, never through a pipe.

### The commit

```
GREEN_COMMIT=0a73bb6dfd7a06c904f40f0bfa0454d9b7fbc499
GREEN_REBUILT=no
GREEN_TREE_OK=yes
E2E_TREE_COVERS_GREEN=yes
```

- **`GREEN_COMMIT=`.** `git rev-parse refs/evidence/187/green` prints `0a73bb6dfd7a06c904f40f0bfa0454d9b7fbc499`, the commit plan 187-19 rebuilt and pushed as `pr-evidence/187-head` (`PR_HEAD_PUSHED=` of `evidence/187-19-pr-plan.md`). Its tree is `fe42deb049d9dcbb43dc53aeecd17855862cc2dd`, and `git ls-tree refs/evidence/187/green -- .planning` lists nothing.
- **`GREEN_TREE_OK=yes`, `GREEN_REBUILT=no`.** `git diff --quiet refs/evidence/187/green HEAD -- . ':!.planning'` exit 0. The commits since the rebuild (`e2bcf829d` to `619505b36`) touch `.planning/` only, so the execution rules' rebuild did not run.
- **`E2E_TREE_COVERS_GREEN=yes`.** `E2E_TREE_SHA=450632a5c933ccb806506b83a5c29bca31cdc672` is the current line of `evidence/187-13-closing-e2e.md` (§ Re-run 2026-11-16, plan 187-28: 729 passed, 0 failed, 0 flaky, 0 did not run, 0 skipped). `git diff --quiet 450632a5c933ccb806506b83a5c29bca31cdc672..HEAD -- apps packages tests` exit 0.

### The contestant

```
CONTESTANT_READY=yes
ENV_STAGING_SECRET_NAMES=ALERT_EMAIL,SMOKE_CONTESTANT_EMAIL,SMOKE_CONTESTANT_PASSWORD,SUPABASE_ACCESS_TOKEN,SUPABASE_DB_PASSWORD
```

- `gh api repos/OpenVAA/voting-advice-application/environments/staging/secrets --jq '[.secrets[].name]|sort|join(",")'` exit 0, the five names above; no value was read. `evidence/187-17-smoke-contestant.md` holds `CONTESTANT_SECRETS_PRESENT=yes` (Task 3, 2026-11-15) and records the hosted contestant's full deployed smoke run green (`GREEN_SMOKE_EXIT=0`, `GREEN_VERDICT_EXIT=0`, `CREDENTIAL_LEAK_CHECK=clean`). The names are unchanged since then.

### The expected plan

```
PR_PLAN_AS_EXPECTED=yes
RUNNING_TASK_DEFINITION_BEFORE=arn:aws:ecs:eu-north-1:471112560111:task-definition/openvaa-staging-frontend:6
RUNNING_IMAGE_REFERENCE_BEFORE=tag
RUNNING_IMAGE_DIGEST_BEFORE=sha256:bab8fa75c6094a2cecab07282826bffa4d9746bf7ee56fc7231b8283ea937bea
```

- **`PR_PLAN_AS_EXPECTED=yes`.** `evidence/187-19-pr-plan.md` holds `PR_PLAN_SUMMARY=Plan: 1 to add, 1 to change, 1 to destroy.`, `PR_PLAN_MATCHES_EXPECTED=yes`, `PR_PLAN_SUBSCRIPTION_UNCHANGED=yes` and `PR_PLAN_IN_SUMMARY=yes`, made from this same commit (`PR_HEAD_PUSHED=0a73bb6df…`) at 14:34Z today: `module.frontend.aws_ecs_task_definition.app` replaced and `module.frontend.aws_ecs_service.app` updated in place, nothing else.
- **The state that plan was made on still stands.** `aws sts get-caller-identity --query Account` exit 0 (`471112560111`). `infra/scripts/running-image-digest.sh --cluster openvaa-staging --service openvaa-staging-frontend` exit 0 printed the three lines above, the same task definition, reference and digest as the plan job's digest step of run `44104573552`. No deploy run has run since (below). The green run's plan differs from the pull request's in one value only: its `image_digest` is the digest its own build pushes, not the running one, so the same two addresses change and the image is new.

### The migrations

```
MIGRATIONS_AT_COMMIT=00001_initial_schema.sql,00002_claim_excludes_identity_provider_accounts.sql,00003_address_confirmation_request.sql,00004_user_entities_pending_email_taken.sql,00005_invitation_link_bounds.sql,00006_nomination_write_guards.sql,00007_nomination_write_kept_constituency.sql,00008_bulk_import_key_quoting.sql,00009_contestant_app_public_config_bounded.sql,00010_claim_grant_key_conflict_target.sql,00011_invitation_email_target_open_rows.sql,00012_bulk_import_constituency_links.sql,00013_nomination_constituency_rule.sql,00014_set_entity_nominations_constituency_once.sql,00015_answers_lock_entity_rows.sql,00016_answers_lock_nominations_storage.sql,00017_user_can_reads_grants.sql,00018_identity_entity_find_or_create.sql,00019_address_holds_open_invitation.sql,00020_identity_metadata_written_under_lock.sql,00021_email_holds_global_or_account_grant.sql,00022_grants_reaching_a_project.sql
EXPECTED_PENDING=00002,00003,00004,00005,00006,00007,00008,00009,00010,00011,00012,00013,00014,00015,00016,00017,00018,00019,00020,00021,00022
MIGRATIONS_PENDING_COUNT=21
MIGRATIONS_ON_STAGING=00001
MIGRATION_00001_BLOB=2b07ce7c378db9c59b09165762b2b0bf0af351cf
MIGRATIONS_PENDING_MATCH_187_27=21
```

- **`MIGRATIONS_AT_COMMIT=`.** `git ls-tree --name-only refs/evidence/187/green apps/supabase/supabase/migrations/` exit 0, 22 files.
- **`EXPECTED_PENDING=` is not `none`.** The plan's assumption (only the baseline `00001` exists) does not hold at this commit: the rebase onto the -gsd stream (plan 187-27) brought `00002` to `00022`. The persistent project `cofbsatfrdysyphajsky` holds `00001` alone: `evidence/184-21-persistent-apply-push-functions.md` (phase 184) records the push of `00001` and a second run with `push_up_to_date=yes` and the drift report `history: database: 00001`, and no later row of the staging Supabase runbook's Observations records a push. So the green run's migrations step will push these 21 versions under the one `staging` approval (C-04), one-way.
- **`MIGRATION_00001_BLOB=`.** `git rev-parse refs/evidence/187/green:apps/supabase/supabase/migrations/00001_initial_schema.sql`, the blob 187-27 recorded for the version staging holds, so the baseline is unchanged and the push leaves it alone.
- **`MIGRATIONS_PENDING_MATCH_187_27=21`.** Each of the 21 files' blob at the green commit equals the `blob=` of its `MIGRATION_PENDING=` line in `evidence/187-27-ci-closure.md` § Task 2, which read every top-level statement and found none that needs a hosted step before a pooler `db push` (`MIGRATIONS_NEEDING_HAND_STEP=none`).

### For the reviewer of Task 2 (from the records of plan 187-27, not re-read on hosted services)

```
STAGING_SETTINGS_HAND_APPLY=needed-before:187-21
STAGING_SETTINGS_HAND_APPLY_RECORDED=no
MIGRATIONS_CALLTIME_PRIVILEGE_CHECKED=no
```

- **`STAGING_SETTINGS_HAND_APPLY=needed-before:187-21`, `STAGING_SETTINGS_HAND_APPLY_RECORDED=no`.** `deferred-items.md` (2026-11-16, plan 187-27) and `evidence/187-27-ci-closure.md` § Task 2 require the operator to apply Step 18 of `infra/envs/staging/supabase/README.md` (`R=staging`) in the same sitting as this deploy, immediately before its approval: `mailer_otp_length` 6 to 10, and the redirect paths from `/api/auth/callback` to `/auth/confirm`. The functions this run deploys issue a sign-in link only when `/auth/confirm` is admitted, and `deploy.yml` sets no auth setting. The last row of that runbook's Observations is dated 2026-11-15, so no such apply is recorded yet. Without it the run can still be green (the smoke signs in with a password and mails nothing), but staging's mailed links would be refused after the deploy until the apply.
- **`MIGRATIONS_CALLTIME_PRIVILEGE_CHECKED=no`.** `00018_identity_entity_find_or_create.sql` and `00020_identity_metadata_written_under_lock.sql` define SECURITY DEFINER functions, owned by the pushing role, that update `auth.users` at call time. The push creates them without exercising that privilege; whether the hosted `postgres` role holds it is unread, as 187-27 left it for this review. Staging configures no identity provider, so neither function is called by what staging runs.

### The branch, the served build, the runs

```
GREEN_BRANCH_ABSENT=yes
SERVED_BUILD_BEFORE=712947a1bd44a735f66ee8f51610f4748d76cd30
NO_RUN_ACTIVE=yes
```

- **`GREEN_BRANCH_ABSENT=yes`.** `git ls-remote origin refs/heads/deploy-evidence/187-green` exit 0, 0 bytes.
- **`SERVED_BUILD_BEFORE=`.** `curl -sS --max-time 20 https://staging.openvaa.org/api/health` exit 0, HTTP 200, body `{"status":"ok","build":"712947a1bd44a735f66ee8f51610f4748d76cd30"}`.
- **`NO_RUN_ACTIVE=yes`.** `gh run list --workflow deploy.yml` exit 0 lists two runs, `44088753181` (`deploy-evidence/187-red-2`) and `44042442257` (`deploy-evidence/187-red`), both `completed` `failure`. `destroy.yml` is not on the default branch, so `gh run list --workflow destroy.yml` answers 404; among the latest 100 runs of the repository (`actions/runs?per_page=100`, exit 0) none has the path `destroy.yml`, and none of any workflow is other than `completed`. The status-filtered counts are 0 for `in_progress`, `queued`, `waiting`, `requested` and `pending`; `action_required` counts 25, all `claude.yml` runs of 2026-11-14 pull-request review events, and 0 of `deploy.yml` or `destroy.yml`.
