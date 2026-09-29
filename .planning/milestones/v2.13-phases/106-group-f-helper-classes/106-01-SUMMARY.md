---
phase: 106-group-f-helper-classes
plan: 01
subsystem: ui
tags: [svelte5, runes, context-as-class, popupStore, $state, $derived]

# Dependency graph
requires:
  - phase: spikes (CONTEXT-CLASS-PROOF)
    provides: proven Svelte 5 class template (private $state field + prototype getter + arrow-field methods)
provides:
  - "class PopupStore — Svelte 5 class implementing the public PopupStore interface ($state queue, $derived current, arrow push/shift)"
  - "popupStore() factory retained, now returns new PopupStore() (A1)"
  - "Queue-shaped class template (reassigned $state array + $derived projection + arrow fields) for the rest of v2.13"
affects: [107-leaf-contexts, 108-app-producers, 113-consumer-flatten, 114-store-to-state-rename, group-f-SettingsOverlay, group-f-persistedState, group-f-VideoController]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Queue helper class: private #queue $state array reassigned wholesale (§17), #current $derived head, prototype get current()"
    - "Arrow-function fields for detachable methods (push/shift) — §18 this-capture-on-detach"
    - "Name-clash resolution: local class PopupStore implements aliased PopupStoreApi type import"

key-files:
  created: []
  modified:
    - apps/frontend/src/lib/contexts/app/popup/popupStore.svelte.ts

key-decisions:
  - "Resolved the PopupStore class/type name clash via aliased type import (PopupStore as PopupStoreApi) + implements — public type unchanged (appContext still imports it)"
  - "current is a prototype getter over a #current $derived (matches darkMode shape); the handle is not spread so a prototype accessor is safe"
  - "No new test case added — existing 4-case regression gate already covers all class edges (fresh-undefined, FIFO head, shift-to-next, empty-shift safety); A11 unchanged-test contract held"

patterns-established:
  - "Group F queue helper class template: $state array + $derived head + arrow mutators + factory returns new"

requirements-completed: [CLASS-01]

# Metrics
duration: 6min
completed: 2026-06-12
---

# Phase 106 Plan 01: PopupStore Helper Class Summary

**`popupStore()` factory converted to a real Svelte 5 `class PopupStore` (private `$state` queue, `$derived` head-of-queue, arrow-field `push`/`shift`) implementing the unchanged public `PopupStore` interface — consumers byte-identical.**

## Performance

- **Duration:** ~6 min
- **Started:** 2026-06-12T23:33:00Z
- **Completed:** 2026-06-12T23:39:00Z
- **Tasks:** 2
- **Files modified:** 1

## Accomplishments
- Converted the 26-line `popupStore()` factory-closure into `class PopupStore implements PopupStoreApi` — the simplest Group F helper, establishing the queue-shaped class template for the rest of the v2.13 context-as-class migration.
- Reactive core is a private `#queue = $state<Array<PopupQueueItem>>([])` reassigned wholesale on push/shift (§17); `#current = $derived(this.#queue[0])` exposed via prototype `get current()`; `push`/`shift` are arrow-function fields (§18) so they survive detach (`+layout.svelte` calls `popupQueue.shift()` directly).
- Public `PopupStore` interface in `popupStore.type.ts` left byte-identical (appContext.type.ts still imports it); consumers (`appContext.svelte.ts`, `routes/+layout.svelte`) byte-identical (A4).
- Green at every gate: popup test 4/4, full contexts suite 85/85, client+SSR build, svelte-check 151/0 (zero new errors vs baseline).

## Task Commits

Each task was committed atomically:

1. **Task 1: Convert popupStore() to class PopupStore** - `5ef665cf4` (refactor)
2. **Task 2: Green gate — popup class boundary** - no code change (existing test passed unchanged per A11; verification-only)

**Plan metadata:** (final docs commit — see below)

## Files Created/Modified
- `apps/frontend/src/lib/contexts/app/popup/popupStore.svelte.ts` - Now a `class PopupStore implements PopupStoreApi` (aliased type import to resolve the name clash) with private `$state` queue, `$derived` current, arrow `push`/`shift`; `popupStore()` factory returns `new PopupStore()`.

## Decisions Made
- **Name-clash resolution:** imported the public type as `PopupStore as PopupStoreApi` and declared `class PopupStore implements PopupStoreApi`. Kept the interface name `PopupStore` in `popupStore.type.ts` so appContext.type.ts's import is untouched (Claude's-discretion item in CONTEXT §decisions).
- **`current` as a prototype getter** over a `#current` `$derived` field — matches the landed `darkMode` shape; the handle is not spread into a parent, so a prototype accessor is safe (A2 / Spike 020 finding A).
- **No new test case:** the existing 4-case `popupStore.svelte.test.ts` already exercises every class edge — including detached `store.push`/`store.shift` calls (arrow-`this` survival, §18) and empty-queue shift safety — so it stayed unchanged (A11). No edge surfaced that the contract didn't already cover.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- The queue-shaped class template (reassigned `$state` array + `$derived` projection + arrow fields + factory-returns-instance) is now landed in production and is the copy target for the three remaining Group F helpers (`SettingsOverlay`, `persistedState`, `VideoController`) and the leaf/orchestrator contexts in 107/108.
- svelte-check baseline still 151/0; no new errors introduced — the zero-NEW-errors gate (A13) remains intact for the rest of the phase.

## Self-Check: PASSED

- FOUND: `apps/frontend/src/lib/contexts/app/popup/popupStore.svelte.ts`
- FOUND: `.planning/phases/106-group-f-helper-classes/106-01-SUMMARY.md`
- FOUND commit: `5ef665cf4` (Task 1)

---
*Phase: 106-group-f-helper-classes*
*Completed: 2026-06-12*
