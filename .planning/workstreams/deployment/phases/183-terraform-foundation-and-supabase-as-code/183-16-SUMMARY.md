---
phase: 183-terraform-foundation-and-supabase-as-code
plan: 16
subsystem: infra
tags: [aws, terraform, bootstrap, state-migration, s3-backend, iam-simulator, state-lock, budget, infra-15, infra-17, operator-checkpoint]
status: complete

requires:
  - phase: 183-14
    provides: "the clean account inventory, 183-R1 ruled, Terraform 1.16.5 on the workstation"
  - phase: 183-01
    provides: "tools/attempt.sh (attempt files, reply screen, bound checks)"
provides:
  - "The bootstrap root applied in 471112560111 / eu-north-1 on 2026-10-21, with its state migrated to s3://openvaa-tfstate-471112560111/hand/bootstrap/terraform.tfstate and the local files removed"
  - "evidence/183-16-bootstrap-apply.md: every criterion row seen, a full simulator table, the lock observed, and the provenance of the five Task 1 lines that were not pasted"
  - "infra/bootstrap/README.md: four statements moved to dated Observations rows; step 8(a) fixed to one call per resource"
  - "tools/attempt.sh: the reply screen accepts numbered sub-steps such as s8d1_"
affects: [183-17, 183-20, phase-183-verification]

estimate:
  tokens: 48000
  tasks: 3
actuals:
  tokens: 8542     # chars/4 over the changed lines of the realized diff (34169 chars)
  tasks: 3
  commits: 3       # MEASURED: git rev-list --count plan_head_before..HEAD at SUMMARY write

plan_head_before: e3cc5a1c1bda19e0cfb0c49cb4500cec218fa595
plan_head_after: 7178a694a8a4684c241c2cc5f3a490fd05bb713c

tech-stack:
  added: []
  patterns:
    - "When an operator's line is lost, a re-check is stored under its own name (s6b_, s9b_) with a note. It is never rewritten into the original name, and the plan is amended to check it."
    - "simulate-principal-policy is given one resource per call when a per-resource decision is needed"

key-files:
  created:
    - .planning/workstreams/deployment/phases/183-terraform-foundation-and-supabase-as-code/evidence/183-16-bootstrap-apply.md
  modified:
    - infra/bootstrap/README.md
    - .planning/workstreams/deployment/phases/183-terraform-foundation-and-supabase-as-code/183-16-PLAN.md
    - .planning/workstreams/deployment/phases/183-terraform-foundation-and-supabase-as-code/tools/attempt.sh

key-decisions:
  - "Plan amendment ruled by the operator (answer_amend=yes): s0_account, the s6b backend re-check and s9b_state_resources=30 (less 7 data sources = 23 = s3_managed_count) stand for the five Task 1 lines that were not pasted"
  - "Step 8(a) runs one simulator call per resource, because two resources in one call give one result per action"
  - "The reply screen's named-line form accepts a digit run after the sub-step letter (s8d1_); rules 2 to 5 are unchanged"

requirements-completed: [INFRA-17]   # INFRA-15 left Pending: the alert mail is observed in plan 183-20

duration: "about 6 h 15 min of wall time (2026-10-21T13:20Z to 19:35Z), most of it the operator's sittings"
completed: 2026-10-21
---

# Phase 183 Plan 16: Bootstrap apply, state migration and read-backs Summary

**The bootstrap root is applied in 471112560111 / eu-north-1 and its state is in the bucket it created. The data was read back on 2026-10-21:**
- **State and bucket:** the state object and the bucket are AES256-encrypted and versioned, the bucket is closed and TLS-only, and a second plan exits 0.
- **Lock:** the lock was held at the approval prompt.
- **Simulator:** the plan role's deny is explicit, and the pipeline allow holds.
- **Budget:** it sits at the 1 USD test amount, with a computed spend of 6.475 USD.

## What the plan asked to be stated

- **Budget computed spend:** `s10_budget_actual=6.475` against `s10_budget_limit=1.0`. The actual alert is set at 80 percent of 1 USD, so it can fire once the computed spend passes 0.80 USD. 6.475 is past that, so **the actual alert is eligible to fire, and its mail is expected at the alert address.** This is expected while `budget_limit_usd=1` is kept until plan 183-20. No action was taken. Whether the mail arrives, and when, is plan 183-20's to observe.
- **Route that gave the local backend:** the untracked `backend_override.tf` override worked (`answer_fallback=no`, `s6b_backend_type=local`).
- **Lock seen:** yes. `s9_locked_plan_exit=1` and `s9_lock_error_lines=1`. The lock object was present during the wait (exit 0) and gone afterwards (exit 254).

## Performance

- **Duration:** about 6 h 15 min of wall time, mostly operator sittings
- **Completed:** 2026-10-21T19:35Z
- **Tasks:** 3 (two operator checkpoints, one recording task)
- **Files modified:** 4

## Accomplishments

- **Task 1 (operator):** the first apply ran on local state, 23 resources at the 1 USD test budget. The reply is stored in attempt 16-1, with the provenance of each line.
- **Task 2 (operator):**
  - The state was migrated to S3 and the remote copy confirmed (23 managed resources) before the local files were removed. The second plan reported `No changes`.
  - Every read-back matched: the bucket, the registry (`IMMUTABLE`), the GitHub OIDC provider, both roles with managed policies only, and the inventory assert exiting 0.
  - All 17 simulator decisions matched their expected values, and the lock was observed.
