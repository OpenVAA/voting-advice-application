---
phase: 08-infrastructure-setup
plan: 02
subsystem: infra
tags: [supabase, typescript, codegen, types, workspace]

# Dependency graph
requires:
  - phase: 08-01
    provides: "Supabase CLI workspace with running local dev stack"
provides:
  - "@openvaa/supabase-types workspace with generate script and generated Database types"
  - "Root alias yarn supabase:types for type regeneration"
  - "Type-safe Supabase access via Database, Tables, TablesInsert, TablesUpdate, Enums, CompositeTypes helpers"
affects: [08-03, 09-schema, frontend-adapter]

# Tech tracking
tech-stack:
  added: [supabase-gen-types]
  patterns: [raw-ts-source-package, type-generation-pipeline]

key-files:
  created:
    - packages/supabase-types/package.json
    - packages/supabase-types/tsconfig.json
    - packages/supabase-types/src/database.ts
    - packages/supabase-types/src/index.ts
  modified:
    - package.json
    - yarn.lock

key-decisions:
  - "Export raw .ts source (no build step) -- SvelteKit Vite handles TS imports directly"
  - "Re-export all generated helper types (Tables, TablesInsert, TablesUpdate, Enums, CompositeTypes, Constants) not just Database and Json"

patterns-established:
  - "Type generation: supabase gen types with --workdir pointing to apps/supabase, output to packages/supabase-types/src/database.ts"
  - "Raw TS packages: noEmit in tsconfig, no build script, exports point to .ts source"

requirements-completed: [INFRA-04]

# Metrics
duration: 3min
completed: 2026-03-12
---

# Phase 8 Plan 02: Supabase Type Generation Summary

**@openvaa/supabase-types package with auto-generated Database types from local Supabase stack via supabase gen types CLI**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-12T18:16:26Z
- **Completed:** 2026-03-12T18:19:08Z
- **Tasks:** 1
- **Files modified:** 6

## Accomplishments
- Created @openvaa/supabase-types workspace exporting raw TypeScript source (no build step needed)
- Configured type generation pipeline using `supabase gen types typescript --local --workdir` with prettier formatting
- Generated actual Database types from running local Supabase stack (includes graphql_public and public schemas)
- Barrel index.ts re-exports all generated helper types: Database, Json, Tables, TablesInsert, TablesUpdate, Enums, CompositeTypes, Constants
- Added root alias `yarn supabase:types` for convenient regeneration

## Task Commits

Each task was committed atomically:

1. **Task 1: Create @openvaa/supabase-types package with generation pipeline** - `318e4693b` (feat)

## Files Created/Modified
- `packages/supabase-types/package.json` - @openvaa/supabase-types workspace with generate script and no-op build
- `packages/supabase-types/tsconfig.json` - TypeScript config extending shared base with noEmit for type-checking only
- `packages/supabase-types/src/database.ts` - Generated Database type from Supabase CLI with Tables/Insert/Update helpers
- `packages/supabase-types/src/index.ts` - Barrel re-export of all generated types and Constants value
- `package.json` - Added supabase:types root alias script
- `yarn.lock` - Updated with supabase-types workspace resolution

## Decisions Made
- Exported raw `.ts` source instead of compiled `.js` -- SvelteKit's Vite bundler handles TypeScript imports directly, so a compile step would add complexity without benefit. A build step can be added later if a non-Vite consumer needs it.
- Re-exported all generated helper types (Tables, TablesInsert, TablesUpdate, Enums, CompositeTypes) and the Constants value, not just the minimal Database and Json types from the plan. These helpers are the standard Supabase patterns for typed queries.
- Used `noEmit: true` in tsconfig to enforce type-checking without emitting JS files, consistent with the raw-source approach.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] Re-exported all generated helper types**
- **Found during:** Task 1 (index.ts creation)
- **Issue:** Plan specified re-exporting only Database and Json, but the generated file also exports Tables, TablesInsert, TablesUpdate, Enums, CompositeTypes types and a Constants value that downstream consumers need
- **Fix:** Updated index.ts to re-export all exported types and the Constants value
- **Files modified:** packages/supabase-types/src/index.ts
- **Verification:** TypeScript check passes with `tsc --noEmit`
- **Committed in:** 318e4693b (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 missing critical)
**Impact on plan:** Essential for downstream usability. No scope creep -- these are standard Supabase type exports.

## Issues Encountered
None

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Type generation pipeline is operational; running `yarn supabase:types` regenerates types from the current database schema
- Package is ready for consumption by frontend adapters and any other workspace package via `@openvaa/supabase-types`
- Once schema migrations are added in Phase 9, re-running type generation will produce typed interfaces for all tables

## Self-Check: PASSED

All files verified present. All commits verified in git log.

---
*Phase: 08-infrastructure-setup*
*Completed: 2026-03-12*
