# 187-23 — The destroy path up to its apply

Repository: `OpenVAA/voting-advice-application`. Staging: `https://staging.openvaa.org`.

## Task 1 — Readiness, read-only (2026-11-18)

Recorded 2026-11-18 (UTC) by the plan executor of plan 187-23, from HEAD `6bd92f72df3ac96268b58164cd7e5597de1f00b8`, at 10:11:55Z to 10:14Z. Nothing was pushed, no branch was created, no workflow was started or re-run, no review was approved or rejected, and no hosted service or GitHub setting was written. The remote reads were one `git ls-remote origin refs/heads/deploy-evidence/destroy-staging` and one of `refs/heads/deploy-evidence/*`, `refs/heads/deploy/*` and `refs/heads/main`; one GET of `https://staging.openvaa.org/api/health`; `gh api` GETs of `environments/staging-destroy` with its `deployment-branch-policies`, `secrets` and `variables`, of `actions/runs` (status-filtered, the latest 100, and filtered by the destroy branch), of `actions/workflows` and `actions/workflows/destroy.yml`, and of the repository; and, with `AWS_PROFILE=openvaa-admin` (the session was valid; the executor did not sign in), `aws sts get-caller-identity`, `infra/scripts/running-image-digest.sh`, one `aws ecs describe-services` and one `terraform -chdir=infra/envs/staging/aws state list` on the already-initialised root, all of which only read. Every status was read on its own line, never through a pipe; the outputs are under `tmp/187-23/t1/` (ignored).

```
READ_AT=2026-11-18T10:11:55Z
DESTROY_COMMIT=331b5db28058a1f8bc4ef88a3841080a4610efa2
DESTROY_COMMIT_IS_GREEN_REF=yes
DESTROY_COMMIT_IS_DEPLOY_STAGING_TIP=yes
DESTROY_BRANCH_ABSENT=yes
DESTROY_BRANCH_ADMITTED=yes
DEPLOY_EXCLUDES_DESTROY_BRANCH=yes
DESTROY_TRIGGERS_ON_BRANCH=yes
DESTROY_WORKFLOW_ON_DEFAULT_BRANCH=no
DESTROY_WORKFLOW_REGISTERED=no
ALSO_STARTED_BY_PUSH=infra-plan.yml
STAGING_DESTROY_SECRETS=0
STAGING_DESTROY_VARIABLES=0
STAGING_DESTROY_REVIEWERS=1
SERVED_BUILD_BEFORE=331b5db28058a1f8bc4ef88a3841080a4610efa2
RUNNING_TASK_DEFINITION_BEFORE=arn:aws:ecs:eu-north-1:471112560111:task-definition/openvaa-staging-frontend:8
RUNNING_IMAGE_REFERENCE_BEFORE=digest
RUNNING_IMAGE_DIGEST_BEFORE=sha256:b4a14b890f132c8c2c1150ad3a2355f389fba7304e7b7c1ce0d8804152c195d4
RUNNING_DEPLOYMENTS_BEFORE=1
RUNNING_ROLLOUT_STATE_BEFORE=COMPLETED
STATE_ADDRESSES_BEFORE=46
STATE_MANAGED_BEFORE=40
STATE_OUTSIDE_MODULE_BEFORE=0
NO_RUN_ACTIVE=yes
DESTROY_TREE_EQUALS_HEAD_OUTSIDE_PLANNING=no
DESTROY_DIFF_VS_HEAD_OUTSIDE_PLANNING=infra/envs/staging/aws/README.md
DESTROY_INPUTS_EQUAL_HEAD=yes
REBUILD_REQUIRED=no
```

