---
phase: 05-configuration-variants
plan: 01
subsystem: testing
tags: [playwright, e2e, dataset-overlay, variant-testing, configuration]

# Dependency graph
requires:
  - phase: 01-infrastructure-foundation
    provides: StrapiAdminClient, testIds, Playwright project dependencies pattern, data.setup/teardown
provides:
  - mergeDatasets utility for base + overlay dataset composition
  - 3 overlay JSON datasets (multi-election, constituency, startfromcg)
  - 3 variant data-setup projects following established patterns
  - 1 shared variant data-teardown project
  - 8 new Playwright config project entries with sequential dependency chains
  - testId constants for elections.continue, constituencies.continue, results.electionAccordion
affects: [05-02, 05-03, 05-04]

# Tech tracking
tech-stack:
  added: []
  patterns: [base+overlay dataset merging with externalId-based update semantics, variant Playwright project chains]

key-files:
  created:
    - tests/tests/utils/mergeDatasets.ts
    - tests/tests/data/overlays/multi-election-overlay.json
    - tests/tests/data/overlays/constituency-overlay.json
    - tests/tests/data/overlays/startfromcg-overlay.json
    - tests/tests/setup/variant-multi-election.setup.ts
    - tests/tests/setup/variant-constituency.setup.ts
    - tests/tests/setup/variant-startfromcg.setup.ts
    - tests/tests/setup/variant-data.teardown.ts
  modified:
    - tests/tests/utils/testIds.ts
    - tests/playwright.config.ts

key-decisions:
  - "Shared base+overlay dataset merging with externalId update semantics for variant composition"
  - "Single shared variant teardown project for all variant setups"
  - "Sequential variant dependency chain: multi-election -> results-sections -> constituency -> startfromcg"
  - "Cross-nominations for existing candidates in multi-election overlay (alpha, beta, gamma appear in both elections)"

patterns-established:
  - "Base+overlay dataset merging: mergeDatasets(mergeDatasets(default, voter), overlay) for composable test data"
  - "Variant setup pattern: delete prefix, merge datasets, import, configure settings"
  - "Variant Playwright project chain: data-setup-X -> variant-X, all sequential after data-teardown"

requirements-completed: [CONF-07, CONF-08]

# Metrics
duration: 4min
completed: 2026-03-09
---

# Phase 5 Plan 01: Variant Infrastructure Summary

**Overlay dataset merge utility, 3 variant JSON overlays (multi-election, constituency, startFromConstituencyGroup), 3 setup projects, shared teardown, and 8 Playwright config entries with sequential dependency chains**

## Performance

- **Duration:** 4 min
- **Started:** 2026-03-09T19:14:01Z
- **Completed:** 2026-03-09T19:18:01Z
- **Tasks:** 2
- **Files modified:** 10

## Accomplishments
- Created mergeDatasets utility that composes base datasets with overlays using externalId-based update semantics
- Built 3 overlay JSON files covering multi-election, hierarchical constituency, and startFromConstituencyGroup with orphan municipality configurations
- Created 3 variant data-setup projects and 1 shared teardown following the established data.setup.ts pattern
- Updated Playwright config with 8 new projects in a sequential dependency chain running after the default suite

## Task Commits

Each task was committed atomically:

1. **Task 1: Create merge utility, overlay datasets, and testId additions** - `6d6bf5b50` (feat)
2. **Task 2: Create variant setup/teardown projects and update Playwright config** - `19baf0989` (feat)

## Files Created/Modified
- `tests/tests/utils/mergeDatasets.ts` - Deep merge utility for base + overlay dataset composition with externalId matching
- `tests/tests/data/overlays/multi-election-overlay.json` - 2nd election with single constituency, 2 scoped questions, 3 new + 3 cross-nominated candidates
- `tests/tests/data/overlays/constituency-overlay.json` - 4 constituencies (2 regions, 2 municipalities) with parent hierarchy, constituency-scoped questions
- `tests/tests/data/overlays/startfromcg-overlay.json` - Like constituency but with orphan municipality for reversed flow edge case
- `tests/tests/setup/variant-multi-election.setup.ts` - Multi-election variant data setup (delete, merge, import, settings)
- `tests/tests/setup/variant-constituency.setup.ts` - Constituency variant data setup
- `tests/tests/setup/variant-startfromcg.setup.ts` - startFromConstituencyGroup variant data setup
- `tests/tests/setup/variant-data.teardown.ts` - Shared teardown for all variant setups
- `tests/tests/utils/testIds.ts` - Added elections.continue, constituencies.continue, results.electionAccordion
- `tests/playwright.config.ts` - Added 8 variant project entries with dependency chains

## Decisions Made
- **Shared variant teardown:** Single `data-teardown-variants` project handles all variant cleanups since all entities use the `test-` prefix
- **Sequential variant chain:** Variants run in order multi-election -> results-sections -> constituency -> startfromcg to avoid concurrent data mutations
- **Cross-nominations:** Multi-election overlay adds election-2 nominations for existing default candidates (alpha, beta, gamma) so they appear in both election results
- **startFromConstituencyGroup setting deferred to spec:** The setting requires a database ID (not externalId), so the spec must query for the constituency group first

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- All variant infrastructure is in place for Plans 02 and 03 to write spec files
- Spec files will be placed in `tests/tests/specs/variants/` directory (referenced by testDir in Playwright config)
- Each variant spec can import overlay data for assertion values (candidate names, question counts, etc.)
- The `startFromConstituencyGroup` setting must be set via API in the spec file after querying for the constituency group database ID

---
*Phase: 05-configuration-variants*
*Completed: 2026-03-09*
