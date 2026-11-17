# 187-29 — The status reads under the runner's `bash -e`, and the red run observed again

This file serves the operator's ruling `RULING_BASH_E=fix-now-and-re-observe` (evidence/187-18-red-run.md § Operator ruling (2026-11-17)): the status-reading steps of the three pipeline workflows are fixed for the shell GitHub runs them in, proven locally under that shell, and the red run is observed again on a new branch.

## Task 1: the wrong-subject step under bash -e

ERREXIT_BASE_HEAD=32177fe6b1096cc079169674610063846bf0d6cb

The harness is `infra/scripts/workflow-errexit.test.ts`. It takes the step's `run` string from the parsed workflow and runs it as `bash -e <file>` (this workstation's bash 3.2.57, `/bin/bash`), in a temporary root whose `PATH` names only the case's `stubs/` and `utils/`, with an environment built from nothing.

Red first, on the unchanged workflow at `ERREXIT_BASE_HEAD` (`vitest run --config infra/vitest.config.ts workflow-errexit`, exit 1, 3 of 3 cases failed):

ERREXIT_TRACER_RED_AT_START=yes

- The refusal case printed two lines: the step's `::add-mask::` line, then nothing. It printed none of the five lines. Reproduced alone under the same stubs, bash exited with status 1, and the last line it printed was the step's `::add-mask::` line (its token is the harness's stand-in and is not copied here). That is the runner's failure of the `wrong-subject` job: `IFS=. read -r _ payload _ < "$token_file"` returns 1 at the end of a token file with no trailing newline, and `-e` ends the step there.
- The accepting-role case printed no `::error::A role did not refuse` line, for the same reason.
- The capture-removed case found no ` || <name>=$?` to remove, because the unchanged step has none.

The fix, in the wrong-subject step only: its six statuses (`curl_status`, `jq_status`, `decode_status`, `subject_status`, `deploy_status`, `plan_status`) are each set to 0 on the line before their command and captured as `|| name=$?` on the command's last line, and the token's read is guarded as `IFS=. read -r _ payload _ < "$token_file" || [ -n "$payload" ]`. The set line, both STS calls' arguments, the five output lines and the pass condition are unchanged, and no tolerance key was added.

Green (`vitest run --config infra/vitest.config.ts workflow-errexit infra-plan-workflow`, exit 0, 2 files, 36 tests passed):

ERREXIT_TRACER_GREEN=yes
WRONG_SUBJECT_CONTROL_RED=yes
WRONG_SUBJECT_LOCAL_LINES=token_subject,deploy_role_assume_status,deploy_role_error,plan_role_assume_status,plan_role_error

`WRONG_SUBJECT_CONTROL_RED=yes` is the accepting-role case: the step exits 1 with its own `::error::A role did not refuse the subject ... with AccessDenied.` line. The capture-removed case exits non-zero and prints none of the five lines, which is the runner's failure reproduced on the fixed step.

## Task 2: every status-reading step

The population, read from the parsed workflows at Task 1's commit `79c173257` by the population gate of this task's verify, which printed `29 1 0`: 29 status-reading steps (12 in `deploy.yml`, 13 in `destroy.yml`, 4 in `infra-plan.yml`), 1 of them with every read captured in an `||` list (the wrong-subject step), and 0 steps that turn errexit off. The 29 steps held 42 `$?` reads.

STATUS_READING_STEPS_AT_START=29
STATUS_READS_CAPTURED_AT_START=1

Red first, on the unchanged steps (`vitest run --config infra/vitest.config.ts workflow-errexit`, exit 1, 34 of 44 cases failed): 28 sweep cases and the six behaviour cases failed. The wrong-subject sweep case, the population case, the three wrong-subject cases, the function-directory count, the two unread-status cases and their two `+e` controls passed.

ERREXIT_SWEEP_RED_AT_START=28

- The 28 sweep cases red at start, each exiting non-zero with no `::error::` line:
  - `deploy.yml` `deploy`: Build and push the image; Install psql; Plan the staging AWS root with the built digest; Show the plan; Link a work directory to the Supabase project; Push the migrations; Deploy the functions; Apply the saved plan; Check the rollout is stable; Run the deployed smoke entry; Read the served build again; Alert the operator.
  - `destroy.yml` `plan-destroy`: Show the Supabase root's state is out of reach; List the state of the staging AWS root; Plan the destroy of the staging AWS root; Export the saved plan for the guard; Check the plan destroys the stack and nothing else; Show the plan.
  - `destroy.yml` `apply-destroy`: List the state of the staging AWS root; Plan the destroy of the staging AWS root; Export the saved plan for the guard; Check the plan destroys the stack and nothing else; Show the plan; Apply the saved destroy plan; Show the state of the staging AWS root is empty.
  - `infra-plan.yml` `plan`: Read the digest the service runs; Plan the staging AWS root; Show the plan.

The fix: the 36 remaining reads (18 in `deploy.yml`, 15 in `destroy.yml`, 3 in `infra-plan.yml`) were each rewritten as `name=0` on the line before the command (before its first line when it continues over several) and ` || name=$?` on its last line, with the next-line read removed. Each workflow's header comment gained one sentence on why. No set line changed, and no `set +e`, `shell:` key or `defaults:` block was added. The scripts under `infra/scripts/` are unchanged.

Green (`vitest run --config infra/vitest.config.ts workflow`, exit 0, 6 files, 205 tests passed, among them the five existing workflow test files with no assertion edited):

ERREXIT_SWEEP_GREEN=29
STATUS_READING_STEPS=29
STATUS_READS_CAPTURED=29
STEPS_WITH_ERREXIT_OFF=0
BUILD_FAILURE_LOCAL_LINE=failed=build
BUILD_STATUS_3_CONTINUES=yes
PR_PLAN_STATUS_2_ACCEPTED=yes
SUPABASE_ROOT_REFUSAL_PASSES=yes
UNREAD_STATUS_ENDS_STEP=yes

- `BUILD_FAILURE_LOCAL_LINE`: the build step, with the real staging AWS tfvars and a build script that prints `failed=build` and exits 1, printed `failed=build`, `build_exit=1` and `::error::build-push-image.sh exited 1.` and exited 1.
- `BUILD_STATUS_3_CONTINUES`: with a build script that prints `tag_exists=yes image_digest=sha256:<64 hex>` and exits 3, it printed `build_exit=3` and `digest=sha256:<64 hex>`, wrote that digest to `GITHUB_OUTPUT` and exited 0.
- `PR_PLAN_STATUS_2_ACCEPTED`: the pull-request plan step exited 0 with `plan_exit=2` on plan status 2, and exited 1 with `::error::terraform plan exited 1.` on status 1.
- `SUPABASE_ROOT_REFUSAL_PASSES`: the destroy plan job's Supabase-root step printed `supabase_root_init_status=1`, `supabase_state_head_status=254` and `supabase_root_refused=yes` and exited 0 on the two refusals, and printed `supabase_root_refused=no` and exited 1 when the init succeeded.
- `UNREAD_STATUS_ENDS_STEP`: the functions step, with `awk` failing on `config.toml`, exited non-zero with no `function=` line; its `+e` control printed `function=` lines with `verify_jwt` taken as true. The deploy job's plan print, with `cat` failing on `tfplan.txt`, exited non-zero with no plan heading in `GITHUB_STEP_SUMMARY`; its `+e` control exited 0 with the heading written.

## Task 3: the rule and the gates

The shared rule `status-read-after-or`, the last entry of `SHARED_RULES` in `infra/scripts/workflowGuards.ts`, reports a step whose `run` reads `$?` anywhere but after `||` on its command's line, or holds a `set` line whose options include `+e`. Its red copy in `infra-plan-workflow.test.ts` moves the first ` || <name>=$?` of the file to a line of its own; a second red case adds `set +e` after the first `set -uo pipefail`. Both fail `sharedViolations` with a `status-read-after-or: ` violation, and `deploy.yml`, `destroy.yml` and `infra-plan.yml` produce none (`vitest run --config infra/vitest.config.ts workflow`, exit 0, 207 tests).

SHARED_RULE_RED_COPY=yes
SHARED_RULE_GREEN_ON_THREE=yes

`infra/README.md`: the "Workflow guards" row of § Guards names the rule and `workflow-errexit.test.ts`, and § Reading a red run says why its lines are printed. `prettier --write` re-padded the Guards table.

The gates, 2026-11-17T12:48:28Z to 12:52:22Z, with `tmp/187-29/gates/run-gates.sh` (the copy of `tmp/187-28/t1/run-gates.sh` with `tmp/187-28` rewritten, `bash -n` exit 0) and turbo's cache private to the attempt (`TURBO_CACHE_DIR=tmp/187-29/turbo-cache`). They ran at `GATES_HEAD`, Task 2's commit, with Task 3's three source files in the working tree; those files' blobs (`workflowGuards.ts` `1bb2739a1`, `infra-plan-workflow.test.ts` `8c7862a1d`, `infra/README.md` `9150ea776`) were the same before and after the gates and are the ones committed below. Each line is read from its own `.status` file under `tmp/187-29/gates/`.

GATES_HEAD=3774b1c988064c590c6dfbbed7ae15419ad7aca3
lint:check exit=0
format:check exit=0
typecheck exit=0
test:unit exit=0
lint:workflows exit=0
ERREXIT_TS_STRICT_EXIT=0
INFRA_TESTS_PASSED=bootstrap-tfvars.test.ts,build-push-image.test.ts,check-destroy-plan.test.ts,deploy-workflow.test.ts,destroy-workflow.test.ts,infra-plan-workflow.test.ts,main-e2e-workflow.test.ts,probe-hosted.test.ts,push-migrations.test.ts,request-loop.test.ts,running-image-digest.test.ts,workflow-errexit.test.ts,workflows.test.ts (13 files, 369 tests; 187-28: 12 files, 323 tests)
GUARD_DEPLOYED_SMOKE=passed
TF_FILES_CHANGED=0
FIX_PATHS=.github/workflows/deploy.yml,.github/workflows/destroy.yml,.github/workflows/infra-plan.yml,infra/README.md,infra/scripts/infra-plan-workflow.test.ts,infra/scripts/workflow-errexit.test.ts,infra/scripts/workflowGuards.ts
FIX_TOUCHES_APPS_PACKAGES_TESTS=no

- `typecheck` ran in 1 s because its 24 turbo tasks were hits of the attempt's private cache, filled by `lint:check` earlier in the same chain. `infra/` is not a workspace, so its three TS files were type-checked by the strict `tsc` of `ERREXIT_TS_STRICT_EXIT`.
- `INFRA_TESTS_PASSED`: `vitest run --config infra/vitest.config.ts --reporter=verbose`, exit 0. `GUARD_DEPLOYED_SMOKE`: `vitest run --config tests/vitest.config.ts --reporter=verbose`, exit 0, 15 files and 358 tests, with 16 cases of `deployedSmokeGuards.test.ts` passing and none failing.
- `TF_FILES_CHANGED`: `git diff --name-only <ERREXIT_BASE_HEAD> HEAD -- '*.tf' '*.tfvars' '*.hcl'` lists nothing, so the Terraform loops were not run. `git diff --quiet <ERREXIT_BASE_HEAD> -- apps packages tests` exits 0.

The E2E rule's targeted proof (CLAUDE.md, ruling of 2026-11-09): no spec, fixture, route or helper changed, and no application source changed, so no project is affected.

E2E_PROJECTS_AFFECTED=none
E2E_PROJECT_DELTAS=none
E2E_SUMMED_DELTAS=0

## Task 4: the evidence commits

HELPERS_COPIED=yes

`tmp/187-28/commits/make-commits.sh`, `tmp/187-28/build-archive.sh` and `tmp/187-28/scan.sh` were copied with their mode to the same paths under `tmp/187-29/`, with `tmp/187-28` and the earlier session's scratch directory rewritten to `tmp/187-29` and this executor's session scratch directory; each copy passes `bash -n`. The commits, the builds and their lines are in `evidence/187-12-evidence-commits.md` § Re-run 2026-11-17 (plan 187-29).

DB_STOPPED_FOR_BUILDS=yes

The scan of the red range (`bash tmp/187-29/scan.sh red 340a200708c28fb7ed078d452138712f3400c789 refs/evidence/187/red`, in the background, exit 0). It fetched from this checkout's own path only, into a plain repository that it removed afterwards, and ran trufflehog 3.97.9 with `main.yaml`'s extra arguments. The `--github-actions` run printed `"chunks": 4191`, `"verified_secrets": 0` and `"unverified_secrets": 0` and kept no annotation; the `--json` run's selection of location fields is empty, and its raw output was deleted with its mode-700 directory.

RED_SCAN_HEAD=26ecadd36d5cf2dbc17fd1f3739708d42c9be09a
RED_SCAN_BASE=340a200708c28fb7ed078d452138712f3400c789
RED_SCAN_EXIT=0
RED_SCAN_RESULTS=0
RED_SCAN_COVERS_GREEN=yes

`RED_SCAN_COVERS_GREEN`: `git diff-tree -r --name-only refs/evidence/187/green refs/evidence/187/red` prints only `apps/frontend/src/routes/+layout.ts`, so the red range holds the green tree.

BUILDER_CACHE_PRUNED=yes
DB_STARTED_AFTER=yes

`yarn db:start` exit 0; `supabase_db_openvaa-local` (healthy) and `supabase_edge_runtime_openvaa-local` Up afterwards.

GREEN_DIFF_VS_FINAL_4=.github/workflows/deploy.yml,.github/workflows/destroy.yml,.github/workflows/infra-plan.yml,infra/README.md,infra/bootstrap/README.md,infra/envs/staging/aws/README.md,infra/scripts/infra-plan-workflow.test.ts,infra/scripts/workflow-errexit.test.ts,infra/scripts/workflowGuards.ts
GREEN_DIFF_VS_FINAL_4_TOUCHES_APP_OR_TF=no

`GREEN_DIFF_VS_FINAL_4` is `git diff --name-only 68a54299aa81b2a2f95fd2151031ab4e624ef01c <GREEN_COMMIT>`: Task 3's `FIX_PATHS` and the two runbooks plan 187-18 changed. The same diff limited to `apps packages tests` and to `'*.tf' '*.tfvars' '*.hcl'` lists nothing, so the source tree that plan 187-28's closing E2E run covered is unchanged.

## Task 5: readiness

Read 2026-11-17T12:59:44Z to 13:00Z by the plan executor at HEAD `70c0c6150`. Every read is a GET or a local git read: nothing was pushed, no setting changed, no run started or approved. Each status was written to its own file under `tmp/187-29/t5/` on the line after its command and read from there; every one is 0.

READ_AT=2026-11-17T12:59:44Z
ENV_READ_BACK_OK=yes
STEP9_APPLIED=yes
RED_COMMIT_TO_PUSH=26ecadd36d5cf2dbc17fd1f3739708d42c9be09a
RED_TREE_PROVEN=yes
RED2_BRANCH=deploy-evidence/187-red-2
BRANCH_POLICY_ADMITS_RED2=yes
RED_BRANCH_ABSENT=yes
OLD_RED_BRANCH_TIP=3250ba0e8e964f8c87c03459f812bd935637272b
RUN_44042442257_ATTEMPTS=1
RUN_44042442267_ATTEMPTS=1
RED2_TRIGGERS=deploy.yml,infra-plan.yml
SERVED_BUILD_BEFORE=712947a1bd44a735f66ee8f51610f4748d76cd30
NO_RUN_ACTIVE=yes
READY_TO_PUSH=yes

- `ENV_READ_BACK_OK` (12:59:44Z): `gh api repos/OpenVAA/voting-advice-application/environments/<E>` and `.../environments/<E>/deployment-branch-policies` for `staging` and `staging-destroy`, each exit 0, read as types and names only. Both: `can_admins_bypass: false`; one `required_reviewers` rule with one reviewer of type `User`, `prevent_self_review: false`, no wait timer; a `branch_policy` rule; `deployment_branch_policy` `custom_branch_policies: true`, `protected_branches: false`; branch policies exactly `deploy-evidence/*:branch,deploy/staging:branch`. That is what 187-18 read at 07:50Z. The two environment responses were deleted after the types were read.
- `STEP9_APPLIED`: `evidence/187-16-bootstrap-apply.md` records `STEP9_RESULT=applied`, and `git diff --quiet 1e10dff7f HEAD -- infra/bootstrap infra/modules/github-oidc ':!infra/bootstrap/README.md'` exit 0.
- `RED_COMMIT_TO_PUSH` is the current `RED_COMMIT` of `evidence/187-12-evidence-commits.md` and `git rev-parse refs/evidence/187/red`.
- `RED_TREE_PROVEN`: in a temporary index under the session scratch directory, removed afterwards, `git read-tree HEAD`, `git rm -r --cached --quiet .planning` and `git write-tree`, each exit 0, printed `cdefe3565e672afc732dad52d44515f56e7c6168`, which is `refs/evidence/187/green^{tree}`; the real index untouched (`git diff --cached --quiet` exit 0). `git diff-tree -r --name-only refs/evidence/187/green refs/evidence/187/red` prints only `apps/frontend/src/routes/+layout.ts`, and `git for-each-ref --contains refs/evidence/187/red` prints only `refs/evidence/187/red`.
- `BRANCH_POLICY_ADMITS_RED2`: `deploy-evidence/187-red-2` matches `deploy-evidence/*` with no further `/`, and is not `deploy-evidence/destroy-staging`.
- `RED_BRANCH_ABSENT`: `git ls-remote origin refs/heads/deploy-evidence/187-red-2` exit 0, 0 bytes. `OLD_RED_BRANCH_TIP`: `git ls-remote origin refs/heads/deploy-evidence/187-red` exit 0, still `3250ba0e8`, so the consumed branch is untouched.
- `RUN_*_ATTEMPTS`: `run_attempt` of `gh api repos/OpenVAA/voting-advice-application/actions/runs/<id>`, each exit 0 and `1`.
- `RED2_TRIGGERS`: `git show 26ecadd36:.github/workflows/<w>.yml`, push branches. `deploy.yml`: `deploy/staging`, `deploy-evidence/**`, `!deploy-evidence/destroy-staging`; `infra-plan.yml`: `deploy-evidence/**`; `destroy.yml`: `deploy-evidence/destroy-staging` only. So the push starts one `deploy.yml` run and one `infra-plan.yml` run, and no `destroy.yml` run.
- `SERVED_BUILD_BEFORE` (12:59:50Z): `curl -sS -m 30 https://staging.openvaa.org/api/health` exit 0, HTTP 200, body `{"status":"ok","build":"712947a1bd44a735f66ee8f51610f4748d76cd30"}`, the same build 187-18 read before its push.
- `NO_RUN_ACTIVE`: `gh run list --status <s>` repository-wide for `queued`, `waiting`, `in_progress`, `requested` and `pending`, each exit 0, each listing nothing.
