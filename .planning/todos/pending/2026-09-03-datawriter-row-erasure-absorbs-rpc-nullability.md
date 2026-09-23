---
created: "2026-09-03T00:00:00.000Z"
title: dataWriter erases the get_candidate_user_data row, so the RPC nullability override buys nothing there
area: api
files:
  - apps/frontend/src/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.ts
---

## Problem

Phase 164 plan 01 widened six `get_candidate_user_data` output columns to include null in the single
override locus (`packages/supabase-types/src/database.overrides.ts`): `organization_id`,
`first_name`, `last_name`, `subtype`, `sort_order`, `terms_of_use_accepted`. Four of those are
`NULL::…` literals in the RPC's own organization UNION branch
(`apps/supabase/supabase/schema/503-entity-rpcs.sql:127-128`), so the nullability is real.

The plan predicted that widening them would surface type errors at the only call site,
`supabaseDataWriter.ts:221` (`.rpc('get_candidate_user_data', …)`). Measured during execution:
**no error appeared anywhere.** The reason is that line 228 immediately erases the row:

    const mapped = toDataObject(entityRow as Record<string, unknown>, effectiveLocale, defaultLocale);

Every column is read through `Record<string, unknown>`, so no column is ever read at its declared
nullability. The override is correct and reaches the type, but the guarantee is discarded one line
later at this call site. A future null in any of those six columns is as invisible here after the
phase as it was before it.

This is a pre-existing whole-row type-erasure cast, not an RPC-return nullability cast, so it does
not match Phase 164 criterion 3's grep and was correctly out of scope for that phase.

## Solution

TBD — likely the Phase-157 adapter-boundary treatment applied to this call site:

- Drop the `as Record<string, unknown>` and give `toDataObject` a row-typed overload, or narrow the
  row explicitly before mapping.
- Expect real errors to surface on the six widened columns; discharge each with a guard or a
  documented narrowing, never a re-cast (the Phase 164 PROH-02 rule).
- Note that the candidate branch of the RPC is selected here via `p_entity_type: 'candidate'`, which
  may make several of the six provably non-null at this specific call site — that argument needs to
  be written down rather than assumed, since the RPC's type is shared with the organization branch.

## Context

Found during Phase 164 plan 01 Task 2 triage. Resolves research assumption A2
("UNVERIFIED whether any error actually appears") as: no error appears, and the reason is erasure
rather than correctness.
