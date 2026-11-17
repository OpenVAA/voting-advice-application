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
