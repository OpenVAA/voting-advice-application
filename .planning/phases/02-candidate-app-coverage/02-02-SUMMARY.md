---
phase: 02-candidate-app-coverage
plan: 02
subsystem: testing
tags: [playwright, e2e, candidate-auth, login, logout, password-change, registration, password-reset, ses-email]

# Dependency graph
requires:
  - phase: 02-candidate-app-coverage
    plan: 01
    provides: page objects (LoginPage, HomePage, SettingsPage, RegisterPage, ForgotPasswordPage), emailHelper, StrapiAdminClient extensions, fixtures, dataset with unregistered candidate
provides:
  - candidate-auth.spec.ts covering login, logout, password change E2E flows
  - candidate-registration.spec.ts covering email registration and password reset E2E flows
affects: [02-03, 02-04]

# Tech tracking
tech-stack:
  added: []
  patterns: [serial-describe-for-dependent-steps, unauthenticated-storageState-override, ses-email-polling-with-expect-poll, password-restoration-after-change-tests]

key-files:
  created:
    - tests/tests/specs/candidate/candidate-auth.spec.ts
    - tests/tests/specs/candidate/candidate-registration.spec.ts
  modified: []

key-decisions:
  - "Used direct getByTestId locators for register/password and password-reset pages instead of page objects due to testId mismatches between page objects and actual page elements"
  - "Handled logout modal confirmation with try-catch fallback using role-based button locator for the modal's secondary logout button"
  - "Used getByTestId('password-field').first()/nth(1) pattern for password-reset page where PasswordSetter has no explicit testIds"

patterns-established:
  - "Unauthenticated spec pattern: test.use({ storageState: { cookies: [], origins: [] } }) at file level"
  - "Password restoration: every test that changes passwords restores the original at the end to not break auth-setup"
  - "SES email polling: expect.poll with intervals [1000, 2000, 3000] and 15s timeout for email arrival"
  - "PasswordSetter interaction: target password-field testId within wrapper div testId using chained getByTestId"

requirements-completed: [CAND-01, CAND-02, CAND-07, CAND-08]

# Metrics
duration: 3min
completed: 2026-03-04
---

# Phase 2 Plan 02: Auth and Registration Specs Summary

**Candidate auth E2E tests covering login/logout/password-change and registration/password-reset flows with SES email verification and password restoration**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-04T17:42:32Z
- **Completed:** 2026-03-04T17:46:11Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- Created candidate-auth.spec.ts with 4 tests covering valid login, invalid login error, logout with modal handling, and password change with restoration
- Created candidate-registration.spec.ts with 3 tests covering registration email send/extract, registration completion via email link, and password reset via SES email flow
- Established patterns for unauthenticated browser context, serial test execution for dependent steps, and SES email polling

## Task Commits

Each task was committed atomically:

1. **Task 1: Write candidate-auth.spec.ts (login, logout, password change)** - `fdd7ab9b0` (feat)
2. **Task 2: Write candidate-registration.spec.ts (email registration, password reset)** - `d969fa602` (feat)

## Files Created/Modified
- `tests/tests/specs/candidate/candidate-auth.spec.ts` - Login (valid/invalid), logout, and password change E2E tests with password restoration
- `tests/tests/specs/candidate/candidate-registration.spec.ts` - Registration email flow and password reset flow with SES email verification

## Decisions Made
- Used direct `getByTestId` locators for the register/password page (`register-password`, `register-confirm-password`, `register-password-submit`) and password-reset page (`password-field` with nth() indexing, `password-reset-submit`) instead of RegisterPage page object, because the page object's `submitButton` targets `register-submit` which is on the registration code entry page, not the password-setting page
- Handled logout modal confirmation by using a try-catch pattern: first attempt direct logout navigation, then if a modal appears (due to unanswered questions), find and click the modal's logout button using role-based locator
- Used `page.getByTestId('password-field').first()/nth(1)` for password-reset page fields since PasswordSetter on that page has no explicit passwordTestId/confirmPasswordTestId props

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Corrected register/password page submit button testId**
- **Found during:** Task 2 (candidate-registration.spec.ts)
- **Issue:** Plan suggested using `registerPage.setPassword()` which clicks `register-submit`, but the register/password page's submit button has `register-password-submit` testId. `register-submit` is on the separate code entry page.
- **Fix:** Used direct `page.getByTestId('register-password-submit')` instead of registerPage fixture
- **Files modified:** tests/tests/specs/candidate/candidate-registration.spec.ts
- **Verification:** TypeScript compilation passes
- **Committed in:** d969fa602 (Task 2 commit)

**2. [Rule 1 - Bug] Corrected registration flow expectation (no auto-login)**
- **Found during:** Task 2 (candidate-registration.spec.ts)
- **Issue:** Plan suggested registration completes with auto-login to home page, but actual register/password page redirects to login page on success (via `goto($getRoute('CandAppLogin'))`)
- **Fix:** Changed assertion to expect login page redirect, then added explicit login step to verify the newly set password works
- **Files modified:** tests/tests/specs/candidate/candidate-registration.spec.ts
- **Verification:** Matches actual frontend code behavior
- **Committed in:** d969fa602 (Task 2 commit)

---

**Total deviations:** 2 auto-fixed (2 bug fixes)
**Impact on plan:** Both fixes align tests with actual frontend behavior. No scope creep.

## Issues Encountered
- No tsconfig.json in tests directory (same as Plan 01). Verified TypeScript compilation using direct `npx tsc --noEmit` with explicit flags instead of `--project tests/tsconfig.json`.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Auth and registration spec patterns established for downstream plans
- Plans 02-03 and 02-04 can now build on these patterns for profile, questions, settings, and mode-switching specs
- Password restoration pattern (restore original after each change test) ensures auth-setup remains stable

## Self-Check: PASSED

All 2 files verified present. Both task commits (fdd7ab9b0, d969fa602) verified in git log.

---
*Phase: 02-candidate-app-coverage*
*Completed: 2026-03-04*
