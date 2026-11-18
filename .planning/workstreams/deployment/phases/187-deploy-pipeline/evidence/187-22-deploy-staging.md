# 187-22 — The first deploy from `deploy/staging`

Repository: `OpenVAA/voting-advice-application`. Staging: `https://staging.openvaa.org`.

## Task 1 — Readiness, read-only (2026-11-18)

Recorded 2026-11-18 (UTC) by the plan executor of plan 187-22, from HEAD `22a9d40ca8677a435a5b74edd9fe711cf8f8b803`, at 09:12:51Z to 09:13:50Z. Nothing was pushed, no branch was created, no workflow was started or re-run, no review was approved, and no hosted service or GitHub setting was written. The remote reads were one `git ls-remote origin refs/heads/deploy/staging` and one of `refs/heads/deploy/*` with `refs/heads/main`; one GET of `https://staging.openvaa.org/api/health`; `gh api` GETs of `actions/runs` (status-filtered, and the latest 100), `gh run list --workflow deploy.yml`, and `environments/<E>` with `environments/<E>/deployment-branch-policies` for `staging` and `staging-destroy`; and, with `AWS_PROFILE=openvaa-admin` (the session was valid; the executor did not sign in), `aws sts get-caller-identity`, `infra/scripts/running-image-digest.sh`, one `aws ecs describe-services` and one `aws ecr describe-images`, all of which only read. Every status was read on its own line, never through a pipe; the outputs are under `tmp/187-22/t1/` (ignored).

```
READ_AT=2026-11-18T09:12:51Z
BRANCH_COMMIT=331b5db28058a1f8bc4ef88a3841080a4610efa2
BRANCH_COMMIT_IS_GREEN_REF=yes
BRANCH_DIGEST_EXPECTED=sha256:b4a14b890f132c8c2c1150ad3a2355f389fba7304e7b7c1ce0d8804152c195d4
DEPLOY_STAGING_ABSENT=yes
DEPLOY_STAGING_ADMITTED=yes
SERVED_BUILD_BEFORE=331b5db28058a1f8bc4ef88a3841080a4610efa2
RUNNING_TASK_DEFINITION_BEFORE=arn:aws:ecs:eu-north-1:471112560111:task-definition/openvaa-staging-frontend:8
RUNNING_IMAGE_REFERENCE_BEFORE=digest
RUNNING_IMAGE_DIGEST_BEFORE=sha256:b4a14b890f132c8c2c1150ad3a2355f389fba7304e7b7c1ce0d8804152c195d4
RUNNING_DEPLOYMENTS_BEFORE=1
RUNNING_ROLLOUT_STATE_BEFORE=COMPLETED
REGISTRY_TAG_DIGEST=sha256:b4a14b890f132c8c2c1150ad3a2355f389fba7304e7b7c1ce0d8804152c195d4
NO_RUN_ACTIVE=yes
MAIN_TRIGGER_IN_DEPLOY=no
MAIN_ADMITTED=no
GREEN_TREE_EQUALS_HEAD_OUTSIDE_PLANNING=no
GREEN_DIFF_VS_HEAD_OUTSIDE_PLANNING=infra/envs/staging/aws/README.md
REBUILD_WOULD_CHANGE_COMMIT=yes
```

