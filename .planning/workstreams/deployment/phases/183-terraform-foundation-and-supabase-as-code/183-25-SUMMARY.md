---
phase: 183-terraform-foundation-and-supabase-as-code
plan: 25
subsystem: infra
tags: [terraform, supabase, persistent-project, apply, prevent-destroy, hosted-settings, state]
status: complete

requires:
  - phase: 183-23
    provides: PLAN_REVIEWED=ok for tfplan sha256 065a419e31ef13ae8f20b194178eb213fe053c643a7c9f5c74646a0872d43590, root=staging, ref=cofbsatfrdysyphajsky
  - phase: 183-24
    provides: the rehearsed apply, read-back and destroy-plan steps, and the hooks' outcome
provides:
  - The persistent project's hosted API and auth settings applied from one reviewed plan, with the second plan empty
  - All 37 managed keys (34 auth, 3 API) served as declared, both hooks on
  - The destroy plan of the persistent root refused (status 1, prevent_destroy)
  - The state object hand/staging/supabase/terraform.tfstate read back, AES256 and versioned, with the project and the settings resource
  - The lines "Clause C5.1 state: seen", "Clause C5.2: seen" and "Clause C5.3: seen" in the evidence file, for plan 183-27
affects: [183-27, phase-184]

estimate:
  tokens: 44000
  tasks: 2
actuals:
  tokens: 4847     # chars/4 over the realized diff (19387 chars)
  tasks: 2
  commits: 2       # MEASURED: git rev-list --count plan_head_before..HEAD at SUMMARY write
plan_head_before: 7f5e99d9db66a954bf2b42e8d6f73502923735d3
plan_head_after: 65f552b0d67849869b24e401ec24389d156c53f6

tech-stack:
  added: []
  patterns:
    - "The apply is bound to the reviewed checksum and ref through the attempt helper; the served settings are compared key by key, as JSON, with the module's intended values"

key-files:
  created:
    - .planning/workstreams/deployment/phases/183-terraform-foundation-and-supabase-as-code/evidence/183-25-persistent-apply.md
  modified:
    - infra/envs/staging/supabase/README.md

key-decisions:
  - "The persistent project cofbsatfrdysyphajsky has its settings applied with both hooks on. No hook is left for phase 184 to switch on, but its migrations must be pushed before anyone signs in"

requirements-completed: []   # SUPA-11 closes in plan 183-27

duration: "about 50 min of wall time (2026-10-23T11:03Z to 11:52Z), most of it the operator's sitting"
completed: 2026-10-23
---

# Phase 183 Plan 25: The persistent apply Summary

**All three clauses are seen: C5.1 state, C5.2 and C5.3.** On 2026-10-23 the operator applied the reviewed plan (SHA-256 `065a419e…43590`) to the persistent project `cofbsatfrdysyphajsky` (`openvaa-staging`, `eu-north-1`).

- **The apply and the second plan.** The apply exited 0. The second plan exited 0 with "No changes".
- **The read-back.** All 37 managed keys are served as declared.
- **The destroy plan** exited 1, naming `prevent_destroy`.
- **The state object** `hand/staging/supabase/terraform.tfstate` is AES256-encrypted and versioned, and holds exactly the project and the settings resource.

## Performance

- **Started:** 2026-10-23T11:03Z, when the checkpoint was raised.
- **Completed:** 2026-10-23T11:52Z.
- **Tasks:** 2 of 2: one operator checkpoint and one recording task.
- **Files:** 1 created, 1 modified.

## Accomplishments

- **Task 1, the operator's sitting (attempt 25-1, `20261023T110322Z.7f5e99d9d`).**
  - **When it was raised.** The checkpoint went up only after Task 1's verify had exited 0 on 23-3's `PLAN_REVIEWED=ok` line.
  - **The checks and the apply.** The account read `471112560111`, and the checksum matched. The apply ran: `Apply complete! Resources: 1 added, 0 changed, 0 destroyed.`, the creation of the settings resource.
  - **What was removed.** The plan file and the logs.
  - **Where the reply is.** It is stored under `OPERATOR_APPLIED=yes attempt=20261023T110322Z.7f5e99d9d sha256=065a419e…43590 ref=cofbsatfrdysyphajsky head=7f5e99d9d…`, with five `note:` lines of provenance.
