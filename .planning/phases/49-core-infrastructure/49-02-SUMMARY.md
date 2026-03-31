---
phase: 49-core-infrastructure
plan: 02
subsystem: ui
tags: [svelte5, runes, derived, memoizedDerived, persistedState, StackedState, store-migration]

# Dependency graph
requires:
  - phase: 49-01
    provides: persistedState.svelte.ts, StackedState.svelte.ts, memoizedDerived.ts utility files
provides:
  - All 16+ consumer files rewired to new Svelte 5 utilities
  - Old parsimoniusDerived.ts, storageStore.ts, stackedStore.ts deleted
  - Zero legacy utility imports remaining in codebase
affects: [phase-50, phase-51, phase-52, phase-53]

# Tech tracking
tech-stack:
  added: []
  patterns: [native derived() replaces parsimoniusDerived for non-memoized call sites, memoizedDerived for differenceChecker sites, StackedState class constructor replaces stackedStore factory]

key-files:
  created: []
  modified:
    - apps/frontend/src/lib/contexts/utils/questionStore.ts
    - apps/frontend/src/lib/contexts/utils/questionCategoryStore.ts
    - apps/frontend/src/lib/contexts/utils/questionBlockStore.ts
    - apps/frontend/src/lib/contexts/utils/dataCollectionStore.ts
    - apps/frontend/src/lib/contexts/utils/paramStore.ts
    - apps/frontend/src/lib/contexts/utils/pageDatumStore.ts
    - apps/frontend/src/lib/contexts/voter/voterContext.ts
    - apps/frontend/src/lib/contexts/voter/matchStore.ts
    - apps/frontend/src/lib/contexts/voter/nominationAndQuestionStore.ts
    - apps/frontend/src/lib/contexts/voter/filters/filterStore.ts
    - apps/frontend/src/lib/contexts/admin/jobStores.ts
    - apps/frontend/src/lib/contexts/candidate/candidateContext.ts
    - apps/frontend/src/lib/utils/hashIds.ts
    - apps/frontend/src/lib/contexts/voter/answerStore.ts
    - apps/frontend/src/lib/contexts/app/appContext.ts
    - apps/frontend/src/lib/contexts/app/tracking/trackingService.ts
    - apps/frontend/src/lib/contexts/candidate/candidateUserDataStore.ts
    - apps/frontend/src/lib/contexts/layout/layoutContext.ts
    - apps/frontend/src/lib/contexts/layout/layoutContext.type.ts

key-decisions:
  - "Native derived() for 23 call sites without differenceChecker -- no memoization needed for these"
  - "memoizedDerived for 5 call sites with differenceChecker -- preserves existing optimization behavior"
  - "initialValue moved from options object to positional 3rd arg for native derived() API compatibility"

patterns-established:
  - "Store migration pattern: import path swap for identical APIs (storageStore -> persistedState.svelte)"
  - "Constructor migration pattern: stackedStore(args) -> new StackedState(args) for class-based replacements"

requirements-completed: [R1.1, R1.4]

# Metrics
duration: 6min
completed: 2026-03-27
---

# Phase 49 Plan 02: Consumer Migration and Old File Deletion Summary

**All 16+ consumer files rewired from parsimoniusDerived/storageStore/stackedStore to native derived(), memoizedDerived, persistedState.svelte, and StackedState.svelte -- 3 old utility files deleted, build green, 613 tests passing**

## Performance

- **Duration:** 6 min
- **Started:** 2026-03-27T21:24:48Z
- **Completed:** 2026-03-27T21:31:06Z
- **Tasks:** 2
- **Files modified:** 19 (+ 3 deleted)

## Accomplishments
- Migrated 23 parsimoniusDerived call sites (no differenceChecker) to native `derived()` from svelte/store across 9 files
- Migrated 5 parsimoniusDerived call sites (with differenceChecker) to `memoizedDerived()` across 3 files
- Migrated 6 storageStore consumers to persistedState.svelte (import path change only, identical API)
- Migrated 2 stackedStore consumers to StackedState.svelte (import + `new StackedState` constructor)
- Deleted 3 old utility files: parsimoniusDerived.ts, storageStore.ts, stackedStore.ts
- Frontend build succeeds, all 613 unit tests pass

## Task Commits

Each task was committed atomically:

1. **Task 1: Migrate parsimoniusDerived consumers to derived/memoizedDerived** - `73b145f70` (feat)
2. **Task 2: Migrate storageStore/stackedStore consumers, delete old files, verify build** - `4e976a54a` (feat)

## Files Created/Modified
- `apps/frontend/src/lib/contexts/utils/questionStore.ts` - parsimoniusDerived -> derived
- `apps/frontend/src/lib/contexts/utils/questionCategoryStore.ts` - parsimoniusDerived -> derived (3 call sites)
- `apps/frontend/src/lib/contexts/utils/questionBlockStore.ts` - parsimoniusDerived -> derived, initialValue unwrapped
- `apps/frontend/src/lib/contexts/utils/dataCollectionStore.ts` - parsimoniusDerived -> derived
- `apps/frontend/src/lib/contexts/utils/paramStore.ts` - parsimoniusDerived -> memoizedDerived (differenceChecker: JSON.stringify)
- `apps/frontend/src/lib/contexts/utils/pageDatumStore.ts` - parsimoniusDerived -> memoizedDerived (differenceChecker: JSON.stringify)
- `apps/frontend/src/lib/contexts/voter/voterContext.ts` - parsimoniusDerived -> derived (11 call sites), storageStore -> persistedState.svelte
- `apps/frontend/src/lib/contexts/voter/matchStore.ts` - parsimoniusDerived -> derived
- `apps/frontend/src/lib/contexts/voter/nominationAndQuestionStore.ts` - parsimoniusDerived -> derived
- `apps/frontend/src/lib/contexts/voter/filters/filterStore.ts` - parsimoniusDerived -> derived
- `apps/frontend/src/lib/contexts/admin/jobStores.ts` - parsimoniusDerived -> derived (3 call sites), combined duplicate svelte/store imports
- `apps/frontend/src/lib/contexts/candidate/candidateContext.ts` - parsimoniusDerived -> memoizedDerived (3 call sites with hashIds differenceChecker), storageStore -> persistedState.svelte
- `apps/frontend/src/lib/utils/hashIds.ts` - Updated JSDoc to reference memoizedDerived
- `apps/frontend/src/lib/contexts/voter/answerStore.ts` - storageStore -> persistedState.svelte
- `apps/frontend/src/lib/contexts/app/appContext.ts` - storageStore -> persistedState.svelte
- `apps/frontend/src/lib/contexts/app/tracking/trackingService.ts` - storageStore -> persistedState.svelte
- `apps/frontend/src/lib/contexts/candidate/candidateUserDataStore.ts` - storageStore -> persistedState.svelte
- `apps/frontend/src/lib/contexts/layout/layoutContext.ts` - stackedStore -> new StackedState (3 call sites)
- `apps/frontend/src/lib/contexts/layout/layoutContext.type.ts` - StackedStore type -> StackedState type (3 type references)
- DELETED: `apps/frontend/src/lib/contexts/utils/parsimoniusDerived.ts`
- DELETED: `apps/frontend/src/lib/contexts/utils/storageStore.ts`
- DELETED: `apps/frontend/src/lib/contexts/utils/stackedStore.ts`

## Decisions Made
- **Native derived() for non-memoized sites:** The 23 call sites without `differenceChecker` option were using parsimoniusDerived's deep equality check unnecessarily. Native `derived()` is simpler and sufficient since these stores don't produce structurally-equal-but-referentially-different values that cause unnecessary rerenders.
- **initialValue as positional arg:** Native `derived()` takes initialValue as a direct 3rd positional argument, not inside an `{initialValue}` options object. All call sites were updated accordingly.
- **Combined duplicate svelte/store imports:** In jobStores.ts, the new `derived` import was merged with the existing `writable` import from `svelte/store` rather than adding a duplicate import line.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
- Node modules not installed in worktree -- resolved with `yarn install` before build verification.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Phase 49 is fully complete: all 3 new utility files created (Plan 01) and all consumers migrated (Plan 02)
- The codebase has zero imports of parsimoniusDerived, storageStore, or stackedStore
- Build is green, all 613 unit tests pass
- Ready for Phase 50 (context system rewrite) which will use these new utilities as the foundation

## Self-Check: PASSED

All commits verified in git log. All 3 old utility files confirmed deleted. All 3 new utility files confirmed present. SUMMARY.md verified present.

---
*Phase: 49-core-infrastructure*
*Completed: 2026-03-27*
