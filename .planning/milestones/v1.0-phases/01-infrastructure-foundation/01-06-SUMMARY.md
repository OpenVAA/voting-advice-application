---
phase: 01-infrastructure-foundation
plan: 06
subsystem: testing
tags: [eslint, playwright, linting, test-quality, eslint-plugin-playwright]

# Dependency graph
requires: []
provides:
  - ESLint Playwright plugin configured for tests/**/*.ts
  - Playwright-specific lint rules enforcing test best practices
  - func-style override for test file arrow functions
affects: [02-playwright-migration, testing]

# Tech tracking
tech-stack:
  added: [eslint-plugin-playwright@2.9.0]
  patterns: [flat-config-playwright-overlay, error-level-enforcement-for-antipatterns]

key-files:
  created: []
  modified:
    - tests/eslint.config.mjs
    - package.json

key-decisions:
  - 'Set no-raw-locators and no-wait-for-timeout as errors (not warnings) to hard-block anti-patterns'
  - 'Set no-skipped-test as warning to allow temporary test.skip during development'
  - 'Disabled func-style for test files to allow arrow functions in test callbacks'

patterns-established:
  - 'Playwright lint overlay: Playwright rules are applied via flat config files array entry scoped to tests/**/*.ts'
  - 'Error vs warning split: hard-block rules that cause flaky tests (timeouts, raw locators) vs soft-block rules that are acceptable temporarily (skipped tests)'

requirements-completed: [INFRA-09]

# Metrics
duration: 2min
completed: 2026-03-03
---

# Phase 1 Plan 6: ESLint Playwright Plugin Summary

**eslint-plugin-playwright configured with flat/recommended preset enforcing no-wait-for-timeout, no-raw-locators, and prefer-web-first-assertions as errors**

## Performance

- **Duration:** 2 min
- **Started:** 2026-03-03T19:58:28Z
- **Completed:** 2026-03-03T19:59:58Z
- **Tasks:** 1
- **Files modified:** 3 (package.json, tests/eslint.config.mjs, yarn.lock)

## Accomplishments

- Installed eslint-plugin-playwright@2.9.0 as root workspace dev dependency
- Configured flat/recommended preset scoped to tests/\*_/_.ts files
- Set hard error enforcement on no-wait-for-timeout, no-raw-locators, missing-playwright-await, no-focused-test, prefer-web-first-assertions
- Set warning-level enforcement on no-page-pause, no-skipped-test
- Disabled func-style rule for test files to avoid conflict with test callback arrow functions
- Verified ESLint correctly flags existing legacy test anti-patterns (11 errors, 5 warnings)

## Task Commits

Each task was committed atomically:

1. **Task 1: Install eslint-plugin-playwright and configure ESLint** - `0279b5ba4` (feat)

**Plan metadata:** [pending] (docs: complete plan)

## Files Created/Modified

- `tests/eslint.config.mjs` - Updated with Playwright plugin import and flat/recommended config overlay
- `package.json` - Added eslint-plugin-playwright@^2.9.0 to devDependencies
- `yarn.lock` - Updated with eslint-plugin-playwright and globals dependency resolution

## Decisions Made

- Set no-raw-locators and no-wait-for-timeout as errors (not warnings) to hard-block the most common sources of flaky tests from the start
- Set no-skipped-test as warning rather than error to allow temporary test.skip during active development
- Disabled func-style for test files since Playwright test() and describe() callbacks use arrow functions by convention

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Playwright lint rules are active and ready to enforce test quality in Phase 2 test migration
- Existing legacy spec files produce expected lint errors (11 errors from waitForTimeout, raw locators, etc.) confirming the rules work correctly
- These legacy files will be rewritten in Phase 2

## Self-Check: PASSED

- FOUND: tests/eslint.config.mjs
- FOUND: package.json
- FOUND: .planning/phases/01-infrastructure-foundation/01-06-SUMMARY.md
- FOUND: commit 0279b5ba4

---

_Phase: 01-infrastructure-foundation_
_Completed: 2026-03-03_
