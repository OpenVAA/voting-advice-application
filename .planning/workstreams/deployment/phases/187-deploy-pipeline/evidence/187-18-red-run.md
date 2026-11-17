# 187-18 — The red run and the wrong-subject refusal

Repository: `OpenVAA/voting-advice-application`. Names, counts, forms and commit ids only: no login, no address, no secret value.

## Task 1 — Readiness, read-only (2026-11-17T07:50Z to 07:52Z)

Recorded by the plan executor from this checkout at HEAD `5e25a1b8ba3ae81146c4e5fa6933f74f10551a87`. Every read below is a GET or a local git read; nothing was pushed, no setting was changed, no run was started or approved. Each status was read on its own line.

```
READ_AT=2026-11-17T07:50Z
ENV_READ_BACK_OK=yes
STEP9_APPLIED=yes
RED_TREE_PROVEN=yes
RED_BRANCH_ABSENT=yes
SERVED_BUILD_BEFORE=712947a1bd44a735f66ee8f51610f4748d76cd30
NO_RUN_ACTIVE=yes
RED_COMMIT=3250ba0e8e964f8c87c03459f812bd935637272b
RED_TREE=20756a2dec61b17bab3dafecbc020c4d0f1510c0
RED_PARENT=340a200708c28fb7ed078d452138712f3400c789
RED_DIFF_PATHS=apps/frontend/src/routes/+layout.ts
GREEN_COMMIT=68a54299aa81b2a2f95fd2151031ab4e624ef01c
GREEN_TREE=a9d648e87d3e075e1dafc650f2c5030afdda29fb
HEAD_TREE_WITHOUT_PLANNING=a9d648e87d3e075e1dafc650f2c5030afdda29fb
RED_REBUILT=no
NO_RUN_ACTIVE_METHOD=repo-wide status filters and the workflows list; the plan's --workflow form returns 404
```

### `ENV_READ_BACK_OK=yes` (2026-11-17T07:50Z)

`gh api repos/OpenVAA/voting-advice-application/environments/<E>` and `.../environments/<E>/deployment-branch-policies` for `staging` and `staging-destroy`, each exit 0, read as reviewer types only:

- Both: `can_admins_bypass: false`; one `required_reviewers` rule with one reviewer of type `User`, `prevent_self_review: false`, no wait timer; a `branch_policy` rule; `deployment_branch_policy` `custom_branch_policies: true`, `protected_branches: false`.
- Both: branch policies exactly `deploy-evidence/*:branch,deploy/staging:branch`.

That is what plan 187-14 read back on 2026-11-15T19:59Z (`187-14-environments.md` § Task 3).

### `STEP9_APPLIED=yes`

`187-16-bootstrap-apply.md` § Task 3 records `STEP9_RESULT=applied` (`s9d_apply_exit=0`, `Apply complete! Resources: 18 added, 3 changed, 2 destroyed.`, second plan exit 0), with both trusts naming `repository_id 546467466` and `repository_owner_id 115159211` and the deploy trust naming the `environment:staging` and `environment:staging-destroy` subjects. The code applied is unchanged at this HEAD: `git diff --quiet 1e10dff7f HEAD -- infra/bootstrap infra/modules/github-oidc ':!infra/bootstrap/README.md'` exit 0 (the only change in those two paths since is the runbook).

### `RED_TREE_PROVEN=yes`

