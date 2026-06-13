---
phase: 108-app-layer-producer-contexts
plan: 02
subsystem: ui
tags: [svelte5, runes, context-as-class, trackingService, spread-safety, $derived, $state, arrow-fields, factory-wrapper]

# Dependency graph
requires:
  - phase: 107-leaf-contexts
    provides: "authContext spread-safety gate (own-enumerable accessor / handle idiom) + arrow-field methods reference"
  - phase: 108-app-layer-producer-contexts
    plan: 01
    provides: "getRoute/survey class+factory-wrapper conversions (the SHAPE this plan mirrors)"
provides:
  - "class TrackingServiceImpl + unchanged trackingService() factory wrapper (trackingService.svelte.ts)"
  - "Spread-safe Svelte 5 class conversion of the ONLY spread-consumed app-layer producer, ready for Phase 109 appContext orchestrator composition"
  - "spread-safety regression test guarding the Phase 107 gate against future bare-$derived/$state-public-field regressions"
affects: [109-appcontext-orchestrator, 113-flatten, voter-candidate-admin-orchestrators]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "spread-consumed producer class: private #$state/#$derived backing + own-enumerable handle-OBJECT fields (assigned in constructor over `const self = this`) so `{ ...instance }` copies the handle VALUE intact"
    - "D1 field-init order: a $derived reading constructor-injected private fields MUST be installed in the constructor body (after the inputs are assigned), not as a class-field initializer"
    - "arrow-function fields for spread+detach-surviving methods (§18)"
    - "private non-reactive bookkeeping fields (#pageviewEvent/#unsubmittedEvents) — NOT $state"

key-files:
  created: []
  modified:
    - apps/frontend/src/lib/contexts/app/tracking/trackingService.svelte.ts
    - apps/frontend/src/lib/contexts/app/tracking/trackingService.svelte.test.ts

key-decisions:
  - "Kept sendTrackingEvent/shouldTrack as own-enumerable handle-OBJECT fields (assigned in constructor), NOT the authContext Object.defineProperty own-accessor dance — the handle objects are already own-enumerable VALUES, so the spread copies them by construction (PATTERNS.md §spread-safety). Simplest byte-identical conversion."
  - "Installed the shouldTrack $derived in the CONSTRUCTOR BODY (after #appSettings/#userPreferences are assigned), not as a class-field initializer — class-field initializers run before the constructor body, so a declaration-site $derived reading `this.#appSettings` raises TS2729 'used before its initialization' (D1 field-init order landmine)."
  - "#pageviewEvent/#unsubmittedEvents kept as private NON-reactive fields (never read in a tracking scope) — not wrapped in $state."
  - "Factory wrapper returns the class instance itself (own-enumerable members), not a fresh object literal — preserves spread-safety AND the exact trackingService({...}) → RuneTrackingService signature."

patterns-established:
  - "Spread-consumed producer class: private #x = $state/#y = $derived backing + own-enumerable handle-object fields assigned in the constructor; methods are arrow-function fields; $derived over injected fields installed in the constructor body."

requirements-completed: [CLASS-03]

# Metrics
duration: 3min
completed: 2026-06-12
---

# Phase 108 Plan 02: trackingService Context-as-Class Conversion Summary

**Converted `trackingService` — the ONLY spread-consumed app-layer producer (`...tracking` at appContext.svelte.ts:299) — from a factory closure into `class TrackingServiceImpl`, keeping every spread-consumed member own-enumerable (handle-object fields for the 3 reactive members + arrow-function fields for the 5 methods) so the existing `{ ...tracking }` spread still carries the full reactive surface, with the `trackingService()` factory signature + `RuneTrackingService` return type byte-identical.**

## Performance

- **Duration:** ~3 min
- **Started:** 2026-06-12T22:27:51Z
- **Completed:** 2026-06-12T22:30:30Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- `trackingService.svelte.ts`: factory closure replaced with `class TrackingServiceImpl implements RuneTrackingService`.
  - `sendTrackingEvent` → private `#sendTrackingEventValue = $state<...>(undefined)` backing + own-enumerable `{ get current() {...}, set(v) {...} }` handle-object FIELD assigned in the constructor over `const self = this` → survives spread.
  - `shouldTrack` → private `#shouldTrackValue` `$derived` (installed in the constructor body after the input handles) + own-enumerable `{ get current() {...} }` handle-object field → survives spread. No `$effect`.
  - `sessionId` → `sessionStorageState('appContext-sessionId', getUUID())` held as an own-enumerable field initializer (the handle object survives spread).
  - `startPageview` / `startEvent` / `track` / `submitAllEvents` / `resetAllEvents` → arrow-function FIELDS (§18); bodies preserved verbatim (50-event cap, `'pageview'` fallback `logDebugError`, `purgeNullish({ vaaSessionId, ...data })`), reading `this.#pageviewEvent` / `this.#unsubmittedEvents` / `this.#shouldTrackValue` / `this.sessionId.current` / `this.#sendTrackingEventValue`.
  - `#pageviewEvent` / `#unsubmittedEvents` → private NON-reactive bookkeeping fields (not `$state`).
  - `trackingService({ appSettings, userPreferences }): RuneTrackingService` factory wrapper returns `new TrackingServiceImpl({...})` — signature + return type byte-identical; `RuneTrackingService` / `ReactiveHandle` / `WritableHandle` aliases + imports + doc-comment seam prose preserved.
