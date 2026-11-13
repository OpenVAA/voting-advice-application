---
created: 2026-10-09T00:00:00.000Z
title: pgTAP `39-invitations.test.sql` test 238 is red on any database a full E2E run has touched — it counts `private.invitation_link_witness` whole, and no teardown removes those rows
area: tests / pgTAP and E2E teardown
severity: minor
source: Phase 176 plan 02 (176-02-SUMMARY.md § Finding for the closing plan); met again by plans 05, 06, 08, 10, 11, 17 and 18; filed by 176-19
owner: unassigned — the next plan that edits `39-invitations.test.sql` or the E2E teardown of the invitation specs
files:
  - apps/supabase/supabase/tests/database/39-invitations.test.sql
  - tests/tests/specs/contestant/invitation-contract.spec.ts
  - tests/tests/utils/supabaseAdminClient.ts
---

## Problem

Test 238 of `39-invitations.test.sql` ("the table holds exactly the two records the service role opened, each completed once") aggregates over **every** row of `private.invitation_link_witness`. An E2E run that asks for an invitation link leaves rows there, and no teardown of the suite removes them. The assertion is therefore red on any database such a run has touched, and green only on a freshly reset one.

Measured in the phase, read with `psql` after full runs with no reset between them: 4 rows after two runs (plan 02), 26, 52, 30, 66, 85 and 194 at later plans.

## Why the gates never showed it

`176-gates.sh` runs its `db-reset` row before its `pgtap` row, so every gate set of the phase ran pgTAP on a reset database: `Files=42, Tests=1957`, `Result: PASS` in the closing gate set `tests/e2e-runs/176-gates/176-19-final`. Anyone who runs `yarn workspace @openvaa/supabase test:db` after an E2E run, without a reset, meets one red test that says nothing about the tree.

## Solution — two places a fix can go

1. **The assertion**: scope it to the rows the file itself opens (by the witness ids or the addresses it writes), as Phase 175 did for another file ("a pgTAP assertion that counts rows is scoped to the fixture's two projects", 175-03).
2. **The E2E teardown**: remove the witness rows a run wrote. The table is in `private`, so this needs a service-role path the admin client does not have today.

The first is the smaller change and makes the file independent of what the database held before it.

## Resolution

**Closed 2026-10-18** by Phase 177.1 plan 177.1-03, with option 1 of the Solution (operator ruling F6 (a), 177.1 decision D-21).

- **The assertion counts only the file's own records.** The `is (…)` of `39-invitations.test.sql` described "the table holds exactly the two records the service role opened, each completed once" restricts its aggregate to `w.id IN (current_setting('t39.witness')::uuid, current_setting('t39.witness_2')::uuid)`, the two records the file opens; section 20 keeps the second id in `t39.witness_2`. Its ordinal has moved since filing (the file declares `plan (329)`), so it is named by its description. Commit `fc01c81e6`.
- **Control** (plan 177.1-04, `tests/e2e-runs/177.1-unit/177.1-04-d21.{log,exit,head}`, exit 0, head `d65814195`): on a freshly reset database the owner opened one witness record outside the file; `00-helpers` + `39-invitations` then passed (`Files=2, Tests=338`), with that record present before and after the run. The database was reset again afterwards.

**Not done.** Option 2, a teardown that removes the witness records an E2E run writes: the rows still accumulate, and no assertion of file 39 now counts the table whole.
