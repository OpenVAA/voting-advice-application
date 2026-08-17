---
phase: 01-infrastructure-foundation
plan: 08
subsystem: testing
tags: [data-testid, playwright, svelte, candidate-app, e2e]

# Dependency graph
requires:
  - phase: 01-infrastructure-foundation
    provides: Shared component testIds from Plan 07
provides:
  - data-testid attributes on all interactive elements in 6 candidate protected pages
  - profile-submit renamed testId (was submitButton)
affects: [02-playwright-tests, candidate-app-e2e]

# Tech tracking
tech-stack:
  added: []
  patterns: [kebab-case testId naming with page-scoped prefix]

key-files:
  created: []
  modified:
    - frontend/src/routes/[[lang=locale]]/candidate/(protected)/+page.svelte
    - frontend/src/routes/[[lang=locale]]/candidate/(protected)/profile/+page.svelte
    - frontend/src/routes/[[lang=locale]]/candidate/(protected)/questions/+page.svelte
    - frontend/src/routes/[[lang=locale]]/candidate/(protected)/questions/[questionId]/+page.svelte
    - frontend/src/routes/[[lang=locale]]/candidate/(protected)/settings/+page.svelte
    - frontend/src/routes/[[lang=locale]]/candidate/(protected)/preview/+page.svelte

key-decisions:
  - 'Wrapper div testIds for settings password sections since PasswordField/PasswordSetter components have hardcoded testIds'
  - "data-testid on wrapping div for preview container since SingleCardContent doesn't expose restProps"

patterns-established:
  - 'candidate-home-* prefix for candidate home/dashboard page testIds'
  - 'profile-* prefix for profile page testIds'
  - 'candidate-questions-* prefix for questions list page testIds'
  - 'candidate-question-* prefix (singular) for single question page testIds'
  - 'settings-* prefix for settings page testIds'
  - 'candidate-preview-* prefix for preview page testIds'

requirements-completed: [INFRA-01]

# Metrics
duration: 5min
completed: 2026-03-03
---

# Phase 1 Plan 8: Candidate Protected Pages TestIds Summary

**31 data-testid attributes added across 6 candidate protected pages with submitButton renamed to profile-submit**

## Performance

- **Duration:** 5 min
- **Started:** 2026-03-03T19:58:31Z
- **Completed:** 2026-03-03T20:04:01Z
- **Tasks:** 1
- **Files modified:** 6

## Accomplishments

- Added 31 data-testid attributes across all 6 candidate protected page routes
- Renamed existing `submitButton` testId to `profile-submit` on profile page per kebab-case convention
- All interactive elements (buttons, inputs, containers, status areas) now selectable via data-testid
- Settings page has testIds on all password-related sections and buttons

## Task Commits

Each task was committed atomically:

1. **Task 1: Add testIds to candidate protected pages and rename profile submitButton** - `4fefff473` (feat)

**Plan metadata:** `0b74ab657` (docs: complete plan)

## Files Created/Modified

- `frontend/src/routes/[[lang=locale]]/candidate/(protected)/+page.svelte` - Home page: 7 testIds (status, tip, profile, questions, preview, continue, logout)
- `frontend/src/routes/[[lang=locale]]/candidate/(protected)/profile/+page.svelte` - Profile page: 6 testIds (first-name, last-name, image-upload, submit renamed, cancel, return)
- `frontend/src/routes/[[lang=locale]]/candidate/(protected)/questions/+page.svelte` - Questions list: 6 testIds (start, progress, continue, list, card, home)
- `frontend/src/routes/[[lang=locale]]/candidate/(protected)/questions/[questionId]/+page.svelte` - Single question: 5 testIds (answer, comment, save, cancel, return)
- `frontend/src/routes/[[lang=locale]]/candidate/(protected)/settings/+page.svelte` - Settings: 6 testIds (email, current-password, new-password, update-password, contact-support, return)
- `frontend/src/routes/[[lang=locale]]/candidate/(protected)/preview/+page.svelte` - Preview: 1 testId (container)

## Decisions Made

- Used wrapper div testIds for settings password sections because PasswordField component has a hardcoded `data-testid="password-field"` and doesn't accept custom testId via props
- Added a wrapper div with `data-testid="candidate-preview-container"` around the preview content since SingleCardContent doesn't expose restProps
- Used singular `candidate-question-*` prefix for single question page vs plural `candidate-questions-*` for list page to distinguish between the two

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

A linter/formatter runs automatically after edits, reformatting the Svelte files. This caused one edit attempt to fail because the old_string didn't match the post-format content. Re-reading the file and re-applying the edit resolved this immediately.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- All candidate protected pages now have data-testid attributes for E2E test selectors
- Combined with Plans 04-07 (public candidate pages, voter pages, shared components), the full testId infrastructure is in place
- Ready for page object model creation and E2E test writing in Phase 2

---

_Phase: 01-infrastructure-foundation_
_Completed: 2026-03-03_
