---
phase: 183-terraform-foundation-and-supabase-as-code
plan: 23
subsystem: infra
tags: [terraform, supabase, persistent-project, import, plan-review, prevent-destroy, region]
status: complete

requires:
  - phase: 183-24
    provides: the rehearsal on the throwaway project, passed on its second attempt (apply of b194262f…032e, destroy refused, both hooks accepted)
  - phase: 183-16
    provides: the state bucket that holds hand/staging/supabase/terraform.tfstate
provides:
  - The persistent Pro project cofbsatfrdysyphajsky (openvaa-staging, eu-north-1), created by hand and imported into infra/envs/staging/supabase
  - PLAN_REVIEWED=ok for tfplan sha256 065a419e31ef13ae8f20b194178eb213fe053c643a7c9f5c74646a0872d43590, root=staging, ref=cofbsatfrdysyphajsky
  - The line "Clause C5.1 import: seen" in the evidence file, for plan 183-27
  - The root's tracked organisation, name and region
affects: [183-25, 183-27, phase-184]

estimate:
  tokens: 46000
  tasks: 3
actuals:
  tokens: 2883     # chars/4 over the changed lines of the realized diff (11530 chars)
  tasks: 3
  commits: 3       # MEASURED: git rev-list --count plan_head_before..HEAD at SUMMARY write
plan_head_before: 88053dd0f0802ab575d3df0cc4a91fc608ac36a7
plan_head_after: 70dd2508e4a7d580cf082fd349c33b7e3e30e87b

tech-stack:
  added: []
  patterns:
    - "A dashboard label given for a region is stored verbatim, mapped to an id with a note, and confirmed by the provider's read on import"

key-files:
  created:
    - .planning/workstreams/deployment/phases/183-terraform-foundation-and-supabase-as-code/evidence/183-23-persistent-import.md
  modified:
    - infra/envs/staging/supabase/terraform.tfvars
    - .planning/workstreams/deployment/phases/183-terraform-foundation-and-supabase-as-code/183-23-PLAN.md

key-decisions:
  - "The persistent project is in eu-north-1, the AWS stack's region. The dashboard showed the label North EU, and the import read eu-north-1"
  - "The persistent project is in the same organisation as the throwaway (OpenVAA, gulgrbzofwnwepdnrgrl), taken as the Pro organisation used for staging"
  - "The organisation slug gulgrbzofwnwepdnrgrl is tracked in infra/envs/staging/supabase/terraform.tfvars. That goes beyond the tracked values the operator ruled on, because organization_id is a required argument of the project resource"

requirements-completed: []   # SUPA-11 stays open until plan 183-27

duration: "about 4 h 20 min of wall time (2026-10-23T06:41Z to 11:01Z), most of it the operator's sittings"
completed: 2026-10-23
---

# Phase 183 Plan 23: The persistent project's import and first plan Summary

**Review: ok.** The first plan of the persistent root passes all five stop rules. It creates only `module.supabase.supabase_settings.this`:
- no change to the project resource;
- no line for `database_password`;
- nothing destroyed or replaced.

The go-ahead for plan 183-25 holds only for `tfplan` with SHA-256 `065a419e31ef13ae8f20b194178eb213fe053c643a7c9f5c74646a0872d43590`, on project `cofbsatfrdysyphajsky`. Nothing was applied.

- **The project.** Ref `cofbsatfrdysyphajsky`, name `openvaa-staging`, region `eu-north-1`. The operator created it by hand. Terraform created nothing.
- **The organisation slug.** `gulgrbzofwnwepdnrgrl` is now in the tracked variable file. That goes beyond the tracked values the operator ruled on: the project resource requires `organization_id`.

## Performance

- **Started:** 2026-10-23T06:41Z (the first checkpoint)
- **Completed:** 2026-10-23T11:01Z
- **Tasks:** 3 of 3 (two operator checkpoints, one review task)
- **Files:** 1 created, 2 modified

## Accomplishments

- **Task 1, the region decision (attempt 23-1, `20261023T064142Z.88053dd0f`).**
  - The checkpoint was raised only after the rehearsal was confirmed on record as passed: the 22-2 review was `ok`, 24-1 held `yes` for the same checksum, the refused destroy was in 24-1, and the 183-24 evidence named its attempt.
  - The operator chose `eu-north-1` and created the project in the dashboard.
  - The label "North EU" is stored verbatim. The orchestrator mapped it to `eu-north-1`, and the import's `s5_region` confirmed that.
  - The decision is recorded as `OPERATOR_DECISION=eu-north-1 … ref=cofbsatfrdysyphajsky region=eu-north-1`.
- **Task 2, the import and the first plan (attempt 23-2, `20261023T074732Z.88053dd0f`).**
  - The account check read 471112560111.
  - `init`, `import` and `plan` each exited 0, and `s9_logs_removed=yes`.
  - The provider read the persistent project's ref, organisation, name and region, and `s5_password_in_state=false`.
  - The operator kept `tfplan` for 183-25.
- **Task 3, the review (attempt 23-3, `20261023T105701Z.88053dd0f`).**
  - The import is the right project: its ref is not the throwaway's `suxeqyhafjueinxnojge`.
  - The operator's change to the variable file adds exactly the three assignments.
  - The five stop rules hold.
  - The record holds `PLAN_REVIEWED=ok attempt=20261023T105701Z.88053dd0f sha256=065a419e…43590 head=88053dd0f0802ab575d3df0cc4a91fc608ac36a7 root=staging ref=cofbsatfrdysyphajsky` and `Clause C5.1 import: seen`.
  - Both of Task 3's verify commands exit 0.

