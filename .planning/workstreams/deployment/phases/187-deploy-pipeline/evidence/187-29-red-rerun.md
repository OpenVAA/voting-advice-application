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