- **Task 3:**
  - The evidence file has one section per criterion row, all `seen`, with the simulator table.
  - The runbook's Not yet observed and Observations tables are updated: 8 dated rows in Observations.
  - All six Task 3 verify blocks exit 0, and Task 1's and Task 2's verify commands exit 0.

## Task Commits

1. **Task 1:** stored in the Git-ignored attempt file; no commit
2. **Task 2:** stored in the Git-ignored attempt file; no commit
3. **Deviation, screen fix:** `5dd54b40b` (fix)
4. **Plan amendment and step 8(a) fix:** `9d3d688da` (fix)
5. **Task 3, evidence and runbook:** `7178a694a` (docs)

**Plan metadata:** the final docs commit follows this SUMMARY.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] The reply screen refused the plan's own simulator lines**
- **Found during:** preparing the Task 2 checkpoint
- **Issue:** rule 1 of `attempt.sh` took only `s<step>[a-z]_`, so `s8d1_`, `s8d2_`, `s8g1_` and `s8g2_` would have been refused as `unnamed-line`.
- **Fix:** rule 1 and the verdict exemption now take `s[0-9]+[a-z]?[0-9]*_`. Two self-test cases were added, and the self-test passes.
- **Files modified:** tools/attempt.sh
- **Commit:** 5dd54b40b

**2. [Rule 1 - Bug, in the plan's command] Step 8(a) could not print the two lines its check expects**
- **Found during:** Task 2, by the operator
- **Issue:** with two `--resource-arns` in one call, the simulator returns one top-level result per action. That result carries `explicitDeny` and the placeholder resource `arn:aws:s3:::${BucketName}/${KeyName}`. The per-resource results sit only under `ResourceSpecificResults`.
- **Fix:** the operator re-ran (a) as two calls, and those lines are the reply. The plan and the runbook now make one call per resource.
- **Files modified:** 183-16-PLAN.md, infra/bootstrap/README.md
- **Commit:** 9d3d688da

**3. Five Task 1 lines were not pasted; plan amended by the operator's ruling**
- **Issue:**
  - `s3_account`, `s6_init_exit`, `s6_backend_line`, `s9_apply_exit` and `s9_apply_line` were never pasted, because step 11 removed the log first.
  - Task 3's verify as written required them, and must-have truth 1 required the apply's own line.
- **Fix:** the operator ruled `answer_amend=yes`. None of the five lines was fabricated. Task 3 now checks these instead:
  - `s0_account` from Task 2.
  - `s6b_backend_type=local` with `s6b_check_exit=0`.
  - `s9b_state_resources=30`, which less the 7 data sources the code declares equals the plan's 23 to add. That must also equal Task 2's `s3_managed_count`, and it does.
- **Also changed:** must-have truth 1 and the artifact's `contains` were reworded. The runbook's first-apply cleanup item now says to paste the lines before it removes the logs.
- **Files modified:** 183-16-PLAN.md, infra/bootstrap/README.md
- **Commit:** 9d3d688da

**4. Steps 3, 5 and 6 were first run with orchestrator-written commands**
- Those commands used other line names (`s3_size`, `s5_plan_exit`, a tab-separated `s6_public_block`).
- The operator re-ran the plan's exact read-only commands, and the values were identical. Only the plan-named lines are stored.

**5. Extra lines kept as pasted**
- `s0_account`, `s0_dir`, `s1_override_removed` and `s9_t2_account` are not in the plan's list.

**6. Executor root pin**
- The pin script supplied at spawn was missing from the scratchpad when the work resumed.
- An equivalent check was written and run before every Edit, Write and commit after that point. It asserts the toplevel equals the project root, the branch is `feat/deployment-terraform-supabase` and HEAD is attached.

### Operator environment note

The operator's default AWS credentials pointed at another, unrelated account. Task 2's opening account check caught it before any command ran. Every recorded command then ran under a named Identity Center profile against 471112560111. That account is not named in any file.

## Authentication Gates

None for the executor, which holds no credential. Both checkpoints were operator-run by design.

## Known Stubs

None.

## Threat Flags

None. No new surface beyond the plan's threat model:
- **T-183-42:** the remote state was read before the local files were removed.
- **T-183-38:** only named lines were stored, through the screen.

## Issues Encountered

The Task 1 log was removed before five lines were copied. This is recorded above as deviation 3.

## Next Phase Readiness

- **Plan 183-20** raises the budget and observes the actual alert's mail. The alert is already eligible at 6.475 USD computed spend.
- **Plan 183-17 and later** can rely on the state bucket, the roles and the registry. The deploy role's `env:/` list refusal is the tolerated one.

## Self-Check: PASSED

- FOUND: .planning/workstreams/deployment/phases/183-terraform-foundation-and-supabase-as-code/evidence/183-16-bootstrap-apply.md
- FOUND: infra/bootstrap/README.md (Observations: 8 dated rows; Prettier clean)
- FOUND: commit 5dd54b40b
- FOUND: commit 9d3d688da
- FOUND: commit 7178a694a
- `attempt.sh bound 16-1 … account=471112560111` exits 0, and `attempt.sh bound 16-2 … plan=16 task=2` exits 0
- Task 3 verify blocks 1 to 6 exit 0, and Task 1 and Task 2 verify commands exit 0
