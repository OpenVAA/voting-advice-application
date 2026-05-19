---
phase: 11-package-publishing
plan: 01
subsystem: infra
tags: [tsup, esbuild, typescript, build-tooling, esm, cjs]

# Dependency graph
requires:
  - phase: 08-build-orchestration
    provides: Turborepo build pipeline with cached outputs
provides:
  - tsup-based build pipeline for all 8 packages
  - ESM output via tsup for 7 packages, dual ESM+CJS for app-shared
  - tsc declaration-only generation for all packages
  - dist/ output directory convention
affects: [11-02, 11-03, frontend, strapi, docs]

# Tech tracking
tech-stack:
  added: [tsup ^8.5.1]
  patterns: [two-step build (tsup + tsc --emitDeclarationOnly), dist/ output convention]

key-files:
  created:
    - packages/core/tsup.config.ts
    - packages/data/tsup.config.ts
    - packages/matching/tsup.config.ts
    - packages/filters/tsup.config.ts
    - packages/app-shared/tsup.config.ts
    - packages/llm/tsup.config.ts
    - packages/argument-condensation/tsup.config.ts
    - packages/question-info/tsup.config.ts
  modified:
    - turbo.json
    - package.json
    - packages/*/package.json
    - packages/*/tsconfig.json
    - packages/*/.gitignore
    - apps/docs/tsconfig.json
    - apps/frontend/tsconfig.json
    - apps/strapi/tsconfig.json

key-decisions:
  - "tsup produces index.js (ESM) and index.cjs (CJS) in type:module packages -- app-shared exports ./dist/index.js not .mjs"
  - "Added missing project references for llm (app-shared), argument-condensation (app-shared), question-info (app-shared)"
  - "Deleted app-shared's tsconfig.cjs.json and tsconfig.esm.json -- tsup handles dual format from single config"

patterns-established:
  - "Two-step build: tsup for JS bundling + tsc --emitDeclarationOnly for .d.ts generation"
  - "dist/ as output directory for all packages (replaces build/)"
  - "tsup.config.ts at package root with defineConfig pattern"

requirements-completed: [PUB-04]

# Metrics
duration: 7min
completed: 2026-03-13
---

# Phase 11 Plan 01: tsup Build Migration Summary

**Migrated all 8 packages from tsc+tsc-esm-fix to tsup+tsc --emitDeclarationOnly with dist/ output, removing tsc-esm-fix dependency entirely**

## Performance

- **Duration:** 7 min
- **Started:** 2026-03-13T16:13:45Z
- **Completed:** 2026-03-13T16:20:50Z
- **Tasks:** 2
- **Files modified:** 30

## Accomplishments
- All 8 packages build via tsup (esbuild-powered) for fast ESM output
- app-shared produces both ESM (.js) and CJS (.cjs) via single tsup config (replaces dual tsc configs)
- tsc-esm-fix removed from all package devDependencies
- Build output moved from build/ to dist/ across all packages
- All package unit tests pass with new build output

## Task Commits

Each task was committed atomically:

1. **Task 1: Install tsup and create tsup.config.ts for all 8 packages** - `94ff44678` (chore)
2. **Task 2: Update all package.json, tsconfig.json, and .gitignore for dist/ output** - `78788d3e8` (feat)

## Files Created/Modified
- `packages/*/tsup.config.ts` - tsup build configuration (ESM-only for 7, dual ESM+CJS for app-shared)
- `packages/*/package.json` - Updated build scripts, exports, module/types pointing to dist/
- `packages/*/tsconfig.json` - outDir changed to dist/, added declaration+emitDeclarationOnly flags
- `packages/*/.gitignore` - Changed build/ to dist/
- `turbo.json` - Added tsup.config.ts to build inputs
- `package.json` - Added tsup ^8.5.1 as root devDependency
- `apps/docs/tsconfig.json` - Updated reference from tsconfig.esm.json to tsconfig.json
- `apps/frontend/tsconfig.json` - Updated reference from tsconfig.esm.json to tsconfig.json
- `apps/strapi/tsconfig.json` - Updated reference from tsconfig.cjs.json to tsconfig.json
- `packages/app-shared/tsconfig.cjs.json` - Deleted (no longer needed)
- `packages/app-shared/tsconfig.esm.json` - Deleted (no longer needed)

## Decisions Made
- tsup in `type: "module"` packages produces `.js` for ESM and `.cjs` for CJS -- app-shared exports use `./dist/index.js` (import) and `./dist/index.cjs` (require), not `.mjs`
- Added `declaration: true` and `emitDeclarationOnly: true` to all package tsconfigs so tsc only generates .d.ts files
- Added missing project references that were needed for tsc declaration generation but not for the old `tsc --build` chain

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Added missing tsconfig project reference for llm -> app-shared**
- **Found during:** Task 2 (updating package configs)
- **Issue:** llm package imports from @openvaa/app-shared but tsconfig.json only referenced ../core/tsconfig.json, causing tsc --emitDeclarationOnly to fail with TS2307
- **Fix:** Added `{ "path": "../app-shared/tsconfig.json" }` to llm's tsconfig references
- **Files modified:** packages/llm/tsconfig.json
- **Verification:** yarn build passes for all packages
- **Committed in:** 78788d3e8 (Task 2 commit)

**2. [Rule 3 - Blocking] Added missing tsconfig project references for argument-condensation and question-info -> app-shared**
- **Found during:** Task 2 (updating package configs)
- **Issue:** Both packages import from @openvaa/app-shared but tsconfig.json didn't reference it
- **Fix:** Added `{ "path": "../app-shared/tsconfig.json" }` to both packages' tsconfig references
- **Files modified:** packages/argument-condensation/tsconfig.json, packages/question-info/tsconfig.json
- **Verification:** yarn build passes for all packages
- **Committed in:** 78788d3e8 (Task 2 commit)

**3. [Rule 3 - Blocking] Fixed app-shared tsconfig references in docs, frontend, and strapi**
- **Found during:** Task 2 (deleting app-shared's sub-tsconfigs)
- **Issue:** apps/docs referenced tsconfig.esm.json, apps/frontend referenced tsconfig.esm.json, apps/strapi referenced tsconfig.cjs.json -- all deleted
- **Fix:** Updated all three to reference tsconfig.json instead
- **Files modified:** apps/docs/tsconfig.json, apps/frontend/tsconfig.json, apps/strapi/tsconfig.json
- **Verification:** docs build passes; frontend failure is pre-existing (ai dependency issue)
- **Committed in:** 78788d3e8 (Task 2 commit)

**4. [Rule 1 - Bug] Fixed app-shared export paths to match actual tsup output**
- **Found during:** Task 2 (verifying build output)
- **Issue:** Plan specified exports as ./dist/index.mjs but tsup produces ./dist/index.js for ESM in type:module packages
- **Fix:** Changed app-shared exports to ./dist/index.js (import) and ./dist/index.cjs (require)
- **Files modified:** packages/app-shared/package.json
- **Verification:** ls confirms dist/index.js and dist/index.cjs exist
- **Committed in:** 78788d3e8 (Task 2 commit)

---

**Total deviations:** 4 auto-fixed (1 bug, 3 blocking)
**Impact on plan:** All auto-fixes were necessary for the build to work correctly. No scope creep.

## Issues Encountered
- Frontend build fails with `LanguageModelUsage` export error from `ai` dependency -- pre-existing issue unrelated to tsup migration, not caused by our changes
- Strapi build fails with TS2339 errors in `generateMockData.ts` -- pre-existing issue unrelated to our changes

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All packages build with tsup + tsc --emitDeclarationOnly pattern
- Ready for 11-02 (npm metadata and LICENSE files for publishable packages)
- tsc-esm-fix fully removed, dist/ output convention established

## Self-Check: PASSED

All created files verified present. All commits verified in git log. Build outputs (dist/index.js, dist/index.d.ts, dist/index.cjs) confirmed.

---
*Phase: 11-package-publishing*
*Completed: 2026-03-13*
