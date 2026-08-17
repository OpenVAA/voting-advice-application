---
phase: 21-migration-cleanup
plan: 01
subsystem: frontend
tags: [svelte5, typescript, migration, dead-code, type-fixes]

# Dependency graph
requires:
  - phase: 19-validation
    provides: Svelte 5 migration with alwaysNotifyStore and DataRoot subscription pattern
provides:
  - Clean dataContext.ts without dead paramStore('lang') migration code
  - All 9 migration-introduced TypeScript errors resolved across 5 files
affects: [frontend, data-context, i18n]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Local type definitions for Svelte 5 removed exports (Stores/StoresValues)"
    - "Double assertion (as unknown as T) for Paraglide module type compatibility"
    - "readonly array types for Paraglide locale tuples"

key-files:
  created: []
  modified:
    - apps/frontend/src/lib/contexts/data/dataContext.ts
    - apps/frontend/src/lib/contexts/utils/parsimoniusDerived.ts
    - apps/frontend/src/lib/i18n/wrapper.ts
    - apps/frontend/src/lib/contexts/i18n/i18nContext.type.ts
    - apps/frontend/src/lib/utils/route/buildRoute.ts

key-decisions:
  - "Svelte 5 Stores/StoresValues types defined locally matching Svelte internals rather than importing from alternate path"
  - "Double assertion via unknown for Paraglide message module cast (safer than @ts-ignore)"
  - "readonly string[] for locales type aligning with Paraglide's readonly tuple export"

patterns-established:
  - "Local type definitions: When Svelte 5 removes exports, define locally matching internal types"
  - "Type widening assertions: Use 'as string' for strict generated union types in dynamic contexts"

requirements-completed: [CLEAN-01, CLEAN-02]

# Metrics
duration: 3min
completed: 2026-03-18
---

# Phase 21 Plan 01: Migration Cleanup Summary

**Removed paramStore('lang') dead code from dataContext.ts and resolved all 9 migration-introduced TypeScript errors across 5 frontend files**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-18T13:07:23Z
- **Completed:** 2026-03-18T13:10:08Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments
- Removed 25 lines of dead paramStore('lang') code from dataContext.ts while preserving DataRoot subscription
- Fixed 2 TypeScript errors in parsimoniusDerived.ts by defining Stores/StoresValues types locally
- Fixed 1 error in wrapper.ts with safe double assertion for Paraglide message module
- Fixed 1 error in i18nContext.type.ts with readonly string[] for Paraglide locale tuple
- Fixed 2 errors in buildRoute.ts with type assertions for resolveRoute and localizeHref
- Resolved 1 cascading error in LanguageSelection.svelte via the i18nContext.type.ts fix
- Build passes cleanly with no regressions

## Task Commits

Each task was committed atomically:

1. **Task 1: Remove paramStore('lang') dead code from dataContext.ts** - `83ed869eb` (fix)
2. **Task 2: Fix 7 remaining migration-introduced TypeScript errors** - `fcaf65d9e` (fix)

**Plan metadata:** [pending] (docs: complete 21-01 plan)

## Files Created/Modified
- `apps/frontend/src/lib/contexts/data/dataContext.ts` - Removed dead paramStore('lang') import, unsubscribers array, and locale-change subscription block; preserved direct dataRoot.subscribe call
- `apps/frontend/src/lib/contexts/utils/parsimoniusDerived.ts` - Replaced missing Svelte 5 Stores/StoresValues imports with local type definitions
- `apps/frontend/src/lib/i18n/wrapper.ts` - Added double assertion (as unknown as MessageModule) for Paraglide module type safety
- `apps/frontend/src/lib/contexts/i18n/i18nContext.type.ts` - Changed locales type from Readable<Array<string>> to Readable<readonly string[]>
- `apps/frontend/src/lib/utils/route/buildRoute.ts` - Added type assertions for resolveRoute routeId and localizeHref locale parameter

## Decisions Made
- Defined Stores/StoresValues locally rather than importing from an alternate Svelte path -- keeps dependency on official svelte/store module
- Used double assertion (as unknown as MessageModule) instead of @ts-ignore -- maintains type safety while accommodating Paraglide's nested namespace structure
- Used readonly string[] instead of string[] for locales -- correctly reflects Paraglide's readonly tuple export and resolves downstream LanguageSelection.svelte error

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All migration-introduced TypeScript errors resolved
- Codebase is clean of Svelte 5 migration artifacts
- Pre-existing errors (75) remain untouched -- out of scope

## Self-Check: PASSED

All 5 modified files verified on disk. Both task commits (83ed869eb, fcaf65d9e) verified in git log.

---
*Phase: 21-migration-cleanup*
*Completed: 2026-03-18*