- **`DESTROY_COMMIT=`.** Read from `evidence/187-22-deploy-staging.md` with `sed -n 's/^BRANCH_COMMIT=//p'` (`grep -c '^BRANCH_COMMIT='` is 1). `git rev-parse refs/evidence/187/green` prints the same commit (`DESTROY_COMMIT_IS_GREEN_REF=yes`), its one parent is `340a20070…`, still `main` on the remote, and `git ls-remote` names `deploy/staging` and `deploy-evidence/187-green-4` at it (`DESTROY_COMMIT_IS_DEPLOY_STAGING_TIP=yes`). The plan names this commit and no other: Task 3 pushes `<DESTROY_COMMIT>:refs/heads/deploy-evidence/destroy-staging`.
- **`DESTROY_BRANCH_ABSENT=yes`.** `git ls-remote origin refs/heads/deploy-evidence/destroy-staging` exit 0 printed nothing (0 bytes). The listing of `refs/heads/deploy-evidence/*`, `refs/heads/deploy/*` and `refs/heads/main` (exit 0) names `185-image`, `187-green`, `187-green-2`, `187-green-3`, `187-green-4`, `187-red` and `187-red-2` under `deploy-evidence/`, `deploy/staging` and `main`, and no destroy branch. `actions/runs?branch=deploy-evidence/destroy-staging` exit 0: `total_count` 0.
- **`DESTROY_BRANCH_ADMITTED=yes`.** `environments/staging-destroy` exit 0: `custom_branch_policies=true`, `protected_branches=false`, one `required_reviewers` rule with one user reviewer, `prevent_self_review=false`, no wait timer, and a `branch_policy` rule. `deployment-branch-policies` exit 0: exactly the two `branch` rules `deploy-evidence/*` and `deploy/staging`. `destroy-staging` holds no `/`, so `deploy-evidence/destroy-staging` matches `deploy-evidence/*` under GitHub's rule, where `*` stops at `/`, as under the shell's glob (`[[ … == deploy-evidence/* ]]` exit 0). Both jobs name `environment: staging-destroy`, so each waits for that one reviewer. `secrets` and `variables` exit 0, `total_count` 0 each: the environment holds no Supabase token, no database password, and nothing else.
- **`DEPLOY_EXCLUDES_DESTROY_BRANCH=yes`.** `git show 331b5db28:.github/workflows/deploy.yml` exit 0. Its `push.branches` are `deploy/staging`, `deploy-evidence/**` and `!deploy-evidence/destroy-staging`, in that order; GitHub applies the patterns in order and the later negative one removes the branch that `deploy-evidence/**` admitted. The other `on:` key is `workflow_dispatch`, which a push does not fire.
- **`DESTROY_TRIGGERS_ON_BRANCH=yes`.** `git show 331b5db28:.github/workflows/destroy.yml` exit 0. `on.push.branches` is the one exact branch `deploy-evidence/destroy-staging`, beside a `workflow_dispatch` with the input `confirm`. Both jobs carry the `if:` `(github.event_name == 'push' && github.ref == 'refs/heads/deploy-evidence/destroy-staging') || (… dispatch with confirm == 'destroy staging aws')`, so on this push both are eligible: `plan-destroy` first, then `apply-destroy` (`needs: plan-destroy`), each behind its own review.
- **`DESTROY_WORKFLOW_ON_DEFAULT_BRANCH=no`, `DESTROY_WORKFLOW_REGISTERED=no`: why the workflows API answers 404, and why that does not stop the push.** The default branch is `main` (`gh api repos/…` exit 0). `git ls-tree` of `main`'s commit `340a20070…` lists `claude-code-review.yml`, `claude-solve-issue.yml`, `claude.yml`, `docs.yml` and `main.yaml` only: no `deploy.yml`, `destroy.yml` or `infra-plan.yml`. `gh api …/actions/workflows/destroy.yml` exit 1, `Not Found (HTTP 404)`, and `actions/workflows` (exit 0) lists `deploy.yml` and `infra-plan.yml` as `active` but no `destroy.yml`. GitHub registers a workflow that is not on the default branch when a push first runs it, which is how `deploy.yml` and `infra-plan.yml` came to be listed: neither is on `main`, and both have runs from `deploy-evidence/**` and `deploy/staging` pushes (`44270824581`, `44270824411`, `44276384977`). For a `push` event GitHub reads the workflow file from the pushed commit, as `main.yaml`'s `ci-evidence/**` comment records, so `destroy.yml` at `331b5db28` is what the push will run. The 404 means only that `destroy.yml` has never run; it is expected to be listed after the push. Its `workflow_dispatch` stays unavailable until the file is on `main`, which is why F-01 was amended to stop between the two jobs.
- **`ALSO_STARTED_BY_PUSH=infra-plan.yml`.** `infra-plan.yml` at the commit starts on `push` to `deploy-evidence/**` and has no negative pattern, so the same push starts it, as the plan's artifact list expects. On a push only its no-credential job and `wrong-subject` run (the credentialed plan job carries `if: github.event_name == 'pull_request' …`); neither names an environment, so neither waits for a review or reads a secret, and `wrong-subject` passes only when STS refuses the branch subject for both roles. No other workflow at the commit starts on this push: `main.yaml` takes `main` and `ci-evidence/**`, `docs.yml` and `release.yml` take `main`, and the three Claude workflows take dispatch, call, issue and review events.
- **`SERVED_BUILD_BEFORE=`.** `/api/health` exit 0, HTTP 200, body `{"status":"ok","build":"331b5db28058a1f8bc4ef88a3841080a4610efa2"}`. `running-image-digest.sh --cluster openvaa-staging --service openvaa-staging-frontend` exit 0: task definition `:8`, reference `digest`, digest `sha256:b4a14b89…`, the same as plan 187-22 recorded after its run. `describe-services` exit 0: one deployment, `PRIMARY`, `COMPLETED`, task definition `:8`, 1 of 1 running.
- **`STATE_ADDRESSES_BEFORE=46`, `STATE_MANAGED_BEFORE=40`.** `terraform state list` exit 0 with the admin profile: 46 addresses, every one under `module.frontend.` (`STATE_OUTSIDE_MODULE_BEFORE=0`), six of them data sources (`module.frontend.data.…`), which `infra/scripts/check-destroy-plan.sh` does not count. So, if the state does not change before the run, its guard is expected to print 40 as the state's managed resources, and the plan to read `0 to add, 0 to change, 40 to destroy`. This is a prediction for Task 3, not one of its lines.
- **`NO_RUN_ACTIVE=yes`.** The status-filtered counts of `actions/runs` are 0 for `queued`, `in_progress`, `waiting`, `requested` and `pending`. `action_required` counts 25, every one `completed` (none other than `completed`). Among the latest 100 runs none is other than `completed` and none has a `destroy` path; the latest is plan 187-22's `44276384977`, `completed` `success`. `destroy.yml` shares the concurrency group `staging-aws` with `deploy.yml` and cancels nothing, so with no run in the group the destroy run starts at once.
- **`DESTROY_TREE_EQUALS_HEAD_OUTSIDE_PLANNING=no`, recorded and not acted on; `DESTROY_INPUTS_EQUAL_HEAD=yes`; `REBUILD_REQUIRED=no`.** `git diff --quiet 331b5db28 HEAD -- . ':!.planning'` exit 1; `--name-only` names `infra/envs/staging/aws/README.md` alone (69 insertions, 68 deletions: plan 187-21 Task 3's Observations row, commit `db50c2dda`, and Prettier's re-widening of the table around it). Everything the destroy run reads is identical: `git diff --quiet 331b5db28 HEAD --` of `.github/workflows/destroy.yml`, `deploy.yml`, `infra-plan.yml`, `infra/scripts`, `infra/modules` and `infra/envs/staging/supabase` exit 0, and of `infra/envs/staging/aws` without its README exit 0; Terraform reads no Markdown. This plan's rules ask for no tree equality: Task 1 takes `DESTROY_COMMIT=` from plan 187-22's `BRANCH_COMMIT=`, and Task 3 pushes that commit. The tree rule and its rebuild belong to plan 187-21's execution rules. A rebuild would give a different commit, one that staging does not serve and `deploy/staging` does not hold; plans 187-24 and 187-25 start their runs by re-running this plan's destroy run and plan 187-22's deploy run, so keeping `331b5db28` keeps the three commits the same. No rebuild was made.

