---
phase: 01-infrastructure-foundation
plan: 10
subsystem: testing
tags: [playwright, data-testid, svelte, e2e-testing]

# Dependency graph
requires:
  - phase: 01-infrastructure-foundation
    provides: testIds.ts constants and initial component instrumentation (plans 01-03, 01-04, 01-07, 01-08, 01-09)
provides:
  - All testIds.ts constants now have matching data-testid attributes in the DOM
  - Voter results page section-level testIds for candidate/party result sections
  - EntityDetails content-level testIds for info, opinions, and submatches tabs
  - Candidate navigation per-item testIds for home, profile, questions, settings, preview
  - Voter navigation results link testId
  - PasswordSetter passwordTestId/confirmPasswordTestId props for page-specific test targeting
affects: [phase-02, phase-03, voter-e2e, candidate-e2e]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - PasswordSetter testId prop forwarding for shared component page-specific targeting
    - Dynamic data-testid based on active entity type for tab-switched content

key-files:
  created: []
  modified:
    - tests/tests/utils/testIds.ts
    - frontend/src/routes/[[lang=locale]]/(voters)/(located)/results/+page.svelte
    - frontend/src/lib/dynamic-components/entityDetails/EntityDetails.svelte
    - frontend/src/lib/dynamic-components/navigation/candidate/CandidateNav.svelte
    - frontend/src/lib/dynamic-components/navigation/voter/VoterNav.svelte
    - frontend/src/routes/[[lang=locale]]/candidate/register/password/+page.svelte
    - frontend/src/lib/candidate/components/passwordSetter/PasswordSetter.svelte
    - frontend/src/lib/candidate/components/passwordSetter/PasswordSetter.type.ts
    - frontend/src/routes/[[lang=locale]]/candidate/(protected)/settings/+page.svelte

key-decisions:
  - 'Dynamic section testId on results page based on activeEntityType rather than static wrappers'
  - 'Removed orphaned testIds (voter.results.score, candidate.nav.menu, candidate.nav.logout) instead of adding unreachable DOM elements'
  - 'PasswordSetter testId props (passwordTestId, confirmPasswordTestId) instead of modifying PasswordField component'
  - 'Renamed voter.constituencies.item to voter.constituencies.selector matching existing constituency-selector DOM element'

patterns-established:
  - 'Optional testId prop forwarding: shared components accept optional testId props to allow page-specific data-testid values'
  - 'NavItem data-testid override via restProps: parent-passed data-testid overrides NavItem default nav-menu-item'

requirements-completed: [INFRA-01, INFRA-02, INFRA-03, INFRA-04, INFRA-05, INFRA-06, INFRA-07, INFRA-08, INFRA-09]

# Metrics
duration: 3min
completed: 2026-03-04
---

# Phase 1 Plan 10: Missing TestId Wiring Summary

**Wired 18 orphaned testIds.ts constants to DOM elements across voter results, entity details, candidate/voter navigation, password registration, and settings components**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-04T07:50:22Z
- **Completed:** 2026-03-04T07:53:22Z
- **Tasks:** 2
- **Files modified:** 9

## Accomplishments

- All testIds.ts constants now have matching data-testid attributes in the DOM (zero orphaned constants remain)
- Voter results page has dynamic section testIds (candidate-section / party-section) based on active entity type
- EntityDetails tabs have content-level testIds for info, opinions, and submatches sections
- Candidate navigation items individually identifiable via data-testid (home, profile, questions, settings, preview)
- PasswordSetter component now accepts optional testId props for page-specific test targeting
- Cleaned up 3 orphaned testIds.ts constants that had no corresponding DOM element and no planned one

## Task Commits

Each task was committed atomically:

1. **Task 1: Add missing testIds to voter results, entity details, and navigation** - `268aa2350` (feat)
2. **Task 2: Add testIds to registration, settings, and constituency components** - `99fbcf3b7` (feat)

## Files Created/Modified

- `tests/tests/utils/testIds.ts` - Removed 3 orphaned constants (score, nav.menu, nav.logout); renamed constituencies.item to constituencies.selector
- `frontend/src/routes/[[lang=locale]]/(voters)/(located)/results/+page.svelte` - Added section-level testId wrapper with dynamic value based on activeEntityType
- `frontend/src/lib/dynamic-components/entityDetails/EntityDetails.svelte` - Wrapped info/opinions/candidates content with testId divs
- `frontend/src/lib/dynamic-components/navigation/candidate/CandidateNav.svelte` - Added data-testid to 5 NavItem components (home, profile, questions, preview, settings)
- `frontend/src/lib/dynamic-components/navigation/voter/VoterNav.svelte` - Added data-testid="voter-nav-results" to Results NavItem
- `frontend/src/routes/[[lang=locale]]/candidate/register/password/+page.svelte` - Passes passwordTestId/confirmPasswordTestId to PasswordSetter
- `frontend/src/lib/candidate/components/passwordSetter/PasswordSetter.svelte` - Added optional passwordTestId/confirmPasswordTestId props with wrapper divs
- `frontend/src/lib/candidate/components/passwordSetter/PasswordSetter.type.ts` - Added passwordTestId/confirmPasswordTestId to type definition
- `frontend/src/routes/[[lang=locale]]/candidate/(protected)/settings/+page.svelte` - Passes confirmPasswordTestId to PasswordSetter

## Decisions Made

1. **Dynamic section testId on results page** - Used conditional testId based on activeEntityType rather than separate static wrappers, since only one entity list is visible at a time (tab-switched).
2. **Removed orphaned testIds** - voter.results.score (Phase 3 concern, requires EntityCard internals), candidate.nav.menu (shared Navigation.svelte already has nav-menu), candidate.nav.logout (no logout NavItem exists in CandidateNav) were removed rather than forcing DOM elements that don't exist.
3. **PasswordSetter testId props** - Added optional passwordTestId and confirmPasswordTestId props rather than modifying the shared PasswordField component, allowing page-specific testId values while keeping PasswordField generic.
4. **Constituency selector mapping** - Renamed voter.constituencies.item to voter.constituencies.selector = 'constituency-selector' matching the existing DOM element in ConstituencySelector.svelte, since native <select>/<option> elements don't support per-item testId targeting in a useful way.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Phase 1 infrastructure foundation is complete - all 10 plans executed
- All testIds.ts constants are wired to DOM elements, providing reliable E2E test selectors
- Page objects, fixtures, data lifecycle utilities, and test configuration are ready for Phase 2+ test authoring
- No blockers for subsequent phases

## Self-Check: PASSED

All 9 modified files verified to exist. Both task commits (268aa2350, 99fbcf3b7) verified in git log.

---

_Phase: 01-infrastructure-foundation_
_Completed: 2026-03-04_
