---
phase: 04-voter-app-settings-and-edge-cases
plan: 01
subsystem: testing
tags: [playwright, e2e, voter-settings, testids, category-selection, category-intros, minimum-answers]

# Dependency graph
requires:
  - phase: 01-infrastructure-foundation
    provides: testIds pattern, StrapiAdminClient, Playwright project dependencies
  - phase: 03-voter-app-core-journey
    provides: voter journey fixtures, voter page objects, data setup with settings defaults
provides:
  - 16 new testId constants for Phase 4 voter features
  - Banner.svelte results button data-testid for VOTE-17
  - voter-settings.spec.ts with 5 describe blocks covering settings-toggled voter features
affects: [04-02, 04-03, voter-popups, voter-static-pages]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Settings toggle per describe block with beforeAll/afterAll for voter specs
    - Progressive answer counting for threshold boundary testing
    - Category checkbox manipulation for filtered question flow testing

key-files:
  created:
    - tests/tests/specs/voter/voter-settings.spec.ts
  modified:
    - tests/tests/utils/testIds.ts
    - frontend/src/routes/[[lang=locale]]/Banner.svelte

key-decisions:
  - "Complete sibling settings in every updateAppSettings call to avoid Pitfall 2 (overwrite, not merge)"
  - "Category checkbox deselect-all-then-select-one pattern for deterministic category filtering tests"

patterns-established:
  - "Voter settings spec pattern: per-describe StrapiAdminClient with settings enable/restore lifecycle"
  - "Banner results button testId: voter-banner-results for header results link testing"

requirements-completed: [VOTE-04, VOTE-05, VOTE-07, VOTE-13, VOTE-17]

# Metrics
duration: 3min
completed: 2026-03-08
---

# Phase 04 Plan 01: TestId Infrastructure + Voter Settings Spec Summary

**16 new testId constants and voter-settings.spec.ts covering category selection, category/question intros, minimum answers threshold, and results link visibility**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-08T18:50:55Z
- **Completed:** 2026-03-08T18:54:33Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments
- Extended testIds.ts with 16 new entries across 7 voter sections (questions, about, info, privacy, nominations, results, banner)
- Added data-testid="voter-banner-results" to Banner.svelte results Button for VOTE-17 testing
- Created voter-settings.spec.ts (461 lines) with 5 self-contained describe blocks covering VOTE-04, VOTE-05, VOTE-07, VOTE-13, VOTE-17

## Task Commits

Each task was committed atomically:

1. **Task 1: Add Phase 4 testIds to testIds.ts and data-testid to Banner.svelte** - `3ac654d61` (feat)
2. **Task 2: Write voter-settings.spec.ts** - `56aaf1b36` (feat)

**Plan metadata:** committed with SUMMARY.md (docs: complete plan)

## Files Created/Modified
- `tests/tests/utils/testIds.ts` - Added 16 new testId entries for Phase 4 voter features
- `frontend/src/routes/[[lang=locale]]/Banner.svelte` - Added data-testid="voter-banner-results" to results Button
- `tests/tests/specs/voter/voter-settings.spec.ts` - E2E spec with 5 describe blocks for settings-driven voter features

## Decisions Made
- Complete sibling settings in every updateAppSettings call (e.g., always send both questionsIntro and categoryIntros together) to avoid Pitfall 2 where partial updates clear adjacent settings
- Category checkbox deselect-all-then-select-one pattern ensures deterministic test behavior regardless of default checkbox state

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- testIds.ts now has all entries needed for Phase 4 plans 02 and 03
- Banner.svelte testId enables VOTE-17 testing in this plan and future assertions
- voter-settings.spec.ts pattern (settings toggle per describe block) can be replicated in voter-popups.spec.ts

## Self-Check: PASSED

All files exist. All commits verified.

---
*Phase: 04-voter-app-settings-and-edge-cases*
*Completed: 2026-03-08*
