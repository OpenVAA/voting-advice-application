---
phase: 02-candidate-app-coverage
plan: 04
subsystem: testing
tags: [playwright, e2e, app-modes, maintenance, notifications, settings, visibility]

# Dependency graph
requires:
  - phase: 01-infrastructure-foundation
    provides: testIds constants, fixture index, StrapiAdminClient with updateAppSettings
  - phase: 02-candidate-app-coverage
    plan: 01
    provides: StrapiAdminClient.updateAppSettings method, page objects, dataset
provides:
  - E2E tests for all candidate app modes (locked, disabled, maintenance)
  - E2E tests for candidate notification popup display
  - E2E tests for help and privacy page rendering
  - E2E tests for question visibility settings (hideVideo, hideHero)
  - Clean Playwright config with legacy spec files removed
affects: []

# Tech tracking
tech-stack:
  added: []
  patterns: [settings-toggle-with-cleanup, complete-access-object-update, dialog-role-notification-assertion]

key-files:
  created:
    - tests/tests/specs/candidate/candidate-settings.spec.ts
  modified:
    - tests/playwright.config.ts
  deleted:
    - tests/tests/candidateApp-basics.spec.ts
    - tests/tests/candidateApp-advanced.spec.ts
    - tests/tests/translations.spec.ts

key-decisions:
  - "Used role=dialog assertion for notification popup since Alert component renders with role=dialog"
  - "Used getByText inside dialog for content verification (acceptable per plan: text checks OK for verification, not targeting)"
  - "Verified hero visibility via overflow-hidden class presence inside figure[role=presentation] rather than adding testIds"

patterns-established:
  - "Settings toggle with cleanup: each describe block owns StrapiAdminClient, restores defaults in afterAll"
  - "Complete access object: always send full {candidateApp, voterApp, underMaintenance, answersLocked} to avoid Pitfall 2"
  - "MaintenancePage detection: check absence of normal content testIds + presence of h1 and main elements"

requirements-completed: [CAND-09, CAND-10, CAND-11, CAND-13, CAND-14, CAND-15]

# Metrics
duration: 4min
completed: 2026-03-04
---

# Phase 2 Plan 04: Candidate Settings and App Modes Summary

**E2E spec covering all app modes (locked, disabled, maintenance), notification popup, help/privacy pages, and question visibility settings with legacy spec cleanup**

## Performance

- **Duration:** 4 min
- **Started:** 2026-03-04T17:44:05Z
- **Completed:** 2026-03-04T17:48:18Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments
- Created candidate-settings.spec.ts with 304 lines covering CAND-09 through CAND-15
- Each app mode test (locked, disabled, maintenance) sends complete access objects and restores defaults in afterAll
- Notification test verifies Alert dialog appearance with correct title and content text
- Help and privacy pages verified via their dedicated data-testid attributes
- Question visibility tests toggle hideHero and verify Hero component presence/absence
- Deleted 3 legacy spec files (612 lines removed) and cleaned testIgnore to only exclude vitest files

## Task Commits

Each task was committed atomically:

1. **Task 1: Write candidate-settings.spec.ts** - `ea875de4c` (feat)
2. **Task 2: Delete legacy spec files and clean testIgnore** - `02fd57af6` (chore)

## Files Created/Modified
- `tests/tests/specs/candidate/candidate-settings.spec.ts` - 6 describe blocks covering app modes, notifications, help/privacy, visibility settings
- `tests/playwright.config.ts` - testIgnore cleaned to only `['**/*.test.ts']`
- `tests/tests/candidateApp-basics.spec.ts` - DELETED (replaced by new Phase 2 specs)
- `tests/tests/candidateApp-advanced.spec.ts` - DELETED (replaced by new Phase 2 specs)
- `tests/tests/translations.spec.ts` - DELETED (locale testing deferred to ADV-02)

## Decisions Made
- Used `role="dialog"` assertion for notification popup detection since the Alert component renders `<div role="dialog">` when it has action buttons
- Used `getByText` inside the dialog element for content verification assertions (not for element targeting) -- consistent with plan guidance
- Verified hero visibility via the presence of `.overflow-hidden` class inside `figure[role="presentation"]` rather than adding new testIds, since the Hero component uses this class

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
- TypeScript compilation of `playwright.config.ts` itself shows pre-existing ESM/esModuleInterop errors (not introduced by our changes). The config file works correctly at runtime via Playwright's own TypeScript handling. The spec file itself compiles cleanly with `tsc --noEmit`.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All candidate app settings and app mode tests are in place
- Legacy spec migration is complete -- no more legacy files exist
- Playwright config is clean with only vitest file exclusion in testIgnore
- Phase 2 candidate app E2E coverage is now complete (all CAND-01 through CAND-15 addressed across plans 01-04)

## Self-Check: PASSED

All 2 created files verified present. Both deleted files confirmed absent. Both task commits (ea875de4c, 02fd57af6) verified in git log.

---
*Phase: 02-candidate-app-coverage*
*Completed: 2026-03-04*
