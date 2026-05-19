---
phase: 04-voter-app-settings-and-edge-cases
plan: 05
subsystem: testing
tags: [playwright, e2e, voter-app, nominations, null-safety, entityCard]

# Dependency graph
requires:
  - phase: 04-voter-app-settings-and-edge-cases
    provides: testIds for nominations pages and voter-static-pages spec (plan 03)
provides:
  - Fixed nominations E2E test that finds voter-nominations-container and entity cards
  - Null safety fixes for EntityCard.svelte and entityCards.ts cardContents access
affects: []

# Tech tracking
tech-stack:
  added: []
  patterns: [null safety for appSettings.results.cardContents across all access sites]

key-files:
  created: []
  modified:
    - tests/tests/specs/voter/voter-static-pages.spec.ts
    - frontend/src/lib/dynamic-components/entityCard/EntityCard.svelte
    - frontend/src/lib/utils/entityCards.ts

key-decisions:
  - "Root cause was null cardContents crashing EntityCard rendering, not settings mutation or data loading"
  - "Applied null safety (optional chaining + nullish coalescing) to all cardContents access sites"
  - "Added complete sibling settings to all updateAppSettings calls per Pitfall 2 rule"

patterns-established:
  - "cardContents null safety: always use ?. or ?? [] when accessing appSettings.results.cardContents[type]"

requirements-completed: [VOTE-19]

# Metrics
duration: 23min
completed: 2026-03-09
---

# Phase 4 Plan 5: Fix Nominations Test Summary

**Fixed nominations E2E test by adding null safety to EntityCard and entityCards.ts cardContents access, plus complete sibling settings in all updateAppSettings calls**

## Performance

- **Duration:** 23 min
- **Started:** 2026-03-09T07:20:09Z
- **Completed:** 2026-03-09T07:43:00Z
- **Tasks:** 1
- **Files modified:** 3

## Accomplishments
- Nominations "when enabled" test now finds voter-nominations-container and renders entity cards with count > 0
- Nominations "when disabled" test confirms redirect to home page
- Static pages (about, info, privacy) continue to pass unchanged
- All 5 tests in voter-static-pages.spec.ts pass

## Task Commits

Each task was committed atomically:

1. **Task 1: Fix nominations test data loading and assertions** - `5a43998f9` (fix)

**Plan metadata:** pending

## Files Created/Modified
- `tests/tests/specs/voter/voter-static-pages.spec.ts` - Added serial mode, complete sibling settings in updateAppSettings, networkidle wait, increased timeout
- `frontend/src/lib/dynamic-components/entityCard/EntityCard.svelte` - Added null safety to cardContents[type]?.includes() calls
- `frontend/src/lib/utils/entityCards.ts` - Added null safety to cardContents[type] ?? [] in getCardQuestions

## Decisions Made
- Root cause was NOT settings mutation or data loading timing -- it was EntityCard.svelte crashing on null cardContents values during rendering, which caused Svelte HMR to mark the component as broken
- Applied optional chaining (?.) and nullish coalescing (?? false, ?? []) to all cardContents access sites to prevent null reference errors
- Added complete sibling settings (questions + entities) to all updateAppSettings calls to follow Pitfall 2 rule consistently

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed null cardContents crash in EntityCard.svelte**
- **Found during:** Task 1 (nominations test debugging)
- **Issue:** EntityCard.svelte line 117 called `.includes('submatches')` on potentially null `cardContents[type]`, crashing the component rendering and preventing the nominations page from displaying
- **Fix:** Added optional chaining: `cardContents[type]?.includes('submatches') ?? false` and `cardContents.organization?.includes('candidates')`
- **Files modified:** frontend/src/lib/dynamic-components/entityCard/EntityCard.svelte
- **Verification:** Nominations page renders with entity cards after fix
- **Committed in:** 5a43998f9 (Task 1 commit)

**2. [Rule 1 - Bug] Fixed null cardContents crash in entityCards.ts**
- **Found during:** Task 1 (nominations test debugging)
- **Issue:** getCardQuestions() called `.filter()` on potentially null `cardContents[type]`, throwing "Cannot read properties of null (reading 'filter')"
- **Fix:** Added nullish coalescing: `(cardContents[type] ?? []).filter(isQuestion)`
- **Files modified:** frontend/src/lib/utils/entityCards.ts
- **Verification:** Nominations page renders without JavaScript errors
- **Committed in:** 5a43998f9 (Task 1 commit)

---

**Total deviations:** 2 auto-fixed (2 bugs - same null safety pattern as voterContext.ts fix)
**Impact on plan:** Both auto-fixes were necessary for the nominations page to render at all. The plan's prescribed changes (settings, timing, serial mode) were also applied but the root cause was the null cardContents bug, not settings mutation.

## Issues Encountered
- Initial diagnosis required extensive debugging to identify the true root cause. The plan suggested settings mutation and data loading timing as causes, but the actual issue was a JavaScript runtime error in EntityCard preventing component rendering. The Svelte HMR error message ("Unrecoverable HMR error in EntityCard") was the key clue, and capturing browser pageerror events revealed the specific TypeError.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- voter-static-pages.spec.ts fully passing (5/5 tests)
- Plan 04-04 (voter-settings and voter-popups fixes) still needed for remaining UAT gaps
- EntityCard null safety fix benefits all pages that render entity cards

## Self-Check: PASSED

- FOUND: tests/tests/specs/voter/voter-static-pages.spec.ts
- FOUND: frontend/src/lib/dynamic-components/entityCard/EntityCard.svelte
- FOUND: frontend/src/lib/utils/entityCards.ts
- FOUND: commit 5a43998f9

---
*Phase: 04-voter-app-settings-and-edge-cases*
*Completed: 2026-03-09*
