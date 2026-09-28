---
phase: 12-polish-and-optimization
plan: 01
subsystem: infra
tags: [yarn, catalogs, dependency-management, monorepo]

# Dependency graph
requires:
  - phase: 08-build-orchestration
    provides: Turborepo build system for verifying builds after migration
provides:
  - Yarn 4.13.0 as active package manager
  - Dependency catalog in .yarnrc.yml for 12 shared dependencies
  - All eligible workspaces using catalog: protocol for centralized version management
affects: [12-polish-and-optimization, ci-workflows]

# Tech tracking
tech-stack:
  added: [yarn-4.13.0, yarn-catalogs]
  patterns: [catalog-protocol-for-shared-deps]

key-files:
  created: [.yarn/releases/yarn-4.13.0.cjs]
  modified: [.yarnrc.yml, package.json, .github/workflows/release.yml, packages/core/package.json, packages/data/package.json, packages/matching/package.json, packages/filters/package.json, packages/app-shared/package.json, packages/llm/package.json, packages/argument-condensation/package.json, packages/question-info/package.json, packages/shared-config/package.json, apps/frontend/package.json, apps/strapi/package.json, apps/strapi/src/plugins/openvaa-admin-tools/package.json, apps/docs/package.json, yarn.lock]

key-decisions:
  - "Catalog version for prettier normalized to ^3.7.4 (highest across workspaces)"
  - "Catalog version for @eslint/js normalized to ^9.39.1 (highest across workspaces)"
  - "apps/docs excluded from typescript catalog (uses ^5.7.2 vs catalog ^5.7.3)"
  - "apps/docs excluded from vitest catalog (uses ^4.0.15, different major)"
  - "apps/docs excluded from globals catalog (uses ^16.5.0, different major)"
  - "Docs included in catalog for eslint, prettier, tsx, and eslint-related deps (compatible versions)"

patterns-established:
  - "catalog: protocol: Use catalog: in package.json devDependencies for shared deps"
  - "Version exceptions: When a workspace uses a different major, keep explicit version"

requirements-completed: [POL-02]

# Metrics
duration: 5min
completed: 2026-03-14
---

# Phase 12 Plan 01: Yarn Upgrade and Dependency Catalog Summary

**Yarn 4.13.0 with catalog: protocol for 12 shared dependencies across 14 workspaces, eliminating 50 duplicated version declarations**

## Performance

- **Duration:** 5 min
- **Started:** 2026-03-14T16:49:00Z
- **Completed:** 2026-03-14T16:54:08Z
- **Tasks:** 2
- **Files modified:** 17

## Accomplishments
- Upgraded Yarn from 4.6.0 to 4.13.0 across the monorepo
- Defined a centralized dependency catalog in .yarnrc.yml for 12 shared dependencies (typescript, vitest, eslint, prettier, tsx, and 7 eslint-related packages)
- Migrated 50 explicit version ranges to catalog: protocol across 14 workspace package.json files
- Normalized version inconsistencies: prettier from ^3.4.2 to ^3.7.4, @eslint/js from ^9.17.0 to ^9.39.1

## Task Commits

Each task was committed atomically:

1. **Task 1: Upgrade Yarn to 4.13.0 and define dependency catalog** - `2d78e3081` (chore)
2. **Task 2: Migrate workspace dependencies to catalog: protocol** - `3cdee320b` (feat)

## Files Created/Modified
- `.yarnrc.yml` - Added catalog section with 12 shared dependency versions, updated yarnPath
- `.yarn/releases/yarn-4.13.0.cjs` - New Yarn 4.13.0 release binary
- `.yarn/releases/yarn-4.6.0.cjs` - Removed old Yarn 4.6.0 release binary
- `package.json` - Updated packageManager to yarn@4.13.0, migrated 6 deps to catalog:
- `.github/workflows/release.yml` - Updated Yarn version from 4.6 to 4.13
- `packages/*/package.json` (9 files) - Migrated typescript, vitest, tsx, and eslint deps to catalog:
- `apps/frontend/package.json` - Migrated 10 deps to catalog:
- `apps/strapi/package.json` - Migrated 5 deps to catalog:
- `apps/strapi/src/plugins/openvaa-admin-tools/package.json` - Migrated prettier, typescript to catalog:
- `apps/docs/package.json` - Migrated 8 deps to catalog: (excluded vitest, globals, typescript)
- `yarn.lock` - Regenerated with catalog-resolved versions

## Decisions Made
- Normalized prettier to ^3.7.4 (was ^3.4.2 in most workspaces, ^3.7.4 in docs) -- highest version wins
- Normalized @eslint/js to ^9.39.1 (was ^9.17.0 in frontend/shared-config, ^9.39.1 in docs) -- highest version wins
- Excluded apps/docs from typescript catalog since docs uses ^5.7.2 (different patch from catalog ^5.7.3)
- Excluded apps/docs from vitest catalog (^4.0.15 vs catalog ^2.1.8 -- different major)
- Excluded apps/docs from globals catalog (^16.5.0 vs catalog ^15.14.0 -- different major)
- Included apps/docs in catalog for eslint-related deps, prettier, tsx where versions are compatible
- Did not include workspace:^ references in catalog (per plan guidance about potential issues)

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Yarn 4.13.0 is active and all builds pass
- Catalog infrastructure is in place for future dependency additions
- Ready for Phase 12 Plan 02 (per-workspace lint/typecheck tasks, Vercel remote cache)

---
*Phase: 12-polish-and-optimization*
*Completed: 2026-03-14*
