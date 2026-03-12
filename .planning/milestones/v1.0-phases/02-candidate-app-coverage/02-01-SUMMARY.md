---
phase: 02-candidate-app-coverage
plan: 01
subsystem: testing
tags: [playwright, page-objects, e2e, ses, mailparser, cheerio, strapi-admin]

# Dependency graph
requires:
  - phase: 01-infrastructure-foundation
    provides: testIds constants, LoginPage/HomePage patterns, StrapiAdminClient base, fixture index, default dataset
provides:
  - 7 candidate page objects (ProfilePage, QuestionsPage, QuestionPage, SettingsPage, PreviewPage, RegisterPage, ForgotPasswordPage)
  - emailHelper utility for SES email fetch/parse/link extraction
  - Extended StrapiAdminClient with updateAppSettings, sendEmail, sendForgotPassword, setPassword
  - Extended dataset with unregistered candidate and text/boolean/image info questions
  - Fixture index with all 9 page objects registered
affects: [02-02, 02-03, 02-04]

# Tech tracking
tech-stack:
  added: [cheerio, mailparser]
  patterns: [page-object-per-candidate-route, ses-email-verification, admin-api-extension]

key-files:
  created:
    - tests/tests/utils/emailHelper.ts
    - tests/tests/pages/candidate/ProfilePage.ts
    - tests/tests/pages/candidate/QuestionsPage.ts
    - tests/tests/pages/candidate/QuestionPage.ts
    - tests/tests/pages/candidate/SettingsPage.ts
    - tests/tests/pages/candidate/PreviewPage.ts
    - tests/tests/pages/candidate/RegisterPage.ts
    - tests/tests/pages/candidate/ForgotPasswordPage.ts
  modified:
    - tests/tests/utils/strapiAdminClient.ts
    - tests/tests/data/default-dataset.json
    - tests/tests/fixtures/index.ts

key-decisions:
  - "Used || instead of ?? for mailparser html field to handle false return type"
  - "Renamed voter questionsPage fixture to voterQuestionsPage for candidate/voter disambiguation"
  - "content-manager admin API receives parsed JSON (data param) while Admin Tools receives JSON.stringify"

patterns-established:
  - "Page object per candidate route: constructor with Page, readonly Locators from testIds, async action methods"
  - "Fixture naming: candidateQuestionsPage vs voterQuestionsPage for cross-app disambiguation"
  - "SES email verification: fetchEmails -> parse with mailparser -> extract links with cheerio"

requirements-completed: [CAND-03, CAND-04, CAND-07, CAND-08]

# Metrics
duration: 4min
completed: 2026-03-04
---

# Phase 2 Plan 01: Foundation Utilities Summary

**7 candidate page objects, SES email helper, extended StrapiAdminClient, and dataset with unregistered candidate and all question types for downstream E2E specs**

## Performance

- **Duration:** 4 min
- **Started:** 2026-03-04T17:34:28Z
- **Completed:** 2026-03-04T17:38:49Z
- **Tasks:** 2
- **Files modified:** 11

## Accomplishments
- Created all 7 candidate page objects following established LoginPage pattern with testId-based locators
- Built emailHelper utility providing SES inbox fetch, MIME parsing, and link extraction for registration/reset flows
- Extended StrapiAdminClient with 4 new methods for app settings, email sending, forgot password, and password management
- Extended default dataset with unregistered candidate, nomination, and text/boolean/image info question types
- Updated fixture index registering all 9 page objects (2 existing + 7 new) with proper candidate/voter disambiguation

## Task Commits

Each task was committed atomically:

1. **Task 1: Create emailHelper, extend StrapiAdminClient, extend dataset** - `45690dd60` (feat)
2. **Task 2: Create 7 page objects and register all in fixture index** - `564cd4dac` (feat)

## Files Created/Modified
- `tests/tests/utils/emailHelper.ts` - SES email fetch, parse with mailparser, link extraction with cheerio
- `tests/tests/utils/strapiAdminClient.ts` - Added updateAppSettings, sendEmail, sendForgotPassword, setPassword methods
- `tests/tests/data/default-dataset.json` - Added unregistered candidate, nomination, and text/boolean/image info questions
- `tests/tests/pages/candidate/ProfilePage.ts` - Profile page with imageUpload locator and uploadImage/submit actions
- `tests/tests/pages/candidate/QuestionsPage.ts` - Candidate questions list with questionCard locator and navigateToQuestion
- `tests/tests/pages/candidate/QuestionPage.ts` - Single question with answerInput/commentInput/saveButton and actions
- `tests/tests/pages/candidate/SettingsPage.ts` - Settings page with password change fields and changePassword action
- `tests/tests/pages/candidate/PreviewPage.ts` - Preview page with container locator
- `tests/tests/pages/candidate/RegisterPage.ts` - Registration page with password fields and setPassword action
- `tests/tests/pages/candidate/ForgotPasswordPage.ts` - Forgot password with email/submit and requestReset action
- `tests/tests/fixtures/index.ts` - All 9 page objects registered with candidate/voter QuestionsPage disambiguation

## Decisions Made
- Used `||` instead of `??` for mailparser `parsed.html` field because mailparser returns `string | false` (not `string | null`), and `??` does not filter `false`
- Renamed the existing voter `questionsPage` fixture to `voterQuestionsPage` and named the candidate fixture `candidateQuestionsPage` for clear disambiguation
- Used `data` param directly (not JSON.stringify) for `updateAppSettings` because the content-manager admin API expects parsed JSON, unlike Admin Tools controllers

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed mailparser html type mismatch**
- **Found during:** Task 1 (emailHelper creation)
- **Issue:** `parsed.html` returns `string | false` in mailparser types, but `??` only filters `null | undefined`, causing TypeScript error
- **Fix:** Changed `parsed.textAsHtml ?? parsed.html ?? undefined` to `parsed.textAsHtml || parsed.html || undefined` which correctly filters `false`
- **Files modified:** tests/tests/utils/emailHelper.ts
- **Verification:** TypeScript compilation passes
- **Committed in:** 45690dd60 (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 bug fix)
**Impact on plan:** Minor type handling fix for correctness. No scope creep.

## Issues Encountered
- No tsconfig.json exists in the tests directory. Verification used direct `npx tsc --noEmit` on individual files instead of the plan's suggested `--project tests/tsconfig.json`. All files compile cleanly.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All page objects and utilities are ready for downstream spec files (plans 02-04)
- Dataset includes all question types (Likert-5, date, number, text, boolean, image) and unregistered candidate for registration flow testing
- Fixture index provides all page objects as test parameters for clean test authoring

## Self-Check: PASSED

All 11 files verified present. Both task commits (45690dd60, 564cd4dac) verified in git log.

---
*Phase: 02-candidate-app-coverage*
*Completed: 2026-03-04*