## Task Commits

1. **Task 1:** a checkpoint. Its reply is in the Git-ignored attempt file, so there is no commit.
2. **Task 2:** a checkpoint. Its reply is in the Git-ignored attempt file, so there is no commit.
3. **Task 3:**
   - `cb06e64c9a9e3d1fabb355cd54459ccd3878078d` (fix): the plan's tfvars secret-name check.
   - `b988931f38d4dc71f1aaf5c870108d5ee3ab01c0` (feat): the root's organisation, name and region.
   - `70dd2508e4a7d580cf082fd349c33b7e3e30e87b` (docs): the evidence file.

**Plan metadata:** the final docs commit follows this SUMMARY.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Task 3's second verify flagged a variable the plan requires as secret-named**
- **Found during:** Task 3, second verify command.
- **Issue:** `/^[a-z_]*(secret|password|token)[a-z_]* *=/` matches `enable_access_token_hook = true`. Task 3 requires that assignment to be kept, so the check could never pass on a correct file. Plan 183-21 met and fixed the same pattern in its own plan.
- **Fix:** the pattern now requires the secret word at the end of the name: `/^[a-z_]*(secret|password|token) *=/`. A red control holding `database_password = "x"` still fails it, with exit 1.
- **Files modified:** 183-23-PLAN.md
- **Commit:** `cb06e64c9`

**2. [Rule 2 - Correctness] The variable file's header comment described the file before the import**
- **Issue:** the comment said the three values are given as `TF_VAR_` values until the import.
- **Fix:** it now states that they are the persistent project's, as the import read them. The note that a file value takes precedence over a `TF_VAR_` value is kept.
- **Not affected:** the assignments. The values committed in `b988931f3` are byte-for-byte those the plan was made with.
- **Commit:** `b988931f3`

### Process (orchestrator additions and provenance)

- **Orchestrator-added and executor-added lines and steps:**
  - `answer_region_shown_id=eu-north-1` and two `note:` lines in 23-1. They cover the label-to-id mapping and the organisation reading.
  - A `printf` append for step 2. The plan leaves the edit to the operator. The orchestrator checked the result with `git diff`.
  - A `note:` line in 23-2 for each point of delivery.
- **How the commands were delivered:**
  - Task 2's commands went out in six blocks, with `AWS_PROFILE=openvaa-admin` and the account check first.
  - The secrets were read with `read -rs`.
  - The orchestrator built the jq filter and the grep pattern in shell variables and checked them byte-identical to the plan.
  - No step of this plan was expected to exit non-zero. There is no destroy plan and no red control here.
- **The review's `head`** is `88053dd0f`, the HEAD at which the operator made the plan. The variable file's change was uncommitted then. It is committed in `b988931f3` with the same assignments.
- **`TF_DATA_DIR`.**
  - Task 3's `init -backend=false` and `validate` ran with a throwaway `TF_DATA_DIR`, because the operator's `terraform init` recorded the S3 backend in the root's `.terraform/`.
  - Task 1's verify ran as written, because the root had not been initialised with a backend then.
  - This settles the 183-23 entry of the `init -backend=false` deferred item. 183-25 and 183-27 still need the same treatment.

## Authentication Gates

None for the executor, which held no credential. Both operator checkpoints were by design. The executor ran no Terraform plan, import, show or apply, and no AWS or Supabase call. It read no state and no plan file.

## Known Stubs

None.

## Threat Flags

None beyond the plan's threat model.
- **T-183-50:** the ref is bound from the decision to the reply to the review, and differs from the throwaway's.
- **T-183-51:** the region was confirmed before creation and confirmed again by the import's read.
- **T-183-67:** the review is bound to the plan file's checksum and the ref.

## Next Phase Readiness

- **Plan 183-25** may raise its apply checkpoint on `PLAN_REVIEWED=ok` for `tfplan` sha256 `065a419e31ef13ae8f20b194178eb213fe053c643a7c9f5c74646a0872d43590`, ref `cofbsatfrdysyphajsky`. The operator still holds that file in `infra/envs/staging/supabase`.
  - The apply runs with both hook switches on, as 183-24 settled.
  - Its destroy-plan and red-control steps are expected to exit non-zero, and the operator should be told so.
  - It would benefit from 183-24's `s5_refusal_line` capture, an orchestrator addition.
- **Phase 184:** from the apply until the migrations are pushed, both hooks point at functions that do not exist yet. Push the migrations before anyone signs in.
- **Plan 183-20** is untouched and still paused. STATE.md's current plan stays at 20.
- **SUPA-11** stays open until plan 183-27.

## Self-Check: PASSED

- FOUND: `evidence/183-23-persistent-import.md`. Its `Attempt: 23-1`, `23-2` and `23-3` lines match the helper's `id`, and it holds the line `Clause C5.1 import: seen`.
- FOUND: `infra/envs/staging/supabase/terraform.tfvars` assigns `organization_id`, `project_name`, `region`, `public_origin`, `enable_access_token_hook` and `enable_send_email_hook`, and no secret.
- FOUND: commits `cb06e64c9`, `b988931f3` and `70dd2508e` are ancestors of HEAD.
- Both of Task 3's verify commands exit 0. Task 1's and Task 2's automated verifies exited 0 when their checkpoints were raised.
