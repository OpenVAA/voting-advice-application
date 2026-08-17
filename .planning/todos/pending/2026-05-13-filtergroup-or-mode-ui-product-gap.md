---
title: FilterGroup OR-mode UI PRODUCT-GAP — voter results filter dialog has no AND/OR mode toggle
severity: medium
surfaced-in: phase 77 / SETTINGS-01 wave B (RESEARCH LANDMINE-4)
target-milestone: v2.10+ (filter UX)
status: pending
created: 2026-05-13
---

# FilterGroup OR-mode UI PRODUCT-GAP

## Problem

The `@openvaa/filters` package supports BOTH `AND` and `OR` composition modes
on `FilterGroup`:

- API setter: `packages/filters/src/group/filterGroup.ts:75-79` (`logicOperator`).
- Constants: `LOGIC_OP.And` / `LOGIC_OP.Or` from the package's enum.

The voter app currently exposes ONLY the default (`AND`) behavior. The voter
results filter dialog (`apps/frontend/src/lib/components/entityFilters/EntityFilters.svelte`)
renders an Expander-per-filter UI but emits NO mode-toggle control. Verified by:

```bash
grep -rn "logicOperator\|LOGIC_OP" apps/frontend/src/lib/components/entityFilters/
# 0 hits
```

A voter wanting to express the disjunctive query "candidates in Party A OR
matching at least one of these positions" cannot do so today; the only
composition available is conjunctive (AND).

This was surfaced during Phase 77 Plan 02 (SETTINGS-01 wave B — filter-type
matrix). Plan 02 captured the FilterGroup OR cell as PASS-WITH-DEFERRAL — the
matrix asserts AND composition (5 cells passing) and documents OR composition
as PRODUCT-GAP (this todo).

## Evidence

- `apps/frontend/src/lib/components/entityFilters/EntityFilters.svelte` — only
  emits per-filter Expanders; no logic-operator toggle anywhere in the
  component tree.
- `packages/filters/src/group/filterGroup.ts` exposes a `logicOperator` setter
  but no UI emits `LOGIC_OP.Or`.
- `grep -rn "logicOperator|LOGIC_OP" apps/frontend/src/lib/components/entityFilters/`
  → 0 matches.

## Acceptance (if surfaced)

If OR-mode should become voter-facing:

1. Add a mode-toggle UI surface to `EntityFilters.svelte` (or the parent
   `EntityListWithControls.svelte` dialog) — e.g., a `<select>` or
   segmented control with localized labels for "match all" / "match any".
2. Wire the control to `FilterGroup.logicOperator` via a context update or
   prop binding (the filter-group instance is currently constructed in
   `filterStore.svelte.ts:67`; the writer surface needs to thread the operator
   selection down).
3. Add a top-level wave B cell to `voter-results.spec.ts` asserting OR-mode:
   toggle 2 filters in OR-mode → assert WIDENING vs. the equivalent AND
   composition (count_OR > count_AND).

## Notes

- This is conditional on a product decision: whether voters benefit from
  per-mode-toggle UX vs. simply more flexible filter composition strategies
  (e.g., "exclude all candidates without ANY answer" rules at the @openvaa/filters
  rule layer). The PRODUCT-GAP framing here is "the filter type listed in the
  original `2026-04-27-extend-e2e-filter-type-coverage.md` cannot be asserted
  today" — not necessarily "this UX SHOULD exist".
- See `.planning/phases/77-settings-matrix-question-customization-gap-fills/77-02-SUMMARY.md`
  for the Plan 02 close context.
- Phase 77 Plan 02 PASS-WITH-DEFERRAL pattern inherited from Phase 74 D-04 / Phase 75 D-03 /
  Phase 76 D-06; PASS-WITH-DEFERRAL is captured by NOT writing a test that fails on
  the missing surface, but instead by documenting the gap in this follow-up todo.
- Source todo (now resolved): `.planning/todos/completed/2026-04-27-extend-e2e-filter-type-coverage.md`.
