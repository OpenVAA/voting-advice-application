---
phase: 189-documentation-and-closure
plan: "06"
subsystem: infra-docs
tags: [supabase, backups, pitr, management-api, observations, operator-sitting]
status: complete

requires:
  - phase: 189 (CONTEXT E-02, H-01 (2))
    provides: the second operator sitting, read-only, and the backups read it holds
  - phase: 183 (tools/attempt.sh)
    provides: the attempt file and the top-level binding of the operator's reply
provides:
  - "Step 24 of the Supabase runbook, 'The backups, read': one GET of /v1/projects/<ref>/database/backups, the token on curl's stdin, s24_ lines only, no restore and no POST"
  - "The persistent project's backups read on 2026-11-20 at 13:55Z: status 200, eu-north-1, PITR off, WAL-G on, 8 backups, all 8 COMPLETED, both physical-backup times null"
  - "One dated Observations row in infra/envs/staging/supabase/README.md citing 189-06-backups.md"
affects: [189-14]

actuals:
  tokens: 1956
  tasks: 3
  commits: 2
plan_head_before: cc6f1b19345dbd159425988485367c92e1967969
plan_head_after: f02d27fc491efe81a4d74e69d155414306bc3139

tech-stack:
  added: []
  patterns:
    - "A Management API read in a runbook step sends the bearer header to curl -K - on stdin from printf, writes the body to $L and prints only prefixed key=value lines through jq"

key-files:
  created:
    - .planning/workstreams/deployment/phases/189-documentation-and-closure/evidence/189-06-backups.md
  modified:
    - infra/envs/staging/supabase/README.md

key-decisions:
  - "Sitting 2 approved by the operator (attempt 20261120T135428Z.406e0395d, bound at top level). attempt.sh bound and has both exited 0 before anything was recorded. The reply had no explicit answer_sitting line; running the sitting and returning its lines was read as approval, as the attempt file records"
  - "The two physical-backup times are recorded as null, exactly as printed, with no date put in their place. No cause is claimed beyond noting that PITR is off. The span of the 8 daily backups is recorded as not known from this read, because Step 24 prints counts and no inserted_at"

patterns-established: []

requirements-completed: []  # DOCS-06 is advanced, not met: the operations page's restore section (plan 189-14) cites this read

coverage:
  - id: D1
    description: "Step 24 is in the Supabase runbook, reads the backups endpoint and names no restore and no POST"
    requirement: DOCS-06
    verification:
      - kind: other
        ref: "Task 1 automated verify (previous executor, commit 406e0395d)"
        status: pass
    human_judgment: false
  - id: D2
    description: "The operator's Step 24 lines are bound and recorded as E2_* lines, with one dated Observations row, formatted, and no token-shaped string in the evidence"
    requirement: DOCS-06
    verification:
      - kind: other
        ref: "Task 3 automated verify (attempt.sh bound; E2_BACKUPS_HTTP, E2_PITR_ENABLED, E2_COMPLETED well-formed; 189-06-backups cited in the runbook; prettier --check; token search) exited 0"
        status: pass
    human_judgment: true

duration: 6min
completed: 2026-11-20
---

# Phase 189 Plan 06: Sitting 2, the persistent project's backups read Summary

E2_BACKUPS_HTTP=200
E2_PITR_ENABLED=false
E2_COMPLETED=8

**The operator ran Step 24 once, at a read-only sitting they approved. This is one `GET` of the Management API's backups endpoint for the persistent Supabase project. The answer was status 200: region `eu-north-1`, PITR off, WAL-G archiving on, and eight backups, all `COMPLETED`. Both physical-backup times printed `null`. The read is now a runbook step that anyone can rerun, and a dated Observations row.**

## Performance

- **Duration:** about 6 min, from plan start (13:52Z, after `cc6f1b193`) to Task 3's commit (13:57Z). This includes the operator's sitting, which read at 13:55Z.
- **Started:** 2026-11-20T13:52Z
- **Completed:** 2026-11-20T13:57Z
- **Tasks:** 3 (1 and 3 by executors, 2 by the operator)
- **Files modified:** 2

## Accomplishments

- Step 24, "The backups, read", was added to `infra/envs/staging/supabase/README.md` after Step 23. It is written in the runbook's step form: the read, the `jq` that prints seven `s24_` lines, and the removal of `$L`.
- The persistent project's answer, read 2026-11-20T13:55Z, is recorded as `E2_*` lines: `E2_BACKUPS_HTTP=200`, `E2_REGION=eu-north-1`, `E2_PITR_ENABLED=false`, `E2_WALG_ENABLED=true`, `E2_BACKUPS=8`, `E2_COMPLETED=8`, `E2_EARLIEST_UTC=null`, `E2_LATEST_UTC=null`.
- One dated row was added to the runbook's Observations. Prettier reports the runbook and the evidence file clean.

## Task Commits

1. **Task 1: Step 24 written into the runbook, in the form of its read steps** - `406e0395d` (docs; previous executor)
2. **Task 2: The operator runs Step 24 against the persistent project**. No commit: the reply is stored under attempt key `189-06-2`, attempt `20261120T135428Z.406e0395d`, and was bound at top level.
3. **Task 3: What the project keeps, recorded and dated** - `f02d27fc4` (docs)

## Files Created/Modified

- `evidence/189-06-backups.md`: Task 1's `STEP24_WRITTEN=yes` and `SITTING_COMMAND_READY=yes`. The Task 3 section has the pasted `s24_` lines, the `E2_*` lines and the reading of the two `null` times.
- `infra/envs/staging/supabase/README.md`: Step 24 (Task 1) and one Observations row (Task 3).

## Decisions Made

- Before anything was recorded, the binding was checked with `attempt.sh bound 189-06-2 OPERATOR_REPLY plan=189-06 task=2` and `has 189-06-2 '^answer_sitting=approve$'`. Both exited 0. The lines were copied from the attempt file and nothing was re-run. The executor made no call to Supabase.
- `E2_EARLIEST_UTC` and `E2_LATEST_UTC` are `null`, because there was no Unix time to convert. `jq` prints `null` for an absent field and for a JSON `null` alike, so the record says only that the answer gave no physical-backup range. It notes PITR off beside this, and claims no cause.

## Facts carried to later plans

- These are for plan 189-14's restore section:
  - The persistent project has **no PITR** (`pitr_enabled=false`), so a restore there is a restore from a daily backup, not to a point in time.
  - **Eight backups, all `COMPLETED`**, one more than the research's assumed "about 7" (A4). The read does not show which days they cover. A page that states the window should cite Supabase's documented 7 days, not this read.
  - The answer gave **no physical-backup range** (both times `null`).

## Deviations from Plan

None. The plan was executed as written. The plan's "span from earliest to latest" could not be filled in, because the read printed no dates. The Observations row and the evidence say so in place of a span.

## Issues Encountered

None.

## Known Stubs

None.

## Threat Flags

None. No new surface: the plan added a read-only runbook step, an evidence file and one row. The evidence contains no token-shaped string (T-189-11), and Step 24 has one `GET` and names no restore (T-189-12).

## Self-Check: PASSED
