---
title: nominations.created_by is readable by anon (the one exemption in the anon auth-user-id census)
priority: low
created: 2026-10-01
context: Residue of Phase 166 (decision D-02). Phase 166 made the editor grant the only link from an auth user to an entity and removed every auth user id column from the entity tables, but narrowed its "anon can read no auth user id" criterion to the entity tables. nominations.created_by is the one auth user id column anon can still read.
---

# nominations.created_by is readable by anon

## What is exposed

- `public.nominations.created_by` is `uuid REFERENCES auth.users (id) ON DELETE SET NULL DEFAULT auth.uid ()`
  (`apps/supabase/supabase/schema/104-nominations.sql`). It records who originated a nomination, and
  `private.caller_unconfirmed_originated_count` counts a caller's unconfirmed placeholder parents through it.
- `anon_select_nominations` (`302-rls.sql`) returns whole rows, and the schema uses no column-level SELECT
  privileges anywhere, so `anon` can read the auth user id of whoever created any publicly visible nomination.
- The frontend does not read it: it reads nominations through `get_nominations` (SECURITY INVOKER), which
  does not project `created_by`. The exposure is through direct PostgREST table reads.

## Where it is pinned

`apps/supabase/supabase/tests/database/36-entity-identity.test.sql`, first section: the anon-exposure census
lists every column holding an auth user id on a table anon can select and permits exactly one,
`public.nominations.created_by`. Any new exposure turns it red. The exemption list is never widened to make
the census pass. Phase 169's pgTAP gate re-runs the census after its dependency bump.

## Ways to close it, and why Phase 166 took neither

1. **Table-level REVOKE of SELECT from anon, then a column-list GRANT of every other column.** Not taken: it
   introduces column-level SELECT privileges, which the schema uses nowhere else, on the table every voter
   read touches, and every future `nominations` column would have to be added to the list by hand or be
   silently unreadable.
2. **Move `created_by` to a side table** readable only by the service role and the functions that need it.
   Not taken: it reshapes the originated-count cap (`caller_unconfirmed_originated_count`) and the
   confirmation path built around it (D-02 names `enforce_nomination_confirmation` as well), which is scope
   another phase owns.

## Not a vestige

`created_by` is a live column with a live purpose (authorship and the cap on unconfirmed parents), not a
leftover of the retired entity link. **Phase 167 (vestige cleanup) leaves this todo open and does not pick
it up.**

## Closing it

Whichever option is taken, remove `public.nominations.created_by` from the census exemption list in
`36-entity-identity.test.sql` in the same change, so the census then permits no auth user id column at all,
and observe the census green on the closed tree.
