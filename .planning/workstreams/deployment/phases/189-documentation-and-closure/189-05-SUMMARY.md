---
phase: 189-documentation-and-closure
plan: "05"
subsystem: infra-docs
tags: [supabase, probe, dns, dmarc, observations, operator-sitting]
status: complete

requires:
  - phase: 189 (CONTEXT H-01 (1), C-01 S18 and S27, G-03, G-04(c))
    provides: the first operator sitting, read-only, and the facts it has to settle
  - phase: 183 (tools/attempt.sh)
    provides: the attempt file and the top-level binding of the operator's reply
provides:
  - "A probe row on the persistent project taken after the 2026-11-19 function deploy: status 0, 22 PASS, functions.verify-jwt and functions.identity-callback-unverified PASS (G-04(c), G-03)"
  - "has_table_privilege('postgres', 'auth.users', 'UPDATE') = t on the persistent project, read through the session pooler (C-01 S27)"
  - "DMARC policies read from public DNS: _dmarc.openvaa.org p=none, _dmarc.staging.openvaa.org p=quarantine (C-01 S18)"
affects: [189-15, 189-17]

actuals:
  tokens: 1791
  tasks: 3
  commits: 2
plan_head_before: c03e1881ec530e8e569612d6ae90d10ebd6931ca
plan_head_after: 60ca78bb1221eaf5ad65949bf52db0eb2b60efc8

tech-stack:
  added: []
  patterns:
    - "An operator sitting's reply is read from the bound attempt file and copied into S1_* lines; the runbooks get one dated past-tense row per fact citing the evidence file"

key-files:
  created:
    - .planning/workstreams/deployment/phases/189-documentation-and-closure/evidence/189-05-staging-reads.md
  modified:
    - infra/envs/staging/supabase/README.md
    - infra/envs/staging/dns-mail/README.md

key-decisions:
  - "Sitting 1 approved by the operator (attempt 20261120T133036Z.242ab9b76, bound at top level; attempt.sh bound and has both exited 0 before anything was recorded)"
  - "The plan's 'two identity-callback check results' are functions.verify-jwt (verify_jwt as configured, identity-callback's false included) and functions.identity-callback-unverified (400 to a keyless GET, 401 to a keyless empty POST); both are named in the probe row"

patterns-established: []

requirements-completed: []  # DOCS-03 and DOCS-08 are advanced (the observations G-03, G-04(c), S18 and S27 need are on the record), not met: later plans of phase 189 write the closures and replace the unverified statements

coverage:
  - id: D1
    description: "The probe of Step 23 ran on the persistent project after the 2026-11-19 deploy and its 22 check lines are recorded"
    requirement: DOCS-03
    verification:
      - kind: other
        ref: "Task 3 automated verify (22 S1_CHECK_ lines, S1_PROBE_EXIT numeric, identity-callback-unverified line present)"
        status: pass
    human_judgment: true
  - id: D2
    description: "The postgres UPDATE privilege on auth.users and both DMARC policies are read and recorded"
    requirement: DOCS-08
    verification:
      - kind: other
        ref: "Task 3 automated verify (S1_POSTGRES_UPDATE_AUTH_USERS, S1_DMARC_DIFFERS)"
        status: pass
    human_judgment: true
  - id: D3
    description: "Dated rows in both runbooks' Observations, formatted, and no secret-, IPv4- or mailbox-shaped string in the evidence"
    requirement: DOCS-03
    verification:
      - kind: other
        ref: "Task 3 automated verify (grep of 189-05-staging-reads in both runbooks, prettier --check, IPv4/mailto search); key/token search returned 0"
        status: pass
    human_judgment: false

duration: 12min
completed: 2026-11-20
---

# Phase 189 Plan 05: Sitting 1, the read-only staging reads Summary

S1_PROBE_EXIT=0
S1_PROBE_PASS=22
S1_CHECK_functions.verify-jwt=PASS
S1_CHECK_functions.identity-callback-unverified=PASS