## Task 3 — The push, the plan job observed, the apply job rejected (2026-11-18)

The binding was checked at top level before the push and again by the plan executor before any read of the run: `attempt.sh bound 187-23-2 OPERATOR_REPLY plan=187-23 task=2` exit 0 and `attempt.sh has 187-23-2 '^answer_push=approve$'` exit 0, attempt `20261118T101555Z.3c8a4fc08`. The orchestrator made the one push, `git push origin 331b5db28058a1f8bc4ef88a3841080a4610efa2:refs/heads/deploy-evidence/destroy-staging` (exit 0). The plan executor pushed nothing, approved and rejected nothing, and made no POST to `pending_deployments`; both reviews are the operator's, in the web interface. Every status below was read on its own line; the outputs are under `tmp/187-23/t3/` (ignored).

### The push and the waiting plan job (10:28Z to 10:29Z)

```
DESTROY_BRANCH_PUSHED=yes
DESTROY_BRANCH_TIP=331b5db28058a1f8bc4ef88a3841080a4610efa2
DEPLOY_RUN_FOR_BRANCH=none
DESTROY_RUN_ID=44285713407
DESTROY_RUN_URL=https://github.com/OpenVAA/voting-advice-application/actions/runs/44285713407
DESTROY_RUN_CREATED=2026-11-18T10:28:18Z
DESTROY_RUN_EVENT=push
DESTROY_RUN_HEAD=331b5db28058a1f8bc4ef88a3841080a4610efa2
INFRA_PLAN_RUN_ID=44285713394
PLAN_JOB_WAITED=yes
PLAN_JOB_WAIT_ENVIRONMENT=staging-destroy
```

