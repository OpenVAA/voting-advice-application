---
phase: 06-ci-integration-and-test-organization
plan: 02
subsystem: testing
tags: [playwright, tags, smoke-tests, selective-execution, ci]

# Dependency graph
requires:
  - phase: 01-infrastructure-foundation
    provides: "Playwright project structure with spec files and fixtures"
  - phase: 02-candidate-app-coverage
    provides: "Candidate spec files to tag"
  - phase: 03-voter-app-core-journey
    provides: "Voter spec files to tag"
  - phase: 04-voter-app-settings-and-edge-cases
    provides: "Voter settings and popup spec files to tag"
  - phase: 05-configuration-variants
    provides: "Variant spec files to tag"
provides:
  - "Playwright tag metadata on all 16 spec files for selective test execution"
  - "@smoke tag on 3 curated files for quick health check suite"
  - "@candidate, @voter, @variant app-level tags for focused test runs"
affects: [06-ci-integration-and-test-organization]

# Tech tracking
tech-stack:
  added: []
  patterns: ["Playwright { tag: } property on test.describe() for selective --grep filtering"]

key-files:
  created: []
  modified:
    - tests/tests/specs/candidate/candidate-auth.spec.ts
    - tests/tests/specs/candidate/candidate-profile.spec.ts
    - tests/tests/specs/candidate/candidate-questions.spec.ts
    - tests/tests/specs/candidate/candidate-registration.spec.ts
    - tests/tests/specs/candidate/candidate-settings.spec.ts
    - tests/tests/specs/voter/voter-journey.spec.ts
    - tests/tests/specs/voter/voter-results.spec.ts
    - tests/tests/specs/voter/voter-detail.spec.ts
    - tests/tests/specs/voter/voter-matching.spec.ts
    - tests/tests/specs/voter/voter-static-pages.spec.ts
    - tests/tests/specs/voter/voter-settings.spec.ts
    - tests/tests/specs/voter/voter-popups.spec.ts
    - tests/tests/specs/variants/multi-election.spec.ts
    - tests/tests/specs/variants/results-sections.spec.ts
    - tests/tests/specs/variants/constituency.spec.ts
    - tests/tests/specs/variants/startfromcg.spec.ts

key-decisions:
  - "Tags placed on test.describe() blocks (not individual tests) for inheritance to all contained tests"
  - "Smoke suite curated to 3 files: candidate-auth (login flow), voter-journey (full happy path), voter-static-pages (fast page loads)"

patterns-established:
  - "Tag inheritance: { tag: } on top-level test.describe() inherits to all nested tests"
  - "App-level tags: @candidate, @voter, @variant for focused test runs during feature development"
  - "Smoke tag: @smoke for curated quick health check subset"

requirements-completed: [CI-03]

# Metrics
duration: 2min
completed: 2026-03-10
---

# Phase 06 Plan 02: Spec File Tagging Summary

**Playwright tag metadata on all 16 spec files enabling selective --grep @smoke/@candidate/@voter/@variant test execution**

## Performance

- **Duration:** 2 min
- **Started:** 2026-03-10T09:20:58Z
- **Completed:** 2026-03-10T09:23:16Z
- **Tasks:** 2
- **Files modified:** 16

## Accomplishments
- Added `{ tag: ['@candidate'] }` to all 13 top-level test.describe() blocks across 5 candidate spec files
- Added `{ tag: ['@voter'] }` to all 17 top-level test.describe() blocks across 7 voter spec files
- Added `{ tag: ['@variant'] }` to all 5 top-level test.describe() blocks across 4 variant spec files
- Added `@smoke` tag to 3 curated files (candidate-auth, voter-journey, voter-static-pages) for quick health check suite
- Zero changes to test logic, assertions, fixtures, or imports -- tags are metadata only

## Task Commits

Each task was committed atomically:

1. **Task 1: Add tags to all candidate spec files** - `466aff01d` (feat)
2. **Task 2: Add tags to all voter and variant spec files** - `4832f2285` (feat)

## Files Created/Modified
- `tests/tests/specs/candidate/candidate-auth.spec.ts` - Added @candidate and @smoke tags (2 describes)
- `tests/tests/specs/candidate/candidate-profile.spec.ts` - Added @candidate tag (1 describe)
- `tests/tests/specs/candidate/candidate-questions.spec.ts` - Added @candidate tag (2 describes)
- `tests/tests/specs/candidate/candidate-registration.spec.ts` - Added @candidate tag (2 describes)
- `tests/tests/specs/candidate/candidate-settings.spec.ts` - Added @candidate tag (6 describes)
- `tests/tests/specs/voter/voter-journey.spec.ts` - Added @voter and @smoke tags (1 describe)
- `tests/tests/specs/voter/voter-results.spec.ts` - Added @voter tag (1 describe)
- `tests/tests/specs/voter/voter-detail.spec.ts` - Added @voter tag (1 describe)
- `tests/tests/specs/voter/voter-matching.spec.ts` - Added @voter tag (1 describe)
- `tests/tests/specs/voter/voter-static-pages.spec.ts` - Added @voter and @smoke (1st describe), @voter only (2nd describe)
- `tests/tests/specs/voter/voter-settings.spec.ts` - Added @voter tag (5 describes)
- `tests/tests/specs/voter/voter-popups.spec.ts` - Added @voter tag (3 describes)
- `tests/tests/specs/variants/multi-election.spec.ts` - Added @variant tag (2 describes)
- `tests/tests/specs/variants/results-sections.spec.ts` - Added @variant tag (1 describe)
- `tests/tests/specs/variants/constituency.spec.ts` - Added @variant tag (1 describe)
- `tests/tests/specs/variants/startfromcg.spec.ts` - Added @variant tag (1 describe)

## Decisions Made
- Tags placed on test.describe() blocks (not individual tests) for inheritance to all contained tests
- Smoke suite curated to 3 files: candidate-auth (login flow is most basic candidate flow), voter-journey (core happy path), voter-static-pages (fast page-load tests)
- Only the first describe in voter-static-pages gets @smoke (static pages are fast and suitable); nominations describe is @voter only since it mutates settings

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All spec files are now tagged for selective execution via `--grep`
- CI pipeline can use `playwright test --grep @smoke` for quick health checks
- Feature development can use `--grep @candidate` or `--grep @voter` for focused testing
- Phase 06 tagging complete, ready for CI integration plan if applicable

## Self-Check: PASSED

All 16 modified spec files verified present on disk. Both task commits (`466aff01d`, `4832f2285`) verified in git log. SUMMARY.md created successfully.

---
*Phase: 06-ci-integration-and-test-organization*
*Completed: 2026-03-10*
