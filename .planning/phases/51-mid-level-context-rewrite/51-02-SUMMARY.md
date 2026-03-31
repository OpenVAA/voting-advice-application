---
phase: 51-mid-level-context-rewrite
plan: 02
subsystem: ui
tags: [svelte5, runes, state, derived, context, appcontext, toStore, fromStore, pageDatumStore]

# Dependency graph
requires:
  - phase: 51-mid-level-context-rewrite
    plan: 01
    provides: ComponentContext with plain values, DataContext with toStore bridge
provides:
  - AppContext with $state/$derived internals + toStore bridges for downstream contexts
  - Tracking service with $state for sendTrackingEvent, $derived for shouldTrack
  - Survey link with $derived.by and fromStore/toStore bridges
  - Popup queue with $state for queue, $derived for firstItem
affects: [52-downstream-context-rewrite]

# Tech tracking
tech-stack:
  added: []
  patterns: [fromStore/toStore bridge for accepting Readable inputs and exposing store-typed outputs, $effect replacing pageDatumStore subscriptions, Omit + intersection type for overriding plain values with store types]

key-files:
  created:
    - apps/frontend/src/lib/contexts/app/appContext.svelte.ts
    - apps/frontend/src/lib/contexts/app/tracking/trackingService.svelte.ts
    - apps/frontend/src/lib/contexts/app/survey.svelte.ts
    - apps/frontend/src/lib/contexts/app/popup/popupStore.svelte.ts
  modified:
    - apps/frontend/src/lib/contexts/app/appContext.type.ts
    - apps/frontend/src/lib/contexts/app/index.ts
    - apps/frontend/src/lib/contexts/app/tracking/index.ts
    - apps/frontend/src/lib/contexts/app/popup/index.ts

key-decisions:
  - "AppContext uses toStore() wrappers for all mutable/computed state to maintain store-typed interface for downstream contexts"
  - "pageDatumStore subscriptions replaced with $effect reading page.data directly via $app/state (per D-02)"
  - "ComponentContext plain values (locale, locales, darkMode) wrapped as Readable stores in AppContext for VoterContext/CandidateContext backward compat"
  - "AppContext type uses Omit<ComponentContext, locale|locales|darkMode> + Readable overrides to express store-wrapped values"
  - "trackingService accepts Readable inputs via fromStore() and exposes store outputs via toStore() for bidirectional interop"

patterns-established:
  - "$effect for page.data reactivity: replaces pageDatumStore subscription pattern with direct $effect watching page.data properties"
  - "fromStore/toStore bridge pattern: accept store-typed inputs via fromStore(), create $derived from .current, expose via toStore()"
  - "Omit + intersection for type overrides: Omit plain properties from spread type, add store-typed versions in intersection"

requirements-completed: [R2.6, R2.10, R2.11, R2.12, R3.1, R3.2, R3.3]

# Metrics
duration: 7min
completed: 2026-03-28
---

# Phase 51 Plan 02: AppContext Rewrite Summary

**AppContext with $state/$derived internals, pageDatumStore eliminated via $effect on page.data, store bridges for all downstream-consumed properties**

## Performance

- **Duration:** 7 min
- **Started:** 2026-03-28T12:40:06Z
- **Completed:** 2026-03-28T12:47:10Z
- **Tasks:** 2
- **Files modified:** 8 (4 created, 4 deleted, 4 modified)

## Accomplishments
- Rewrote AppContext main module from writable/derived to $state/$derived with toStore() bridges
- Eliminated pageDatumStore subscriptions, replaced with $effect reading page.data directly via $app/state
- Wrapped ComponentContext plain values (locale, locales, darkMode) as Readable stores for downstream context compat
- Rewrote trackingService to use $state for sendTrackingEvent, $derived for shouldTrack, fromStore() for input stores
- Rewrote surveyLink to use $derived.by with fromStore/toStore bridges
- Rewrote popupStore to use $state for queue, $derived for firstItem, toStore for subscribe interface
- Updated AppContext type with Omit + intersection pattern for store-typed overrides
- All 613 unit tests pass, build succeeds

## Task Commits