- **`BRANCH_COMMIT=`.** Read from `evidence/187-21-green-run.md` with `sed -n 's/^GREEN_COMMIT=//p'`: the anchored pattern takes the one current line (`grep -c '^GREEN_COMMIT='` is 1) and none of the `GREEN_COMMIT_SUPERSEDED=` lines. `git rev-parse refs/evidence/187/green` prints the same commit (`BRANCH_COMMIT_IS_GREEN_REF=yes`); its tree is `8bce93f99…`, its one parent `340a20070…` is still `origin/main` (`git ls-remote` of `refs/heads/main` names it), and `git ls-tree` of it lists nothing under `.planning`. `BRANCH_DIGEST_EXPECTED=` is plan 187-21's `BUILD_DIGEST=`, read the same way (`sed -n 's/^BUILD_DIGEST=//p'`, `grep -c '^BUILD_DIGEST='` 1; `A1_BUILD_DIGEST=`, `A2_BUILD_DIGEST=` and `A3_BUILD_DIGEST=` are not matched).
- **`DEPLOY_STAGING_ABSENT=yes`.** `git ls-remote origin refs/heads/deploy/staging` exit 0 printed nothing (0 bytes); `refs/heads/deploy/*` names no branch either.
- **`DEPLOY_STAGING_ADMITTED=yes`.** `deploy/staging` equals the `deploy/staging` rule of both environments' policies, so the gated job's environment admits the branch about to be created.
- **`SERVED_BUILD_BEFORE=`.** `/api/health` exit 0, HTTP 200, body `{"status":"ok","build":"331b5db28058a1f8bc4ef88a3841080a4610efa2"}`: staging serves the commit about to be pushed. `running-image-digest.sh --cluster openvaa-staging --service openvaa-staging-frontend` exit 0: task definition `:8`, reference `digest`, digest `sha256:b4a14b89…`, equal to `BRANCH_DIGEST_EXPECTED=`; `describe-services` exit 0: one deployment, `PRIMARY`, `COMPLETED`, task definition `:8`, 1 of 1 running.
- **`REGISTRY_TAG_DIGEST=`.** `aws ecr describe-images --repository-name openvaa-frontend --image-ids imageTag=331b5db28…` exit 0 printed `sha256:b4a14b89…`, the expected digest: the registry already holds the commit's image, so `build-push-image.sh` is expected to exit 3 with `tag_exists=yes` and that digest.
- **`NO_RUN_ACTIVE=yes`.** The status-filtered counts of `actions/runs` are 0 for `queued`, `in_progress`, `waiting`, `requested` and `pending`. `action_required` counts 25, every one `completed` with conclusion `action_required` (the `Claude Code` workflow on `pull_request_review` and `pull_request_review_comment` events, the latest at 2026-11-14T08:44:45Z), so none is active. Among the latest 100 runs none is other than `completed` and none has a `destroy` path. `gh run list --workflow deploy.yml` exit 0 lists six runs, all `completed`: `44270824581` `success` (plan 187-21's green run) and the five earlier `failure` runs.
- **`MAIN_TRIGGER_IN_DEPLOY=no`.** `git show 331b5db28:.github/workflows/deploy.yml` exit 0. Its `on:` block is `push.branches` `deploy/staging`, `deploy-evidence/**`, `!deploy-evidence/destroy-staging`, and `workflow_dispatch`; `grep -cE '\bmain\b'` over the block counts 0, and no branch filter anywhere in the file names `main`. HEAD's `deploy.yml` is byte-identical (`git diff --quiet 331b5db28 HEAD -- .github/workflows/deploy.yml` exit 0).
- **`MAIN_ADMITTED=no`.** Fresh GETs, each exit 0: `staging` and `staging-destroy` both hold `custom_branch_policies=true`, `protected_branches=false`, and exactly the two `branch` rules `deploy-evidence/*` and `deploy/staging`, as `evidence/187-14-environments.md` § Task 3 recorded them. Matching `main` against each rule with the shell's glob (`[[ main == <rule> ]]`) matches none.
- **`GREEN_TREE_EQUALS_HEAD_OUTSIDE_PLANNING=no`, recorded and not acted on.** `git diff --quiet 331b5db28 HEAD -- . ':!.planning'` exit 1; `--name-only` names `infra/envs/staging/aws/README.md` alone, the runbook's observation row for run 44270824581 that plan 187-21 Task 3 added (commit `db50c2dda`) after the green commit was built. This plan's rules do not ask for that equality: Task 1 takes `BRANCH_COMMIT=` from plan 187-21's `GREEN_COMMIT=`, Task 3 pushes `<BRANCH_COMMIT>:refs/heads/deploy/staging`, and Task 1's verify compares `SERVED_BUILD_BEFORE=` with `BRANCH_COMMIT=`. The tree rule and its rebuild belong to plan 187-21's execution rules. No rebuild was made.
- **`REBUILD_WOULD_CHANGE_COMMIT=yes`.** The evidence commits are built from HEAD's tree without `.planning/` on `origin/main`, so a rebuild now would carry the README row: a different tree and therefore a different commit. That commit has no image in the registry and is not the one staging serves, so its run would build a new image (`build_exit=0`, not 3), its plan would replace the task definition, and `SERVED_BUILD_BEFORE=` would differ from `BRANCH_COMMIT=`. Task 1's verify, and Task 3's `BUILD_EXIT=3`, `BUILD_TAG_EXISTS=yes`, `BUILD_DIGEST_SAME=yes`, `PLAN_NO_CHANGES=yes` and `APPLY_NO_CHANGES=yes`, would then all fail. The difference is one Markdown row under `infra/`, outside `apps packages tests`, and `.dockerignore` excludes `infra` from the image's build context; the only change a rebuild would bring is the commit id itself.

## Task 3 — The push and the second run of the same commit (2026-11-18)

Recorded 2026-11-18 (UTC) by the plan executor of plan 187-22. The executor pushed nothing, started or re-ran no workflow, approved no review and wrote no hosted service or GitHub setting; its remote reads were `gh run view`, `gh api` GETs and `git ls-remote origin`. Every status was read on its own line, never through a pipe; the outputs are under `tmp/187-22/t3/` (ignored).

### The binding and the push

```
DEPLOY_STAGING_ATTEMPT_ID=20261118T091540Z.c76e378df
DEPLOY_STAGING_PUSHED=yes
DEPLOY_STAGING_PUSHED_SHA=331b5db28058a1f8bc4ef88a3841080a4610efa2
STAGING_RUN_ID=44276384977
STAGING_RUN_URL=https://github.com/OpenVAA/voting-advice-application/actions/runs/44276384977
MAIN_PUSHED=no
```

- **The binding.** The orchestrator opened attempt `20261118T091540Z.c76e378df` of key `187-22-2` and stored the operator's reply, given after the orchestrator recommended pushing `331b5db28` as it stands, without a rebuild (§ Task 1's `REBUILD_WOULD_CHANGE_COMMIT=yes`); `put`, `bash "$A" bound 187-22-2 OPERATOR_REPLY plan=187-22 task=2` and `bash "$A" has 187-22-2 '^answer_push=approve$'` each exited 0 at top level. The executor ran `bound` and `has '^answer_push=approve$'` again at 09:30Z before recording anything (both read-only): exit 0 each.
- **The orchestrator's checks before the push.** Task 1's verify exit 0; `git ls-remote` showing `deploy/staging` absent; no deploy run active.
- **`DEPLOY_STAGING_PUSHED=yes`.** The orchestrator pushed at top level after the binding: `git push origin 331b5db28058a1f8bc4ef88a3841080a4610efa2:refs/heads/deploy/staging` exit 0. The executor read it back: `git ls-remote origin refs/heads/deploy/staging` exit 0, `331b5db28058a1f8bc4ef88a3841080a4610efa2`, equal to `BRANCH_COMMIT=` of § Task 1. No push to `main` was made (`MAIN_PUSHED=no`).
- **The run.** `gh run view 44276384977 --json ...` exit 0: event `push`, head branch `deploy/staging`, head SHA `331b5db28058a1f8bc4ef88a3841080a4610efa2`, created 09:29:26Z, attempt 1, its `checks` job (id `134705501754`) started 09:29:29Z. `actions/runs?head_sha=331b5db28…` (a GET, exit 0) lists this run as the only one the push started: `infra-plan.yml` has no `deploy/staging` trigger (`grep -n 'deploy/staging' .github/workflows/*.yml` names only `deploy.yml`'s `push.branches` and two comments), so, unlike plan 187-21's evidence branches, no plan run accompanies it.

### The checks job and the gate

```
CHECKS_JOB=success
CHECKS_JOB_ID=134705501754
DEPLOY_JOB_ID=134706135937
GATE_WAITED=yes
GATE_ENVIRONMENT=staging
GATE_WAIT_TIMER=0
```

- **`CHECKS_JOB=success`.** `gh api repos/OpenVAA/voting-advice-application/actions/jobs/134705501754` exit 0: `success` on `ubuntu-24.04`, 09:29:29Z to 09:30:37Z (68 s). Steps, each `success`: Set up job (4 s), Checkout source code (5 s), Setup Terraform 1.16.5 (1 s), Check Terraform formatting (0 s), Validate the staging AWS root (10 s), Setup Node.js 24.21.0 (4 s), Setup Yarn 4.18 (27 s), Unit tests of the infrastructure scripts (13 s), and the post and complete steps (0 s).
- **`GATE_WAITED=yes`.** A background watcher read the run `waiting` at 09:30:52Z, and at 09:31:06Z `gh run view 44276384977` read the run `waiting`, the `checks` job `completed` `success` and the `deploy` job (id `134706135937`, created 09:30:38Z) `waiting`. `gh api repos/OpenVAA/voting-advice-application/actions/runs/44276384977/pending_deployments` (a GET) exit 0: one pending deployment, environment `staging`, `wait_timer` 0, a `User` reviewer. The review is left to the operator in the GitHub web interface; the executor made no POST to `pending_deployments` and approved nothing. A second background watcher reads the deploy job every 60 s, for up to 90 minutes, until it leaves `waiting`.

### The approval and the run: green, nothing built, nothing changed

Recorded read-only on 2026-11-18 (UTC) by the plan executor of plan 187-22. The reads were `gh api` GETs of run `44276384977`, of its approvals (each entry's `state` and environment names only, no user), of the deploy job `134706135937` and of the run's artifacts; `gh run view 44276384977 --log --job 134706135937` to a file; one GET of `https://staging.openvaa.org/api/health` at 10:08:12Z; `git ls-remote origin` of `deploy/staging` and `main`; and, with `AWS_PROFILE=openvaa-admin` (the session was valid, `aws sts get-caller-identity` exit 0; the executor did not sign in), `infra/scripts/running-image-digest.sh` and one `aws ecs describe-services`, all of which only read. Each status was read on its own line. Nothing was pushed, approved or re-run, and no hosted service or GitHub setting was written. The lines below are copied from the log without their timestamps and colour codes; none holds an address or a token.

```
GATE_REVIEW=approved
GATE_REVIEW_ENVIRONMENT=staging
GATE_APPROVED_BETWEEN=2026-11-18T10:01:47Z..2026-11-18T10:02:47Z
DEPLOY_JOB_RUNNER=ubuntu-24.04-arm
DEPLOY_JOB_STARTED=2026-11-18T10:02:47Z
DEPLOY_JOB_COMPLETED=2026-11-18T10:06:45Z
DEPLOY_STEPS=33
STEP=Set up job conclusion=success seconds=2
STEP=Checkout source code conclusion=success seconds=2
STEP=Assume the deploy role conclusion=success seconds=1
STEP=Build and push the image conclusion=success seconds=2
STEP=Drop the build credentials conclusion=success seconds=0
STEP=Setup Node.js 24.21.0 conclusion=success seconds=5
STEP=Setup Yarn 4.18 conclusion=success seconds=23
STEP=Install psql conclusion=success seconds=15
STEP=Setup Terraform 1.16.5 conclusion=success seconds=1
STEP=Assume the deploy role for the plan conclusion=success seconds=1
STEP=Initialise the staging AWS root conclusion=success seconds=8
STEP=Plan the staging AWS root with the built digest conclusion=success seconds=11
STEP=Show the plan conclusion=success seconds=2
STEP=Drop the plan credentials conclusion=success seconds=0
STEP=Link a work directory to the Supabase project conclusion=success seconds=4
STEP=Push the migrations conclusion=success seconds=105
STEP=Deploy the functions conclusion=success seconds=3
STEP=Assume the deploy role again for the apply conclusion=success seconds=2
STEP=Apply the saved plan conclusion=success seconds=5
STEP=Check the rollout is stable conclusion=success seconds=7
STEP=Drop the rollout credentials conclusion=success seconds=0
STEP=Install Playwright's Chromium conclusion=success seconds=17
STEP=Run the deployed smoke entry conclusion=success seconds=17
STEP=Read the served build again conclusion=success seconds=1
STEP=Remove the plan, the smoke output and the step files conclusion=success seconds=0
STEP=Assume the deploy role again for the alert conclusion=skipped seconds=0
STEP=Alert the operator conclusion=skipped seconds=0
STEP=Post Assume the deploy role again for the apply conclusion=success seconds=0
STEP=Post Assume the deploy role for the plan conclusion=success seconds=0
STEP=Post Setup Node.js 24.21.0 conclusion=success seconds=0
STEP=Post Assume the deploy role conclusion=success seconds=0
STEP=Post Checkout source code conclusion=success seconds=0
STEP=Complete job conclusion=success seconds=0
STAGING_JOB_MINUTES=4.0
STAGING_JOB_LIMIT_MINUTES=60
BUILD_EXIT=3
BUILD_TAG_EXISTS=yes
BUILD_DIGEST_THIS_RUN=sha256:b4a14b890f132c8c2c1150ad3a2355f389fba7304e7b7c1ce0d8804152c195d4
BUILD_DIGEST_SAME=yes
PLAN_SUMMARY_LINE=No changes. Your infrastructure matches the configuration.
plan_exit=0
PLAN_NO_CHANGES=yes
links=3
link_exit=0
linked_ref=cofbsatfrdysyphajsky
push_connection=unknown
push_up_to_date=yes
drift_status=0
push_exit=0
MIGRATIONS_PUSHED=none
DRIFT_HISTORY=00001..00022
functions_deploy_exit=0
functions_list_http=200
function=account-access status=ACTIVE verify_jwt=false expected_verify_jwt=false
function=identity-callback status=ACTIVE verify_jwt=false expected_verify_jwt=false
function=send-email status=ACTIVE verify_jwt=true expected_verify_jwt=true
functions_expected=account-access identity-callback send-email
functions_served=account-access identity-callback send-email
FUNCTIONS_REDEPLOYED=yes
APPLY_LINE=Apply complete! Resources: 0 added, 0 changed, 0 destroyed.
apply_exit=0
APPLY_NO_CHANGES=yes
stable_poll=1
stable_describe_exit=0
stable_task_definition_matches=yes
stable_rollout_state=COMPLETED
stable_running=1
stable_desired=1
STABLE_POLLS_READ=1
PASS service-role-key-absent
PASS origin
PASS sha
PASS ref
PASS project-id
SMOKE_PASSED=2 passed (15.9s)
smoke_exit=0
served_build_after_smoke=331b5db28058a1f8bc4ef88a3841080a4610efa2
ALERT_STEP=skipped
STAGING_ARTIFACTS=0
STAGING_RUN_ATTEMPT=1
STAGING_RUN_CONCLUSION=success
SERVED_BUILD_AFTER=331b5db28058a1f8bc4ef88a3841080a4610efa2
RUNNING_TASK_DEFINITION_AFTER=arn:aws:ecs:eu-north-1:471112560111:task-definition/openvaa-staging-frontend:8
RUNNING_IMAGE_REFERENCE_AFTER=digest
RUNNING_IMAGE_DIGEST_AFTER=sha256:b4a14b890f132c8c2c1150ad3a2355f389fba7304e7b7c1ce0d8804152c195d4
RUNNING_IMAGE_UNCHANGED=yes
RUNNING_DEPLOYMENTS_AFTER=1
RUNNING_ROLLOUT_STATE_AFTER=COMPLETED
SERVICE_DEPLOYMENT_UPDATED_AT=2026-11-18T09:05:53Z
HOSTED_WRITES=functions
DEPLOY_STAGING_AT_END=331b5db28058a1f8bc4ef88a3841080a4610efa2
MAIN_AT_END=340a200708c28fb7ed078d452138712f3400c789
DISPATCH_OBSERVABLE=after-merge
```

- **The gate.** `gh api .../actions/runs/44276384977/approvals` exit 0: one entry, `state` `approved`, environment `staging`. The approval watcher read the deploy job `waiting` 31 times, every 60 s, from 09:31:24Z to 10:01:47Z, then `queued` at 10:02:48Z and `in_progress` at 10:03:48Z; the job GET gives its start as 10:02:47Z. So the operator approved the review in the web interface between 10:01:47Z and 10:02:47Z, about 32 minutes after the gate opened. The executor approved nothing.
- **Every step succeeded, in the workflow's order** (`DEPLOY_STEPS=33`, one `STEP=` line each, from the job GET; the same 33 steps as plan 187-21's green run). The job ran on `ubuntu-24.04-arm` from 10:02:47Z to 10:06:45Z, 238 s: `STAGING_JOB_MINUTES=4.0` against the 60-minute limit, against 10.1 for the run that built and rolled. Only the two alert steps were skipped, as their `if: failure() || cancelled()` conditions require on a green job. `STAGING_RUN_ATTEMPT=1` is the run's only attempt.
- **`BUILD_EXIT=3`, `BUILD_TAG_EXISTS=yes`, `BUILD_DIGEST_SAME=yes`: nothing built.** The build step printed `tag_exists=yes image_digest=sha256:b4a14b890f132c8c2c1150ad3a2355f389fba7304e7b7c1ce0d8804152c195d4` and `build_exit=3`, and passed in 2 s (184 s for plan 187-21's build). The workflow reads exit 3 as "take the digest and continue" (`.github/workflows/deploy.yml`: only an exit other than 0 and 3 fails the step). The digest equals plan 187-21's `BUILD_DIGEST=` and § Task 1's `BRANCH_DIGEST_EXPECTED=` and `REGISTRY_TAG_DIGEST=` (string comparison, equal): the image is built once and deployed by digest.
- **`PLAN_NO_CHANGES=yes`.** `No changes. Your infrastructure matches the configuration.`, `plan_exit=0`, printed by the plan step and again by the show step; no resource line. With the same digest, the task definition the plan would write is the one staging runs.
- **The link and the migrations.** `link_exit=0` on `cofbsatfrdysyphajsky`. The dry run found nothing to push: `push_up_to_date=yes`, no `push_pending=` line and no `push_confirmation=` line (`grep -c` over the log: 0 each). The drift check read the manifest and the database's history, each `00001` to `00022` (22 versions), `history: holds`, `schema: holds`, `CLEAN`, `drift_status=0`. No migration was pushed (`MIGRATIONS_PUSHED=none`). `push_connection=unknown` as in plan 187-21's runs; the drift check's pooler host is not copied here.
- **`FUNCTIONS_REDEPLOYED=yes`.** The functions step deploys on every run: `functions_deploy_exit=0` (its CLI output goes to a runner file the log does not print), `functions_list_http=200`, the three functions each `ACTIVE` with `verify_jwt` as `config.toml` sets it, and the served slugs equal the function directories of the commit. The code deployed is the green commit's, the same as plan 187-21's run deployed.
- **`APPLY_NO_CHANGES=yes`.** `Apply complete! Resources: 0 added, 0 changed, 0 destroyed.`, `apply_exit=0`, in 5 s (112 s when the task definition was replaced).
- **The stable step.** One read: the primary deployment on the applied task definition, `COMPLETED`, 1 of 1 running, so the step passed on its first poll (`STABLE_POLLS_READ=1`, 7 s): with no apply change there was no rollout to wait for.
- **The smoke run.** The deployed smoke gate printed its five `PASS` lines (service-role-key-absent, origin, sha, ref, project-id) and `DEPLOYED SMOKE GATE OK` with the green commit as `build`, ref `cofbsatfrdysyphajsky` and project `00000000-0000-0000-0000-000000000001`; both specs passed, the contestant's sign-in, home and sign-out and the voter's answers to candidate results, `2 passed (15.9s)`, `smoke_exit=0`.
- **The re-read.** `served_build_after_smoke=331b5db28058a1f8bc4ef88a3841080a4610efa2`, equal to the run's SHA and to `BRANCH_COMMIT=`.
- **Nothing uploaded, no alert.** `gh api .../runs/44276384977/artifacts` exit 0, `total_count` 0. The alert step was skipped.
- **From the workstation.** `/api/health` at 10:08:12Z: exit 0, HTTP 200, body `{"status":"ok","build":"331b5db28058a1f8bc4ef88a3841080a4610efa2"}`. `infra/scripts/running-image-digest.sh --cluster openvaa-staging --service openvaa-staging-frontend` exit 0: task definition `:8`, reference `digest`, digest `sha256:b4a14b89…`, the same as § Task 1's `RUNNING_*_BEFORE=` lines (`RUNNING_IMAGE_UNCHANGED=yes`). `aws ecs describe-services` exit 0: one deployment, `PRIMARY`, `COMPLETED`, task definition `:8`, 1 of 1 running, last updated 09:05:53Z, the moment plan 187-21's rollout completed: this run rolled nothing.
- **What the run wrote (`HOSTED_WRITES=functions`).** Only the three functions, redeployed from the same commit. No image, no migration, no task definition, no service rollout, no alert mail.
- **The branch and `main` at the end.** `git ls-remote origin` exit 0: `deploy/staging` at `331b5db28…` (`BRANCH_COMMIT=`), and `main` at `340a20070…`, the parent of the green commit, as § Task 1 recorded it. No push to `main` was made.
- **`DISPATCH_OBSERVABLE=after-merge`.** `deploy.yml` also starts on `workflow_dispatch`, but GitHub offers a dispatch only for a workflow on the default branch, and `main` does not hold `deploy.yml` yet. A dispatch becomes observable once the milestone merges; phase 189 observes it with the first push to `main`.
- **Runner warnings, not acted on.** The job printed the same kinds of `##[warning]` lines as before (Yarn's peer-dependency and disabled build-script notes, the Node 20 deprecation of `threeal/setup-yarn-action`), and the Yarn cache could not be restored or saved because GitHub's cache service answered 400 and then "Our services aren't available right now". The step succeeded without the cache. No step failed.
