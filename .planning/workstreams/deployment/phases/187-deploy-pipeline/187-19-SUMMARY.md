---
phase: 187-deploy-pipeline
plan: "19"
subsystem: infra
tags: [github-actions, infra-plan, pull-request, oidc, terraform-plan, image-digest, step-summary, evidence-commits, pipe-02]
status: complete
requirements-advanced: [PIPE-02, INFRA-19, PIPE-01, SUPA-08]

requires:
  - phase: 187-29
    provides: "the errexit-safe status reads in infra-plan.yml, the evidence-commit helpers under tmp/187-29/, and the public red commit 26ecadd36 the head is compared against"
  - phase: 187-18
    provides: "the runbook rows the head must carry, and its close (stopped at Task 3, closed by 187-29)"
provides:
  - "Local refs refs/evidence/187/green (0a73bb6df) and refs/evidence/187/red (aee0ba372), rebuilt from HEAD c5dbe5e86; green built (exit 0), red failed at @openvaa/frontend#build on the missing module (exit 1); builder cache pruned"
  - "Public: branches pr-evidence/187-base (340a20070, origin/main) and pr-evidence/187-head (0a73bb6df); closed draft #905 into pr-evidence/187-base; infra-plan.yml run 44104573552 (success)"
  - "The first digest-based plan of the staging AWS root, read in the log and in the step summary: Plan: 1 to add, 1 to change, 1 to destroy. on the task definition (replaced) and the service (updated in-place), the same image by digest, no subscription change"
  - "evidence/187-19-pr-plan.md, and the ## Re-run 2026-11-17 (plan 187-19) section of evidence/187-12-evidence-commits.md"
affects: [187-20, 187-21, 187-23, 187-25]

estimate:
  tokens: 30000
  tasks: 3
actuals:
  tokens: 7300
  tasks: 3
  commits: 3
plan_head_before: c5dbe5e8605ee5f433376bc4b2ec1b3a466100d0
plan_head_after: bb89c5e6ac4f295613f351a9df2982a555d2f004

tech-stack:
  added: []
  patterns:
    - "A pull request's plan is observed without a pull request against main: a draft from pr-evidence/187-head into pr-evidence/187-base (a branch at origin/main), after every workflow's push patterns are matched against both branch names"
    - "A job's step summary is not readable through the REST API or without a session; it is recorded as read only when someone signed in reads it on the run's Summary tab"

key-files:
  created:
    - .planning/workstreams/deployment/phases/187-deploy-pipeline/evidence/187-19-pr-plan.md
  modified:
    - .planning/workstreams/deployment/phases/187-deploy-pipeline/evidence/187-12-evidence-commits.md

key-decisions:
  - "Both evidence commits were rebuilt before Task 1 recorded anything, because the green ref's tree lacked 187-29's runbook rows (e7ed9022c); the previous lines were renamed *_SUPERSEDED="
  - "PR_PLAN_IN_SUMMARY stayed unread at Task 3's commit: the REST API exposes no step summary and the run's summary pages answer 404 without a session. It was set to yes only after the operator, signed in, read the summary on the run's Summary tab and pasted it in the main session"
  - "The requirements are recorded advanced, not complete, because plans 187-20 to 187-25 still carry them"
  - "The two pr-evidence branches stay on the remote for plan 187-20; only the draft was closed"

duration: about 23 min (2026-11-17T14:27Z to 14:50Z, including the operator's approval, the pushes, the run and the operator's read of the step summary)
completed: 2026-11-17
---

# Phase 187 Plan 19: The pull request's plan of the staging AWS root, observed Summary

```
PR_PLAN_SUMMARY=Plan: 1 to add, 1 to change, 1 to destroy.
PR_RUN_URL=https://github.com/OpenVAA/voting-advice-application/actions/runs/44104573552
PR_URL=https://github.com/OpenVAA/voting-advice-application/pull/905
PR_BASE_REF=pr-evidence/187-base
PR_CHECKS_JOB=success
PR_PLAN_JOB=success
PR_WRONG_SUBJECT_JOB=skipped
PR_DIGEST_REFERENCE=tag
PR_DIGEST=sha256:bab8fa75c6094a2cecab07282826bffa4d9746bf7ee56fc7231b8283ea937bea
PR_PLAN_EXIT=2
PR_PLAN_SUBSCRIPTION_UNCHANGED=yes
PR_PLAN_IN_SUMMARY=yes
PR_ARTIFACTS=0
PR_CLOSED=yes
```

**A draft pull request from `pr-evidence/187-head` (the rebuilt green commit `0a73bb6df`) into `pr-evidence/187-base` (`origin/main`, `340a20070`) ran `infra-plan.yml` as run 44104573552. Its `plan` job assumed the plan role through OIDC from the pull-request subject, resolved the running image's digest from its tag, and planned the staging AWS root without the lock. The plan is `Plan: 1 to add, 1 to change, 1 to destroy.`: the task definition is replaced and the service updated in-place, a rollout of the same image by digest, with no change to the alert subscription. That is the plan Task 1 expected. It is readable in the log and, as the operator read it signed in, in the job's step summary. No artifact was uploaded, and the draft is closed.**

## Performance

