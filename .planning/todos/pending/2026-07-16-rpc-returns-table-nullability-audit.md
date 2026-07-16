---
created: "2026-07-16T00:00:00.000Z"
title: Audit RETURNS TABLE RPC nullability vs generated types (parent_nomination_id gap)
area: backend
priority: medium
files:
  - apps/supabase/supabase/schema/503-entity-rpcs.sql
  - packages/supabase-types/src/database.ts
  - apps/frontend/src/lib/api/adapters/supabase/dataProvider/supabaseDataProvider.ts
source: Phase 126 finding (126-03-SUMMARY.md + 126-REVIEW.md)
---

## Problem

PostgreSQL stores no nullability metadata for `RETURNS TABLE (...)` output columns, so
`supabase gen types` emits **every** RETURNS-TABLE column as non-nullable. For the
`get_nominations` RPC this makes semantically-nullable columns lie in the generated
`Returns` type:

- `parent_nomination_id` — NULL for every root nomination (table column is nullable,
  `104-nominations.sql:49`; generated *table* Row correctly says `string | null` at
  `database.ts:705`, but the RPC `Returns` says non-null `string`).
- `candidate_id` / `organization_id` / `faction_id` / `alliance_id` — mutually exclusive
  per `entity_type`; all but one are NULL on every row, yet all typed non-null.

The danger: trusting the generated type makes TypeScript flag real null-guards as dead
code. Phase 126 (126-03) compensated with one documented cast
(`row.parent_nomination_id as string | null | undefined`) to keep the parent-lookup
null-guards alive. The entity-id columns don't bite today only because they are read
inside `entity_type` branches.

## Solution (audit, then pick per column)

Enumerate all RETURNS-TABLE RPCs (`get_nominations`, `get_candidate_user_data`, any
future ones) × semantically-nullable output columns, then decide per RPC:

1. **Keep documented adapter casts** (current approach — cheap, but the lie stays in
   the generated types and each new consumer must know about it).
2. **Restructure the RPC** to return a relation type the generator can read nullability
   from (note: views generate all-nullable columns; `RETURNS SETOF <table>` reads table
   nullability but doesn't fit joined shapes like get_nominations).
3. **Maintain a small type-override layer** for RPC Returns in `packages/supabase-types`
   (hand-written `KnownNullable<...>` wrapper applied at the adapter boundary).

There is no SQL-side fix in the function signature itself — Postgres has no nullability
syntax for output columns.

Fits naturally alongside Phase 127 (TYPE-05 adapter-layer typing, where
`supabaseDataWriter` consumes the same generated types) or any later TYPE-workstream /
backend-hygiene phase.