- **`DESTROY_BRANCH_PUSHED=yes`.** `git ls-remote origin refs/heads/deploy-evidence/destroy-staging` exit 0 printed `331b5db28058a1f8bc4ef88a3841080a4610efa2`, `DESTROY_COMMIT` of Task 1.
- **`DEPLOY_RUN_FOR_BRANCH=none`.** `gh run list --branch deploy-evidence/destroy-staging --workflow deploy.yml` exit 0 printed `[]`. `gh run list --branch deploy-evidence/destroy-staging` (every workflow, exit 0) lists two runs, both `push`: "Destroy staging AWS" `44285713407` and "Infrastructure plan" `44285713394`, the one other workflow Task 1 predicted (`ALSO_STARTED_BY_PUSH=infra-plan.yml`). So `deploy.yml`'s negative pattern held.
- **`PLAN_JOB_WAITED=yes`.** `gh run view 44285713407` exit 0 at 10:29Z: run `waiting`, one job, `plan-destroy`, `waiting`, started 10:28:19Z, no step run. `actions/runs/44285713407/pending_deployments` (GET, exit 0) names one pending deployment, environment `staging-destroy`, wait timer 0, one `User` reviewer. `apply-destroy` is not yet listed, as a job that `needs` a waiting one is not.

### plan-destroy approved (10:30Z)

```
PLAN_JOB_REVIEW=approved
PLAN_JOB_REVIEW_ENVIRONMENT=staging-destroy
PLAN_JOB_STARTED_BY_REVIEW=yes
```

- **`PLAN_JOB_REVIEW=approved`.** `actions/runs/44285713407/approvals` (GET, exit 0) holds one review: `approved`, environment `staging-destroy`, by the environment's one reviewer, no comment. The operator gave it in the web interface; the plan executor made no POST. At the next poll, 10:30:47Z, `gh run view` (exit 0) showed `plan-destroy` `in_progress` with its first step started.

### The plan job's lines (10:30:45Z to 10:31:27Z)

`plan-destroy` (job `134737738434`) concluded `success` at 10:31:27Z: every one of its twelve steps `success`, then the post steps. Its log was read with `gh run view 44285713407 --log --job 134737738434` (exit 0, 1,846 lines). The lines below are the step outputs exactly as printed; none holds an address, a key or a token.