- `git rev-parse refs/evidence/187/red` prints `3250ba0e8e964f8c87c03459f812bd935637272b` and its tree `20756a2dec61b17bab3dafecbc020c4d0f1510c0`: the `RED_COMMIT` and `RED_TREE` of `187-12-evidence-commits.md` § Re-run 2026-11-16 (plan 187-28), whose local build exited 1 at `shared 2/2 RUN yarn build` on `Failed: @openvaa/frontend#build` (`RED_LOCAL_BUILD_EXIT=1`).
- The green ref's tree still equals HEAD's tree without `.planning/`: in a temporary index under the session scratch directory (removed afterwards), `git read-tree HEAD` exit 0, `git rm -r --cached --quiet .planning` exit 0, `git write-tree` exit 0 printed `a9d648e87d3e075e1dafc650f2c5030afdda29fb`, which is `refs/evidence/187/green^{tree}`; `git diff --quiet refs/evidence/187/green HEAD -- . ':!.planning'` exit 0; the real index untouched (`git diff --cached --quiet` exit 0). So, per the plan's execution rules, the red commit is `refs/evidence/187/red` as it stands and nothing was rebuilt.
- `git diff-tree -r --name-only refs/evidence/187/green refs/evidence/187/red` prints the one path `apps/frontend/src/routes/+layout.ts`; `git diff --stat`: `1 file changed, 1 insertion(+)`, the line `import '$lib/does-not-exist-187-red';` (blob `8ccc60be8f1696621812d5e7f8084f403b708aa7`). The red commit's parent is `340a200708c28fb7ed078d452138712f3400c789`, which `git ls-remote origin refs/heads/main` still prints.
- `git for-each-ref --contains refs/evidence/187/red` prints exactly `refs/evidence/187/red`.

### `RED_BRANCH_ABSENT=yes` (2026-11-17T07:50Z)

`git ls-remote origin refs/heads/deploy-evidence/187-red` exit 0 printed nothing (0 bytes). For context, `git ls-remote origin 'refs/heads/deploy-evidence/*' 'refs/heads/deploy/*'` prints one branch, `deploy-evidence/185-image` at `712947a1bd44a735f66ee8f51610f4748d76cd30`, and no `deploy/*` branch.

### `SERVED_BUILD_BEFORE` (2026-11-17T07:50:40Z)

`curl -sS -m 30 https://staging.openvaa.org/api/health` exit 0, HTTP 200, body `{"status":"ok","build":"712947a1bd44a735f66ee8f51610f4748d76cd30"}`: the tip of `deploy-evidence/185-image`.

### `NO_RUN_ACTIVE=yes` (2026-11-17T07:51Z)

- `gh run list --workflow deploy.yml`, `--workflow destroy.yml` and `--workflow infra-plan.yml` each exit 1 with `HTTP 404: workflow <name> not found on the default branch`. The plan's command form cannot answer here: none of the three files is on `main`, and none has ever run, so GitHub has not registered it.
- `gh api repos/OpenVAA/voting-advice-application/actions/workflows` (exit 0) lists nine workflows, none of the three.
- `gh api .../actions/runs?per_page=100` (exit 0): 0 runs whose `path` names `deploy.yml`, `destroy.yml` or `infra-plan.yml`.
- `gh run list --status <s>` repository-wide for `queued`, `waiting`, `in_progress`, `requested` and `pending`, each exit 0, each empty: no run of any workflow is active.

So no run of either workflow is queued, waiting or in progress, and the first `deploy.yml` and `infra-plan.yml` runs will be the red push's.

### What the red tree will trigger

From `git show refs/evidence/187/red:.github/workflows/<w>.yml`: `deploy.yml` runs on a push to `deploy/staging` and `deploy-evidence/**` (but not `deploy-evidence/destroy-staging`); `infra-plan.yml` runs on a push to `deploy-evidence/**`; `destroy.yml` runs on a push to `deploy-evidence/destroy-staging` only. A push to `deploy-evidence/187-red` therefore starts one `deploy.yml` run and one `infra-plan.yml` run, and no `destroy.yml` run.

## Task 3 — The push, both runs step by step (2026-11-17T07:55Z to 09:02Z)

Attempt `20261117T075239Z.d53169b29` of key `187-18-2`. The orchestrator stored the operator's reply with `attempt.sh put 187-18-2` (exit 0). `attempt.sh bound 187-18-2 OPERATOR_REPLY plan=187-18 task=2` exited 0, and `attempt.sh has 187-18-2 '^answer_push=approve$'` exited 0. The orchestrator then made the push at top level: `git push origin 3250ba0e8e964f8c87c03459f812bd935637272b:refs/heads/deploy-evidence/187-red` exited 0 at 2026-11-17T07:55:25Z, and `git ls-remote` read back `3250ba0e8e964f8c87c03459f812bd935637272b refs/heads/deploy-evidence/187-red`. The agent pushed nothing, approved nothing and re-ran no run. Step conclusions come from `gh api repos/OpenVAA/voting-advice-application/actions/jobs/<id>`, and log lines from `gh run view --log --job <id>`. No line copied here holds an address or a resource id from a log.

