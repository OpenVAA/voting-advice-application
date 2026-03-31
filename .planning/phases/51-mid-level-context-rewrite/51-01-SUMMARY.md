---
phase: 51-mid-level-context-rewrite
plan: 01
subsystem: ui
tags: [svelte5, runes, state, derived, context, darkmode, dataroot, toStore]

# Dependency graph
requires:
  - phase: 50-leaf-context-rewrite
    provides: I18nContext with plain values (locale, locales, t, translate)
provides:
  - ComponentContext with $state-backed darkMode (plain boolean)
  - DataContext with version counter pattern replacing alwaysNotifyStore
  - Store-compatible dataRoot via toStore() for VoterContext/CandidateContext backward compat
affects: [51-02-appcontext-rewrite, 52-downstream-context-rewrite]

# Tech tracking
tech-stack:
  added: []
  patterns: [version counter for mutable-in-place objects, createDarkMode factory for SSR safety, toStore bridge for backward compat]

key-files:
  created:
    - apps/frontend/src/lib/contexts/component/componentContext.svelte.ts
    - apps/frontend/src/lib/contexts/component/darkMode.svelte.ts
    - apps/frontend/src/lib/contexts/data/dataContext.svelte.ts
  modified:
    - apps/frontend/src/lib/contexts/component/componentContext.type.ts
    - apps/frontend/src/lib/contexts/component/index.ts
    - apps/frontend/src/lib/contexts/data/index.ts
    - apps/frontend/src/lib/components/image/Image.svelte
    - apps/frontend/src/routes/(voters)/(located)/+layout.svelte

key-decisions:
  - "Used createDarkMode() factory with getter object to preserve $state reactivity across context boundary"
  - "DataContext version counter pattern bridges DataRoot.subscribe() to $derived without modifying DataRoot source"
  - "DataContext exposes Readable<DataRoot> store via toStore() for VoterContext/CandidateContext backward compat"
  - "Only Image.svelte needed $darkMode -> darkMode update; other 4 consumers already had plain property access after Phase 50"

patterns-established:
  - "Version counter pattern: $state(0) incremented in subscribe() callback, read by $derived.by() to force re-evaluation for mutable-in-place objects"
  - "Factory function pattern for SSR-safe $state: createDarkMode() called inside initComponentContext(), not at module level"
  - "toStore() bridge: expose $derived values as Readable stores for downstream contexts still using svelte/store derived()"

requirements-completed: [R2.4, R2.5, R2.10, R2.11, R2.12, R3.1, R3.2, R3.3]

# Metrics
duration: 7min
completed: 2026-03-28
---

# Phase 51 Plan 01: ComponentContext + DataContext Rewrite Summary

**ComponentContext with $state-backed darkMode factory and DataContext with version counter pattern replacing alwaysNotifyStore, all exposed as plain values for consumers**

## Performance

- **Duration:** 7 min
- **Started:** 2026-03-28T12:26:33Z
- **Completed:** 2026-03-28T12:33:13Z
- **Tasks:** 2
- **Files modified:** 8 (3 created, 3 deleted, 5 modified)

## Accomplishments
- Replaced module-level darkMode readable() store with SSR-safe createDarkMode() factory using $state
- Eliminated alwaysNotifyStore workaround in DataContext, replaced with version counter pattern ($state + $derived.by)
- DataContext exposes store-compatible Readable<DataRoot> via toStore() for VoterContext/CandidateContext backward compat
- Updated Image.svelte to use plain darkMode (only consumer still using $darkMode store syntax)
- Updated stale TODO comment referencing removed alwaysNotifyStore

## Task Commits

Each task was committed atomically:

1. **Task 1: Rewrite ComponentContext, darkMode, and DataContext to $state/$derived** - `ccdabf3c7` (feat)
2. **Task 2: Update ComponentContext consumer components** - `e77f884ea` (feat)
3. **Chore: Update stale TODO comment** - `d3df0d9b3` (chore)

## Files Created/Modified
- `apps/frontend/src/lib/contexts/component/darkMode.svelte.ts` - New: $state-backed createDarkMode() factory
- `apps/frontend/src/lib/contexts/component/componentContext.svelte.ts` - New: ComponentContext init with plain darkMode via getter
- `apps/frontend/src/lib/contexts/component/componentContext.type.ts` - Updated: darkMode type from typeof darkMode to plain boolean
- `apps/frontend/src/lib/contexts/component/index.ts` - Updated: re-exports from .svelte.ts
- `apps/frontend/src/lib/contexts/data/dataContext.svelte.ts` - New: DataContext with version counter and toStore() bridge
- `apps/frontend/src/lib/contexts/data/index.ts` - Updated: re-exports from .svelte.ts
- `apps/frontend/src/lib/components/image/Image.svelte` - Updated: $darkMode -> darkMode
- `apps/frontend/src/routes/(voters)/(located)/+layout.svelte` - Updated: stale TODO comment

### Deleted Files
- `apps/frontend/src/lib/contexts/component/darkMode.ts` - Old module-level readable() store
- `apps/frontend/src/lib/contexts/component/componentContext.ts` - Old store-based context
- `apps/frontend/src/lib/contexts/data/dataContext.ts` - Old alwaysNotifyStore-based context

## Decisions Made
- **createDarkMode returns getter object:** Returning `{ get current() { return dark } }` preserves $state reactivity when the value is read through the context object's own getter. The primitive $state value would lose reactivity if returned directly.
- **Version counter in DataContext:** `let version = $state(0)` incremented by `dataRoot.subscribe()` callback, read by `$derived.by(() => { void version; return dataRoot })`. This bridges DataRoot's imperative mutation notifications to Svelte 5's signal-based reactivity without modifying DataRoot source code.
- **toStore() for backward compat:** DataContext still exposes `Readable<DataRoot>` for VoterContext and CandidateContext which use `derived()` from svelte/store. Phase 52 will remove this bridge.
- **4 of 5 consumers already updated:** Phase 50's I18nContext rewrite already converted locale/locales to plain values in Input, Video, LanguageSelector, and SingleGroupConstituencySelector. Only Image.svelte still used `$darkMode` store syntax.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Updated stale TODO comment referencing alwaysNotifyStore**
- **Found during:** Task 2 (overall verification)
- **Issue:** `+layout.svelte` had a TODO comment referencing the now-removed `alwaysNotifyStore` workaround
- **Fix:** Updated comment to reflect that dataContext now uses native reactivity
- **Files modified:** `apps/frontend/src/routes/(voters)/(located)/+layout.svelte`
- **Verification:** Comment updated, build passes
- **Committed in:** `d3df0d9b3`

---

**Total deviations:** 1 auto-fixed (1 stale comment)
**Impact on plan:** Minimal. Comment-only change for documentation accuracy.

## Issues Encountered
- Worktree had Svelte 4 installed from main branch's node_modules. Required `yarn install` to get Svelte 5.53.12 (from yarn.lock) before toStore() was available.

## Known Stubs
None -- all functionality is fully wired.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- ComponentContext and DataContext are fully migrated to runes
- AppContext (Plan 02) can now spread these contexts and add its own $state/$derived properties
- VoterContext/CandidateContext backward compat maintained via toStore() bridge on dataRoot

## Self-Check: PASSED

All created files exist. All commits verified. All deleted files confirmed removed. Build succeeds. 613 unit tests pass.

---
*Phase: 51-mid-level-context-rewrite*
*Completed: 2026-03-28*
