---
phase: 184-hosted-supabase-measurement-and-conformance-probe
plan: 20
subsystem: infra
tags: [infra, supabase, hosted, staging, persistent-project, terraform-plan, logging-settings, key-model]
status: complete

requires:
  - "184-19: the throwaway back at its declared state, with the green run after the revert (s23_probe_exit=0)"
  - "184-16: SMTP_PORT_DELIVERS=2587"
  - "184-07: the canonical public_project_id, ruled by the operator on 2026-10-26"
provides:
  - "The staging root declares the smtp object (port 2587) and public_project_id, the same as the throwaway"
  - "The persistent project cofbsatfrdysyphajsky read before any change: connection path, seven logging settings, key model, served hook/SMTP/OAuth flags"
  - "The first staging plan saved as infra/envs/staging/supabase/tfplan, sha256 caeebee2e4d8b206d3d41863d455c1c8cdee9a963eccd02c4c506922a539dc13, reviewed PLAN_REVIEWED=ok"
  - "Measured: the session pooler host is given by GET /v1/projects/<ref>/config/database/pooler (db_host)"
affects: [184-21, 184-22, 184-23]

actuals:
  tokens: 4600
  tasks: 3
  commits: 2
plan_head_before: 7663353249f670815f9a64a2da81df350876847a
plan_head_after: f296576d9087af13ac05584be381bfcadaa9f69b

tech-stack:
  added: []
  patterns:
    - "The session pooler host is read from the Management API's pooler configuration and accepted only in the form aws-<n>-<region>.pooler.supabase.com, for the region in the root's tfvars; only the shard and region are printed"
    - "A read-only plan script keeps its sorted plan lines and checksum beside the sitting (plan.lines, plan.sha256), so a later apply script can cmp them before it applies"

key-files:
  created:
    - .planning/workstreams/deployment/phases/184-hosted-supabase-measurement-and-conformance-probe/evidence/184-20-persistent-reads-and-plan.md
  modified:
    - infra/envs/staging/supabase/terraform.tfvars
    - infra/envs/staging/supabase/README.md

key-decisions:
  - "PLAN_REVIEWED=ok for the staging plan: exactly the settings update in place, the two creations and Plan: 2 to add, 1 to change, 0 to destroy; no import, destroy, replacement or password line"
  - "The persistent project's sitting uses the session pooler, because the direct host did not resolve; the host came from the Management API, not from an assumed region"

requirements-completed: []

duration: about 50 min, from the Task 1 edit to the record; the sitting ran 2026-11-11 from 16:07:39Z
completed: 2026-11-11
---

# Phase 184 Plan 20: The persistent project's reads and its first plan Summary

**The review is `ok`.** The persistent project's first plan had exactly the rule's lines:
- the settings updated in place;
- the SMTP settings and the function secrets created;
- `Plan: 2 to add, 1 to change, 0 to destroy.`

It had no import, destroy, replacement or password line. **No logging setting differs from the throwaway's.** All seven read the same, so a statement slower than 10 s would be logged with its parameters, as on the throwaway. Plan 184-22 decides that gate.

## Performance

- **Sitting:** 2026-11-11, from 16:07:39Z. The orchestrator ran it under the operator's authorisation of 2026-11-11 for the staging sittings, with credentials from the operator's keychain. The dashboard answers come from the operator's screenshots.
- **Tasks:** 3 of 3 (Task 2 was the operator sitting).
- **Files:** 1 created, 2 modified.

## Accomplishments

- **Task 1:** the staging tfvars now hold the throwaway's `smtp` object, with port `2587` (measured from a hosted function, 2026-11-11), and `public_project_id` with the canonical id. The root formats and validates offline, and the parity guard is clean.
- **Task 2, the sitting:** six scripts, all exiting 0.
  - **Connection:** the direct host did not resolve (`s15_direct_exit=2`). The session pooler worked, its host read from the Management API (shard `aws-0`, `eu-north-1`), so `s15_connection=pooler`.
  - **Logging settings:** `ddl`, `-1`, `-1`, `none`, `off`, `10s`, `-1`.
  - **Key model:** legacy anon and service_role keys enabled, plus a publishable and a secret `default` key. The dashboard gives the retirement as "early 2027". This is the same as the throwaway.
  - **Served flags:** both hooks on, `smtp_port` null, OAuth server flags `false`.
  - **The plan:** saved and kept for 184-21.
