---
title: Constituency filter UI PRODUCT-GAP — voter results filter dialog does not render a constituency filter
severity: low
surfaced-in: phase 77 / SETTINGS-01 wave B / Plan 02 OQ-5 resolution
target-milestone: v2.10+ (filter UX — depends on product decision)
status: pending
created: 2026-05-13
---

# Constituency filter UI PRODUCT-GAP

## Problem

`apps/frontend/src/lib/contexts/voter/filters/buildParentFilters.ts:9-13` emits
filters ONLY for the following parent-nomination types:

```typescript
const PARENT_GETTER: Record<Exclude<EntityType, 'candidate'>, string> = {
  alliance: 'allianceNomination',
  faction: 'factionList',
  organization: 'list'
};
```

`constituency` is NOT in this map. The voter results filter dialog therefore
renders zero constituency-level filtering UI today. Constituency is treated as
a navigation/scope concern (election → constituency selector → questions →
constituency-scoped results), not as a per-list filter.

This was surfaced during Phase 77 Plan 02 OQ-5 (filter-type matrix scope
audit). Phase 77 Plan 02 captured the cell as PASS-WITH-DEFERRAL via
`test.skip(true, ...)` in `tests/tests/specs/variants/constituency.spec.ts`.

## Evidence

- `grep -rn "constituency" apps/frontend/src/lib/contexts/voter/filters/`
  returns 0 hits for filter-building paths (the constituency name appears only
  in the e2e-fixture file references, not in filter logic).
- `buildParentFilters` only iterates `PARENT_GETTER` keys; constituency is not
  a parent-nomination type — it is a scope.
- `EntityFilters.svelte` renders whatever `FilterGroup.filters` contains; the
  current `FilterGroup` only includes parent-nomination filters + filterable
  question filters.

## Acceptance (if surfaced)

If constituency should become a top-level voter-results filter:

1. Extend `buildParentFilters` (or add a sibling `buildConstituencyFilter`) to
   emit an `EnumeratedFilter` keyed on entity.constituency.id (or whatever
   constituency association exists on the nomination chain).
2. Surface the filter in `EntityFilters.svelte` with an appropriate locale
   key (`entityFilters.constituencyLabel` or similar).
3. Add a top-level wave B cell in `voter-results.spec.ts` or
   `constituency.spec.ts` that toggles the constituency filter and asserts
   narrowing.

## Notes

- This is conditional on a product decision: in many VAAs the voter has already
  selected their constituency upstream, so an additional constituency filter
  inside results may be redundant. The PRODUCT-GAP framing here is "the filter
  type listed in the original `2026-04-27-extend-e2e-filter-type-coverage.md`
  cannot be asserted today" — not necessarily "this filter type SHOULD exist".
- See `.planning/phases/77-settings-matrix-question-customization-gap-fills/77-02-SUMMARY.md`
  for the Plan 02 close context.
- Source todo (now resolved): `.planning/todos/completed/2026-04-27-extend-e2e-filter-type-coverage.md`.
