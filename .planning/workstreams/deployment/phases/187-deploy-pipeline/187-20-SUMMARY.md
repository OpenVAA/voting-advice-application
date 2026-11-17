---
phase: 187-deploy-pipeline
plan: "20"
subsystem: infra
tags: [github-actions, infra-plan, pull-request, fork, oidc, credentials, pipe-03]
status: complete
requirements-advanced: [PIPE-03]

requires:
  - phase: 187-19
    provides: "the public branches pr-evidence/187-base (340a20070) and pr-evidence/187-head (0a73bb6df), and the same-repository run 44104573552 whose plan job assumed the plan role"
provides:
  - "Public: closed draft #906 from a fork's branch pr-evidence/187-fork (0a73bb6df) into pr-evidence/187-base; infra-plan.yml run 44124810789 (success), its plan job skipped"
  - "evidence/187-20-fork-pr.md: the readiness lines (Task 1) and the FORK_* lines of the run (Task 3)"
affects: [187-21, 187-23, 187-25]

estimate:
  tokens: 20000
  tasks: 3
actuals:
  tokens: 1530
  tasks: 3
  commits: 3
plan_head_before: 619505b3685c71ba315b587f2eb852415cb80f2b
plan_head_after: 1d0b6a1aea2f5eb3934957c176f9ee1ee44fe9aa

tech-stack:
  added: []
  patterns:
    - "A fork's pull request is observed against a pr-evidence base branch, not main: the operator pushes the public evidence commit to a branch of their fork and opens a draft into pr-evidence/187-base"
    - "A fork's head is recorded as FORK_HEAD_IS_FORK=yes from head.repo.fork; the owner's login is never written, and the evidence is checked for it by count without printing it"

key-files:
  created:
    - .planning/workstreams/deployment/phases/187-deploy-pipeline/187-20-SUMMARY.md
  modified:
    - .planning/workstreams/deployment/phases/187-deploy-pipeline/evidence/187-20-fork-pr.md

key-decisions:
  - "The run had already completed when Task 3 began, so no wait for an approval was needed and no approval checkpoint was returned"
  - "FORK_ASSUME_STEPS=0 is read from the run's jobs: plan and wrong-subject have no steps, checks has none named for credentials, and its log holds no credentials string"
  - "PIPE-03 is recorded advanced, not complete, because plans 187-21 to 187-25 still carry the phase's requirements"
  - "Both pr-evidence branches are left on the remote as they were; only the pull request was closed"

duration: about 91 min (2026-11-17T14:53Z to 16:24Z, nearly all of it the wait for the operator's fork and pull request)
completed: 2026-11-17
---

# Phase 187 Plan 20: A fork's pull request gets no credentials Summary

```
FORK_PLAN_JOB=skipped
FORK_RUN_URL=https://github.com/OpenVAA/voting-advice-application/actions/runs/44124810789
FORK_PR=906
FORK_HEAD_IS_FORK=yes
FORK_RUN_EVENT=pull_request
FORK_RUN_CONCLUSION=success
FORK_CHECKS_JOB=success
FORK_WRONG_SUBJECT_JOB=skipped
FORK_ASSUME_STEPS=0
FORK_ARTIFACTS=0
FORK_PR_CLOSED=yes
```

**The operator opened draft #906 from a branch of their fork, `pr-evidence/187-fork` at the public green commit `0a73bb6df`, into `pr-evidence/187-base`. It ran `infra-plan.yml` as run 44124810789, event `pull_request`, concluded `success`. The credential-free `checks` job ran and passed. The `plan` job, which holds the workflow's only `aws-actions/configure-aws-credentials` step, shows as `skipped` with no steps, because its `if` requires the head repository to be this repository. `wrong-subject` also skipped, as it does on every pull request. No step of the run assumed a role, the run uploaded nothing, and the pull request is closed. That is PIPE-03's visible skip, not a red run at the credentials step.**

## Performance

- **Duration:** about 91 min, 2026-11-17T14:53Z (Task 1's record) to 16:24Z (the close). Nearly all of it was the wait for the operator.
- **Tasks:** 3 of 3. Task 2 was the operator's checkpoint, settled at top level.
- **Files modified:** 1, exactly the plan's `files_modified`.

## Accomplishments

- **Readiness (Task 1).** The base branch `pr-evidence/187-base` still names `340a20070`. The head `0a73bb6df` is public. The workflow at that commit guards `plan` with `github.event.pull_request.head.repo.full_name == github.repository` and has no `pull_request_target` trigger.
- **The pull request (Task 2).** Attempt `20261117T145418Z.1c5ed8deb`, `answer_fork_pr=906`. The orchestrator bound it at top level. Task 3 began by re-reading the binding (`bound` exit 0).
- **The run (Task 3).** Run 44124810789, attempt 1, 16:21:23Z to 16:22:53Z, `head_repository.fork=true`. It is the only run for the fork pull request.
  - **`checks` (job 134185560511): `success`.** It validated 8 roots. The module tests passed 33 and 11 (2 modules), and the three example roots planned with 1 passed each. Its token had `Contents: read` and `Metadata: read`. Its log has no credentials string.
  - **`plan` (job 134185564336): `skipped`, no steps.**
  - **`wrong-subject` (job 134185642793): `skipped`, no steps.**
  - **Artifacts:** `total_count=0`.
- **The close.** `gh pr close 906` ran at 16:23:59Z, on the operator's reply. The pull request then read `state=closed` and `merged=false`. The close started no run. Both `pr-evidence/*` branches still read at their pushed SHAs.
- **No login.** The evidence holds neither the fork owner's login nor the git user name. Both were checked by count, 0, without being printed.

## Task Commits

1. **Task 1: readiness, read-only.** `1c5ed8deb` (docs)
2. **Task 2: the operator's fork pull request.** Done at top level; recorded in `1d0b6a1ae`.
3. **Task 3: the fork run read, and the pull request closed.** `1d0b6a1ae` (docs)

`git rev-list --count 619505b36..HEAD` measures 3. One of the three, `6854e9d6f`, is plan 187-21's readiness commit, which landed between this plan's two commits. This plan made 2 of them.

## Decisions Made

See `key-decisions` in the frontmatter.

## Deviations from Plan

None. The plan was executed as written. The run had already completed by the time Task 3 read it, so the approval wait was not needed.

## Issues Encountered

- `gh api .../actions/jobs/<id>/logs` refused to write the log because it contains terminal escape sequences, so the log was read with `gh run view --job <id> --log` instead. The verdict does not depend on it.

## User Setup Required

None.

## Next Phase Readiness

- PIPE-03 is observed. A same-repository pull request plans with the plan role (187-19). A fork's pull request skips the credentialed job and assumes no role (this plan).
- `pr-evidence/187-base` and `pr-evidence/187-head` remain on the remote, unchanged. The fork's branch is the operator's to delete.

## Self-Check: PASSED

- The files exist: `evidence/187-20-fork-pr.md` and this SUMMARY.
- Commits `1c5ed8deb` and `1d0b6a1ae` are ancestors of HEAD.
- Task 3's verify exited 0, with its status read on its own line after the last edit.
