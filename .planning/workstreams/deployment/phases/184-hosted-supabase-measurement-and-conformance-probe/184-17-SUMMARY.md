---
phase: 184-hosted-supabase-measurement-and-conformance-probe
plan: 17
subsystem: infra
tags: [infra, supabase, hosted, throwaway, conformance-probe, catalog-role, rls, observations]
status: complete

requires:
  - "184-11: the bypass readings (s11_postgres_bypassrls=t, s11_readonly_bypassrls=f, s11_readonly_count_exit=1)"
  - "184-15/184-16: the throwaway bootstrapped, first administrator granted, smoke dataset seeded, port 2587 served, account-access at version 6 with verify_jwt=false"
provides:
  - "CATALOG_ROLE=postgres (ruled by the operator on 2026-11-11): the probe's catalog half connects as postgres.<ref> through the session pooler"
  - "The first green probe run on a hosted project: s23_probe_exit=0, 22 PASS lines, 0 FAIL, 0 COULD NOT RUN, on the throwaway before any fault (2026-11-11)"
  - "The scope of no-seed: it detects seed.sql residue only (openvaa.test users or the two fixed seed ids, a local storage_config address, the demo key), not dev-seed content rows"
  - "Runbook: one dated Observations row for the green run"
affects: [184-18, 184-20, 184-22, 185]

actuals:
  tokens: 11700
  tasks: 3
  commits: 1
plan_head_before: 9027d2fdcbfcd0d12c0223a7b876efada05d79e3
plan_head_after: 24cce02ba781b3dc9091b958774570959284e36f

tech-stack:
  added: []
  patterns:
    - "A sitting prelude that creates its log directory when absent, so no script depends on an earlier one having left it"
    - "The probe's input kinds asserted before the run without printing a value (publishable prefix, service-role key unset)"

key-files:
  created:
    - .planning/workstreams/deployment/phases/184-hosted-supabase-measurement-and-conformance-probe/evidence/184-17-throwaway-probe-green.md
  modified:
    - infra/envs/staging/supabase/README.md

key-decisions:
  - "CATALOG_ROLE=postgres, ruled by the operator on 2026-11-11 via the orchestrator: of the two roles 184-11 measured, only postgres bypasses row-level security, so it is the only one the probe's catalog preflight accepts"
  - "no-seed passing with the smoke dataset present is by definition, not a probe defect: the check covers seed.sql residue, and D-18 requires the smoke template to create no auth user. No probe check detects dev-seed content; a check for that would be new, not a correction"

requirements-completed: []  # SUPA-07 needs both halves of D-17: this is the green run; the batched break of 184-18 shows the probe failing by name

duration: about 4 minutes from the Task 2 attempt id (10:06:18Z) to the record; the sitting ran 10:07:05Z to 10:07:14Z
completed: 2026-11-11
---

# Phase 184 Plan 17: The probe's catalog role and the throwaway's green probe run Summary

**CATALOG_ROLE=postgres. Probe status 0: twenty-two PASS lines, no FAIL and no COULD NOT RUN, on the throwaway before any fault.**

## Performance

- **Sitting:** 2026-11-11, 10:07:05Z to 10:07:14Z (UTC). The orchestrator ran it under the operator's authorisation of 2026-11-10, with credentials from the operator's keychain. The executor held no credential.
- **Tasks:** 3 of 3.
- **Files modified in the repository:** 2.

## Accomplishments

- **Task 1, the catalog role.** Ruled by the operator on 2026-11-11 via the orchestrator: `postgres`, the plan's recommended option.
  - 184-11 measured `s11_postgres_bypassrls=t` and `s11_readonly_bypassrls=f`.
  - The read-only login role also failed to count `storage.buckets` (`s11_readonly_count_exit=1`, cause UNCONFIRMED).
  - So `postgres` is the only role that passes the probe's bypass guard.
- **Task 2, the run.** Runbook Step 23 ran against `infra/envs/scratch/supabase`.
  - The connection was `postgres.<ref>` through the session pooler, with the publishable key as the anon key and the service-role key unset.
  - It printed `s23_probe_exit=0` and the 22 PASS lines, whose names match `checks.mjs` one for one, in order.
  - The `NOTE key-model:` line agrees with the runbook's 2026-11-08/09 observation.
- **Task 3, the check.**
  - The reply is stored and `bound` under `OPERATOR_REPLY=received attempt=20261111T100618Z.9027d2fdc plan=184-17 task=2 head=9027d2fdcbfcd0d12c0223a7b876efada05d79e3`.
  - The evidence is written whole from the attempt files.
  - The runbook's Observations gained the dated green-run row, and Prettier is clean on it.
  - The probe's spec passes (`vitest run --config infra/vitest.config.ts`: 96 of 96, offline).
- **The orchestrator's `no-seed` question.**
  - `no-seed` runs `infra/scripts/check-seed.sql`. That script looks only for what `seed.sql` leaves: a user in `openvaa.test` or with one of the two fixed ids, a local or absent `supabase_url` in `storage_config`, or the demo service-role JWT.
  - The `smoke` template creates no auth user and no `storage_config` row, as D-18 requires "so that `no-seed` stays green".
  - The pass is therefore correct for the check as specified.
  - Stated plainly as a scope limit: no probe check detects dev-seed content rows, or auth users outside the seed's domain and ids. This is not a defect of `no-seed`. If production ever needs a "no dev-seed content" check, that would be a new check.

## Task Commits

1. **Tasks 1 to 3: the ruling, the green run and the runbook row:** `24cce02ba` (docs)

Task 1 (a decision) and Task 2 (an operator action) produced no repository change of their own. Their outcomes are written into the one record of Task 3.

## Files Created/Modified

- `.planning/workstreams/deployment/phases/184-hosted-supabase-measurement-and-conformance-probe/evidence/184-17-throwaway-probe-green.md`: the ruling, the inputs, the 22 lines and the `no-seed` scope.
- `infra/envs/staging/supabase/README.md`: one Observations row. Prettier re-aligned the table's columns, which is why 63 existing rows show as changed with no change of wording.

## Decisions Made

- `CATALOG_ROLE=postgres`, ruled by the operator on 2026-11-11.
- `no-seed`'s scope is recorded as it is. Neither the check nor the template was changed.

## Deviations from Plan

**1. [Process] Task 2's attempt was opened before the ruling.** To save a round trip, the sitting for the recommended option was written, and `184-17-2` opened, together with the Task 1 checkpoint. The checkpoint said that a different ruling would get a fresh attempt and a different sitting. The ruling matched, so the prepared sitting was used. Nothing else changed.

**2. [Process] The sitting's scripts live in the scratchpad**, at `184-17/prelude.sh`, `01-probe.sh` and `02-cleanup.sh`, as the sitting mode directs. The prelude creates the log directory when it is absent rather than requiring it.

No probe defect and no project deviation were found, so `sources.mjs`, `checks.mjs` and `probe-hosted.test.ts` are unchanged.

## Issues Encountered

None.

## User Setup Required

None.

## Next Phase Readiness

- Plan 184-18's batched break now has a green baseline under the same probe and the same catalog role.
- The `no-seed` scope limit is recorded for whoever plans production checks.

## Self-Check: PASSED

- FOUND: `.planning/workstreams/deployment/phases/184-hosted-supabase-measurement-and-conformance-probe/evidence/184-17-throwaway-probe-green.md`
- FOUND: `24cce02ba` (ancestor of HEAD)
- Task 3's two automated verifies: exit 0 (bound, `s23_probe_exit=0`, 22 PASS, 0 FAIL; the role line, the attempt line, Prettier, vitest).