- **Task 2, the check and the record (attempt 25-2, `20261023T114935Z.7f5e99d9d`).**
  - **The binding.** The bindings to 23-3 and 25-1 pass, for both the checksum and the ref.
  - **The comparison.** It was made key by key, by the 183-24 method: 37 equal, 0 different, 0 missing.
  - **The evidence file** holds the full table, the destroy-plan text, the state lines and the "Criterion 5, Supabase clauses" section.
  - **The runbook** names the ref and carries four dated observations.
  - **All three verify commands exit 0.**

## Task Commits

1. **Task 1** was a checkpoint and has no commit. Its reply is in the Git-ignored attempt file.
2. **Task 2:**
   - `07ecd06275a609f87dd054a5eec561dd7e032a08` (docs): the runbook's ref and observations.
   - `65f552b0d67849869b24e401ec24389d156c53f6` (docs): the evidence file.

**Plan metadata:** the final docs commit follows this SUMMARY.

## Deviations from Plan

### Auto-fixed Issues

None in code. The module, the guard and the variable files are unchanged.

### Process (orchestrator additions and provenance)

- **Orchestrator-added lines.** `s0_account` (the account check, with `AWS_PROFILE=openvaa-admin`) and `s5_refusal_line` (the destroy plan's matching text) were added by the orchestrator. Each is stored with a `note:` line.
- **The order of the `s0` line.** It was first run in the setup block, and its line was not pasted. The operator ran it again at the head of the apply block, so the account was checked before the apply.
- **The first try of step 4 sent nothing.** The variables `U`, `F1` and `F2` had not been set, so curl rejected the URL (`000`) and jq failed to compile. The reads were run again after the operator confirmed the lengths of the three variables. The stored `s4` lines are from that second run.
- **Wording that does not match the commands.**
  - The plan's general rule "a status not 0 means stop" does not hold for the destroy plan, which must be non-zero. The operator was told so in advance.
  - The plan's execution rules mention a header file for the token, but its commands pass the token to curl on standard input. The commands were followed.
- **The variable file.** `terraform.tfvars` was changed after the review head (`b988931f3`): the header comment was reworded, and the assignments are byte-identical. A saved plan does not read the file again, and the second plan was empty.

## Authentication Gates

None for the executor, which held no credential. The operator's checkpoint was by design. The executor ran no Terraform plan, apply, import, state or show command, and made no AWS or Supabase call. It read no state and no plan file.

## Known Stubs

None.

## Threat Flags

None beyond the plan's threat model. The applied plan is bound to the reviewed checksum and ref (T-183-68), and the refusal was seen with a destroy plan only (T-183-69).

## What phase 184 inherits

- **The project:** ref `cofbsatfrdysyphajsky`, region `eu-north-1`, organisation `gulgrbzofwnwepdnrgrl`.
- **The hooks.** Both are on: the access-token hook and the send-email hook. Their functions do not exist yet on the persistent project. Push the migrations before anyone signs in. How the auth service behaves while the functions are missing was not observed.
- **The throwaway project and its scratch root.** These are `suxeqyhafjueinxnojge` and `infra/envs/scratch/supabase`, whose state is local. No step of this plan removed them, and this plan did not check that they still exist. When the rehearsal is no longer needed, the runbook's last rehearsal step deletes the project in the dashboard and removes the scratch root's local state.
- **The SMTP settings** are written in the module and not applied: `smtp` is null in both roots.
- **Still under "Not yet observed" in the runbook:**
  - whether two settings resources work side by side for one project;
  - whether the hosted auth service sends no mail of its own while the send-email hook is on.
- **From `deferred-items.md`:**
  - the conformance probe reads the OAuth-server switches;
  - the migrations come before any sign-in.
- **The `init -backend=false` item.** Plan 183-27 still runs `init -backend=false` in the initialised staging root, and needs a throwaway `TF_DATA_DIR` there. This plan ran no init or validate, because no `.tf` file changed.
- **Plan 183-20** is untouched and still paused. STATE.md's current plan stays at 20.
- **SUPA-11** stays open until plan 183-27.

## Self-Check: PASSED

- FOUND: `evidence/183-25-persistent-apply.md`.
  - Its `Attempt: 25-1 20261023T110322Z.7f5e99d9d` and `Attempt: 25-2 20261023T114935Z.7f5e99d9d` lines match the helper's `id`.
  - It holds the three clause lines, each ending `seen`.
- FOUND: commits `07ecd0627` and `65f552b0d` are ancestors of HEAD.
- All three of Task 2's verify commands exit 0:
  - the bindings and named lines;
  - every JSON key served as in the file;
  - the clause lines, the attempt line, Prettier on the runbook and the parity guard.
