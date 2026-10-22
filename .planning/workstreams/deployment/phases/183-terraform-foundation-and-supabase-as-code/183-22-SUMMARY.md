---
phase: 183-terraform-foundation-and-supabase-as-code
plan: 22
subsystem: infra
tags: [terraform, supabase, import, plan-review, stop-rules]
status: complete

requires:
  - phase: 183-21
    provides: the throwaway project imported into the scratch root's local state, and the provider-read variable file
provides:
  - "The first plan after the throwaway import, saved as tfplan (SHA-256 35d762b21b217cc2cd232fcdc347e8da13604ed69ec2cb60d4db0da92a1289c8) and kept for plan 183-24"
  - "PLAN_REVIEWED=ok, bound to that checksum, in attempt 22-2: the go-ahead plan 183-24 requires"
  - "An observation dated 2026-10-22: ignoring database_password gives no project change on an imported project (assumption A1)"
affects: [183-24, 183-25]

actuals:
  tokens: 1400
  tasks: 2
  commits: 1
plan_head_before: 1d0e2d6d0bce8b21eac8a60a530be6b1d0f9ff34
plan_head_after: c9c4534cdd9fcbbea36bd8932a524ce6aeb5b01e

tech-stack:
  added: []
  patterns:
    - "A plan's go-ahead is a PLAN_REVIEWED line bound to the plan file's SHA-256; a new plan needs a new review"

key-files:
  created:
    - .planning/workstreams/deployment/phases/183-terraform-foundation-and-supabase-as-code/evidence/183-22-throwaway-plan-review.md
  modified: []

key-decisions:
  - "183-22: the first plan after the throwaway import passed all five stop rules (one in-place update of supabase_settings.this, 0 to destroy, no password line); PLAN_REVIEWED=ok for tfplan sha256 35d762b2…1289c8 only"
  - "183-22: assumption A1 observed to hold on an imported project: ignore_changes = [database_password] gives no change to the project resource; follow-up 183-R4 is not raised"

requirements-completed: []

duration: 45min wall clock (2026-10-22T16:14Z to 16:59Z), most of it waiting for the operator
completed: 2026-10-22
---

# Phase 183 Plan 22: First plan after the throwaway import, reviewed Summary

**Review: ok.** All five stop rules hold for the first plan after the throwaway import, so there is a go-ahead. It is `PLAN_REVIEWED=ok attempt=20261022T165931Z.1d0e2d6d0 sha256=35d762b21b217cc2cd232fcdc347e8da13604ed69ec2cb60d4db0da92a1289c8 head=1d0e2d6d0bce8b21eac8a60a530be6b1d0f9ff34 root=scratch`, and it holds for that one `tfplan` file. Nothing was applied.

## What happened

- **Task 1 (operator, attempt 22-1 `20261022T161449Z.1d0e2d6d0`):** the operator made one plan in `infra/envs/scratch/supabase` and saved it as `tfplan`. They then pasted:
  - `s1_plan_exit=0`
  - the checksum
  - two `s3_plan_line` lines: line 10, `# module.supabase.supabase_settings.this will be updated in-place`, and line 265, `Plan: 0 to add, 1 to change, 0 to destroy.`
  - `s4_logs_removed=yes`

  The reply passed the `attempt.sh put` screen with no refusal. `tfplan` is kept for plan 183-24.
- **Task 2 (executor, attempt 22-2 `20261022T165931Z.1d0e2d6d0`):** I read the pasted lines against the five stop rules, and each one holds:
  1. No heading names the project resource.
  2. No line names `database_password`.
  3. Nothing is destroyed or replaced.
  4. The settings resource has the only heading.
  5. The plan exited 0.

  The verdicts and the review line are in the evidence file.

## What this observes (2026-10-22)

Assumption A1 holds here. The import left the password out of state, and the module ignores changes to it. With both, the first plan showed no change to `module.supabase.supabase_project.this`, so the apply does not call the password-update endpoint. Wave B goes on, and follow-up 183-R4 is not raised.

Not observed, because step 3 prints no setting value:
- which keys inside the settings diff change;
- whether the API accepts them at the apply, including the two hooks on a project with no hook functions (research F2);
- whether `""` for `password_required_characters` comes back as `""` or as null. The second plan (Step 6) shows that.

## Deviations from Plan

None in the plan's commands. The orchestrator changed only how they were presented:
- The two secrets were entered with the runbook's no-echo `read -rs` lines.
- Step 3's regular expression was assembled in a variable from three single-quoted parts and checked byte-identical to the plan's pattern before it was handed out.

The orchestrator relayed the operator's lines, which carried the attempt id. The drift-heading flag raised at the checkpoint did not apply: no "has changed" heading appeared.

## Next

Plan 183-24's first task asks for the apply of exactly this `tfplan` and checks its checksum against the `PLAN_REVIEWED` line again. The file holds the project's settings and the database password in clear text, and the step that applies it removes it.

## Self-Check: PASSED

- FOUND: `evidence/183-22-throwaway-plan-review.md` (names `Attempt: 22-1 20261022T161449Z.1d0e2d6d0` and `Attempt: 22-2 20261022T165931Z.1d0e2d6d0`)
- FOUND: commit `c9c4534cdd9fcbbea36bd8932a524ce6aeb5b01e`, an ancestor of HEAD
- Both of Task 2's verify commands exit 0. Attempt 22-2 holds exactly one `PLAN_REVIEWED=` line.
- No file this plan wrote holds a token, a password or an address.