```
OIDC_ASSUME_DESTROY_ENV=success
supabase_root_init_status=1
supabase_state_head_status=254
SUPABASE_ROOT_REFUSED=yes
state_list_exit=0
plan_exit=0
export_exit=0
destroy_planned=40
destroy_state_resources=40
destroy_outside_module=0
destroy_other_actions=0
destroy_unmatched=0
destroy_guard=pass
guard_exit=0
DESTROY_PLAN_SUMMARY=0 to add, 0 to change, 40 to destroy
DESTROY_PLAN_RESOURCES_SHOWN=40
DESTROY_PLAN_RESOURCES_OUTSIDE_MODULE=0
```

- **`OIDC_ASSUME_DESTROY_ENV=success`.** The step "Assume the deploy role" concluded `success`; it printed `Assuming role with OIDC` and `Authenticated as assumedRoleId …:destroy-plan-44285713407`, the session name the workflow sets. The deploy role trusts only the subjects of `infra/bootstrap/terraform.tfvars`'s `deploy_subjects`, `…:environment:staging` and `…:environment:staging-destroy`, and this job runs in `staging-destroy` and no other, so its token carried the `environment:staging-destroy` subject.
- **`SUPABASE_ROOT_REFUSED=yes`** from the step's own `supabase_root_refused=yes`. The step prints that line only after `init` of `infra/envs/staging/supabase` exited non-zero (1) with `Error refreshing state` and `AccessDenied` or `403` in its output, and `aws s3api head-object` of the key `hand/staging/supabase/terraform.tfstate` exited non-zero (254) with `Forbidden`, `AccessDenied` or `403`; otherwise it prints `=no` and fails. The step concluded `success`. The two outputs were removed in the step and never printed.
- **The guard.** `infra/scripts/check-destroy-plan.sh` printed the five counts and `destroy_guard=pass`: 40 planned deletes, 40 managed resources in the state list, none outside `module.frontend`, no action other than `delete`, no state resource left unplanned. `destroy_planned` equals `destroy_state_resources`, and both equal Task 1's `STATE_MANAGED_BEFORE=40`.
- **`DESTROY_PLAN_SUMMARY=`** from the shown plan's line `Plan: 0 to add, 0 to change, 40 to destroy.`, printed by "Show the plan" after the guard passed, as Task 1 predicted. The plan shows 40 `# … will be destroyed` headers, every one under `module.frontend.` (`DESTROY_PLAN_RESOURCES_OUTSIDE_MODULE=0`), and no header of any other action. Its "Changes to Outputs" set the root's outputs to `null`; the one sensitive output prints as `(sensitive value)`.

### apply-destroy waited, was rejected, ran nothing; the run's conclusion (10:31:28Z to 10:31:57Z)

```
APPLY_JOB_WAITED=yes
APPLY_JOB_WAIT_ENVIRONMENT=staging-destroy
APPLY_JOB_REVIEW=rejected
APPLY_JOB_STEPS_RUN=0
APPLY_JOB_RUNNER_ASSIGNED=no
APPLY_JOB_LOG=none
APPLY_JOB_CONCLUSION=failure
DESTROY_RUN_STATUS=completed
DESTROY_RUN_CONCLUSION=failure
DESTROY_RUN_ATTEMPT=1
DESTROY_ARTIFACTS=0
```

