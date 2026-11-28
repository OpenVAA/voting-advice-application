---
phase: 187-deploy-pipeline
plan: "18"
subsystem: infra
tags: [deploy-evidence, red-run, oidc, sts, wrong-subject, sns-alert, environment-gate, bash-e, pipe-09]
status: stopped
requirements-advanced: [PIPE-09, PIPE-01, PIPE-04, INFRA-16, INFRA-19, PIPE-02]

requires:
  - phase: 187-16
    provides: "step 9's hand apply: both trusts naming repository_id and repository_owner_id, the deploy trust naming environment:staging"
  - phase: 187-28
    provides: "refs/evidence/187/red (3250ba0e8) on a tree CI read green, with its local build failure proven"
provides:
  - "`evidence/187-18-red-run.md`: Task 1's six readiness lines, run 44042442257 and run 44042442267 read step by step, the operator's ruling RULING_BASH_E=fix-now-and-re-observe, the Closed by plan 187-29 pointer, and the operator's alert-mail lines"
  - "Public: branch `deploy-evidence/187-red` at 3250ba0e8e964f8c87c03459f812bd935637272b (consumed), run 44042442257 (deploy.yml, red at the build) and run 44042442267 (infra-plan.yml); one SNS message, 0d08cd58-15d0-5afa-995e-ae2e0c34d217, whose mail arrived"
  - "Dated Observations rows in `infra/envs/staging/aws/README.md` and `infra/bootstrap/README.md`: the pipeline's first run red at the build with nothing deployed, and the deploy role assumed from environment:staging with both id conditions set"
affects: [187-19, 187-21, 187-23, 187-25]

estimate:
  tokens: 40000
  tasks: 3
actuals:
  tokens: 23000
  tasks: 3
  commits: 13
plan_head_before: 5e25a1b8ba3ae81146c4e5fa6933f74f10551a87
plan_head_after: c35fce920f5f51b2d9968673b3cf634ab0d0251b

tech-stack:
  added: []
  patterns:
    - "A line a run cannot show because of a defect in the workflow is not re-run on the same branch; the defect is fixed in a gap plan, the evidence commits are rebuilt, and the line is observed on a new evidence branch. The old run stays as it is, at run_attempt 1"

key-files:
  created:
    - .planning/workstreams/deployment/phases/187-deploy-pipeline/evidence/187-18-red-run.md
  modified:
    - infra/envs/staging/aws/README.md
    - infra/bootstrap/README.md

key-decisions:
  - "Plan 187-18 stops at Task 3. Run 44042442257 was red at the build as intended, with the alert published and nothing deployed. But the runner's bash -e ended the build step before it printed failed=build, and ended the wrong-subject step before either STS call, so five of Task 3's verify lines could not be shown"
  - "Operator ruling of 2026-11-17: RULING_BASH_E=fix-now-and-re-observe. Gap plan 187-29 fixed the status reads and observed the five lines on deploy-evidence/187-red-2 (run 44088753181 and run 44088753527); run 44042442257 and run 44042442267 were not re-run"
  - "The operator confirmed the alert mail of run 44042442257: RED_ALERT_MAIL=arrived, RED_ALERT_MAIL_UTC=2026-11-17T09:00Z"
  - "The requirements are recorded advanced, not complete, because plans 187-19 to 187-25 still carry every one of them"

duration: about 6h30min (wall clock 2026-11-17T07:50Z to 14:20Z, including the operator's approval, a wait of about an hour at the gate, the ruling, gap plan 187-29 and the operator's mail report)
completed: 2026-11-17
---

# Phase 187 Plan 18: The red run from a broken build, its alert, and the wrong-subject refusal Summary

```
RED_RUN_URL=https://github.com/OpenVAA/voting-advice-application/actions/runs/44042442257
ALERT_STAGE=build
RED_ALERT_MAIL=arrived
deploy_role_error=AccessDenied
plan_role_error=AccessDenied
RED_ALERT_MAIL_UTC=2026-11-17T09:00Z
ALERT_MESSAGE_ID=0d08cd58-15d0-5afa-995e-ae2e0c34d217
HOSTED_WRITE=none
```

**The two refusal codes were not observed on this plan's runs. They were observed by gap plan 187-29**, on run 44088753527 for branch `deploy-evidence/187-red-2`, where both roles refused the subject `repo:OpenVAA/voting-advice-application:ref:refs/heads/deploy-evidence/187-red-2` with `AccessDenied`, status 254. The other lines above are this plan's own, from run 44042442257 and the operator's report.

