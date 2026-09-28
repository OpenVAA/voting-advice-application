---
phase: 09-directory-restructure
plan: 02
subsystem: infra
tags: [docker, e2e, playwright, integration-testing, directory-restructure]

# Dependency graph
requires:
  - phase: 09-directory-restructure
    plan: 01
    provides: apps/ directory layout with all Docker, CI, TypeScript, and test path updates
provides:
  - Verified Docker dev stack starts with restructured directory layout
  - Verified all 92 E2E tests pass from new paths
  - Fixed Dockerfile turbo.json COPY and E2E test import path issues
affects: [10-versioning, 11-publishing, 12-ci-quality]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "turbo.json must be copied into Docker build context for yarn build to work"

key-files:
  created: []
  modified:
    - apps/frontend/Dockerfile
    - apps/strapi/Dockerfile
    - tests/tests/utils/buildRoute.ts
    - tests/tests/utils/translations.ts

key-decisions:
  - "Add turbo.json to Dockerfile COPY: yarn build depends on turbo.json for task orchestration"
  - "Fix relative import depth in test utils: directory move changed nesting depth requiring ../../ -> ../../../"

patterns-established: []

requirements-completed: [DIR-02, DIR-04]

# Metrics
duration: 32min
completed: 2026-03-13
---

# Phase 9 Plan 02: Docker and E2E Integration Verification Summary

**Full Docker stack (4 services) starts and all 92 E2E tests pass with restructured apps/ directory layout**

## Performance

- **Duration:** 32 min (including Docker build, E2E run, and checkpoint wait)
- **Started:** 2026-03-13T06:50:00Z
- **Completed:** 2026-03-13T07:22:00Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments
- Docker dev stack starts with all 4 services healthy (frontend, strapi, postgres, awslocal)
- All 92 E2E tests pass against the Docker stack with new directory layout
- Fixed Dockerfile COPY to include turbo.json (required by yarn build inside containers)
- Fixed E2E test utility import paths for new directory depth

## Task Commits

Each task was committed atomically:

1. **Task 1: Start Docker dev stack and run E2E tests** - `17d526316` (fix)
2. **Task 2: Verify Docker stack and directory structure** - checkpoint:human-verify (user approved, no commit needed)

## Files Created/Modified
- `apps/frontend/Dockerfile` - Added turbo.json to COPY command for Docker build context
- `apps/strapi/Dockerfile` - Added turbo.json to COPY command for Docker build context
- `tests/tests/utils/buildRoute.ts` - Fixed relative import path depth (../../ -> ../../../)
- `tests/tests/utils/translations.ts` - Fixed relative import path depth (../../ -> ../../../)

## Decisions Made
- **turbo.json in Dockerfiles:** yarn build (which replaced build:shared) requires turbo.json at the repo root. Docker COPY must include it alongside package.json and yarn.lock.
- **Relative import fix:** The directory move from frontend/ to apps/frontend/ added one level of nesting, requiring test utility imports to use ../../../ instead of ../../.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Added turbo.json to Dockerfile COPY commands**
- **Found during:** Task 1 (Docker build)
- **Issue:** Docker build failed because yarn build requires turbo.json but it was not copied into the build context
- **Fix:** Added turbo.json to the COPY line in both frontend and strapi Dockerfiles
- **Files modified:** apps/frontend/Dockerfile, apps/strapi/Dockerfile
- **Committed in:** 17d526316 (Task 1 commit)

**2. [Rule 1 - Bug] Fixed E2E test utility relative import paths**
- **Found during:** Task 1 (E2E test run)
- **Issue:** buildRoute.ts and translations.ts had relative imports using ../../ which was incorrect after the directory restructure added a nesting level
- **Fix:** Updated imports to use ../../../ for correct path resolution
- **Files modified:** tests/tests/utils/buildRoute.ts, tests/tests/utils/translations.ts
- **Committed in:** 17d526316 (Task 1 commit)

---

**Total deviations:** 2 auto-fixed (1 blocking, 1 bug)
**Impact on plan:** Both auto-fixes necessary for Docker build and E2E test execution. Direct consequences of the directory restructure.

## Issues Encountered
None beyond the auto-fixed deviations above.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Phase 9 (Directory Restructure) fully complete: all builds, unit tests, Docker stack, and E2E tests verified
- Directory structure settled: apps/frontend, apps/strapi, apps/docs, packages/*
- Ready for Phase 10 (Version Management) - Changesets integration

## Self-Check: PASSED

- All modified files verified to exist (apps/frontend/Dockerfile, apps/strapi/Dockerfile, tests/tests/utils/buildRoute.ts, tests/tests/utils/translations.ts)
- Task 1 commit verified in git history (17d5263)
- SUMMARY.md created at correct path

---
*Phase: 09-directory-restructure*
*Completed: 2026-03-13*
