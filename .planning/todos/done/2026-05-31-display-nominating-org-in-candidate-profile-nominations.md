---
created: 2026-05-31T00:00:00.000Z
title: Display the nominating organization in candidate/profile nominations
area: frontend
files:
  - apps/frontend/src/routes/candidate/(protected)/profile/+page.svelte
  - apps/frontend/src/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.ts
  - apps/supabase/supabase/schema/503-entity-rpcs.sql
resolves_phase: 176
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

## Resolution

**Closed 2026-10-09** by Phase 176 (plans 176-02, 176-05, 176-12 and 176-13), at the phase's close (plan 176-19).

What the todo asked for is on the tree, on another page than the one it names.

- **The read.** `public.get_entity_nominations(p_project_id, p_entity_type, p_entity_id)` in `apps/supabase/supabase/schema/503-entity-rpcs.sql` (commit `1119638e1`) returns an entity's own nominations, confirmed or not, each with `confirmed`, `custom_data` and the `parent` it stands under as `entity_type`, `name` and `short_name`. It is scoped by the caller's editor grant on the named entity and serves an organization as it serves a candidate. The data writer's `getEntityUserData({ loadNominations: true })` calls it and maps each row to an `EntityNomination` (`fab21508d`, `c23d8ce93`); it is the app's one nominations read.
- **The view.** `apps/frontend/src/routes/contestant/(protected)/[entityType=servedEntityType]/[entityId=uuid]/nominations/+page.svelte` (`68bbae4ca`) shows one card per nomination: the election, the constituency, the parent under the label of the entity's type (the election list, for a candidate), the election symbol, and the state as confirmed or pending, with a line under an unconfirmed card saying that voters do not see it yet.
- **The profile's block is gone** (`3117d9896`): the profile holds nothing of the entity's nominations. The todo's approach (a), giving the nominations to the data root again, was not taken: the view renders the rows the load read and builds no `Nomination` object.
- **Tests.** `42-entity-nominations.test.sql`, 69 planned assertions, for the function. The four `nominations:` cases of `supabaseDataWriter.integration.test.ts`, against the stack. `nominations/page.svelte.test.ts` for the view, a parent row among its cases. In a browser: step 12 of `contestant-journey` for a candidate under a party; the six `nominations:` tests of `perm-no-nomination`; and the scan entry `cand-nominations`, whose reach asserts a visible parent row. All green in the phase's closing full run, `tests/e2e-runs/176-e2e/176-19-final` (341 passed, 0 failed, 0 flaky, 0 skipped, 0 did not run).

Two things the todo names are no longer so. Its first `files:` entry, `apps/frontend/src/routes/candidate/(protected)/profile/+page.svelte`, is a path that does not exist: the app is the Contestant App and its profile lies under the `(nominated)` route group. And the types are regenerated with `yarn db:types`.

Left, and filed: a parent row is shown in a browser for a candidate under a party only (`2026-10-09-176-states-and-assertions-the-phase-left-unexercised.md`, item 9).