**The pipeline's first run went red at the build, as intended. It waited at the `staging` gate until the operator approved it, assumed the deploy role through OIDC with both id conditions in force, skipped every later stage, published the build-failure alert, and wrote nothing hosted. The operator confirmed that the alert mail arrived. The runner's `bash -e` hid the build step's `failed=build` line and stopped the wrong-subject job before STS, so the plan stops at Task 3, and plan 187-29 closes those five lines.**

## Performance

- **Duration:** about 6 h 30 min of wall clock, from Task 1's first read at 2026-11-17T07:50Z to the operator's mail lines in `c35fce920` at 14:20Z. The run waited at the gate for about an hour (07:56:40Z to 08:59:12Z), and gap plan 187-29 ran in between.
- **Tasks:** 3 of 3 executed. Task 3's verify fails on five lines, which plan 187-29 closes.
- **Files modified:** 3, exactly the plan's `files_modified`.

## What was done

- **Task 1 (readiness, read-only).** All six lines read `yes` at 2026-11-17T07:50Z, from GETs and local git reads:
  - both environments still had the reviewer, bypass off and the two branch rules;
  - step 9 was applied;
  - the red ref `3250ba0e8` was the tree whose local build had failed, so nothing was rebuilt;
  - the branch `deploy-evidence/187-red` did not exist;
  - staging served `712947a1bd44…`;
  - no run was active.

  The plan's `gh run list --workflow` form returned 404, because none of the three workflows had run or was on `main`, so the last line was read with repository-wide status filters. Commit `d53169b29`.
