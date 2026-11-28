---
phase: 184-hosted-supabase-measurement-and-conformance-probe
plan: 21
subsystem: infra
tags: [infra, supabase, hosted, staging, persistent-project, one-way-gate, terraform-apply, db-push, edge-functions]
status: complete

requires:
  - "184-20: PLAN_REVIEWED=ok for the staging plan, sha256 caeebee2e4d8b206d3d41863d455c1c8cdee9a963eccd02c4c506922a539dc13; the session pooler (aws-0, eu-north-1)"
  - "184-11, 184-13, 184-15 to 184-19: the throwaway rehearsal records shown at the gate"
provides:
  - "D01_GATE=proceed, given by the operator on 2026-11-11"
  - "The persistent project cofbsatfrdysyphajsky holds migration 00001, the SMTP settings (port 2587), the seven function secrets and the three functions ACTIVE"
  - "In the state bucket: supabase_settings.smtp_secret[0] and supabase_edge_function_secrets.this[0] under hand/staging/supabase/"
  - "On the workstation: tmp/supabase-linked/cofbsatfrdysyphajsky, linked"
affects: [184-22, 184-23, 184-24, 184-25]

actuals:
  tokens: 4600
  tasks: 3
  commits: 1
plan_head_before: 0e6ba4f902faa64e8393404a304e295d91c7105a
plan_head_after: 04f81900a3c6bb6b563705692979fb7a710c9e19

tech-stack:
  added: []
  patterns:
    - "Every project-changing sitting script checks for the recorded gate line (D01_GATE=proceed in the current attempt file) before it acts"
    - "The apply script applies only a saved plan whose sha256 equals the reviewed value and whose terraform show lines cmp-match the reviewed lines"

key-files:
  created:
    - .planning/workstreams/deployment/phases/184-hosted-supabase-measurement-and-conformance-probe/evidence/184-21-persistent-apply-push-functions.md
  modified:
    - infra/envs/staging/supabase/README.md

key-decisions:
  - "D01_GATE=proceed (ruled by the operator 2026-11-11): the reviewed staging plan applied, the baseline pushed and the functions deployed on the persistent project"
  - "The five push lines that clean() stripped of '=' were restored in the stored reply by inserting '=' after the fixed field name, with the raw lines kept as notes; exit statuses and CLEAN reports corroborate them"

requirements-completed: [SUPA-01, SUPA-04]  # SUPA-02 waits for the hook's claims on a real token (184-22); SUPA-05 is listed again by 184-25

duration: about 4 h 30 min of wall clock, from the Task 1 attempt id (16:22:09Z) to the record (about 20:51Z); the sitting ran 19:34:36Z to about 20:48Z
completed: 2026-11-11
---

# Phase 184 Plan 21: The one-way gate, the staging apply, the push and the functions Summary

**D01_GATE=proceed.** The operator gave it explicitly on 2026-11-11, after being shown the four commitments, the eight rehearsal records and the two risks.

**The push and drift statuses.** The first push printed `s16_push_status=0` and `s16_drift_status=0` (`s16_push_exit=0`), and the drift check was CLEAN. The second push printed `s5_push_up_to_date=yes`, `s5_drift_status=0` and `s5_push_exit=0`. The frozen baseline `00001` is now on the persistent project `cofbsatfrdysyphajsky`. It was pushed by the same wrapper as on the throwaway, and this cannot be undone.

## Performance

- **Sitting:** 2026-11-11, from 19:34:36Z. The orchestrator ran it under the operator's authorisation of 2026-11-11 for the staging sittings, with credentials from the operator's keychain. The operator approved the apply before it ran, and ran the push in their own terminal, where they typed the ref.
- **Tasks:** 3/3.
- **Files:** 1 created, 1 modified.

## Accomplishments

