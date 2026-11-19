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