- **`APPLY_JOB_WAITED=yes`, `APPLY_JOB_REVIEW=rejected`.** `apply-destroy` (job `134739441207`) was created at 10:31:28Z, a second after `plan-destroy` ended, and was completed at 10:31:56Z. The poll was once a minute, so no poll saw it in `waiting`: the one between, at 10:31:23Z, still showed `plan-destroy` in progress, and the next, at 10:32:25Z, showed the run completed. What shows it waited at its own review: `actions/runs/44285713407/approvals` (GET, exit 0) now holds two reviews, both for environment `staging-destroy` by the environment's one reviewer, `approved` (the plan job's, above) and, newest first, `rejected`; and the job's check run (GET `check-runs/134739441207`, exit 0) carries the one annotation, at level `failure`, `The deployment was rejected or didn't satisfy other protection rules.` The operator rejected it in the web interface; the plan executor made no POST.
- **`APPLY_JOB_STEPS_RUN=0`.** `actions/runs/44285713407/jobs` (GET, exit 0) lists `apply-destroy` with 0 steps and an empty `runner_name`, so no runner took it (`APPLY_JOB_RUNNER_ASSIGNED=no`), and its log GET answered HTTP 404, `BlobNotFound` (`APPLY_JOB_LOG=none`). None of its steps, so not its plan, its apply or its state check, ran.
- **`DESTROY_RUN_CONCLUSION=failure`.** `actions/runs/44285713407` (GET, exit 0): `completed`, `failure`, attempt 1, updated 10:31:57Z. As the plan's assumption expected, a rejected review fails the waiting job without running any of its steps, and the run concludes `failure`. The run was not re-run.
- **`DESTROY_ARTIFACTS=0`.** `actions/runs/44285713407/artifacts` (GET, exit 0): `total_count` 0.
- **The `infra-plan.yml` run.** `44285713394` (`gh run view`, exit 0): `completed`, `success`; `checks` and `wrong-subject` `success`, the credentialed `plan` `skipped`, as Task 1 predicted for a push.

### The stack afterwards, read-only (10:34Z)

One GET of `https://staging.openvaa.org/api/health`, and, with `AWS_PROFILE=openvaa-admin` (`aws sts get-caller-identity` exit 0: the session was still valid; the executor did not sign in), `infra/scripts/running-image-digest.sh`, one `aws ecs describe-services` and one `terraform -chdir=infra/envs/staging/aws state list`, all of which only read.

```
READ_AFTER_AT=2026-11-18T10:34:12Z
SERVED_BUILD_AFTER=331b5db28058a1f8bc4ef88a3841080a4610efa2
RUNNING_TASK_DEFINITION_AFTER=arn:aws:ecs:eu-north-1:471112560111:task-definition/openvaa-staging-frontend:8
RUNNING_IMAGE_REFERENCE_AFTER=digest
RUNNING_IMAGE_DIGEST_AFTER=sha256:b4a14b890f132c8c2c1150ad3a2355f389fba7304e7b7c1ce0d8804152c195d4
RUNNING_DEPLOYMENTS_AFTER=1
RUNNING_ROLLOUT_STATE_AFTER=COMPLETED
STATE_ADDRESSES_AFTER=46
STATE_MANAGED_AFTER=40
STATE_OUTSIDE_MODULE_AFTER=0
STATE_LIST_UNCHANGED=yes
STACK_INTACT=yes
NO_RUN_ACTIVE_AFTER=yes
DEPLOY_RUN_FOR_BRANCH_AFTER=none
```

- **`SERVED_BUILD_AFTER=`.** `/api/health` exit 0, HTTP 200, body `{"status":"ok","build":"331b5db28058a1f8bc4ef88a3841080a4610efa2"}`, equal to `SERVED_BUILD_BEFORE`.
- **The running image.** `running-image-digest.sh` exit 0; its output is byte-identical to Task 1's (`cmp` exit 0): task definition `:8`, reference `digest`, the same digest. `describe-services` exit 0: one deployment, `PRIMARY`, `COMPLETED`, task definition `:8`, 1 of 1 running.
- **The state.** `state list` exit 0: 46 addresses, every one under `module.frontend.`, 40 of them managed; the list is byte-identical to Task 1's (`cmp` exit 0, `STATE_LIST_UNCHANGED=yes`).
- **`STACK_INTACT=yes`.** `SERVED_BUILD_AFTER` equals `SERVED_BUILD_BEFORE`, and the running image and the state are the ones Task 1 read.
- **`NO_RUN_ACTIVE_AFTER=yes`, `DEPLOY_RUN_FOR_BRANCH_AFTER=none`.** `actions/runs?status=in_progress` and `?status=waiting` exit 0, `total_count` 0 each; `gh run list --branch deploy-evidence/destroy-staging --workflow deploy.yml` exit 0 printed `[]`. `git ls-remote` (exit 0) names `deploy-evidence/destroy-staging` and `deploy/staging` both at `331b5db28058a1f8bc4ef88a3841080a4610efa2`. The destroy branch stays, as the plan's artifact list says; its next push starts a destroy run that waits at `plan-destroy`'s review.
