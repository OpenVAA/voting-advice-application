---
requirements-completed: [PIPE-02, PIPE-04, PIPE-07, PIPE-08]   # marked at the v2.17 milestone audit (2026-11-21) from the phase VERIFICATION.md
phase: 187-deploy-pipeline
plan: "29"
subsystem: infra
tags: [github-actions, errexit, bash-e, wrong-subject, oidc, sts, red-run, evidence-commits, gap-closure, pipe-09]
status: complete
requirements-advanced: [PIPE-09, PIPE-01, INFRA-16, INFRA-19, PIPE-04, PIPE-02, PIPE-05, PIPE-06, PIPE-07, PIPE-08]

requires:
  - phase: 187-18
    provides: "run 44042442257 and run 44042442267, which showed the runner's bash -e ending the build step and the wrong-subject step before their status reads, and the operator's ruling RULING_BASH_E=fix-now-and-re-observe"
  - phase: 187-28
    provides: "the evidence-commit helpers (make-commits.sh, build-archive.sh, scan.sh) and the gate runner, copied under tmp/187-29/"
provides:
  - "Every status the run: steps of deploy.yml, destroy.yml and infra-plan.yml read is captured as name=0 then cmd || name=$? (29 steps, 42 reads); the token's read guarded with || [ -n \"$payload\" ]; errexit on everywhere"
  - "infra/scripts/workflow-errexit.test.ts: each status-reading step run under bash -e against stub commands (44 tests), green locally and on the runner"
  - "The shared workflow rule status-read-after-or in infra/scripts/workflowGuards.ts"
  - "Local refs refs/evidence/187/green (f721ef779) and refs/evidence/187/red (26ecadd36), the red range scanned 0 at trufflehog 3.97.9"
  - "Public: branch deploy-evidence/187-red-2 at 26ecadd36; run 44088753181 (deploy.yml, red at the build with failed=build printed) and run 44088753527 (infra-plan.yml, wrong-subject success); one SNS message"
  - "evidence/187-29-red-rerun.md, and the Closed by plan 187-29 pointer in evidence/187-18-red-run.md"
affects: [187-18, 187-19, 187-21, 187-23, 187-25]

estimate:
  tokens: 110000
  tasks: 7
actuals:
  tokens: 26300
  tasks: 7
  commits: 6
plan_head_before: 32177fe6b1096cc079169674610063846bf0d6cb
plan_head_after: e7ed9022cdc11309731439f284c84f94f6df6e6d

tech-stack:
  added: []
  patterns:
    - "A status a run: step reads is captured on its command's own line, name=0 then cmd || name=$?, never with $? on the next line: GitHub runs a step with no shell: as bash -e {0}, and errexit stays on so an unread failure still ends the step"
    - "A workflow step's behaviour is tested by running its run string under bash -e in a temporary root whose PATH holds only stubs and symlinked file utilities, with an environment built from nothing"

key-files:
  created:
    - infra/scripts/workflow-errexit.test.ts
    - .planning/workstreams/deployment/phases/187-deploy-pipeline/evidence/187-29-red-rerun.md
  modified:
    - .github/workflows/deploy.yml
    - .github/workflows/destroy.yml
    - .github/workflows/infra-plan.yml
    - infra/scripts/workflowGuards.ts
    - infra/scripts/infra-plan-workflow.test.ts
    - infra/README.md
    - infra/bootstrap/README.md
    - infra/envs/staging/aws/README.md
    - .planning/workstreams/deployment/phases/187-deploy-pipeline/evidence/187-12-evidence-commits.md
    - .planning/workstreams/deployment/phases/187-deploy-pipeline/evidence/187-18-red-run.md

key-decisions:
  - "Statuses are captured in || lists rather than turning errexit off per step, job or workflow, so a failing command whose status a step does not read still ends the step (an unreadable config.toml cannot default every verify_jwt to true)"
  - "The red run was observed again on a new branch, deploy-evidence/187-red-2 (run 44088753181 and run 44088753527); run 44042442257 and run 44042442267 were not re-run and deploy-evidence/187-red was not pushed to"
  - "The wrong-subject job's pass condition is unchanged (both statuses non-zero, both codes AccessDenied); on the runner both roles refused the branch subject with AccessDenied, status 254"
  - "The requirements are recorded advanced, not complete, because plans 187-19 to 187-25 still carry every one of them"

