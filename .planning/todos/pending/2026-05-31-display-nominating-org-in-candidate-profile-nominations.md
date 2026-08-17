---
created: 2026-05-31T00:00:00.000Z
title: Display the nominating organization in candidate/profile nominations
area: frontend
files:
  - apps/frontend/src/routes/candidate/(protected)/profile/+page.svelte
  - apps/frontend/src/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.ts
  - apps/supabase/supabase/schema/503-entity-rpcs.sql
---

## Problem

The candidate profile nominations block (`profile/+page.svelte`) no longer
shows the **election list / nominating organization** for each nomination.

On 2026-05-31 the candidate profile was changed to format nominations
directly from the raw `userData` nomination list rather than providing them
to `dataRoot` (which threw `DataProvisionError: No matching entity found for
nomination` because the raw partial data carries no entity graph — see commit
`82986cd21`). The raw nomination payload from `_getCandidateUserData` only
includes `electionId`, `constituencyId`, `electionSymbol`, `electionRound`,
`entityType`, `entityId`, `id` — it has **no parent-nomination / organization
data** and **no confirmed/pending state**, so `parseNomination` hard-codes
`organization: undefined` and `unconfirmed: false`.

As a result:
- The "Election list" (`common.electionList`) Input never renders.
- The "State" Input always shows "Confirmed" even for pending nominations.

## Solution

Surface the nominating organization (and ideally confirmed/pending state) in
the candidate profile nominations.

Likely approach — fetch the richer nomination graph for the candidate, modeled
on the existing `get_nominations` RPC (`apps/supabase/supabase/schema/503-entity-rpcs.sql`),
which already joins nominations with their entity rows and exposes
`parent_nomination_id` + entity columns:

1. Add a candidate-scoped RPC (e.g. `get_candidate_nominations()`, auth.uid()-based)
   modeled on `get_nominations`, returning the candidate's own nominations plus
   their parent chain (org/alliance) joined with entity data, including
   `unconfirmed` / `custom_data`.
2. Rewire `_getCandidateUserData` to build the `nominations` + `entities` map
   from the RPC result (mirror the voter `supabaseDataProvider._getNominationData`
   mapping: entity dedup, `parentNominationType` derivation, reverse-fill of
   parent→children id arrays).
3. Either:
   - (a) restore `dr.provideNominationData(...)` in the candidate
     `(protected)/+layout.svelte` now that the entity graph is complete and
     read nominations back via `getNominationsForEntity`; OR
   - (b) keep the raw-format approach on the profile page but extend the raw
     nomination shape with `organization` (parent entity name) + `unconfirmed`
     and render the `common.electionList` + `common.state` Inputs accordingly.
4. Regenerate Supabase types (`yarn supabase:types`) for the new RPC.
5. Extend the candidate-mega-journey profile assertions to cover the election
   list + state once displayed.

## Context

- Raw-format decision + rationale: commit `82986cd21` (the candidate app
  intentionally does not load the full nomination graph).
- Reference pattern: `supabaseDataProvider._getNominationData`
  (`apps/frontend/src/lib/api/adapters/supabase/dataProvider/supabaseDataProvider.ts:232+`)
  and `get_nominations` RPC.