- **Task 2 (the operator's approval).** Under attempt `20261117T075239Z.d53169b29` of key `187-18-2`, the operator's reply was stored. Both `attempt.sh bound` and `attempt.sh has '^answer_push=approve$'` exited 0. The orchestrator pushed `3250ba0e8…:refs/heads/deploy-evidence/187-red` at top level, at 07:55:25Z. The agent pushed and approved nothing.
- **Task 3 (both runs, step by step).** Commit `559ff935f`.
  - **Run 44042442257 (`deploy.yml`).** `checks` succeeded. The `staging` deployment waited, and was approved by a reviewer of type `User` at 08:59Z. The deploy job assumed the role as `deploy-44042442257`. The build step failed at `Failed: @openvaa/frontend#build` on the missing module, so no image was pushed. Steps 5 to 24 were all skipped: the plan, the migrations, the functions, the apply, the stable check, the smoke and the served-build read. The alert printed `alert_stage=build` and `alert_message_id=0d08cd58-…`, and the run concluded `failure`. Every one of the 31 steps is recorded as a `STEP=` line.
  - **Run 44042442267 (`infra-plan.yml`).** `checks` succeeded and mock-planned the three example roots (`aws`, `dns-mail`, `supabase`). `plan` was skipped. `wrong-subject` failed 0.26 s into its STS step and printed none of its five lines.
  - **Staging.** It served the same build after the run, so `HOSTED_WRITE=none`.
  - **Runbooks.** Rows were added to both runbooks and formatted with Prettier.
- **The ruling.** The operator ruled `RULING_BASH_E=fix-now-and-re-observe` (commit `331284af6`).
- **The alert mail.** The operator reported the mail as arrived, at 11:00 EET, which is 09:00Z. The body names the commit, the trigger and the run URL. Commit `c35fce920`.

## Task Commits

1. **Task 1: readiness.** `d53169b29` (docs)
2. **Task 2: the operator's approval and the push.** Done at top level; no commit.
3. **Task 3: both runs, the runbook rows.** `559ff935f` (docs); the ruling `331284af6` (docs); the operator's alert mail `c35fce920` (docs)

The pointer `## Closed by plan 187-29 (2026-11-17)` in the evidence is plan 187-29's commit `e7ed9022c`.

`commits: 13` is measured as `git rev-list --count 5e25a1b8b..c35fce920`. That range also holds plan 187-29's nine commits, which ran inside this plan's window. This plan's own commits are the four above, and this SUMMARY's commit makes five.

## Why the plan stops at Task 3

Both causes are the runner's default shell. GitHub runs a `run:` step that names no `shell:` as `bash -e {0}`, and each step read its command's status with `$?` on the next line.

- **The build step.** `build-push-image.sh` returned non-zero, and `-e` ended the step before `build_exit=$?` ran. So the script's `failed=build` line was never printed (`RED_BUILD_LINE=absent`). The step's conclusion and the alert's stage were not affected.
- **The wrong-subject step.** The token's `IFS=. read` hit the end of a file with no trailing newline and returned 1, which ended the step before either STS call. So `WRONG_SUBJECT_JOB=failure`, and no `token_subject=`, `deploy_role_error=` or `plan_role_error=` line was printed.

Task 3's verify therefore fails on `RED_BUILD_LINE=failed=build`, `WRONG_SUBJECT_JOB=success`, `token_subject=…deploy-evidence/187-red`, `deploy_role_error=` and `plan_role_error=`. As written it cannot pass, because its `token_subject` literal names `deploy-evidence/187-red`, which is consumed and must not be pushed again. Under the plan's prohibition, run 44042442257 was not re-run.

## Closed by plan 187-29 (2026-11-17)

Plan 187-29 captured every status read in the three workflows as `name=0`, then `cmd || name=$?`, with errexit left on. It rebuilt the evidence commits and pushed red commit `26ecadd36d5cf2dbc17fd1f3739708d42c9be09a` as `deploy-evidence/187-red-2`. On that push it observed the five lines this plan could not show. They are recorded in `evidence/187-29-red-rerun.md` § Task 7 and checked by that plan's verify:

- **Run [44088753181](https://github.com/OpenVAA/voting-advice-application/actions/runs/44088753181) (`deploy.yml`).** `RED_BUILD_LINE=failed=build`, with `build_exit=1`. Every later stage was skipped, `ALERT_STAGE=build`, and the run concluded `failure`.
- **Run [44088753527](https://github.com/OpenVAA/voting-advice-application/actions/runs/44088753527) (`infra-plan.yml`).** It recorded:
  - `WRONG_SUBJECT_JOB=success`;
  - `token_subject=repo:OpenVAA/voting-advice-application:ref:refs/heads/deploy-evidence/187-red-2`;
  - `deploy_role_error=AccessDenied` and `plan_role_error=AccessDenied`, both with assume status 254.
- **Staging.** `HOSTED_WRITE=none`: staging served `712947a1bd44…` before and after.

The operator also confirmed that mail: `RED2_ALERT_MAIL=arrived` at 2026-11-17T13:05Z, in `evidence/187-29-red-rerun.md`.

Run 44042442257 and run 44042442267 still read `run_attempt` 1, and `deploy-evidence/187-red` still points at `3250ba0e8`. This plan's status stays `stopped`, because its own Task 3 verify does not pass. The closure is plan 187-29's.

## Deviations from Plan

- **`NO_RUN_ACTIVE` was read by another method (Task 1).** The plan's `gh run list --workflow deploy.yml` returned 404 because the workflow was not yet registered. The line was read with repository-wide status filters and the runs list, as `NO_RUN_ACTIVE_METHOD=` in the evidence records.
- **Five verify lines were not shown (Task 3).** The cause was the runner's `bash -e`, described above. The plan stopped, and the operator's ruling took the fix to gap plan 187-29. No workflow file was changed in this plan.
- **The runbook rows record what was seen.** The bootstrap runbook's row "not yet observed" for both roles' refusal was narrowed rather than moved, because the refusal was not seen on this push. Plan 187-29 then added its own Observations rows for the refusal.

## Known Stubs

None.

## Next

- Plan 187-19 can start. It depends on 187-18 and on 187-29, and both now have a SUMMARY.

## Self-Check: PASSED

- FOUND: `.planning/workstreams/deployment/phases/187-deploy-pipeline/evidence/187-18-red-run.md`, and this file.
- FOUND commits, each an ancestor of HEAD: `d53169b29`, `559ff935f`, `331284af6`, `e7ed9022c` and `c35fce920`.
- Task 1's verify exits 0. The evidence holds no address (the plan's address pattern matched 0 lines).
- FOUND in `evidence/187-29-red-rerun.md`: `RED_BUILD_LINE=failed=build`, `WRONG_SUBJECT_JOB=success`, the `token_subject=` for `deploy-evidence/187-red-2`, `deploy_role_error=AccessDenied`, `plan_role_error=AccessDenied` and `HOSTED_WRITE=none`.