### The `deploy.yml` run

```
RED_PUSHED=yes
RED_RUN_ID=44042442257
RED_RUN_URL=https://github.com/OpenVAA/voting-advice-application/actions/runs/44042442257
RED_RUN_HEAD=3250ba0e8e964f8c87c03459f812bd935637272b
CHECKS_JOB=success
GATE_WAITED=yes
GATE_WAITED_AT=2026-11-17T07:56:40Z
GATE_REVIEW=approved
GATE_REVIEW_READ_AT=2026-11-17T08:59:20Z
DEPLOY_JOB_STARTED=2026-11-17T08:59:12Z
DEPLOY_JOB_COMPLETED=2026-11-17T09:00:23Z
STEP=Set up job conclusion=success
STEP=Checkout source code conclusion=success
STEP=Assume the deploy role conclusion=success
STEP=Build and push the image conclusion=failure
STEP=Drop the build credentials conclusion=skipped
STEP=Setup Node.js 24.21.0 conclusion=skipped
STEP=Setup Yarn 4.18 conclusion=skipped
STEP=Install psql conclusion=skipped
STEP=Setup Terraform 1.16.5 conclusion=skipped
STEP=Assume the deploy role for the plan conclusion=skipped
STEP=Initialise the staging AWS root conclusion=skipped
STEP=Plan the staging AWS root with the built digest conclusion=skipped
STEP=Show the plan conclusion=skipped
STEP=Drop the plan credentials conclusion=skipped
STEP=Link a work directory to the Supabase project conclusion=skipped
STEP=Push the migrations conclusion=skipped
STEP=Deploy the functions conclusion=skipped
STEP=Assume the deploy role again for the apply conclusion=skipped
STEP=Apply the saved plan conclusion=skipped
STEP=Check the rollout is stable conclusion=skipped
STEP=Drop the rollout credentials conclusion=skipped
STEP=Install Playwright's Chromium conclusion=skipped
STEP=Run the deployed smoke entry conclusion=skipped
STEP=Read the served build again conclusion=skipped
STEP=Remove the plan, the smoke output and the step files conclusion=success
STEP=Assume the deploy role again for the alert conclusion=success
STEP=Alert the operator conclusion=success
STEP=Post Assume the deploy role again for the alert conclusion=success
STEP=Post Assume the deploy role conclusion=success
STEP=Post Checkout source code conclusion=success
STEP=Complete job conclusion=success
OIDC_ASSUME=success
RED_BUILD_STEP=failure
RED_BUILD_LINE=absent
RED_LATER_STAGES=skipped
ALERT_STEP=success
ALERT_STAGE=build
ALERT_MESSAGE_ID=0d08cd58-15d0-5afa-995e-ae2e0c34d217
ALERT_STEP_UTC=2026-11-17T09:00:19Z to 09:00:21Z
ALERT_PUBLISHED_UTC=2026-11-17T09:00:21Z
RED_RUN_CONCLUSION=failure
```