Each task was committed atomically:

1. **Task 1: Rewrite sub-modules (tracking, survey, popup)** - `50dbae08d` (feat)
2. **Task 2: Rewrite AppContext main module with pageDatumStore refactor** - `0476662e7` (feat)

## Files Created/Modified
- `apps/frontend/src/lib/contexts/app/appContext.svelte.ts` - New: AppContext with $state/$derived internals + toStore bridges
- `apps/frontend/src/lib/contexts/app/appContext.type.ts` - Updated: Omit<ComponentContext, ...> + Readable overrides for store-wrapped values
- `apps/frontend/src/lib/contexts/app/index.ts` - Updated: re-exports from .svelte.ts
- `apps/frontend/src/lib/contexts/app/tracking/trackingService.svelte.ts` - New: $state/$derived tracking with fromStore/toStore bridges
- `apps/frontend/src/lib/contexts/app/tracking/index.ts` - Updated: re-exports from .svelte.ts
- `apps/frontend/src/lib/contexts/app/survey.svelte.ts` - New: $derived.by survey link with fromStore/toStore bridges
- `apps/frontend/src/lib/contexts/app/popup/popupStore.svelte.ts` - New: $state queue, $derived firstItem, toStore subscribe
- `apps/frontend/src/lib/contexts/app/popup/index.ts` - Updated: re-exports from .svelte.ts

### Deleted Files
- `apps/frontend/src/lib/contexts/app/appContext.ts` - Old writable/derived-based context
- `apps/frontend/src/lib/contexts/app/tracking/trackingService.ts` - Old writable/derived tracking service
- `apps/frontend/src/lib/contexts/app/survey.ts` - Old derived survey link
- `apps/frontend/src/lib/contexts/app/popup/popupStore.ts` - Old writable/derived popup store

## Decisions Made
- **toStore() for all mutable state:** All $state values (appType, appSettings, appCustomization, openFeedbackModal, sendTrackingEvent) are wrapped via `toStore(() => value, (v) => { value = v })` to produce Writable<T> for downstream contexts still using svelte/store `derived()`.
- **pageDatumStore replaced with $effect:** Instead of `pageDatumStore('appSettingsData').subscribe(...)`, use `$effect(() => { const data = page.data?.appSettingsData; ... })` reading directly from `$app/state`'s `page` object. This eliminates the intermediate memoizedDerived layer.
- **ComponentContext values wrapped as stores:** `locale`, `locales`, and `darkMode` are plain values from ComponentContext but downstream contexts (VoterContext, CandidateContext) use them in `derived([locale, ...])` calls. Wrapping via `toStore(() => componentCtx.locale)` produces `Readable<string>` that has `.subscribe()` for store compat.
- **AppContext type uses Omit + intersection:** `Omit<ComponentContext, 'locale' | 'locales' | 'darkMode'> & DataContext & TrackingService & { locale: Readable<string>; ... }` cleanly expresses that plain values are overridden with store-wrapped versions.
- **fromStore() for store inputs in trackingService:** Since trackingService receives Readable<AppSettings> and Readable<UserPreferences>, `fromStore()` converts these to reactive `.current` properties for use in `$derived` expressions.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None - all files existed as expected, build passed on first attempt for both tasks.

## Known Stubs
None -- all functionality is fully wired. Pre-existing TODOs ("Handle merging so that empty objects do not overwrite defaults", "Refactor when Cand App is refactored") are carried forward from original code unchanged.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- AppContext is fully migrated to $state/$derived with toStore() bridges
- All sub-modules (tracking, survey, popup) use runes internally
- pageDatumStore no longer imported by AppContext (dead code, can be cleaned up)
- Downstream contexts (VoterContext, CandidateContext, AdminContext) build successfully with store-typed AppContext properties
- Phase 52 can now rewrite VoterContext/CandidateContext/AdminContext to use $state/$derived, removing the toStore() bridges

## Self-Check: PASSED

All created files exist. All commits verified. All deleted files confirmed removed. Build succeeds. 613 unit tests pass.

---
*Phase: 51-mid-level-context-rewrite*
*Completed: 2026-03-28*
