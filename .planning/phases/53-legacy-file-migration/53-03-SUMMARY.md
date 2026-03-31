---
phase: 53-legacy-file-migration
plan: 03
subsystem: frontend-root-layout
tags: [svelte5, runes, migration, root-layout, fromStore]
dependency_graph:
  requires: [53-01, 53-02]
  provides: [runes-root-layout, zero-legacy-syntax-gate]
  affects: [apps/frontend/src/routes/+layout.svelte]
tech_stack:
  added: []
  patterns: [fromStore-bridge-for-root-layout, $effect-visibility-change-dom-api, $effect-async-data-loading]
key_files:
  created: []
  modified:
    - apps/frontend/src/routes/+layout.svelte
decisions:
  - "Used fromStore() bridge for all store-based context values (appSettings, dataRoot, openFeedbackModal, sendTrackingEvent) since AppContext still exposes toStore() wrappers"
  - "Replaced svelte-visibility-change third-party component with direct DOM visibilitychange $effect (6 lines, eliminates both <svelte:component> and on:hidden)"
  - "Used store.set() for writing to Writable stores (sendTrackingEventStore.set(), openFeedbackModalStore.set()) instead of fromStore .current assignment"
metrics:
  duration: 3m
  completed: 2026-03-28T14:15:38Z
  tasks_completed: 2
  tasks_total: 2
  files_modified: 1
requirements-completed: [R5.1, R5.4, R5.5, R5.6]
---

# Phase 53 Plan 03: Root +layout.svelte Migration Summary

**Migrated root +layout.svelte (highest-risk file, 176 lines) to Svelte 5 runes with fromStore() bridge, DOM API visibility tracking, and verified zero legacy syntax across all route files**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-28T14:12:33Z
- **Completed:** 2026-03-28T14:15:38Z
- **Tasks:** 2/2
- **Files modified:** 1 (apps/frontend/src/routes/+layout.svelte)

## Accomplishments

- Full runes rewrite of root +layout.svelte in a single pass per D-01
- Replaced `export let data: LayoutData` with `$props()` including `children: Snippet`
- Converted 4 `$:` reactive blocks to `$effect()` with `$state` variables for `error`, `ready`, `underMaintenance`
- Replaced all `$store` subscriptions with `fromStore()` bridge pattern for `appSettings`, `dataRoot`, `openFeedbackModal`, `sendTrackingEvent`
- Replaced `<slot />` with `{@render children?.()}`
- Replaced `<svelte:component this={UmamiAnalytics.default}>` with direct `<UmamiAnalytics.default>` rendering per D-02
- Replaced `svelte-visibility-change` third-party component + `on:hidden` event with a 6-line `$effect` using the standard DOM `visibilitychange` API
- Verified zero Svelte 4 syntax in all route .svelte files (0 `<slot>`, 0 `$:`, 0 `export let`, 0 `on:event`, 0 `<svelte:component>`)
- Build succeeds with zero errors
- All 613 unit tests pass (33 test files)

## Task Commits

| Task | Name | Commit | Key Changes |
| ---- | ---- | ------ | ----------- |
| 1 | Full runes rewrite of root +layout.svelte | `16f7faa8c` | $props(), $effect, fromStore(), {@render children?.()}, DOM visibility API |
| 2 | Whole-codebase zero-legacy-syntax verification | (verification only) | Confirmed zero legacy syntax in routes, all tests pass |

## Files Created/Modified

- `apps/frontend/src/routes/+layout.svelte` - Full Svelte 5 runes migration: $props() for data/children, $effect for async data loading and side effects, fromStore() for store-based context values, {@render children?.()} for child rendering, direct component rendering for UmamiAnalytics, DOM API for visibility change tracking

## Decisions Made

- **fromStore() bridge pattern**: All store-based context values from `initAppContext()` (appSettings, dataRoot, openFeedbackModal, sendTrackingEvent) are accessed via `fromStore()` with `.current` for reading. For writing to Writable stores, `store.set()` is used directly (e.g., `sendTrackingEventStore.set(umamiRef.trackEvent)`, `openFeedbackModalStore.set(() => feedbackModalRef?.openFeedback())`).
- **DOM API for visibility change**: Replaced the `svelte-visibility-change` third-party component with a direct `document.addEventListener('visibilitychange', ...)` inside an `$effect`. This eliminates both the `<svelte:component>` tag and the `on:hidden` event handler pattern, simplifying the code from a dynamic import + component render to a 6-line effect with cleanup.
- **Store aliases**: Destructured stores with `Store` suffix aliases (e.g., `appSettings: appSettingsStore`) to avoid naming conflicts with the `fromStore()` reactive wrappers.

## Deviations from Plan

None - plan executed exactly as written. The fromStore() bridge pattern (established in Plan 53-01) was applied consistently.

## Out-of-Scope Legacy Patterns Found

The whole-codebase verification (Step 6) found 3 remaining legacy patterns outside the Phase 53 scope:

1. **`apps/frontend/src/lib/admin/components/jobs/WithPolling.svelte:30`** - `<slot />` (not in Phase 53 file list)
2. **`apps/frontend/src/lib/candidate/components/termsOfUse/TermsOfUseForm.svelte:19`** - `$: console.info(...)` (not in Phase 53 file list)
3. **`apps/frontend/src/lib/components/popupRenderer/PopupRenderer.svelte:38`** - `<svelte:component>` (not in Phase 53 file list)

These are NOT in the 16 files targeted by Phase 53. They will need to be addressed in a future phase or during Phase 54 (global runes enablement).

## Known Stubs

None - all functionality is properly wired.

## Self-Check: PASSED

- Modified file exists and contains `<svelte:options runes />`
- Task 1 commit verified (16f7faa8c)
- SUMMARY.md created at expected path
- Build passes with zero errors
- All 613 unit tests pass

---
*Phase: 53-legacy-file-migration*
*Plan: 03*
*Completed: 2026-03-28*
