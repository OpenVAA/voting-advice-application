---
title: Extend E2E tests to cover all supported filter types
priority: medium
created: 2026-04-27
context: Captured during Phase 64 discuss-phase as a deferred follow-up. Phase 64 closes the 5 voter-results E2E tests using the implicit party (EnumeratedFilter via nominate_for) source. Other filter types remain uncovered at the E2E layer.
---

# Extend E2E tests to cover all supported filter types

Phase 64 fixes RESULTS-01/02 + D-14 + D-15 against a single filter source
(party affiliation, the EnumeratedFilter rendered via `nominate_for`).
The `@openvaa/filters` package supports several other filter types that
have unit-test coverage but no end-to-end coverage in the voter app.

## Filter types missing E2E coverage

- **`NumberFilter`** — numeric range/threshold filters (e.g., age, score)
- **`TextFilter`** — free-text matching beyond the search-bar surface
  (i.e., explicit modal-based text filters distinct from the search input)
- **Additional `EnumeratedFilter` sources** beyond party affiliation:
  - Categorical question filters (singleChoiceCategorical answer values)
  - Constituency-based filters (where applicable)
  - Status / nomination-state filters (where applicable)
- **`FilterGroup` AND/OR composition** — nested groups with mixed
  inclusion/exclusion rules
- **`MISSING_FILTER_VALUE` semantics** — the sentinel value handling at
  the UI layer (currently only verified via package-level unit tests)

## Proposed scope

1. Add a categorical question + a number-typed property to the e2e
   template if needed for deterministic seed coverage
2. Author E2E tests for each filter type:
   - Toggle filter → list narrows
   - Reset filter → list restores
   - Filter scope reset on context change (mirrors D-14)
   - Filter persistence on drawer cycle (mirrors D-15)
3. Audit `EntityFilters` rendering for each filter type — confirm all
   supported types render correctly in the voter results modal

## Files of interest

- `tests/tests/specs/voter/voter-results.spec.ts` — extend with new test
  cases per filter type
- `apps/frontend/src/lib/components/entityFilters/` — UI components per
  filter type
- `packages/dev-seed/src/templates/e2e.ts` — extend if seed support is needed
- `packages/filters/src/filter/` — reference for available filter types

## Why deferred

Phase 64's scope is precisely the 5 voter-results residuals + parity-gate
close. Extending coverage to all filter types is additive E2E work that
fits a future test-hygiene phase (potentially paired with the broader
suite-wide skip-path cleanup in `2026-04-27-remove-e2e-skip-modifiers.md`).
