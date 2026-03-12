---
phase: 05-configuration-variants
plan: 03
subsystem: testing
tags: [playwright, e2e, constituency, hierarchical, startFromConstituencyGroup, variant-testing]

# Dependency graph
requires:
  - phase: 05-configuration-variants
    provides: mergeDatasets utility, constituency overlay JSON, startfromcg overlay JSON, variant setup projects, Playwright project entries
  - phase: 01-infrastructure-foundation
    provides: StrapiAdminClient, testIds, buildRoute, voterNavigation helpers
provides:
  - constituency.spec.ts covering CONF-03 (constituency enabled = selection step in flow)
  - startfromcg.spec.ts covering startFromConstituencyGroup reversed flow with orphan municipality edge case
affects: [05-UAT]

# Tech tracking
tech-stack:
  added: []
  patterns: [serial shared-page constituency selection via native select interaction, StrapiAdminClient.findData for database ID lookup before settings mutation]

key-files:
  created:
    - tests/tests/specs/variants/constituency.spec.ts
    - tests/tests/specs/variants/startfromcg.spec.ts
  modified: []

key-decisions:
  - "Native select interaction for constituency selection (selectOption by label) since SingleGroupConstituencySelector renders <select> elements"
  - "Orphan municipality test completes full journey to verify no runtime crash, not just initial navigation"
  - "findData query for constituency group database ID (documentId) before setting startFromConstituencyGroup"

patterns-established:
  - "Constituency selector interaction: locator('select') within constituency-selector testId, then selectOption({ label })"
  - "Settings mutation with database ID lookup: findData for externalId -> extract documentId -> updateAppSettings"

requirements-completed: [CONF-03]

# Metrics
duration: 2min
completed: 2026-03-09
---

# Phase 5 Plan 03: Constituency and startFromConstituencyGroup Variant Specs Summary

**Constituency selection E2E tests covering hierarchical constituency implication, multi-election+constituency combined flow, and startFromConstituencyGroup reversed flow with orphan municipality edge case**

## Performance

- **Duration:** 2 min
- **Started:** 2026-03-09T19:22:32Z
- **Completed:** 2026-03-09T19:24:32Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- Created constituency.spec.ts with 5 tests covering the full voter journey when elections have multiple constituencies requiring explicit selection
- Created startfromcg.spec.ts with 4 tests covering the reversed flow where constituencies are selected before elections, including orphan municipality edge case
- Both specs use serial mode with shared page state, dynamic question answering loops, and URL-change detection patterns established in earlier phases

## Task Commits

Each task was committed atomically:

1. **Task 1: Create constituency variant spec** - `7910f810c` (feat)
2. **Task 2: Create startFromConstituencyGroup variant spec** - `b4c1fb9ed` (feat)

## Files Created/Modified
- `tests/tests/specs/variants/constituency.spec.ts` - 5 tests: constituency page after elections, constituency selection interaction, question journey, election accordion, constituency-filtered results
- `tests/tests/specs/variants/startfromcg.spec.ts` - 4 tests: reversed flow constituency-first, election after constituency, full journey, orphan municipality without errors

## Decisions Made
- **Native select interaction:** ConstituencySelector renders SingleGroupConstituencySelector which uses Select component with native `<select>` elements. Used `selectOption({ label })` for reliable constituency selection by display name.
- **Full journey for orphan test:** The orphan municipality test navigates through the complete flow (constituency -> elections -> questions -> results) to verify no runtime errors anywhere in the chain, not just at the initial redirect.
- **Database ID lookup pattern:** The startFromConstituencyGroup setting requires a database ID (not externalId), so the spec uses `client.findData('constituency-groups', { externalId: { $eq: 'test-cg-municipalities' } })` in beforeAll to get the documentId.
- **Complete sibling settings:** Both beforeAll and afterAll in startfromcg spec include all sibling settings (elections, questions, results, entities, notifications, analytics) to avoid Strapi overwrite pitfall.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- All constituency configuration scenarios are now covered by E2E tests
- Phase 5 Plans 01 (infrastructure), 02 (multi-election/results-sections), and 03 (constituency/startfromcg) complete the variant test suite
- Ready for Phase 5 UAT verification

## Self-Check: PASSED

All files exist and all commits verified:
- tests/tests/specs/variants/constituency.spec.ts: FOUND
- tests/tests/specs/variants/startfromcg.spec.ts: FOUND
- 05-03-SUMMARY.md: FOUND
- Commit 7910f810c: FOUND
- Commit b4c1fb9ed: FOUND

---
*Phase: 05-configuration-variants*
*Completed: 2026-03-09*
