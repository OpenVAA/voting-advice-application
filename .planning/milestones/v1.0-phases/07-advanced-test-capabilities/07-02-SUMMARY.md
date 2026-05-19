---
phase: 07-advanced-test-capabilities
plan: 02
subsystem: testing
tags: [playwright, performance, navigation-timing, ci, github-actions]

# Dependency graph
requires:
  - phase: 01-infrastructure-foundation
    provides: Playwright config, testIds, fixtures, data setup/teardown
  - phase: 03-voter-app-core-journey
    provides: answeredVoterPage fixture for voter results page navigation
  - phase: 07-advanced-test-capabilities
    provides: Visual regression spec and env-gated project pattern (07-01)
provides:
  - Performance budget spec for voter results page load timing via Navigation Timing API
  - Env-gated performance project in Playwright config (PLAYWRIGHT_PERF=1)
  - Non-blocking CI job for visual and performance tests (continue-on-error)
affects: [ci-pipeline, performance-monitoring]

# Tech tracking
tech-stack:
  added: []
  patterns: [Navigation Timing API for page load measurement, continue-on-error CI job for non-blocking checks, env-gated Playwright project for perf tests]

key-files:
  created:
    - tests/tests/specs/perf/performance-budget.spec.ts
  modified:
    - tests/playwright.config.ts
    - .github/workflows/main.yaml

key-decisions:
  - "Env-gated performance project (PLAYWRIGHT_PERF=1) parallel to visual-regression project, for consistent opt-in pattern across specialized test suites"
  - "Single-run measurement with generous budget (8s DOMContentLoaded, 15s full load) rather than multi-run averaging, because Docker dev-mode variance makes statistical approaches impractical"
  - "Independent CI job (no needs dependency) with own Docker stack, because e2e-tests job tears down stack on completion"
  - "page.reload() after fixture navigation to get clean Navigation Timing data instead of client-side route transition timing"

patterns-established:
  - "Perf test run command: PLAYWRIGHT_PERF=1 npx playwright test -c tests/playwright.config.ts --project=performance"
  - "CI visual+perf combined run: PLAYWRIGHT_VISUAL=1 PLAYWRIGHT_PERF=1 npx playwright test --grep @visual|@perf"
  - "continue-on-error CI jobs for informational-only test suites"

requirements-completed: [INFRA-11]

# Metrics
duration: 2min
completed: 2026-03-11
---

# Phase 7 Plan 02: Performance Budget and CI Integration Summary

**Navigation Timing performance budget for voter results page (8s/15s Docker dev thresholds) with non-blocking GitHub Actions CI job for visual and perf test execution**

## Performance

- **Duration:** 2 min
- **Started:** 2026-03-11T16:45:49Z
- **Completed:** 2026-03-11T16:47:28Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments
- Performance budget spec created with Navigation Timing API assertions for voter results page load timing
- Env-gated performance project added to Playwright config matching the visual-regression pattern from 07-01
- GitHub Actions workflow updated with independent e2e-visual-perf job using continue-on-error for non-blocking execution
- CI job enables both PLAYWRIGHT_VISUAL and PLAYWRIGHT_PERF env vars and uses --grep to select tagged tests

## Task Commits

Each task was committed atomically:

1. **Task 1: Create performance budget spec for voter results page** - `1ba26bf01` (feat)
2. **Task 2: Add optional visual/perf CI job to GitHub Actions workflow** - `f65756c8b` (chore)

## Files Created/Modified
- `tests/tests/specs/perf/performance-budget.spec.ts` - Performance budget test using Navigation Timing API with page.reload() for clean timing data
- `tests/playwright.config.ts` - Added env-gated performance project (PLAYWRIGHT_PERF=1) for opt-in perf test execution
- `.github/workflows/main.yaml` - Added e2e-visual-perf job with continue-on-error: true, own Docker stack, distinct report artifact

## Decisions Made
- **Env-gated performance project:** Added `PLAYWRIGHT_PERF=1` gated project parallel to the visual-regression pattern from 07-01, ensuring perf tests are discovered by Playwright when running `--grep @perf` while remaining excluded from default `yarn test:e2e` runs.
- **Independent CI job:** The e2e-visual-perf job runs independently (no `needs` dependency) because the e2e-tests job tears down Docker on completion. Each job spins up its own stack, allowing parallel execution.
- **Page reload for clean timing:** The answeredVoterPage fixture navigates via client-side routing, so `page.reload({ waitUntil: 'load' })` is used after fixture setup to get clean Navigation Timing data for a full page load.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Added env-gated performance project to Playwright config**
- **Found during:** Task 1 (performance budget spec creation)
- **Issue:** No existing Playwright project includes the `specs/perf/` directory. Running `--grep @perf` without a project entry finds zero tests, same issue discovered in 07-01 for visual tests.
- **Fix:** Added a `performance` project with `testDir: './tests/specs/perf'`, conditionally included via `process.env.PLAYWRIGHT_PERF`. Run command: `PLAYWRIGHT_PERF=1 npx playwright test -c tests/playwright.config.ts --project=performance`
- **Files modified:** tests/playwright.config.ts
- **Verification:** Env-gated project only appears when PLAYWRIGHT_PERF=1 is set, excluded from default runs.
- **Committed in:** 1ba26bf01 (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Necessary for test discoverability, consistent with the env-gated pattern established in 07-01. The plan assumed `--grep @perf` alone would work, but directory-based project isolation requires an explicit project entry.

## Issues Encountered
None - both tasks executed cleanly.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Phase 7 is now complete (both plans 07-01 and 07-02 executed)
- Visual regression and performance testing infrastructure is fully established
- CI pipeline runs both test types as non-blocking informational checks
- The entire E2E testing milestone (Phases 1-7) is complete

## Self-Check: PASSED

All 3 created/modified files verified present. Both task commits (1ba26bf01, f65756c8b) verified in git log.

---
*Phase: 07-advanced-test-capabilities*
*Completed: 2026-03-11*
