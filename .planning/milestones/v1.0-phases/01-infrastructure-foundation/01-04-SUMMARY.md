---
phase: 01-infrastructure-foundation
plan: 04
subsystem: testing
tags: [data-testid, e2e-testing, playwright, svelte, candidate-app]

# Dependency graph
requires: []
provides:
  - data-testid attributes on all interactive elements across 12 candidate auth/public route pages
  - data-testid attributes on PasswordField toggle button and TermsOfUseForm checkbox
  - 46 total testId selectors for E2E test targeting
affects: [01-08, testing, e2e]

# Tech tracking
tech-stack:
  added: []
  patterns: [data-testid on interactive elements for E2E selectors]

key-files:
  created: []
  modified:
    - frontend/src/routes/[[lang=locale]]/candidate/login/+page.svelte
    - frontend/src/routes/[[lang=locale]]/candidate/forgot-password/+page.svelte
    - frontend/src/routes/[[lang=locale]]/candidate/password-reset/+page.svelte
    - frontend/src/routes/[[lang=locale]]/candidate/register/+page.svelte
    - frontend/src/routes/[[lang=locale]]/candidate/register/password/+page.svelte
    - frontend/src/routes/[[lang=locale]]/candidate/help/+page.svelte
    - frontend/src/routes/[[lang=locale]]/candidate/privacy/+page.svelte
    - frontend/src/routes/[[lang=locale]]/candidate/preregister/+page.svelte
    - frontend/src/routes/[[lang=locale]]/candidate/preregister/(authenticated)/email/+page.svelte
    - frontend/src/routes/[[lang=locale]]/candidate/preregister/(authenticated)/elections/+page.svelte
    - frontend/src/routes/[[lang=locale]]/candidate/preregister/(authenticated)/constituencies/+page.svelte
    - frontend/src/routes/[[lang=locale]]/candidate/preregister/status/+page.svelte
    - frontend/src/lib/candidate/components/passwordField/PasswordField.svelte
    - frontend/src/lib/candidate/components/termsOfUse/TermsOfUseForm.svelte

key-decisions:
  - 'Kebab-case testId convention with page-prefix pattern (e.g. login-submit, register-code, preregister-start)'
  - 'Added testIds to component-level interactive elements (PasswordField toggle, TermsOfUseForm checkbox) not just page-level'

patterns-established:
  - 'TestId naming: {page-prefix}-{element-description} for page elements (login-submit, register-code)'
  - 'TestId naming: {component-name}-{element} for reusable components (password-field-toggle, terms-checkbox)'
  - 'Existing testIds preserved as-is even when naming convention differs (login-errorMessage uses camelCase)'

requirements-completed: [INFRA-01]

# Metrics
duration: 4min
completed: 2026-03-03
---

# Phase 1 Plan 4: Candidate Auth & Public Pages TestId Summary

**46 data-testid attributes added across 14 candidate app Svelte files covering login, registration, password reset, preregistration, help, and privacy pages plus PasswordField and TermsOfUseForm components**

## Performance

- **Duration:** 4 min
- **Started:** 2026-03-03T19:58:22Z
- **Completed:** 2026-03-03T20:02:37Z
- **Tasks:** 1
- **Files modified:** 14

## Accomplishments

- Added 42 new data-testid attributes across 12 candidate route pages and 2 candidate-specific components
- Preserved all 4 existing testIds (login-email, login-errorMessage, login-submit, password-field)
- Total of 46 data-testid attributes across all 14 files, covering buttons, inputs, links, error messages, and form controls
- PasswordField toggle reveal button and TermsOfUseForm checkbox now have testIds for E2E targeting

## Task Commits

Each task was committed atomically:

1. **Task 1: Add testIds to candidate auth and public pages plus candidate-specific components** - `ea5dcc10e` (feat)

**Plan metadata:** (pending)

## Files Created/Modified

- `frontend/src/routes/[[lang=locale]]/candidate/login/+page.svelte` - Added login-show, login-preregister, login-register-link, login-forgot-password-link, login-help-link, login-voter-app-link
- `frontend/src/routes/[[lang=locale]]/candidate/forgot-password/+page.svelte` - Added forgot-password-email, forgot-password-submit, forgot-password-success, forgot-password-error, forgot-password-home, forgot-password-return
- `frontend/src/routes/[[lang=locale]]/candidate/password-reset/+page.svelte` - Added password-reset-submit, password-reset-help-link, password-reset-error
- `frontend/src/routes/[[lang=locale]]/candidate/register/+page.svelte` - Added register-code, register-submit, register-login-link, register-help-link, register-error, register-go-to-login
- `frontend/src/routes/[[lang=locale]]/candidate/register/password/+page.svelte` - Added register-password-submit, register-password-help-link, register-password-error
- `frontend/src/routes/[[lang=locale]]/candidate/help/+page.svelte` - Added candidate-help-contact-support, candidate-help-home
- `frontend/src/routes/[[lang=locale]]/candidate/privacy/+page.svelte` - Added candidate-privacy-home
- `frontend/src/routes/[[lang=locale]]/candidate/preregister/+page.svelte` - Added preregister-start, preregister-continue, preregister-return
- `frontend/src/routes/[[lang=locale]]/candidate/preregister/(authenticated)/email/+page.svelte` - Added preregister-email-input, preregister-email-confirm, preregister-email-submit
- `frontend/src/routes/[[lang=locale]]/candidate/preregister/(authenticated)/elections/+page.svelte` - Added preregister-elections-list, preregister-elections-submit
- `frontend/src/routes/[[lang=locale]]/candidate/preregister/(authenticated)/constituencies/+page.svelte` - Added preregister-constituencies-list, preregister-constituencies-submit
- `frontend/src/routes/[[lang=locale]]/candidate/preregister/status/+page.svelte` - Added preregister-status-return, preregister-status-retry, preregister-status-help-link
- `frontend/src/lib/candidate/components/passwordField/PasswordField.svelte` - Added password-field-toggle on reveal/hide button (password-field on input preserved)
- `frontend/src/lib/candidate/components/termsOfUse/TermsOfUseForm.svelte` - Added terms-checkbox on the terms acceptance checkbox

## Decisions Made

- Used kebab-case with page-prefix naming convention for all new testIds (e.g., `login-submit`, `register-code`, `preregister-start`)
- Added testIds to component-level interactive elements (PasswordField toggle button, TermsOfUseForm checkbox) not just page-level elements
- Preserved existing camelCase testId `login-errorMessage` as-is per plan instruction to not rename existing testIds

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- All 12 candidate auth/public route pages and 2 candidate-specific components now have data-testid attributes
- Plan 08 (protected candidate pages) can proceed independently for the remaining 6 candidate route pages
- TestIds are ready for E2E test selectors once testIds.ts constants are defined (Plan 01)

## Self-Check: PASSED

- All 14 modified files exist
- Commit ea5dcc10e verified in git log
- SUMMARY.md exists at expected path
- 46 data-testid attributes across 14 files (exceeds minimum of 20)
- All 4 existing testIds preserved

---

_Phase: 01-infrastructure-foundation_
_Completed: 2026-03-03_