- **The gate.** At 2026-11-17T07:56:40Z the orchestrator read `actions/runs/44042442257/pending_deployments` listing `staging`. At that moment `checks` (job 133900002071) had completed with `success` and `deploy` (job 133900487585) was `waiting`, not started; this executor read the same states at 07:56:59Z. A background poll of `actions/runs/44042442257/approvals`, every 30 s, read `[]` until 08:58:49Z and `approved` at 08:59:20Z, for the environment `staging`, by a reviewer of type `User`. The deploy job started at 08:59:12Z, after the approval.
- **`checks`.** Every step `success`: checkout, Terraform 1.16.5, formatting, `Validate the staging AWS root`, Node.js 24.21.0, Yarn 4.18, `Unit tests of the infrastructure scripts`.
- **The assume.** Step 3, `Assume the deploy role`, logged `Authenticated as assumedRoleId <id>:deploy-44042442257`, and step 26 logged the same for the session `deploy-alert-44042442257`. The `environment:staging` subject was taken with the trust's `repository_id` and `repository_owner_id` conditions in force (`187-16-bootstrap-apply.md` § Task 2, `s9e_deploy_condition=`).
- **The build.** Step 4 failed after 59 s. Inside `docker buildx build`, `#16 [shared 2/2] RUN yarn build`: the frontend's build printed `[UNLOADABLE_DEPENDENCY] Could not load src/lib/does-not-exist-187-red`, turbo reported `Tasks: 13 successful, 14 total` and `Failed: @openvaa/frontend#build`, and the build ended `ERROR: failed to build: failed to solve: process "/bin/sh -c yarn build" did not complete successfully: exit code: 1`. Then came `##[error]Process completed with exit code 1.` This is the step and the task where the local build of the same tree failed (`187-12-evidence-commits.md`, plan 187-28 re-run). There was no image push, because the push follows the build in `build-push-image.sh`.
- **`RED_BUILD_LINE=absent`, not `failed=build`.** The log holds no `failed=build`, no `build_exit=` and no `::error::build-push-image.sh exited` line. The step's header reads `shell: /usr/bin/bash -e {0}`. That is the runner's default for a `run:` step with no `shell:`, and the step's own `set -uo pipefail` does not turn `-e` off. So `infra/scripts/build-push-image.sh ... > "$RUNNER_TEMP/build-push.txt"` returning non-zero ended the step at once, before `build_exit=$?`, before the `cat` that prints the script's `failed=` line, and before the step's own error line. This was reproduced offline: under `/bin/bash -e -c 'set -uo pipefail; stub > out; build_exit=$?; cat out; echo build_exit=$build_exit'`, a stub printing `failed=build` and exiting 1 printed nothing, and the shell exited 1. The step's conclusion and the alert's stage are not affected. The script's own output is.
- **Later stages.** Steps 5 to 24, from `Drop the build credentials` to `Read the served build again`, all `skipped`, including the plan, the migrations, the functions, the apply, the stable check, the smoke and the served-build read. Step 25, the `always()` cleanup, `success`.
- **The alert.** Step 26 assumed the role again, and step 27 printed `alert_stage=build` at 09:00:19.96Z and `alert_message_id=0d08cd58-15d0-5afa-995e-ae2e0c34d217` at 09:00:21.10Z, with no `alert_error=` line. By the step's script (the message itself is not in the log), its subject is `openvaa staging deploy failed at build` and its body names the commit `3250ba0e8e964f8c87c03459f812bd935637272b`, the trigger `push of deploy-evidence/187-red` and the run URL above.
- **The run.** `actions/runs/44042442257`: `completed`, `failure`, head `3250ba0e8e964f8c87c03459f812bd935637272b`, event `push`, branch `deploy-evidence/187-red`.

### The `infra-plan.yml` run of the same head

```
INFRA_PLAN_RUN_ID=44042442267
INFRA_PLAN_RUN_URL=https://github.com/OpenVAA/voting-advice-application/actions/runs/44042442267
INFRA_PLAN_RUN_CONCLUSION=failure
INFRA_CHECKS_JOB=success
EXAMPLE_PLANS_RAN=aws,dns-mail,supabase
INFRA_PLAN_JOB=skipped
WRONG_SUBJECT_JOB=failure
WRONG_SUBJECT_STEP=Ask STS for the deploy role and the plan role with the branch subject conclusion=failure
WRONG_SUBJECT_LINES=none printed
WRONG_SUBJECT_STS_CALLED=no
```