- **Task 3:**
  - The reply is bound, and `PLAN_REVIEWED=ok` was written in attempt `184-20-3`.
  - The dated evidence file compares every read with the throwaway's.
  - The runbook moves three "Not yet observed" rows to Observations (the import block planning nothing, the persistent project's direct connection, its logging settings) and adds rows for the key model and the served flags.

## Task Commits

1. **Task 1, the measured port and the project id:** `184cab73a` (feat)
2. **Task 3, the reads and the review:** `f296576d9` (docs)

Task 2 was the operator sitting and made no commit. Its reply is stored in attempt `184-20-2`.

## Decisions Made

See `key-decisions`. No operator decision was needed: the plan matched the rule as written.

## Deviations from Plan

**1. [Rule 2 - correctness] The pooler host was read, not assumed or typed**
- The runbook's Step 15 has the operator copy the host from the dashboard, and the throwaway's preludes hard-coded it. In this sitting, with no terminal input, script 01 read it from `GET /v1/projects/<ref>/config/database/pooler`.
- It accepted the host only in the session-pooler form for the tfvars region, with a fallback that tries the two shard forms.
- The API answered 200, and its host was used.

**2. [Added read] Item 6, served flags before any change**
- Script 03 also read `oauth_server_enabled`, `oauth_server_allow_dynamic_registration`, both hook switches and `smtp_port`. This follows the throwaway lesson that the module never sends the OAuth flags.
- Both OAuth flags are `false`.

**3. [Safety] The plan script removes the plan file on a mismatch**
- `04-plan.sh` compared the sorted lines with the rule itself. It would have removed `tfplan` on a mismatch or a password line.
- It matched, so the file is kept. Its lines and checksum are kept beside the sitting for 184-21's apply script.

**4. Offline validation in a fresh `TF_DATA_DIR`**
- Task 1's verify ran `init -backend=false` with a scratchpad `TF_DATA_DIR` instead of the root's own `.terraform`, per the standing rule. The operator's `.terraform` points at the S3 backend.

## Issues Encountered

- The persistent project's direct database host did not resolve from the workstation. Why is UNCONFIRMED; on the throwaway the same symptom went with an IPv6-only name. The session pooler was used.

## Next

- **184-21:** apply only `infra/envs/staging/supabase/tfplan` with sha256 `caeebee2…dc13`, after the operator's go-ahead and the D01_GATE. Its apply script `cmp`s the plan's lines against the scratchpad's `184-20/plan.lines`. Re-read the auth config about 20 s after the apply before replanning. `tfplan` is ignored by Git (`.gitignore`, pattern `tfplan`) and must never be committed.
- **184-23:** adds "early 2027" and both projects' key model to the FUT-02 todo (its Task 3).
- **Hooks already on:** both hooks are on on the persistent project. Whether their functions exist there was not read; the migration push must come before anyone signs in.

## Known Stubs

None.

## Threat Flags

None.
- T-184-59: the plan was `ok` only for the exact three resource lines and the summary line.
- T-184-60: `tfplan` stays in the root, ignored by Git, for 184-21.
- No key, password, address other than the sender, or IP is in any record (leak scan clean).

## Self-Check: PASSED

- FOUND: `evidence/184-20-persistent-reads-and-plan.md`, `infra/envs/staging/supabase/terraform.tfvars` (`smtp = {` 1, `public_project_id` 1)
- FOUND as ancestors of HEAD: `184cab73a`, `f296576d9`
- Task 1 and Task 3 verifies exit 0; Prettier check of the runbook clean
