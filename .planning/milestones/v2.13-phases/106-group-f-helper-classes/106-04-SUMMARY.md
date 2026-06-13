---
phase: 106-group-f-helper-classes
plan: 04
subsystem: ui
tags: [svelte5, runes, context-as-class, video, layout, $state, refactor]

# Dependency graph
requires:
  - phase: 106-group-f-helper-classes
    provides: "the proven Group F class template (darkMode/popupStore/SettingsOverlay/persistedState) + the A1/A10/A11/A12/A13 locked decisions and §17–22 conventions"
provides:
  - "class VideoController extracted from layoutContext's embedded `video` const-ref into its own file with $state fields + arrow load()"
  - "first headless regression test for the video controller (none existed pre-Nyquist)"
  - "completion of CLASS-01: all four Group F helper factories are now real Svelte 5 classes"
affects: [107-leaf-contexts, 108-app-producers, 113-consumer-flatten, 114-rename]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Extracted (de-embedded) helper class: a $state-ref-object living inside a host factory becomes a standalone `class` the host instantiates; host-only nav hooks drive a public non-interface field (shouldClearContent)"
    - "Public $state class fields (§17) keep the read+write surface byte-identical to a getter/setter const-ref — no private-field-plus-getter indirection needed for reassigned primitives/refs"

key-files:
  created:
    - apps/frontend/src/lib/contexts/layout/VideoController.svelte.ts
    - apps/frontend/src/lib/contexts/layout/VideoController.svelte.test.ts
  modified:
    - apps/frontend/src/lib/contexts/layout/layoutContext.svelte.ts

key-decisions:
  - "Did NOT re-export the `VideoController` interface from the new file — the class shares the name, so a `export type { VideoController }` re-export is a redeclare conflict; consumers import the interface from `./layoutContext.type` as before"
  - "shouldClearContent kept as a PUBLIC field (not private) — the host's beforeNavigate/afterNavigate hooks toggle it across the boundary; it is intentionally off the typed `VideoController` interface surface"
  - "initLayoutContext() stays a factory this phase — its orchestrator-class conversion is DEFERRED to Phase 107 per locked decisions A1/A10 and ROADMAP Phase 106 success criteria"

patterns-established:
  - "De-embedding a host-resident $state ref into a class while keeping host-driven side-effects (nav auto-hide) in the host"

requirements-completed: [CLASS-01]

# Metrics
duration: 4min
completed: 2026-06-12
---

# Phase 106 Plan 04: VideoController Helper Class Summary

**Extracted the video player controller from layoutContext's embedded `video` const-ref into a standalone Svelte 5 `class VideoController` (public `$state` show/hasContent/mode/player + arrow `load`), with a new headless regression test — completing CLASS-01 (all four Group F helpers are now real classes).**

## Performance

- **Duration:** ~4 min
- **Started:** 2026-06-12T20:45:04Z
- **Completed:** 2026-06-12T20:48:20Z
- **Tasks:** 2
- **Files modified:** 3 (2 created, 1 modified)

## Accomplishments

- `class VideoController` extracted into `layout/VideoController.svelte.ts`: four public `$state` fields (`show`/`hasContent`/`mode`/`player`), arrow `load()` field preserving the inline `load()` logic verbatim, and a public `shouldClearContent` field for the host nav hooks. No `$effect` (§20).
- `initLayoutContext()` now constructs `const video = new VideoController()`; the embedded `videoShow`/`videoHasContent`/`videoMode`/`videoPlayer` `$state` locals, the `video` const object literal, the `shouldClearContent` local, and the inline `load()` function are all removed (net −45 lines). The beforeNavigate/afterNavigate auto-hide hooks now drive the instance via `video.shouldClearContent` / `video.hasContent` / `video.show` / `video.player`.
- New headless `VideoController.svelte.test.ts` (7 tests, `$effect.root` + `flushSync`, A11): defaults, field round-trip, load with/without player, autoshow true/false, falsy-resolve no-op, and arrow-method detach survival.
- All 34 `getLayoutContext()` consumers byte-identical (A4) — `git diff` shows zero `.svelte` consumer changes.
- The `initLayoutContext()` orchestrator-class deferral is explicitly recorded (see plan `<deferred_coverage>`); CLASS-01 is fully satisfied by this phase regardless.

## Task Commits

Each task was committed atomically:

1. **Task 1: Extract class VideoController** - `93f513363` (refactor)
2. **Task 2: Wire into layoutContext + author regression test** - `2abe0bbeb` (test)