- **`checks`** (job 133900001945, 07:55:29Z to 07:56:52Z): every step `success`. `Test every Terraform module that has tests` printed `Success! 33 passed, 0 failed.` for `frontend_service` and `Success! 11 passed, 0 failed.` for `github_oidc`. `Plan the example roots with mock providers` printed `tests/plan.tftest.hcl... pass` and `Success! 1 passed, 0 failed.` three times, then `planned 3 example roots: infra/envs/example/aws infra/envs/example/dns-mail infra/envs/example/supabase`.
- **`plan`** (job 133900003139): `skipped`, with no steps, as on a push.
- **`wrong-subject`** (job 133900001691, 07:55:30Z to 07:55:31Z): `Set up job` `success`, then `Ask STS for the deploy role and the plan role with the branch subject` `failure`, then `Complete job` `success`. The step printed nothing between its script listing and `##[error]Process completed with exit code 1.`: no `::error::` line of its own, and none of `token_subject=`, `deploy_role_assume_status=`, `deploy_role_error=`, `plan_role_assume_status=` or `plan_role_error=`. Its header reads `shell: /usr/bin/bash -e {0}`. The token request had succeeded (`curl -sS --fail` prints its error on failure, and none was printed). The script then writes the token with `jq -j .value`, which leaves no trailing newline, and reads it with `IFS=. read -r _ payload _ < "$token_file"`. At end of file, `read` returns 1, even though it fills `payload`. Under `-e` that ended the step before either `aws sts assume-role-with-web-identity` call. This was reproduced locally: under `/bin/bash -e -c 'set -uo pipefail; IFS=. read -r _ payload _ < tok; echo reached'`, with a token file `aaa.bbb.ccc` that has no newline, nothing was printed and the shell exited 1. Without `-e`, `read` exits 1 with `payload=bbb`. Even past that line, the two `aws sts` calls are expected to fail, and each would end the step the same way under `-e`. So the job cannot reach its check as written.
- **Neither role's refusal of `repo:OpenVAA/voting-advice-application:ref:refs/heads/deploy-evidence/187-red` was observed**, and no refusal code exists to record.

### Nothing hosted written

```
SERVED_BUILD_AFTER=712947a1bd44a735f66ee8f51610f4748d76cd30
HOSTED_WRITE=none
```

`curl -sS -m 30 https://staging.openvaa.org/api/health` exit 0 at 2026-11-17T09:01:27Z: HTTP 200, `{"status":"ok","build":"712947a1bd44a735f66ee8f51610f4748d76cd30"}`, equal to `SERVED_BUILD_BEFORE`. No plan, migrations, functions or apply step ran (all `skipped`). After the run, `gh run list --branch deploy-evidence/187-red` listed the two runs above, both `completed failure`. Repository-wide `--status queued`, `waiting` and `in_progress` each listed 0 runs.

### Runbook rows (2026-11-17)

- `infra/envs/staging/aws/README.md` § Observations: one row for the pipeline's first run, red at the build, with the alert published, nothing deployed, and the absent `failed=build` line.
- `infra/bootstrap/README.md`: the not-yet-observed row on `repository_id` and `repository_owner_id` moved to § Observations, as the deploy role assumed from `environment:staging` with both conditions set. The row "A workflow can assume the plan role and the deploy role, and a token with a wrong subject is refused" was narrowed to its unobserved part, the plan role and the refusal by both roles. Its check now names the `wrong-subject` job, once it reaches its STS calls. A second Observations row records that job's failure before either STS call.
- Both files: `prettier --write`, then `prettier --check` exit 0. The staging runbook's table was re-padded by the longer row.

### Not shown, against the plan's verify

`RED_BUILD_LINE=failed=build`, `WRONG_SUBJECT_JOB=success`, `token_subject=repo:OpenVAA/voting-advice-application:ref:refs/heads/deploy-evidence/187-red`, `deploy_role_error=<code>` and `plan_role_error=<code>` were not observed and are not written. The plan's Task 3 verify therefore fails on these lines. Both causes are the runner's default `bash -e` under steps that capture a command's status with `$?` on the next line. The pattern recurs in other steps of `deploy.yml`, `destroy.yml` and `infra-plan.yml`, where it hides the step's diagnosis on failure. `RED_ALERT_MAIL=` and `RED_ALERT_MAIL_UTC=` await the operator.
