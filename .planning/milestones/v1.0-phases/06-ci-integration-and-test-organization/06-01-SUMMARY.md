---
phase: 06-ci-integration-and-test-organization
plan: 01
subsystem: infra
tags: [github-actions, ci, playwright, e2e, docker]

# Dependency graph
requires:
  - phase: 01-infrastructure-foundation
    provides: Playwright project dependencies pattern and test structure
provides:
  - Updated e2e-tests CI job compatible with new test structure
  - Mock data override preventing database pollution in CI
  - OS-level browser dependency installation in CI
affects: [06-02, ci-pipeline]

# Tech tracking
tech-stack:
  added: []
  patterns: [CI mock-data-override via sed, --with-deps for CI Playwright install]

key-files:
  created: []
  modified:
    - .github/workflows/main.yaml
    - .env.example

key-decisions:
  - "Removed 30s sleep step since docker compose --wait handles healthchecks and tests import own data"
  - "Used sed override for mock data rather than changing .env.example default to preserve local dev experience"

patterns-established:
  - "CI environment override: copy .env.example then sed to override CI-specific values"

requirements-completed: [CI-01, CI-02]

# Metrics
duration: 1min
completed: 2026-03-10
---

# Phase 06 Plan 01: CI Workflow Update Summary

**Updated GitHub Actions e2e-tests job with Playwright --with-deps, mock data override, and removal of stale sleep/report steps**

## Performance

- **Duration:** 1 min
- **Started:** 2026-03-10T09:20:58Z
- **Completed:** 2026-03-10T09:22:21Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- Updated Playwright install to include OS-level browser dependencies (--with-deps)
- Added mock data generation override in CI to prevent test data pollution
- Removed obsolete 30-second sleep step and stale playwright-setup-report artifact upload
- Documented CI override behavior in .env.example for future developers

## Task Commits

Each task was committed atomically:

1. **Task 1: Update e2e-tests job in GitHub Actions workflow** - `c4639aae2` (feat)
2. **Task 2: Update .env.example mock data default comment** - `278ca2803` (docs)

## Files Created/Modified
- `.github/workflows/main.yaml` - Updated e2e-tests job with 5 targeted changes for new test structure
- `.env.example` - Added comment documenting CI override of mock data generation

## Decisions Made
- Removed 30s sleep step entirely since `docker compose --wait` handles service healthchecks and the new test structure imports its own data via the Admin Tools API
- Used `sed` to override `GENERATE_MOCK_DATA_ON_INITIALISE` in CI rather than changing the `.env.example` default, preserving the local development experience where mock data is useful

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- CI workflow is ready to run the new E2E test suite on PRs against main
- Plan 06-02 (test tagging) can proceed independently
- Full CI validation will occur when a PR is opened against main

## Self-Check: PASSED

- All files exist (`.github/workflows/main.yaml`, `.env.example`, `06-01-SUMMARY.md`)
- All commits verified (`c4639aae2`, `278ca2803`)

---
*Phase: 06-ci-integration-and-test-organization*
*Completed: 2026-03-10*