- **The apply.** The reviewed staging plan (sha256 `caeebee2…dc13`) was applied whole on the first try: `2 added, 1 changed, 0 destroyed`. The second plan exited 0 on its first try.
- **What the project serves.** The SMTP host, port 2587, sender and sender name are as declared, and an SMTP user is set. The 34 auth and 3 API settings are as sent. Both OAuth flags stayed `false`. The function secrets are exactly the seven the module sets.
- **The refusal.** The wrapper refused the throwaway's ref against the persistent link with exit 2. It printed nothing on standard output, and its message named the link mismatch.
- **The push.** As stated above.
- **The functions.** All three are ACTIVE at version 1. `verify_jwt` is false for account-access and identity-callback and true for send-email. A keyless GET of identity-callback reached its own 405.
- **The buckets.** `private-assets` is present and not public. `public-assets` is present and public.
- **The runbook.** Four dated rows were added to "Observations".

## Task Commits

1. **Task 1: the one-way gate.** No commit, because it changes no repository file. The reply is stored in attempt `184-21-1` (`20261111T162209Z.0e6ba4f90`), followed by the line `D01_GATE=proceed` with its date and the records shown.
2. **Task 2: the operator's sitting.** No commit; this was operator work. The reply is stored in attempt `184-21-2` (`20261111T180327Z.0e6ba4f90`), under the reviewed sha256.
3. **Task 3: evidence and runbook rows.** Commit `04f81900a`.

## Files Created/Modified

- `.planning/workstreams/deployment/phases/184-hosted-supabase-measurement-and-conformance-probe/evidence/184-21-persistent-apply-push-functions.md`: the gate, the apply, the read-back, the refusal, both pushes, the functions and the buckets, all dated.
- `infra/envs/staging/supabase/README.md`: four rows in "Observations", dated 2026-11-11.

## Decisions Made

- `D01_GATE=proceed`, ruled by the operator on 2026-11-11.
- SUPA-01 and SUPA-04 are marked complete: the one push command ran on the persistent project, a second run was safe, and both buckets came from the migration. SUPA-02 and SUPA-05 are left open, because 184-22 and 184-25 list them again.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] The sitting scripts stripped `=` from the wrapper's push lines**
- **Found during:** Task 3, while reading the reply.
- **Issue:** `05-push.sh` and `06-push-again.sh` piped the wrapper's `push_*=` and `drift_status=` lines through the prelude's `clean()`, which deletes `=`. They arrived as, for example, `s16_push_status0`.
- **Fix:**
  - The stored reply keeps each such line as a `note: raw` line, and restores it by inserting `=` after its fixed field name. Nothing else in the reply was changed.
  - `s16_push_exit=0` and `s5_push_exit=0`, together with the CLEAN report lines, bear out the restored values without depending on the restore.
  - Both scripts now keep `=` in those lines.
- **Files modified:** the scratchpad scripts and the stored reply only.
- **Commit:** none; no repository file was involved.

### Sitting events (not executor deviations)

- **AWS session.** The first run of `00-start.sh` stopped because the AWS sign-in session had expired. Nothing was changed; the rerun was ready after the operator signed in again.
- **Push terminal.** The first push attempt, through the session's `!` prefix, had no terminal. The wrapper refused with exit 2 and pushed nothing. The operator then pushed from a separate terminal. So the `!` prefix does not give the wrapper a terminal to confirm on.

## Issues Encountered

- **The connection path is still unknown.** `push_connection=unknown` and `s16_cli_pooler_fallback_warning=no`. The CLI's path to the database is still not shown; this is the gap already in `deferred-items.md`, and nothing about it changed.
- **The throwaway's PostgREST 500 did not recur.** That 500 came on the throwaway's first apply. This apply was a settings update in place, and it gave no 500. The cause of the throwaway's error stays UNCONFIRMED.

## Next Phase Readiness

- The persistent project now has the schema, settings, secrets and functions it needs for the bootstrap and the first administrator (184-22).
- The linked work directory is kept at `tmp/supabase-linked/cofbsatfrdysyphajsky`.

## Self-Check: PASSED

- The evidence file exists, holds the line `D01_GATE=proceed` and the `Attempt: 184-21-3` line, and Prettier accepts the runbook. The second check of Task 3 exits 0.
- The first check of Task 3 also exits 0 against the stored reply of `184-21-2`: every required line is present, with seven secret names and three ACTIVE functions.
- Commit `04f81900a` is an ancestor of HEAD.
