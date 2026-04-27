---
phase: 42-runtime-validation-and-poc
plan: 01
subsystem: infra
tags: [deno, runtime, testing, poc, hybrid-workspace]

# Dependency graph
requires: []
provides:
  - Deno 2.x installed and verified
  - Root deno.json with workspace config and nodeModulesDir manual
  - packages/core/deno.json with @std/testing and @std/expect imports
  - 3 Deno-native test files for @openvaa/core (missingValue, distance, getEntity)
  - Validated Turborepo/Changesets/tsup coexistence with deno.json files
affects: [42-02, 43-evaluation, 44-report]

# Tech tracking
tech-stack:
  added: [deno-2.7.8, "@std/testing@^1", "@std/expect@^1"]
  patterns: [deno-workspace-hybrid, sloppy-imports-for-node-compat, deno-test-bdd]

key-files:
  created:
    - deno.json
    - deno.lock
    - packages/core/deno.json
    - packages/core/tests_deno/missingValue.test.ts
    - packages/core/tests_deno/distance.test.ts
    - packages/core/tests_deno/getEntity.test.ts
  modified: []

key-decisions:
  - "sloppy-imports enabled in root deno.json for Node-style extensionless imports"
  - "compilerOptions.lib set to deno.window+es2022 for Deno globals (console) in type checking"
  - "deno.lock committed to track JSR dependency versions"

patterns-established:
  - "Hybrid workspace: deno.json + package.json coexist at both root and package levels"
  - "Deno tests live in tests_deno/ directory parallel to src/, using .ts extensions for imports"
  - "nodeModulesDir: manual ensures Deno reads yarn-managed node_modules without creating its own"

requirements-completed: [VAL-03, VAL-04, POC-01, POC-02, POC-03]

# Metrics
duration: 6min
completed: 2026-03-26
---

# Phase 42 Plan 01: Deno PoC Summary

**Deno 2.7.8 hybrid workspace with 17 passing deno tests for @openvaa/core, validated Turborepo/Changesets/tsup coexistence**

## Performance

- **Duration:** 6 min
- **Started:** 2026-03-26T15:34:06Z
- **Completed:** 2026-03-26T15:40:10Z
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments
- Installed Deno 2.7.8 and created hybrid workspace configuration (deno.json at root + packages/core)
- Ported 17 @openvaa/core tests to Deno-native test runner (12 missingValue + 4 distance + 6 getEntity via BDD)
- Validated all 5 requirements: POC-01 (deno test passes), POC-02 (deno check resolves imports), POC-03 (tsup build works), VAL-03 (Turborepo unaffected), VAL-04 (Changesets unaffected)

## Task Commits

Each task was committed atomically:

1. **Task 1: Install Deno and create hybrid workspace configuration** - `4cc5e99c0` (feat)
2. **Task 2: Port @openvaa/core tests to deno test and validate PoC** - `e93e43496` (feat)

## Files Created/Modified
- `deno.json` - Root Deno workspace config with workspace members, nodeModulesDir: manual, sloppy-imports
- `deno.lock` - Lockfile for JSR dependencies (@std/testing, @std/expect)
- `packages/core/deno.json` - Package-level Deno config with test imports and compiler options
- `packages/core/tests_deno/missingValue.test.ts` - 12 Deno-native tests for isEmptyValue
- `packages/core/tests_deno/distance.test.ts` - 4 Deno-native tests for normalizeCoordinate
- `packages/core/tests_deno/getEntity.test.ts` - 6 Deno-native tests using BDD describe/it pattern

## Decisions Made
- **sloppy-imports for Node compatibility:** Source code uses extensionless imports (Node/bundler style). Deno's `unstable: ["sloppy-imports"]` in root deno.json allows `deno check` to resolve these without modifying source files
- **compilerOptions.lib for Deno globals:** Added `["deno.window", "es2022"]` to packages/core/deno.json because the shared tsconfig base only includes `es2022` which lacks `console` -- Deno's type checker is stricter than Node about global availability
- **deno.lock committed:** Tracks exact versions of JSR dependencies for reproducible builds, analogous to yarn.lock for npm packages

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Added compilerOptions.lib for Deno globals**
- **Found during:** Task 2 (deno check validation)
- **Issue:** `deno check packages/core/src/index.ts` failed with "Cannot find name 'console'" because the shared tsconfig base uses `lib: ["es2022"]` which doesn't include DOM/Deno globals
- **Fix:** Added `"compilerOptions": { "lib": ["deno.window", "es2022"] }` to packages/core/deno.json
- **Files modified:** packages/core/deno.json
- **Verification:** `deno check packages/core/src/index.ts` exits 0
- **Committed in:** e93e43496 (Task 2 commit)

**2. [Rule 3 - Blocking] Added sloppy-imports for Node-style extensionless imports**
- **Found during:** Task 2 (deno check validation)
- **Issue:** Source files use extensionless imports (`from './distance'` not `from './distance.ts'`), which Deno rejects by default
- **Fix:** Added `"unstable": ["sloppy-imports"]` to root deno.json (must be in workspace root, not member)
- **Files modified:** deno.json
- **Verification:** `deno check packages/core/src/index.ts` exits 0 without `--sloppy-imports` flag
- **Committed in:** e93e43496 (Task 2 commit)

---

**Total deviations:** 2 auto-fixed (2 blocking)
**Impact on plan:** Both auto-fixes were necessary for `deno check` to succeed with the existing Node-style source code. No scope creep -- these are standard Deno configuration for hybrid Node/Deno workspaces.

## Issues Encountered
None beyond the auto-fixed deviations above.

## User Setup Required
None - no external service configuration required. Deno is installed locally via the standard install script.

## Next Phase Readiness
- Deno hybrid workspace foundation is ready for Phase 42-02 (SvelteKit + integration validation)
- Key findings for future phases: sloppy-imports needed for all Node-style packages; compilerOptions.lib needed for packages using console/DOM globals
- Changesets still recognizes all packages correctly with deno.json present

## Self-Check: PASSED

All 7 created files verified on disk. Both task commits (4cc5e99c0, e93e43496) verified in git history.

---
*Phase: 42-runtime-validation-and-poc*
*Completed: 2026-03-26*