_Note: this plan's tasks are `tdd="true"`; Task 1 created the class (svelte-check gate) and Task 2 authored the headless test alongside the host wiring (vitest + build + svelte-check gate), green at each boundary (A12)._

## Files Created/Modified

- `apps/frontend/src/lib/contexts/layout/VideoController.svelte.ts` - New `class VideoController implements VideoController` (interface aliased as `VideoControllerApi`); `$state` show/hasContent/mode/player, arrow `load`, public `shouldClearContent`.
- `apps/frontend/src/lib/contexts/layout/VideoController.svelte.test.ts` - New headless regression test (7 cases).
- `apps/frontend/src/lib/contexts/layout/layoutContext.svelte.ts` - Imports + constructs `new VideoController()`; embedded ref + inline load removed; nav hooks re-pointed at the instance.

## Decisions Made

- **No interface re-export from the new file.** The class is named `VideoController` and the existing interface is also `VideoController`; a `export type { VideoController } from './layoutContext.type'` re-export collides (`Cannot redeclare exported variable`). Dropped the optional re-export (the plan explicitly marked it optional); the interface stays the import-from-`layoutContext.type` contract, byte-identical.
- **`shouldClearContent` is a public class field** (not `#private`) — the host's `beforeNavigate`/`afterNavigate` hooks must toggle it from outside the class, and it is deliberately kept off the typed `VideoController` interface surface (internal coordination only).
- **Player identity asserted by marker, not reference** in the test — reading `instance.player` returns the `$state` proxy (a distinct ref from the original object), the same gotcha documented in `popupStore.svelte.test.ts`.
- **initLayoutContext() stays a factory** — orchestrator-class conversion deferred to Phase 107 per locked A1/A10.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Removed the optional interface re-export to resolve a name clash**
- **Found during:** Task 1 (Extract class VideoController)
- **Issue:** The initial file included `export type { VideoController } from './layoutContext.type'` per the plan's "optionally re-export for import ergonomics" note. Because the class is also named `VideoController`, svelte-check reported 3 errors: `Cannot redeclare exported variable 'VideoController'` / `Export declaration conflicts with exported declaration`.
- **Fix:** Removed the re-export line. The plan explicitly marked the re-export optional ("but do NOT move/rename the interface"); the interface remains imported from `./layoutContext.type` by consumers, unchanged.
- **Files modified:** apps/frontend/src/lib/contexts/layout/VideoController.svelte.ts
- **Verification:** `yarn svelte-check` returned to the 151 baseline (zero new errors).
- **Committed in:** `93f513363` (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** The fix was a strictly-optional convenience the plan flagged as removable; the public contract is unchanged. No scope creep.

## Issues Encountered

- Initial test asserted `expect(video.player).toBe(player)`, which failed because the `$state` field wraps the assigned object in a reactive proxy (distinct ref). Resolved by adding a `marker` to the stub player and asserting on `marker` — mirroring the documented `popupStore.svelte.test.ts` pattern. (Resolved within Task 2, before commit.)

## Green Gate Results

- `yarn vitest run src/lib/contexts/layout/` — 7/7 pass (new VideoController test).
- `yarn vitest run src/lib/contexts/` — 92/92 pass (18 files; full contexts suite).
- `yarn build` — client + SSR bundles compiled (built in ~8s).
- `yarn svelte-check` — **151 errors** (= the pre-existing baseline; **zero new errors**, A13).
- `git diff --stat` on `*.svelte` — empty (consumers byte-identical, A4).

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- **CLASS-01 complete:** all four Group F helpers (`PopupStore`, `SettingsOverlay`, `PersistedStateImpl`, `VideoController`) are now real Svelte 5 classes. Phase 106 is finished.
- **Deferred coverage recorded for the milestone:** `initLayoutContext()` orchestrator → `class LayoutContextProvider` is the natural Phase-107 (leaf/orchestrator tier) follow-on; `initLayoutContext()` now holds 1 `VideoController` + 3 `SettingsOverlay` class instances.
- Spike scaffolding dirs (`_spikes-017-019/`, `_spikes-020-class-conversion/`) remain in-tree, scheduled for deletion in Phase 107 per A14.

## Self-Check: PASSED

- Files: VideoController.svelte.ts, VideoController.svelte.test.ts, 106-04-SUMMARY.md all present.
- Commits: `93f513363`, `2abe0bbeb` present in git history.

---
*Phase: 106-group-f-helper-classes*
*Completed: 2026-06-12*
