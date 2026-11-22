---
phase: 184-hosted-supabase-measurement-and-conformance-probe
plan: 24
subsystem: infra
tags: [infra, supabase, hosted, throwaway, scratch-root, deletion, local-state]
status: complete

requires:
  - "184-18 and 184-19: the throwaway's red run and green run"
  - "184-13: the throwaway's header record (BEHIND_CLOUDFLARE=)"
  - "184-23: the persistent project's green probe run, the precondition for deleting the throwaway"
provides:
  - "SCRATCH_SCOPE=keep-root, dated 2026-11-11"
  - "The throwaway begckvkapaopoztbreqc deleted by the operator; Management API 404 for its ref (D-23)"
  - "The scratch root's state, .terraform and the throwaway's linked work directory removed from the workstation"
  - "The scratch root's tracked texts, infra/README.md and the runbook true after the deletion"
affects: [184-25, 185, 186, 187]

actuals:
  tokens: 5000
  tasks: 3
  commits: 2
plan_head_before: 9e99b3cddcc0b149499a251af9edf706fd96abfc
plan_head_after: 97f8bd72eac02658b637251ecb615dc76ef82094

tech-stack:
  added: []
  patterns:
    - "The local-state removal runs only after the API read has recorded a status other than 200 and 000 for the throwaway's ref"
    - "A kept Terraform root is validated offline with TF_DATA_DIR in a scratch directory, so no .terraform is recreated in it"

key-files:
  created:
    - .planning/workstreams/deployment/phases/184-hosted-supabase-measurement-and-conformance-probe/evidence/184-24-throwaway-deleted.md
  modified:
    - infra/envs/scratch/supabase/main.tf
    - infra/envs/scratch/supabase/terraform.tfvars
    - infra/README.md
    - infra/envs/staging/supabase/README.md

key-decisions:
  - "SCRATCH_SCOPE=keep-root (2026-11-11): the plan's auto-selected recommended option, applied by the orchestrator while the operator was away. Only the local state goes; the scratch root's tracked files stay for a future rehearsal on a new throwaway"
  - "answer_deleted_at=2026-11-12T06:10:00Z is when the operator reported the deletion, not the dashboard's time; the deletion happened at or before it"
  - "infra/README.md's 'Yes, then removed with the throwaway project' read as the root being removed, so under keep-root it was corrected to 'Yes; its state is removed with each throwaway project'"

requirements-completed: [SUPA-07]

duration: about 11 h of wall time, almost all of it waiting for the operator; the work itself took about 30 min (Task 1 and the scripts on 2026-11-11 from 21:24Z, Task 3 on 2026-11-12 from about 08:10 local time)
completed: 2026-11-12
---

# Phase 184 Plan 24: Retire the throwaway project Summary

**SCRATCH_SCOPE=keep-root (2026-11-11). The throwaway project begckvkapaopoztbreqc was deleted by the operator in the dashboard. The deletion was reported at 2026-11-12T06:10:00Z; that is the time of the report, not the dashboard's time. The Management API answers 404 for its ref, and its state and linked work directory are gone from the workstation. The scratch root's tracked files are kept, and their texts now describe a root used once per rehearsal.**

## Ruling and deletion

- `SCRATCH_SCOPE=keep-root`, dated 2026-11-11. This was the plan's auto-selected recommended option (`auto_select="keep-root"`), applied by the orchestrator while the operator was away. Task 1's verify (the throwaway's red and green runs, its header record, the persistent project's green run) exited 0 before the ruling.
- `answer_project_deleted=yes` and `answer_deleted_at=2026-11-12T06:10:00Z`, both from the operator. The time is when the operator reported the deletion; the dashboard's time was not given.
- The orchestrator ran the three scripts after the deletion, with the access token from the operator's keychain, under the operator's authorisation of 2026-11-10. The results:
  - `s2_project_http=404`, read at 06:10:11Z
  - `s3_local_removed=yes`, `s3_state_files_left=0`, `s3_staging_linked_kept=yes`, `s3_tracked_root_diff_exit=0`
  - `s4_logs_removed=yes`
