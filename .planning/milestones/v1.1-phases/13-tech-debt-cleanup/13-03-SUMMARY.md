---
phase: 13-tech-debt-cleanup
plan: 03
subsystem: docs
tags: [documentation, readme, tsup, build-tooling]

# Dependency graph
requires:
  - phase: 11-package-publishing
    provides: tsup migration for publishable packages
  - phase: 09-directory-restructure
    provides: apps/strapi directory path (moved from backend/vaa-strapi)
provides:
  - Package READMEs accurately reference tsup as build tool
  - Documentation URLs already corrected (verified, no action needed)
affects: []

# Tech tracking
tech-stack:
  added: []
  patterns: []

key-files:
  created: []
  modified:
    - packages/core/README.md
    - packages/data/README.md
    - packages/matching/README.md
    - packages/filters/README.md
    - packages/shared-config/README.md

key-decisions:
  - "Task 1 (docs paths) was already completed by Phase 9/13-02 commits -- no changes needed"
  - "Used tsup ^8.5.1 version from root package.json for shared-config README example"

patterns-established: []

requirements-completed: [TD-03, TD-04]

# Metrics
duration: 3min
completed: 2026-03-15
---

# Phase 13 Plan 03: Stale Documentation Paths Summary

**Replaced tsc-esm-fix references with tsup in 5 package READMEs; verified docs already had correct apps/strapi paths**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-15T10:03:19Z
- **Completed:** 2026-03-15T10:06:59Z
- **Tasks:** 2 (1 no-op, 1 executed)
- **Files modified:** 5

## Accomplishments
- Verified all 15 documentation files already use apps/strapi paths (45 URLs correct)
- Replaced tsc-esm-fix with tsup in core, data, matching, and filters READMEs
- Updated shared-config README devDependencies example from tsc-esm-fix to tsup ^8.5.1

## Task Commits

Each task was committed atomically:

1. **Task 1: Replace backend/vaa-strapi with apps/strapi in docs** - No commit (already done in prior phases)
2. **Task 2: Replace tsc-esm-fix references with tsup in package READMEs** - `48432e218` (fix)

## Files Created/Modified
- `packages/core/README.md` - Updated build tool reference from tsc-esm-fix to tsup
- `packages/data/README.md` - Updated build tool reference from tsc-esm-fix to tsup
- `packages/matching/README.md` - Updated build tool reference from tsc-esm-fix to tsup
- `packages/filters/README.md` - Updated build tool reference from tsc-esm-fix to tsup
- `packages/shared-config/README.md` - Updated devDependencies example from tsc-esm-fix to tsup

## Decisions Made
- Task 1 paths were already corrected by commit 3a0a02bb3 (chore(13-02)) and Phase 9 move -- no duplicate changes made
- Used tsup ^8.5.1 version from root package.json catalog for shared-config README example

## Deviations from Plan

### Task 1 Already Completed

Task 1 (replace backend/vaa-strapi with apps/strapi in 15 docs files) required no action. The 45 GitHub blob URLs were already corrected in prior commits (Phase 9 directory restructure moved the files, and commit 3a0a02bb3 in plan 13-02 updated remaining path references). The verification confirms zero stale paths exist.

---

**Total deviations:** 1 (Task 1 was no-op -- work already done in prior phases)
**Impact on plan:** No scope change. Task 1 verification passed; Task 2 executed as planned.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All documentation paths and README build tool references are now accurate
- Phase 13 tech debt cleanup complete (all 3 plans done)

## Self-Check: PASSED

All files found, commit 48432e218 verified, tsup references confirmed in all 5 READMEs.

---
*Phase: 13-tech-debt-cleanup*
*Completed: 2026-03-15*
