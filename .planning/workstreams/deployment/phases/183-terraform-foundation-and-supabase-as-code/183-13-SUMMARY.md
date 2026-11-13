---
phase: 183-terraform-foundation-and-supabase-as-code
plan: 13
subsystem: infra
tags: [lint-check, lint-guard, red-control, iam, settings-parity, gates]
status: complete

requires:
  - phase: 183-09
    provides: "scripts/assert-no-inline-iam-policies.mjs and its `lint:check` link"
  - phase: 183-10
    provides: "scripts/assert-hosted-settings-parity.mjs and its `lint:check` link"
  - phase: 183-26
    provides: "the parity guard's structural assertions (five JSON groups, two hook switches)"
  - phase: 183-11
    provides: "the infra-validate job in main.yaml and its local commands"
  - phase: 183-01
    provides: "baseline gate statuses and tools/attempt.sh"
provides:
  - "evidence/183-13-lint-check-red-controls.md: both new guards seen failing through `yarn lint:check` itself (exit 1 each, finding line quoted, last link before the failure named) in a throwaway worktree, and the three repository gates plus the three new specs and the infra-validate local loop all 0 on the finished tree"
affects: [183-14, 183-15, 183-17, 183-24, 183-25, phase-183-verification]

estimate:
  tokens: 52000
  tasks: 3
actuals:
  tokens: 1833     # chars/4 over the one file this plan's task commits changed (7330 chars)
  tasks: 2         # Tasks 1 and 3 executed; Task 2 skipped by its own condition (chain observation made)
  commits: 2       # MEASURED: git rev-list --count plan_head_before..HEAD at SUMMARY write

plan_head_before: 46099edc1c52f9674cf62c74fa32f280611121d8
plan_head_after: 147d77eca815e3ac25c6be319d5bbc175ff82276

tech-stack:
  added: []
  patterns:
    - "Red controls through a whole-repo chain run in a detached `git worktree` under $TMPDIR with its own `yarn install --immutable`, `yarn build` and private TURBO_CACHE_DIR; the worktree is removed, pruned and checked absent"

key-files:
  created:
    - .planning/workstreams/deployment/phases/183-terraform-foundation-and-supabase-as-code/evidence/183-13-lint-check-red-controls.md
  modified: []

key-decisions:
  - "A fresh scratch checkout needs `yarn build` before `yarn lint:check`: without it `typecheck:tests` fails with TS2307 on @openvaa/app-shared/core/data; that is a setup gap of the scratch checkout, not a red link at the commit, and the clean run after the build was 0"
  - "Task 2 (blocking-human checkpoint) was not raised: Task 1 wrote `Chain observation: made`"
  - "INFRA-17 and SUPA-11 are not marked complete here: the lint:check clause of each is now observed, but INFRA-17 also needs the account's own state (183-14, 183-17) and SUPA-11 the applied and read-back hosted settings (183-24, 183-25), as 183-26 recorded"

requirements-completed: []  # INFRA-17 and SUPA-11: lint:check clause observed here; the remaining clauses close in 183-14/17 and 183-24/25

duration: ~10 min
completed: 2026-10-19
---

# Phase 183 Plan 13: Both new guards red through `yarn lint:check` Summary

**In a throwaway worktree of commit 46099edc1, `yarn lint:check` exited 1 on a planted `aws_iam_role_policy` under `infra/` (finding `infra/zz-red-control/planted.tf:1: aws_iam_role_policy`) and exited 1 on `api.max_rows` 49999 in `hosted-settings.json` (finding `api/max_rows`, after the inline-policy guard passed). The clean run was 0, and the worktree was removed and checked gone. On the finished tree `lint:check`, `format:check` and `test:unit` each exited 0 at 5322ab1f6, with a clean tree before and after.**

## Performance

- Started: 2026-10-19T06:29:57Z
- Completed: 2026-10-19T06:40Z (about 10 minutes)
- Tasks: 2 executed of 3 (Task 2 skipped by its condition)
- Files: 1 created

## Accomplishments

- Inline-policy guard seen red through the chain: setup (plant) status 0, then `yarn lint:check` exit 1. The last link
  to print a summary before it was the auth-signup-closed guard, and the parity guard did not run.
- Parity guard seen red through the chain: setup (edit 50000 to 49999) status 0, then `yarn lint:check` exit 1. The
  inline-policy guard's `0 finding(s)` line just before it shows that the chain reached the last link.
- The shared checkout never held a planted file. The scratch worktree `$TMPDIR/openvaa-183-red` was removed with
  `git worktree remove --force` and `git worktree prune`; it is not listed and the path does not exist. The shared
  checkout's tree sample was 0 lines before and after, at the same commit.
- On the finished tree, `lint:check` 0, `format:check` 0 and `test:unit` 0 (baseline 0/0/0), each with equal full
  HEAD before and after and tree `0/0`. The three new gate specs passed (3 files, 36 tests). The infra-validate local
  loop exited 0 (fmt 0, 8 roots valid, settings types "four cases hold"). Both guards exit 0 when run directly.

## Task Commits

1. **Task 1: both red controls through `yarn lint:check` in a scratch checkout** - `5322ab1f6` (docs)
2. **Task 2: checkpoint for the full-chain observation** - skipped: Task 1 wrote `Chain observation: made`
3. **Task 3: the three gates on the finished tree** - `147d77eca` (docs)

## Files Created/Modified

- `.planning/workstreams/deployment/phases/183-terraform-foundation-and-supabase-as-code/evidence/183-13-lint-check-red-controls.md`:
  the dated record, written whole from attempt files `13-1 20261019T062957Z.46099edc1` and
  `13-3 20261019T063550Z.5322ab1f6`

## Decisions Made

See `key-decisions` in the frontmatter.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Built workspace packages in the scratch checkout**
- **Found during:** Task 1, first clean run
- **Issue:** In the fresh worktree, `yarn lint:check` exited 2 at `typecheck:tests` with TS2307 "Cannot find module
  '@openvaa/app-shared'" (also `@openvaa/core` and `@openvaa/data`), because the workspace packages had no `dist/`
  there. The shared checkout, where the baseline was taken, has them.
- **Fix:** ran `yarn build` (turbo, 14 of 14 tasks, status 0) in the scratch checkout before the clean run. No guard
  or link was changed. The clean run then exited 0. Both runs are recorded in the evidence.
- **Files modified:** none (scratch checkout only, since removed)

**2. [Note] Task 3's extra rows**
- The plan asks for the three new spec files and "the validation job's local loop". The loop was taken as the three
  run steps of the `infra-validate` job, with the validation script extracted from the parsed `main.yaml` (identical
  to the one plan 183-11 ran), under local Terraform 1.14.7 (CI pins 1.16.5).

## Issues Encountered

None beyond the scratch build.

## Next Phase Readiness

- The `lint:check` clauses of roadmap criteria 2 and 5 (INFRA-17, SUPA-11) are observed. Those requirements stay open
  for their account-state and applied-settings clauses (183-14/17, 183-24/25).
- No blocker for the phase gate: every gate on the finished tree is 0.

## Self-Check: PASSED

- FOUND: evidence/183-13-lint-check-red-controls.md
- FOUND: 5322ab1f6 and 147d77eca are ancestors of HEAD
- FOUND: no `openvaa-183-red` entry in `git worktree list --porcelain`; path absent; `infra/zz-red-control` absent