- **Duration:** about 23 min, 2026-11-17T14:27Z (the green commit's rebuild) to 14:50Z (the step-summary record).
- **Tasks:** 3 of 3. Task 2 was the operator's checkpoint, settled at top level.
- **Files modified:** 2, exactly the plan's `files_modified`.

## Accomplishments

- **The rebuild (execution rules, before Task 1).** The green ref's tree lacked the runbook rows of `e7ed9022c` (`infra/bootstrap/README.md`, `infra/envs/staging/aws/README.md`). So both evidence commits were rebuilt from HEAD `c5dbe5e86` with plan 187-29's helpers, copied to `tmp/187-19/`. No remote was read during the rebuild.
  - Green `0a73bb6df`: 3534 paths, none under `.planning/`. It built from its archive with exit 0 in 83 s.
  - Red `aee0ba372`: it differs from green only in `apps/frontend/src/routes/+layout.ts`. It failed at `@openvaa/frontend#build` on `[UNLOADABLE_DEPENDENCY] Could not load src/lib/does-not-exist-187-red`, exit 1.
  - The working tree was left unchanged. The builder cache was pruned (4.903 GB), and the stack was restarted.
- **Readiness (Task 1).** Each line was read locally or with a GET:
  - the head's tree equals HEAD's outside `.planning/`;
  - the head was not yet public (HTTP 422);
  - three paths differ from the public red commit `26ecadd36`;
  - neither `pr-evidence/*` branch existed;
  - no workflow's push patterns match either branch name (0 matches; the control reports 3);
  - the diff matches `infra-plan.yml`'s `paths`;
  - `EXPECTED_PLAN=1 to add, 1 to change, 1 to destroy`, from the staging runbook's Step 5.
- **The approval (Task 2).** Attempt `20261117T143255Z.e2bcf829d`, `answer_push=approve`. The orchestrator bound it at top level before the pushes, and the executor read the binding again at Task 3 (`PR_BINDING_BOUND=0`, `PR_BINDING_HAS_APPROVE=0`).
- **The run (Task 3).** Run 44104573552, event `pull_request`, attempt 1, concluded `success`.
  - **`checks` (job 134113318699).** fmt raised no diff. Validate passed 8 roots. The module tests passed 33 and 11. The example mock plans planned `aws:40,dns-mail:15,supabase:4` addresses, each count matching its root's plan summary line.
  - **`plan` (job 134113319133).** It authenticated as `pr-plan-44104573552`. The digest step printed `running_image_reference=tag` and the digest above. The plan ran with `-lock=false` and ended `plan_exit=2`.
  - **The plan's changes.** The service's only change is its `task_definition`. The task definition's `image` moves from the tag `712947a1…` to the same image's digest, plus the provider's normalisation of AWS-filled defaults. The only output change is `task_definition_arn`. `aws_sns_topic_subscription` appears only on a `Refreshing state...` line.
  - **`wrong-subject`.** Skipped on a pull request, as designed.
  - **Artifacts.** `total_count=0`.
  - **No other runs.** The pushes and the close started no other run on either branch.
- **The step summary (Task 3, closed 2026-11-17).** The operator, signed in to GitHub, read the plan job's summary on the run's Summary tab. The heading is `Plan of infra/envs/staging/aws`, the summary line is `Plan: 1 to add, 1 to change, 1 to destroy.`, the two action lines and the image change are the log's, and no line names the subscription. `PR_PLAN_IN_SUMMARY=yes` was recorded with a dated note quoting both lines. After that, Task 3's verify exited 0, its status read on its own line.
- **The draft closed.** `gh pr close 905` ran at 14:39:12Z. Both branches still read at their pushed SHAs, kept for plan 187-20.

## Task Commits

1. **Task 1: readiness, and the rebuild of the evidence commits.** `e2bcf829d` (docs)
2. **Task 2: the operator's approval.** Done at top level; recorded in `36a07dd68`.
3. **Task 3: the pushes, the draft, the plan read, and the draft closed.** `36a07dd68` (docs), then `bb89c5e6a` (docs), which records the operator's signed-in read of the step summary.

## Decisions Made

See `key-decisions` in the frontmatter. In brief:
- the evidence commits were rebuilt, because the green tree lacked 187-29's runbook rows;
- the step summary was recorded as read only on the operator's signed-in read, not inferred from the step's script and `show_exit=0`;
- the requirements are recorded as advanced, not complete;
- the branches were kept for 187-20.

## Deviations from Plan

**1. The step summary was read by the operator, not with `gh api`.**
- **Found during:** Task 3.
- **Issue:** The action says to read the run's step summary "with `gh api`". The REST API exposes no job step summary: the check run's `output` is empty. The `summary_raw` pages answer 404 without a session.
- **Resolution:** Task 3 was committed with `PR_PLAN_IN_SUMMARY=unread`. The operator then read the summary signed in on the run's Summary tab. That read was recorded in `bb89c5e6a`, and only then did the verify run green.
- **Impact:** None on the verdict. The summary holds the same plan as the log.

## Issues Encountered

None besides the step-summary read above.

## User Setup Required

None.

## Next Phase Readiness

- The plan the green run's first apply will make is known in advance and matches `EXPECTED_PLAN`: a rollout of the same image by digest, with no change to the subscription.
- `pr-evidence/187-base` and `pr-evidence/187-head` remain on the remote for plan 187-20.
- The green evidence commit `0a73bb6df` is now public as `pr-evidence/187-head`. The rebuilt red commit `aee0ba372` was not pushed and stays local.

## Self-Check: PASSED

- The files exist: `evidence/187-19-pr-plan.md`, `evidence/187-12-evidence-commits.md` and this SUMMARY.
- Commits `e2bcf829d`, `36a07dd68` and `bb89c5e6a` are ancestors of HEAD.
- Task 3's verify exited 0, with its status read on its own line after the edit.
