---
phase: 13-tech-debt-cleanup
plan: 02
subsystem: infra
tags: [yarn, docker, ci, github-actions, version-alignment]

# Dependency graph
requires:
  - phase: 12-polish-and-optimization
    provides: Yarn 4.13 upgrade in root packageManager
provides:
  - Consistent Yarn 4.13 version references across all package.json, Dockerfiles, and CI
  - docs.yml CI workflow aligned with standard bootstrap pattern
affects: [ci, docker, deployment]

# Tech tracking
tech-stack:
  added: []
  patterns: [threeal/setup-yarn-action for CI Yarn setup]

key-files:
  created: []
  modified:
    - apps/frontend/package.json
    - apps/strapi/package.json
    - package.json
    - apps/frontend/Dockerfile
    - apps/strapi/Dockerfile
    - .github/workflows/docs.yml

key-decisions:
  - "Used full semver 4.13.0 in Dockerfiles for corepack prepare compatibility"
  - "Also fixed engine.yarn fields in app-level package.json files (not in original plan but necessary for complete alignment)"

patterns-established:
  - "All CI workflows use threeal/setup-yarn-action@v2 with version 4.13 and setup-node with exact 20.18.1"

requirements-completed: [TD-05, TD-06, TD-07, TD-08, TD-09]

# Metrics
duration: 1min
completed: 2026-03-15
---

# Phase 13 Plan 02: Yarn Version Alignment Summary

**Aligned all Yarn version references to 4.13 across 5 config files and standardized docs.yml CI bootstrap pattern**

## Performance

- **Duration:** 1 min
- **Started:** 2026-03-15T10:03:16Z
- **Completed:** 2026-03-15T10:04:52Z
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments
- Eliminated all stale Yarn 4.6 version references from package.json files and Dockerfiles
- Aligned docs.yml with the standard CI bootstrap pattern used by main.yaml and release.yml
- Removed redundant `cd apps/docs && yarn install --immutable` step from docs.yml

## Task Commits

Each task was committed atomically:

1. **Task 1: Align Yarn version strings across package.json files and Dockerfiles** - `925dd1547` (chore)
2. **Task 2: Align docs.yml with standard CI bootstrap pattern** - `3a0a02bb3` (chore)

## Files Created/Modified
- `apps/frontend/package.json` - packageManager and engine.yarn aligned to 4.13
- `apps/strapi/package.json` - packageManager and engine.yarn aligned to 4.13
- `package.json` - engine.yarn aligned to 4.13
- `apps/frontend/Dockerfile` - YARN_VERSION updated to 4.13.0
- `apps/strapi/Dockerfile` - YARN_VERSION updated to 4.13.0
- `.github/workflows/docs.yml` - Added setup-yarn-action, exact node version, single root install

## Decisions Made
- Used full semver `4.13.0` in Dockerfiles because `corepack prepare` expects the full version string
- Also updated `engine.yarn` fields in app-level package.json files (frontend, strapi) from 4.6 to 4.13 -- these were not explicitly called out in the plan but contained stale references that contradicted the success criteria

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] Updated engine.yarn in app-level package.json files**
- **Found during:** Task 1
- **Issue:** `apps/frontend/package.json` and `apps/strapi/package.json` both had `"yarn": "4.6"` in their engine fields, contradicting the plan's success criteria that "all Yarn version references point to 4.13"
- **Fix:** Changed engine.yarn from "4.6" to "4.13" in both files
- **Files modified:** apps/frontend/package.json, apps/strapi/package.json
- **Verification:** grep confirmed zero 4.6 references remain
- **Committed in:** 925dd1547 (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 missing critical)
**Impact on plan:** Essential for complete version alignment. No scope creep.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All Yarn version strings are now consistent across the entire repo
- docs.yml follows the same CI pattern as other workflows
- Ready for Plan 13-03 (stale docs paths and README updates)

## Self-Check: PASSED

All 6 modified files confirmed present. Both task commits (925dd1547, 3a0a02bb3) verified in git log.

---
*Phase: 13-tech-debt-cleanup*
*Completed: 2026-03-15*
