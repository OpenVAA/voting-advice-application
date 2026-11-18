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
