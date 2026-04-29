---
title: Clean up nominations table — remove redundant fields
priority: medium
area: db
created: 2026-04-28
promoted: 2026-04-29
resolves_phase: 66
context: Captured as a note (`.planning/notes/2026-04-28-clean-up-nominations-table.md`) during v2.6 Phase 64 work on the supabase adapter parent-nomination derivation. The `nominations` table carries a `name` column that is rarely (never?) populated and an `entityType` column that is redundant given that the actual entity is referenced by one of `candidate_id` / `organization_id` / `faction_id` / `alliance_id` (whichever column is non-null already determines the entity type).
---

# Clean up nominations table

The `nominations` table in supabase has accumulated fields that look
redundant or unused:

- `name` — the entity already has its name; nominations should be a
  pure relationship row (entity ↔ election ↔ constituency [↔ parent
  nomination]). If `name` is populated for any nominations today, it's
  storing the same value that `<entity>.name` returns.
- `entityType` — the row already encodes which entity by which of the
  `candidate_id` / `organization_id` / `faction_id` / `alliance_id`
  foreign-key columns is non-null. Storing `entityType` separately is
  duplicate truth and a place for the two to drift apart.

## What to do

- Audit current usage of `nominations.name` — grep frontend, backend,
  Edge Functions, and dev-seed. If any code reads it, route to the
  entity's own name instead.
- Audit current usage of `nominations.entityType` — grep frontend,
  backend, Edge Functions, dev-seed, supabase RLS, pgTAP tests. If
  any code reads it, derive from the non-null FK column instead.
- Write a supabase migration that drops both columns (or adds a
  not-null check / generated column for `entityType` if dropping is
  too risky for downstream consumers).
- Update `@openvaa/supabase-types` regeneration step + dev-seed
  generators + adapter reverse-fill (added v2.6 Phase 64 Plan 01) to
  match the new shape.
- Audit pgTAP tests for assertions on either column.

## Acceptance

- `nominations` row shape is just relationship + parent_nomination_id.
- Nothing in the codebase reads `nominations.name` or
  `nominations.entityType`.
- Migration applies cleanly to the existing seed and any dev/prod
  databases (zero data loss for any populated `name` values).
- `yarn supabase:types` produces a tighter type.

## Open questions

- Does any downstream system (admin tooling, third-party importer)
  rely on `nominations.name` or `nominations.entityType`? Audit before
  dropping.
- Is `entityType` populated on any rows where the corresponding FK
  doesn't match the type field? If yes, that's a data-integrity issue
  to fix before the migration.

## Related

- v2.6 Phase 64 Plan 01: supabase adapter now derives
  `parentNominationType` in-memory by looking up the parent
  nomination's entity. The same derivation logic could replace
  `nominations.entityType` reads codebase-wide if any remain.