- `trackingService.svelte.test.ts`: existing 6 cases pass UNMODIFIED; added one spread-safety regression case (`{ ...svc }` then asserts `shouldTrack.current`/`sendTrackingEvent.set`/`sessionId.current`/`startEvent`/`submitAllEvents` survive) — the Phase 107 gate guard. Full file 7/7 green.
- `appContext.svelte.ts` untouched (0 diff lines) — call sites at line 175 (`trackingService({...})`) and line 299 (`...tracking`) byte-identical.

## Task Commits

Each task was committed atomically:

1. **Task 1: Convert trackingService.svelte.ts to a class** - `f7cc349dd` (refactor)
2. **Task 2: Spread-safety regression test** - `b0a128c85` (test)

## Files Created/Modified
- `apps/frontend/src/lib/contexts/app/tracking/trackingService.svelte.ts` - `class TrackingServiceImpl` (own-enumerable `sendTrackingEvent`/`shouldTrack`/`sessionId` handle fields; arrow-field methods; private non-reactive `#pageviewEvent`/`#unsubmittedEvents`; `#sendTrackingEventValue` `$state` + `#shouldTrackValue` `$derived` backings) + unchanged `trackingService()` wrapper.
- `apps/frontend/src/lib/contexts/app/tracking/trackingService.svelte.test.ts` - added one `describe('spread-safety ...')` regression case; existing cases unchanged.

## Decisions Made
- **Handle-object fields over the defineProperty own-accessor dance:** `trackingService`'s reactive members were already exposed as object-literal `{ get current() }` handles (own-enumerable VALUES), so keeping them as instance FIELDS holding handle objects satisfies the spread-safety gate without `Object.defineProperty` (which authContext needed because its `isAuthenticated` was a bare member). PATTERNS.md §spread-safety endorses this as the simplest byte-identical path.
- **D1 field-init order (deviation, see below):** the `shouldTrack` `$derived` reads the constructor-injected `#appSettings`/`#userPreferences`; a class-field initializer cannot reference them (initializers run before the constructor body), so the `$derived` is installed in the constructor body after the input assignments.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] `shouldTrack` `$derived` field-init order (TS2729 "used before its initialization")**
- **Found during:** Task 1 (svelte-check after initial Write)
- **Issue:** The plan's action wording placed `#shouldTrackValue = $derived(... this.#appSettings.current ...)` as a class-field initializer. Class-field initializers run BEFORE the constructor body, so `this.#appSettings` / `this.#userPreferences` (assigned from constructor params) are not yet initialized — svelte-check raised `Property '#appSettings' is used before its initialization` (TS2729) on both. This is the documented D1 field-init-order landmine from Phase 106.
- **Fix:** Declared `#shouldTrackValue!: boolean` and installed the `$derived` in the constructor body, after `this.#appSettings`/`this.#userPreferences` are assigned. Semantics identical (synchronous `$derived`, no `$effect`); reactive edge to `appSettings.current` + `userPreferences.current` + `browser` preserved.
- **Files modified:** apps/frontend/src/lib/contexts/app/tracking/trackingService.svelte.ts
- **Commit:** f7cc349dd (folded into the Task 1 conversion commit)
- **Verification:** `yarn svelte-check --threshold error` reports 0 errors for the file; all 6 existing shouldTrack truth-table + event-queue cases stay green (the gate would fail if the derivation regressed).

## Issues Encountered
None beyond the D1 deviation above. The vite-plugin-svelte `svelte-visibility-change@0.6.0` "missing exports condition" WARNING is a pre-existing, unrelated dependency warning. svelte-check reports 0 errors in the converted file (repo-wide pre-existing errors in unrelated files are out of scope per the SCOPE BOUNDARY rule).

## Known Stubs
None — structure-preserving conversion of an existing producer; no placeholder/empty-value surfaces introduced.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- trackingService is now a Svelte 5 class the Phase 109 appContext orchestrator can compose, with its spread-consumed reactive surface proven (by the new regression test) to survive `{ ...tracking }` until the Phase 109 spread-of-context fix lands.
- All three Phase 108 app-layer producers handled by classes: getRoute + survey (108-01, direct-access, prototype `get current()`); trackingService (108-02, spread-consumed, own-enumerable handle fields). popupStore was already converted in Phase 106 (108-03 verify-only, if scheduled).
- Back-compat `{ readonly current }` handle return shapes retained until Phase 113 FLATTEN; appContext `_poc*` surfaces untouched (Phase 109/113 scope).

## Self-Check: PASSED

- FOUND: apps/frontend/src/lib/contexts/app/tracking/trackingService.svelte.ts
- FOUND: apps/frontend/src/lib/contexts/app/tracking/trackingService.svelte.test.ts
- FOUND: .planning/phases/108-app-layer-producer-contexts/108-02-SUMMARY.md
- FOUND: f7cc349dd (Task 1)
- FOUND: b0a128c85 (Task 2)

---
*Phase: 108-app-layer-producer-contexts*
*Completed: 2026-06-12*
