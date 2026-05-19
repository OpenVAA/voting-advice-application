---
phase: 02-candidate-app-coverage
plan: 03
subsystem: testing
tags: [playwright, e2e, candidate-profile, candidate-questions, image-upload, likert, preview, data-persistence]

# Dependency graph
requires:
  - phase: 02-candidate-app-coverage
    plan: 01
    provides: page objects (ProfilePage, QuestionsPage, QuestionPage, PreviewPage, RegisterPage), emailHelper, StrapiAdminClient extensions, fixtures, dataset with unregistered candidate
  - phase: 02-candidate-app-coverage
    plan: 02
    provides: registration email flow patterns, unauthenticated storageState override, PasswordSetter direct testId pattern
provides:
  - candidate-profile.spec.ts covering fresh candidate registration, image upload, all info field types, and data persistence
  - candidate-questions.spec.ts covering Likert answering, commenting, editing, category navigation, data persistence, and preview
affects: []

# Tech tracking
tech-stack:
  added: []
  patterns: [serial-fresh-candidate-profile-flow, input-type-locators-for-untagged-form-fields, candidate-questions-choice-testid-pattern]

key-files:
  created:
    - tests/tests/specs/candidate/candidate-profile.spec.ts
    - tests/tests/specs/candidate/candidate-questions.spec.ts
  modified: []

key-decisions:
  - "Used direct getByTestId for register/password page (same as Plan 02) since RegisterPage page object targets different testIds"
  - "Added explicit login step after registration since registration redirects to login page (not auto-login)"
  - "Used input[type] locators for info question fields on profile page since QuestionInput does not forward testId props to individual inputs"

patterns-established:
  - "Serial fresh-candidate flow: register -> login -> fill profile -> test persistence, all in one serial describe block"
  - "Input type locators for untestid-ed form fields: page.locator('input[type=\"text\"]:not([readonly]):not([disabled])')"
  - "Voter answerOption testId reused for candidate question choices since QuestionChoices is a shared component"

requirements-completed: [CAND-03, CAND-04, CAND-05, CAND-06, CAND-12]

# Metrics
duration: 3min
completed: 2026-03-04
---

# Phase 2 Plan 03: Profile and Questions Specs Summary

**Candidate profile E2E spec with fresh registration flow and opinion questions spec covering Likert answering, editing, category nav, persistence, and preview**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-04T17:51:51Z
- **Completed:** 2026-03-04T17:55:50Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- Created candidate-profile.spec.ts with 4 tests: fresh candidate registration, image upload via filechooser, info field filling (text/number/date/boolean), and data persistence verification
- Created candidate-questions.spec.ts with 6 tests: question card display with categories, Likert answering with comments, category navigation, answer editing, data persistence, and preview page verification
- Reused Plan 02 patterns for registration (direct getByTestId, explicit login after redirect to login page) and shared QuestionChoices testId for Likert choice selection

## Task Commits

Each task was committed atomically:

1. **Task 1: Write candidate-profile.spec.ts (fresh candidate registration, image upload, info fields, persistence)** - `4f6157c8e` (feat)
2. **Task 2: Write candidate-questions.spec.ts (answering, editing, categories, preview)** - `5c0a96e7e` (feat)

## Files Created/Modified
- `tests/tests/specs/candidate/candidate-profile.spec.ts` - Fresh candidate registration, profile image upload, info question fields (all types), data persistence after reload
- `tests/tests/specs/candidate/candidate-questions.spec.ts` - Likert opinion answering, commenting, category navigation, answer editing, data persistence, preview page EntityDetails verification

## Decisions Made
- Used direct `getByTestId` locators for the register/password page instead of `RegisterPage` page object, consistent with Plan 02's finding that the page object targets different testIds (register-submit vs register-password-submit)
- Added explicit login step after registration because the register/password page redirects to the login page on success (not auto-login), matching Plan 02's verified behavior
- Used `input[type]` CSS attribute locators for profile info question fields because `QuestionInput` renders standard `Input` components without forwarding `data-testid` to individual question inputs. This is a pragmatic choice for fields without testIds while still avoiding text-based locators.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Corrected registration flow (no auto-login)**
- **Found during:** Task 1 (candidate-profile.spec.ts)
- **Issue:** Plan suggested `registerPage.setPassword()` and auto-login to candidate home, but per Plan 02's findings, the register/password page uses different testIds and redirects to login page on success
- **Fix:** Used direct getByTestId for register/password fields and added explicit login step after registration redirect
- **Files modified:** tests/tests/specs/candidate/candidate-profile.spec.ts
- **Verification:** TypeScript compilation passes, matches verified Plan 02 patterns
- **Committed in:** 4f6157c8e (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 bug fix)
**Impact on plan:** Fix aligns test with actual frontend behavior. No scope creep.

## Issues Encountered
- No tsconfig.json in tests directory (consistent with Plans 01 and 02). Verified TypeScript compilation using direct `npx tsc --noEmit` with explicit flags.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All 5 candidate spec files now exist: auth, registration, profile, questions, settings
- Complete CAND-01 through CAND-15 coverage across the spec suite
- Phase 2 candidate app E2E test coverage is complete

## Self-Check: PASSED

All 2 files verified present. Both task commits (4f6157c8e, 5c0a96e7e) verified in git log.

---
*Phase: 02-candidate-app-coverage*
*Completed: 2026-03-04*
