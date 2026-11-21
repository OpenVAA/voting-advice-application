---
created: 2026-10-06T19:00:27.000Z
title: The data writer's integration test against a live stack is run by no CI job
area: CI / tests
severity: minor
source: Phase 173 (ruling O-Q3; 173-03; run by hand in the closing gate of 173-13)
files:
  - apps/frontend/src/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.integration.test.ts
  - .github/workflows/main.yaml
---

## Problem

`supabaseDataWriter.integration.test.ts` holds seven cases against a running local stack: an organization save through the writer, and six writes to an entity the caller does not edit, each refused. It is gated on `SUPABASE_URL`: without the variables the file's seven tests are skipped, which is how `yarn test:unit` and every CI job see it. A regression in the write refusals would therefore pass CI. The pgTAP estate pins the same refusals at the database; this file is the only place they are shown through the adapter.

## How it is run today

With the stack up, the three values read from `supabase status -o env` (`API_URL`, `ANON_KEY`, `SERVICE_ROLE_KEY`) into shell variables and never printed:

`SUPABASE_URL=… SUPABASE_ANON_KEY=… SUPABASE_SERVICE_ROLE_KEY=… CONTESTANT_WRITER_INTEGRATION_REQUIRED=1 yarn workspace @openvaa/frontend vitest run supabaseDataWriter.integration`

`CONTESTANT_WRITER_INTEGRATION_REQUIRED=1` turns a missing variable into a failure instead of a skip.

## Solution

Run it in the CI job that already starts Supabase for pgTAP or for the E2E suite, with the required-run variable set, so that a skip there is red.

The tests' own utility suite (`yarn vitest run --config tests/vitest.config.ts`) is in the same position: no gate row and no CI job runs it.

## Update 2026-10-09 — the file gained cases and runs in a local gate; the CI gap stands (Phase 175 close)

- **Cases.** Phase 175 (plans 07 and 08) added the organization's name, short name and colour, the refused name of a confirmed entity and the read-back: the file holds **16** cases, all passed in the phase's closing gate set (`tests/e2e-runs/175-gates/175-13-final/integration.json`, 16 of 16).
- **A gate runs it locally.** The phase's gate driver has an `integration` row that reads the API URL and the two keys from `supabase status -o env` into shell variables, never prints or stores them, and runs the file with `CONTESTANT_WRITER_INTEGRATION_REQUIRED=1` against the freshly reset local stack. It is one of the fourteen rows every closing gate set of the phase passed.
- **CI is as it was.** No job of `.github/workflows/main.yaml` starts a stack for it, so in CI the sixteen cases are skipped. A regression in what the writer may store, or in the refusal of a confirmed entity's name through the writer, passes CI; pgTAP files 19, 40 and 41 hold the database's half.

## Update 2026-10-09 — four nominations cases; the CI gap stands (Phase 176 close)

Phase 176 (plan 176-05) added four `nominations:` cases — a candidate's editor reads its own nominations with the party it stands for, an organization's editor reads its own, an entity with no nomination has an empty list, and another user's entity is not read. The file holds **20** cases, all passed in the phase's closing gate set (`tests/e2e-runs/176-gates/176-19-final/integration.json`, 20 of 20), whose `integration` row runs it against the freshly reset local stack. The four were never shown red by a mutation of the writer. **CI is as it was:** no job of `.github/workflows/main.yaml` starts a stack for the file, so in CI the twenty cases are skipped.

## Update 2026-10-11 — the file gained the nomination methods' cases, run in the phase's gate; still in no CI job (Phase 177 close)

`supabaseDataWriter.integration.test.ts` gained the cases of `setEntityNominations` and `getNominationParentOptions` (plan 177-09): the two named refusals, `hasCandidates` and `tooManyPending`, are asserted through the real API there and nowhere else. The file is the `integration` row of the phase's gate driver (`.planning/phases/177-define-nominations/177-gates.sh`), which runs it against the local stack after a reset, and it was green in the phase's closing gate set. **It still runs in no CI job**, so on the integration branch and on `main` these cases are run by nobody unless someone runs that row by hand.
