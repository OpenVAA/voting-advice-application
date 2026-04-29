---
title: Clean up sloppy typing in supabaseDataProvider
priority: medium
area: api
created: 2026-04-27
promoted: 2026-04-29
resolves_phase: 66
context: Captured as a one-line note (`.planning/notes/2026-04-27-cleanup-sloppy-typing-supabaseDataProvider.md`) on 2026-04-27. Promoted to a real todo on 2026-04-29 during v2.6 milestone close — the file accumulated several `as unknown as { ... }` casts during Phase 64 Plan 01 (parent-nomination type derivation) and Phase 64 Plan 03 (reverse-fill of nomination parent → children id arrays) that should be replaced with proper types.
---

# Clean up sloppy typing in supabaseDataProvider

`apps/frontend/src/lib/api/adapters/supabase/dataProvider/supabaseDataProvider.ts`
has accumulated several patterns that bypass the type system:

- `as unknown as { ... }` casts in the reverse-fill pass added during
  Phase 64 (lines ~365-419) — `parentNominationId`, `entityType`,
  `candidateNominationIds`/`factionNominationIds`/
  `organizationNominationIds` are accessed via shapeshifting casts
  rather than against the proper `Nomination` types from `@openvaa/data`.
- Pre-existing `any` and `unknown` escape hatches in mapping rows
  from supabase responses to data-model objects.
- Inline anonymous `{ id: string; ... }` object types repeated across
  multiple loops (DRY violation that's also a typing
  consistency hazard if the underlying shape changes).

## What to do

- Audit every `as unknown as` cast in this file; classify each as
  fixable-with-real-type, structural-narrow-required, or actually-runtime-shape-unknown.
- For the reverse-fill pass: define a real intermediate type (`InternalFlatNomination`
  or similar) once at the top of the file and reuse it across the
  parent/child mapping loops.
- Tighten supabase row → data-model object mapping where supabase-types are
  available.
- For genuinely unknown shapes (e.g. JSON columns): use `unknown` + a
  validator function rather than direct casting.

## Acceptance

- Zero `as unknown as` casts in this file (or each remaining one is justified inline with `// @ts-expect-error — reason: …` or a comment).
- No `any` types remaining.
- Type errors surface at the call site, not in downstream consumers.

## Related

- `.planning/todos/pending/2026-04-25-normalise-app-shared-paradigm.md` — same family of "tighten the type-system contract within @openvaa/* packages" work.