- The reply is stored under attempt `20261111T212446Z.08a3b6447` of key `184-24-2` (`put` exit 0, `bound` exit 0).

## Tracked texts under keep-root

- **`main.tf` header:** the root rehearses the staging root on a throwaway project. Each rehearsal creates a new throwaway by hand and writes its four values into `terraform.tfvars`, and the project and the root's state are deleted when the rehearsal ends. The sentence saying the root is removed is gone.
- **`terraform.tfvars` header:** the values name the last throwaway, deleted on 2026-11-12, and the next rehearsal replaces them.
- **`infra/README.md`:** the scratch root's "Ever applied" cell no longer says the root is removed.
- **Runbook:** "When the rehearsal is over" lists all the local state removed, including the linked work directory, and says the tracked files stay. "Observations" has a dated row for the deletion.
- **`infraValidateJobGate.test.ts`:** unchanged. `LOCAL_BACKEND_ROOTS` still names the kept root.

## Task Commits

1. **Task 1: What goes with the throwaway**: `08a3b6447` (docs), the keep-root ruling in the evidence file.
2. **Task 2: The operator deletes the throwaway project**: no commit. The operator acted, the orchestrator ran the scripts, and the reply is stored in the attempt file.
3. **Task 3: Make the tracked texts true after the deletion**: `97f8bd72e` (docs), the evidence of the deletion and the four corrected files.

## Verification

- Task 1 verify: exit 0. Task 2 verify (`SCRATCH_SCOPE=` line): exit 0.
- Task 3 verify 1:
  - `terraform fmt -check -recursive infra`, exit 0
  - the parity guard, exit 0
  - `infraValidateJobGate.test.ts`, 32/32 passed
  - Prettier on both READMEs, exit 0
  - `terraform init -backend=false -lockfile=readonly` and `validate` of the kept scratch root, both exit 0, with `TF_DATA_DIR` in a scratch directory that was removed afterwards. No `.terraform` was recreated in the root.
- Task 3 verify 2 (bound reply, deletion confirmed, not 200, no state, no linked directory, no "root is removed" sentence): exit 0.
- Leak scan of every added line and of the evidence file: no address, IP, key shape or long hex run.

## Deviations from Plan

**1. [Rule 1 - Bug] infra/README.md cell said the root is removed**
- **Found during:** Task 3
- **Issue:** The plan leaves `infra/README.md` as it is unless a sentence there says the root is removed. The "Ever applied" cell, "Yes, then removed with the throwaway project", says exactly that.
- **Fix:** Changed the cell to "Yes; its state is removed with each throwaway project". Prettier re-padded the table because the column grew.
- **Commit:** `97f8bd72e`

**2. [Rule 2 - Correctness] Runbook paragraph listed only part of the local state**
- **Found during:** Task 3
- **Issue:** "When the rehearsal is over" named only the two state files.
- **Fix:** It now also names `tfplan`, `.terraform` and the linked work directory, and says the tracked files stay for the next rehearsal.
- **Commit:** `97f8bd72e`

**3. [Rule 2 - Safety] A gate in the removal script**
- **Found during:** Task 2
- **Issue:** The removal script could have run while the project still answered.
- **Fix:** Script 02 removes nothing unless script 01 recorded a status other than 200 and 000. Before the deletion it was tested offline: it printed `s3_project_gone_first=no` and removed nothing.
- **Commit:** none; the script is in the scratchpad.

## Next Phase Readiness

No Supabase throwaway remains, so phases 185 to 187 plant their red controls on the AWS side (D-23). A later rehearsal creates a new throwaway and writes its values into the kept root's `terraform.tfvars`. Until then, a plan of that root fails at its import, harmlessly.

## Self-Check: PASSED

- FOUND: evidence/184-24-throwaway-deleted.md, infra/envs/scratch/supabase/main.tf, infra/envs/scratch/supabase/terraform.tfvars
- FOUND: commits 08a3b6447 and 97f8bd72e in HEAD's history
- ABSENT, as required: infra/envs/scratch/supabase/terraform.tfstate and tmp/supabase-linked/begckvkapaopoztbreqc