duration: about 55 min (2026-11-17T12:18Z to 13:13Z, including the operator's approval, the push and both runs)
completed: 2026-11-17
---

# Phase 187 Plan 29: The status reads under the runner's bash -e fixed, and the red run observed again Summary

```
RED_RUN_URL=https://github.com/OpenVAA/voting-advice-application/actions/runs/44088753181
RED_BUILD_LINE=failed=build
WRONG_SUBJECT_JOB=success
token_subject=repo:OpenVAA/voting-advice-application:ref:refs/heads/deploy-evidence/187-red-2
deploy_role_error=AccessDenied
plan_role_error=AccessDenied
HOSTED_WRITE=none
INFRA_PLAN_RUN_URL=https://github.com/OpenVAA/voting-advice-application/actions/runs/44088753527
```

**Every status-reading step of the three pipeline workflows now captures its statuses in `||` lists, so under the runner's `bash -e` the deploy run's build step printed `failed=build` and `build_exit=1`, and the `wrong-subject` job reached both STS calls and saw both roles refuse a branch subject with `AccessDenied`. Nothing hosted was written.**

## Performance

- **Duration:** about 55 min, 2026-11-17T12:18Z to 13:13Z, including the operator's approval and both runs.
- **Tasks:** 7 of 7. Task 6 was the operator's checkpoint, settled at top level.
- **Files modified:** 12, exactly the plan's `files_modified`.

## Accomplishments

- **The fix (Tasks 1 and 2).** The 29 status-reading steps hold 42 `$?` reads: 12 steps in `deploy.yml`, 13 in `destroy.yml` and 4 in `infra-plan.yml`. Each read is now written `name=0`, then `cmd || name=$?`. The token's `read` is guarded with `|| [ -n "$payload" ]`. No step, job or workflow turns errexit off (`STEPS_WITH_ERREXIT_OFF=0`). The harness was red first and is now green:
  - the tracer, which runs the wrong-subject step, was red on the unchanged workflow;
  - 28 sweep cases were red at the start, and all 29 steps pass now;
  - the behaviour cases pass: the build fails with `failed=build`, status 3 continues, the PR plan's status 2 is accepted, and the Supabase-root refusal passes;
  - the unread-status cases, with their `+e` controls, show that a status the step does not read still ends the step.
- **The rule and the gates (Task 3).** The rule `status-read-after-or` was red on its mutated copies and is green on the three files. `lint:check`, `format:check`, `typecheck`, `test:unit` and `lint:workflows` each exited 0. The infra tests pass: 13 files, 369 tests. Nothing under `apps/`, `packages/` or `tests/` changed, and no Terraform file did. The E2E rule affects no project.
- **The evidence commits (Task 4).** Green `f721ef779` builds from its archive. Red `26ecadd36` fails at the frontend build on the missing module. The red range scanned 0 at trufflehog 3.97.9 (4191 chunks).
- **Readiness (Task 5).** Every line was read by a GET or a local read: the environments, step 9, the red tree, the branch's absence, the old branch's tip, the attempts of the old runs, the triggers, the served build, and the fact that no run was active. Result: `READY_TO_PUSH=yes`.
- **The push and both runs (Task 7), read by this executor with GETs alone:**
  - **Run 44088753181 (`deploy.yml`).** `checks` succeeded, and on the runner it ran `workflow-errexit.test.ts` with 44 tests passing. The `staging` deployment read `waiting` at 13:03:27Z and was approved by a reviewer of type `User`. The deploy job started at 13:04:18Z and assumed the deploy role. The build failed on `Failed: @openvaa/frontend#build` and then printed `failed=build`, `build_exit=1` and `build-push-image.sh exited 1.`. Steps 5 to 24 were skipped. The alert printed `alert_stage=build` and `alert_message_id=38c955f1-9a60-59f4-9ba2-3687c939f19d`. The run concluded `failure`.
  - **Run 44088753527 (`infra-plan.yml`).** `checks` succeeded and mock-planned the three example roots. `plan` was skipped. `wrong-subject` succeeded and printed the five lines above, with both assume statuses 254.
  - **Staging.** It served `712947a1bd44…` before and after.
  - **Re-runs.** Every `run_attempt` reads 1: both new runs, run 44042442257 and run 44042442267.
- **Runbooks and the pointer (Task 7).**
  - Dated Observations rows were added to `infra/envs/staging/aws/README.md` and `infra/bootstrap/README.md`.
  - The bootstrap runbook's row "not yet observed" was narrowed to "A workflow can assume the plan role", checked by "The plan role on a pull request".
  - `## Closed by plan 187-29 (2026-11-17)` was appended to `evidence/187-18-red-run.md`, and none of its existing lines changed (numstat `12 0`).

## Task Commits

1. **Task 1: the wrong-subject step under `bash -e`.** `79c173257` (fix)
2. **Task 2: every other status read in an `||` list.** `3774b1c98` (fix)
3. **Task 3: the shared rule `status-read-after-or`, the README, the gates.** `195c77f95` (feat)
4. **Task 4: the green and red evidence commits, their builds, the red scan.** `70c0c6150` (docs)
5. **Task 5: the new red push's readiness.** `a71cd9cf9` (docs)
6. **Task 6: the operator's approval and the push.** Done at top level; no commit.
7. **Task 7: the push, both runs, the runbook rows, the pointer.** `e7ed9022c` (docs)

## Handed back to 187-18

- The operator's `RED_ALERT_MAIL=` and `RED_ALERT_MAIL_UTC=` lines, for the alert of run 44042442257, message `0d08cd58-15d0-5afa-995e-ae2e0c34d217`.
- 187-18's SUMMARY, written after that reply. Its status is `stopped` at Task 3, and its five lines are closed by plan 187-29, in the same way plan 187-28 closed 187-15, 187-26 and 187-27.

The mail of this run's alert (message `38c955f1-9a60-59f4-9ba2-3687c939f19d`) is also the operator's to report. `RED2_ALERT_MAIL=` is not a verify line of this plan and is not written.

## Decisions Made

See `key-decisions` in the frontmatter. In brief:
- the `||` capture form was chosen over `set +e`;
- the new branch was used, and no run was re-run;
- the wrong-subject check was left unchanged;
- the requirements are recorded as advanced, not complete.

## Deviations from Plan

There were no deviations in Task 7. Three readings differ from the orchestrator's record, and each is stated in the evidence:
- **`pending_deployments`.** It lists nothing now that the run has completed. So `GATE_WAITED=yes` rests on this executor's read of the `staging` deployment's statuses (`waiting` at 13:03:27Z, `in_progress` at 13:04:18Z) and on the orchestrator's read of `pending_deployments` at 13:03:35Z.
- **The branch's creation time.** GitHub's activity API stamps the creation of `deploy-evidence/187-red-2` at 13:02:15Z. `RED_PUSHED_AT` is the push command's own time from the orchestrator, 13:02:04Z.
- **`SERVED_BUILD_AFTER`.** It was read at 13:08:17Z. The orchestrator's read was at about 13:06Z, and both returned the same body.

The bootstrap runbook's not-yet-observed table was re-padded by prettier after its row got shorter. With runs of spaces and dashes collapsed, its other rows are unchanged.

## Issues Encountered

None.

## Next Phase Readiness

- 187-18 can close once the operator writes the mail lines. 187-19 can start after that.
- From now on, the pipeline's steps print their own diagnosis on green, pull-request and destroy runs.

## Self-Check: PASSED

- The files exist: `infra/scripts/workflow-errexit.test.ts`, `evidence/187-29-red-rerun.md` and this SUMMARY.
- Commits `79c173257`, `3774b1c98`, `195c77f95`, `70c0c6150`, `a71cd9cf9` and `e7ed9022c` are ancestors of HEAD. The evidence commits `f721ef779` and `26ecadd36` exist as objects at their refs.
- Task 7's verify exited 0, with the status read from a file, both before and after its commit.
