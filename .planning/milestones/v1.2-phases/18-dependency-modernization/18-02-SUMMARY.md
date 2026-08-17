---
phase: 18-dependency-modernization
plan: 02
subsystem: infra
tags: [build-verification, vite-6, vitest-3, monorepo, dependency-modernization]

# Dependency graph
requires:
  - phase: 18-dependency-modernization-01
    provides: expanded Yarn catalog with 30 entries, all version bumps applied
provides:
  - verified full monorepo build (13 workspaces) passes after all dependency version bumps
  - verified all unit tests (428 tests across 19 files) pass after dependency modernization
  - Strapi vitest pinned to ^2.1.8 for CJS compatibility (vitest 3 ESM-only config loader)
affects: [19-svelte5-migration, frontend, strapi, packages]

# Tech tracking
tech-stack:
  added: []
  patterns: [cjs-workspace-vitest-pin-for-esm-incompatibility]

key-files:
  created: []
  modified:
    - apps/strapi/package.json
    - yarn.lock

key-decisions:
  - "Strapi vitest pinned to ^2.1.8 overriding catalog ^3.2.4 -- vitest 3 config loader is ESM-only, incompatible with Strapi CJS context"

patterns-established:
  - "CJS workspaces that use catalog vitest 3 must override to vitest 2 if vitest config loading fails with ERR_REQUIRE_ESM"

requirements-completed: [DEP-03]

# Metrics
duration: 3min
completed: 2026-03-16
---

# Phase 18 Plan 02: Build Verification Summary

**Full monorepo build (13 workspaces) and unit tests (428 tests) pass after Vite 5->6, vitest 2->3, jsdom 24->26, jose 5->6, intl-messageformat 10->11, isomorphic-dompurify 2->3 upgrades with one fix for Strapi vitest CJS compatibility**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-16T17:42:19Z
- **Completed:** 2026-03-16T17:45:55Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- Verified all 13 workspace builds pass with zero breakage after dependency version bumps (Vite 6, vitest 3, jsdom 26, jose 6, intl-messageformat 11, isomorphic-dompurify 3, dotenv 17, eslint-config-prettier 10, svelte-eslint-parser 1)
- All 428 unit tests pass across 19 test files (frontend: 417 tests in 17 files, Strapi: 11 tests in 1 file)
- Fixed Strapi vitest CJS incompatibility by pinning vitest to ^2.1.8 (vitest 3's config loader requires ESM which Strapi's CJS context cannot use)
- LLM package builds successfully on ai@5 with no issues
- No Vite 6 migration changes needed -- frontend vite.config.ts works as-is
- No API breakage from jose 6, intl-messageformat 11, or isomorphic-dompurify 3

## Task Commits

Each task was committed atomically:

1. **Task 1: Run yarn build and fix all breakage from version bumps** - No commit (build passed with zero breakage, no changes needed)
2. **Task 2: Run unit tests and verify no regressions from dependency bumps** - `221fdd9f3` (fix)

## Files Created/Modified
- `apps/strapi/package.json` - Pin vitest to ^2.1.8 overriding catalog ^3.2.4 for CJS compatibility
- `yarn.lock` - Regenerated with vitest 2.1.9 for Strapi workspace

## Decisions Made
- Strapi vitest pinned to ^2.1.8 overriding the catalog reference (^3.2.4) because vitest 3 bundles Vite as an ESM-only module and its config loader uses `require()` which fails with ERR_REQUIRE_ESM in Strapi's CJS context. This is the minimal fix; the alternative (adding "type": "module" to Strapi) would be risky for Strapi's CJS runtime.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Strapi vitest 3 ERR_REQUIRE_ESM in CJS context**
- **Found during:** Task 2 (unit test execution)
- **Issue:** vitest 3's config loader (`vitest/dist/config.cjs`) tries to `require()` Vite's ESM-only bundle, failing with ERR_REQUIRE_ESM in Strapi's CJS workspace
- **Fix:** Replaced `"vitest": "catalog:"` with `"vitest": "^2.1.8"` in Strapi's package.json
- **Files modified:** apps/strapi/package.json, yarn.lock
- **Verification:** `yarn test:unit` passes (16/16 tasks successful)
- **Committed in:** 221fdd9f3

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Auto-fix necessary for test suite to run. Strapi's single unit test file still runs on vitest 2 which is fully compatible. No scope creep.

## Issues Encountered
- The plan referenced `apps/strapi/src/util/generateMockData.ts` but the file is at `apps/strapi/src/functions/generateMockData.ts`. This did not matter because Strapi's build succeeded without any TS error fixes needed -- the pre-existing TS errors mentioned in STATE.md blockers do not actually block the build.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Full build pipeline green: `yarn build && yarn test:unit` both pass
- All dependency modernization complete (Phase 18 done)
- Ready for Phase 19 (Svelte 5 migration) or any downstream work
- Strapi builds and its unit tests pass (vitest 2 pinned for CJS compat)
- Frontend builds with Vite 6 + vite-plugin-svelte 5 + vitest 3

## Self-Check: PASSED

All artifacts verified:
- apps/strapi/package.json: FOUND
- 18-02-SUMMARY.md: FOUND
- apps/frontend/.svelte-kit: FOUND
- packages/core/dist/index.js: FOUND
- packages/llm/dist/index.js: FOUND
- Commit 221fdd9f3: FOUND

---
*Phase: 18-dependency-modernization*
*Completed: 2026-03-16*
