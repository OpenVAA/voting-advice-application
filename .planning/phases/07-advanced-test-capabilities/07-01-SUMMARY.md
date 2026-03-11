---
phase: 07-advanced-test-capabilities
plan: 01
subsystem: testing
tags: [playwright, visual-regression, screenshot, e2e]

# Dependency graph
requires:
  - phase: 01-infrastructure-foundation
    provides: Playwright config, testIds, fixtures, data setup/teardown
  - phase: 03-voter-app-core-journey
    provides: answeredVoterPage fixture for voter results screenshots
provides:
  - Visual regression spec with 4 screenshot tests (voter results + candidate preview at 2 viewports)
  - Playwright snapshotPathTemplate and toHaveScreenshot defaults
  - Env-gated visual-regression project for opt-in visual test execution
  - Git-tracked baseline screenshots under __screenshots__/
affects: [07-02-perf-budget, ci-integration]

# Tech tracking
tech-stack:
  added: []
  patterns: [env-gated Playwright project for opt-in test suites, snapshotPathTemplate for git-tracked baselines]

key-files:
  created:
    - tests/tests/specs/visual/visual-regression.spec.ts
    - tests/tests/specs/visual/__screenshots__/visual-regression.spec.ts/voter-results-desktop.png
    - tests/tests/specs/visual/__screenshots__/visual-regression.spec.ts/voter-results-mobile.png
    - tests/tests/specs/visual/__screenshots__/visual-regression.spec.ts/candidate-preview-desktop.png
    - tests/tests/specs/visual/__screenshots__/visual-regression.spec.ts/candidate-preview-mobile.png
  modified:
    - tests/playwright.config.ts

key-decisions:
  - "Env-gated visual-regression project (PLAYWRIGHT_VISUAL=1) instead of grepInvert or always-on project, because Playwright requires a project entry for test discovery but default yarn test:e2e must exclude visual tests"
  - "Threshold 0.2 and maxDiffPixelRatio 0.01 as initial defaults -- permissive enough for anti-aliasing differences across platforms, strict enough to catch layout regressions"

patterns-established:
  - "Env-gated project pattern: spread conditional array in projects list for opt-in test suites"
  - "Visual test run command: PLAYWRIGHT_VISUAL=1 npx playwright test -c tests/playwright.config.ts --project=visual-regression"
  - "Baseline update command: PLAYWRIGHT_VISUAL=1 npx playwright test -c tests/playwright.config.ts --project=visual-regression --update-snapshots"

requirements-completed: [INFRA-10]

# Metrics
duration: 5min
completed: 2026-03-11
---

# Phase 7 Plan 01: Visual Regression Testing Summary

**Playwright visual regression suite with 4 screenshot tests covering voter results and candidate preview at desktop/mobile viewports, env-gated for opt-in execution**

## Performance

- **Duration:** 5 min
- **Started:** 2026-03-11T16:37:51Z
- **Completed:** 2026-03-11T16:43:00Z
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments
- Playwright config updated with snapshotPathTemplate for git-trackable screenshot baselines and toHaveScreenshot defaults (threshold: 0.2, maxDiffPixelRatio: 0.01)
- Visual regression spec created with 4 tests: voter results desktop/mobile and candidate preview desktop/mobile, all tagged @visual
- All 4 baseline screenshots generated and committed to git (total ~320KB)
- Env-gated visual-regression project ensures default `yarn test:e2e` runs zero visual tests (verified: still 85 tests)
- Comparison mode verified: all 4 visual tests pass when comparing against baselines

## Task Commits

Each task was committed atomically:

1. **Task 1: Update Playwright config for visual/perf test isolation** - `54fd8d84c` (chore)
2. **Task 2: Create visual regression spec with 4 screenshot tests** - `ebc4adea3` (feat)

## Files Created/Modified
- `tests/playwright.config.ts` - Added snapshotPathTemplate, toHaveScreenshot defaults, env-gated visual-regression project
- `tests/tests/specs/visual/visual-regression.spec.ts` - 4 screenshot tests across 2 pages and 2 viewports
- `tests/tests/specs/visual/__screenshots__/visual-regression.spec.ts/*.png` - 4 baseline screenshot images

## Decisions Made
- **Env-gated project over grepInvert:** Plan explicitly prohibited grepInvert. Since Playwright requires a project entry for test discovery (no project covers `specs/visual/` by default), added a `visual-regression` project gated by `PLAYWRIGHT_VISUAL` env var. This cleanly excludes visual tests from default runs while enabling opt-in execution.
- **Chromium-based mobile viewport:** Used explicit viewport dimensions (390x844) with `isMobile: true` and `hasTouch: true` instead of `devices['iPhone 14']` which defaults to WebKit, ensuring consistent Chromium rendering across all visual tests.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Added env-gated visual-regression project to Playwright config**
- **Found during:** Task 2 (visual regression spec creation)
- **Issue:** No existing Playwright project includes the `specs/visual/` directory, so `--grep @visual` finds zero tests. Playwright requires a project entry for test discovery.
- **Fix:** Added a `visual-regression` project with `testDir: './tests/specs/visual'`, conditionally included via `process.env.PLAYWRIGHT_VISUAL`. Run command: `PLAYWRIGHT_VISUAL=1 npx playwright test --project=visual-regression`
- **Files modified:** tests/playwright.config.ts
- **Verification:** Without env var: 85 tests (no visual). With env var: 4 visual + 4 setup/teardown tests found and passing.
- **Committed in:** ebc4adea3 (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Necessary for test discoverability. The plan's assumption that `--grep @visual` alone would work was incorrect because directory-based isolation means no project discovers the visual specs. The env-gated project is the clean solution.

## Issues Encountered
None - all tests generated baselines and passed comparison on first attempt.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Visual regression infrastructure is complete and verified
- The env-gated project pattern established here can be reused for the performance budget project (07-02)
- Baselines will need regeneration if the voter results page or candidate preview page undergo intentional UI changes

## Self-Check: PASSED

All 6 created files verified present. Both task commits (54fd8d84c, ebc4adea3) verified in git log.

---
*Phase: 07-advanced-test-capabilities*
*Completed: 2026-03-11*