**At one operator-approved, read-only sitting, the conformance probe passed all 22 checks on the persistent Supabase project. This was its first run since the function deploy of 2026-11-19, and both identity-callback checks passed. The `postgres` role holds `UPDATE` on `auth.users` (`t`). The two DMARC policies differ: `p=none` on `openvaa.org` and `p=quarantine` on `staging.openvaa.org`. Each fact is now a dated row in the Supabase or DNS-and-mail runbook.**

## Performance

- **Duration:** about 12 min from plan start (13:26Z, after `c03e1881e`) to Task 3's commit. The operator's sitting is included; it read at 13:34Z.
- **Started:** 2026-11-20T13:26:23Z
- **Completed:** 2026-11-20T13:38:03Z
- **Tasks:** 3 (1 and 3 by executors, 2 by the operator)
- **Files modified:** 3

## Accomplishments

- Probe on the persistent project, using the publishable key, the catalog role `postgres` through the session pooler and no service-role key. It exited 0 with 22 `PASS`, 0 `FAIL` and 0 `COULD NOT RUN`. Its key-model note again named the legacy keys as enabled.
- `has_table_privilege('postgres', 'auth.users', 'UPDATE')` returned `t` (query exit 0).
- The two `dig +short TXT` reads, each reduced to its `p=` tag: `none` for `_dmarc.openvaa.org` and `quarantine` for `_dmarc.staging.openvaa.org` (`S1_DMARC_DIFFERS=yes`).
- Runbooks: two dated rows in the Observations of `infra/envs/staging/supabase/README.md` and one in `infra/envs/staging/dns-mail/README.md`. Prettier reports both files clean.

## Task Commits

1. **Task 1: Readiness, read-only** - `242ab9b76` (docs; previous executor)
2. **Task 2: The operator's read-only sitting**. No commit: the reply is stored under attempt key `189-05-2`, attempt `20261120T133036Z.242ab9b76`, and was bound at top level.
3. **Task 3: The reads recorded, and dated rows in the two runbooks** - `60ca78bb1` (docs)

## Files Created/Modified

- `evidence/189-05-staging-reads.md`: the Task 3 section gives the sitting's conditions, the probe's note and every `S1_*` line, with `S1_READ_AT=2026-11-20T13:34Z`.
- `infra/envs/staging/supabase/README.md`: two Observations rows, one for the probe and one for the privilege read.
- `infra/envs/staging/dns-mail/README.md`: one Observations row with both DMARC policies.

## Decisions Made

- Before anything was recorded, the binding was checked with `attempt.sh bound 189-05-2 OPERATOR_REPLY plan=189-05 task=2` and `has 189-05-2 '^answer_sitting=approve$'`. Both exited 0.
- The lines were copied from the attempt file as pasted, and nothing was re-run. Neither the executor nor anyone else ran a command against the hosted project, AWS or DNS.

## Facts carried to later plans

- These are for plans 189-15 and 189-17 to weigh. None was a probe failure.
  - **C-01 S27:** `postgres` holds `UPDATE` on `auth.users` (`t`). The question is now answered by a read.
  - **C-01 S18:** the parent domain's DMARC is `p=none`, and the staging zone's own record is `p=quarantine`.
  - **Key model:** the probe's note says the legacy keys are still enabled on the persistent project.

## Deviations from Plan

None. The plan was executed as written.

## Issues Encountered

None.

## Known Stubs

None.

## Threat Flags

None. No new surface: the plan wrote only the evidence file and runbook rows, and the evidence contains no key-, token-, IPv4- or mailbox-shaped string.

## Self-Check: PASSED

- FOUND: `.planning/workstreams/deployment/phases/189-documentation-and-closure/evidence/189-05-staging-reads.md`
- FOUND: `242ab9b76` and `60ca78bb1` are ancestors of HEAD
