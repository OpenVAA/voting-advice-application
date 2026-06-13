---
phase: 109-appcontext-orchestrator-spread-fix-poc-removal
plan: 02
subsystem: ui
tags: [svelte5, context, appContext, class-conversion, spread-safety, ssr, refactor]

# Dependency graph
requires:
  - phase: 109-01
    provides: the clean post-PoC-removal appContext object literal (members locale..userPreferences) the class conversion works against
  - phase: 107-componentcontext-class
    provides: ComponentContextProvider (composing-leaf own-property copy analog) consumed via getComponentContext()
  - phase: 108-trackingservice-class
    provides: TrackingServiceImpl (spread-sensitive producer recipe — own-enumerable handle objects + arrow fields) consumed via trackingService()
provides:
  - appContext.svelte.ts as `class AppContextProvider implements AppContext` constructed via `new AppContextProvider()` inside initAppContext()
  - internal componentCtx/dataCtx/tracking instance-spreads replaced by explicit own-enumerable forwarding (success criterion 1)
  - SSR appSettings/appCustomization merge preserved as synchronous $state field initializers + prev-ref-guarded re-merge $effects in the constructor (success criterion 3)
  - byte-identical initAppContext()/getAppContext() factory wrappers
affects: [109-03-integrity-test, 110-112-orchestrator-spread-migration]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Orchestrator context-as-class: explicit own-enumerable forwarding (Object.assign for stable members, Object.defineProperty getter-handles + direct handle fields for reactive members) REPLACES internal instance-spreads"
    - "Every downstream-spread-consumed member installed as OWN-ENUMERABLE — never a bare $state/$derived field, never a prototype getter"
    - "SSR-correct merge stays a synchronous $state field initializer; prev-ref-guarded re-merge $effects legal in the constructor (component-init effect context)"

key-files:
  created: []
  modified:
    - apps/frontend/src/lib/contexts/app/appContext.svelte.ts

key-decisions:
  - "Used Object.defineProperty(this, …) for the getter-only reactive reads (locale/locales/darkMode/reactiveAppSettings/reactiveLocale) per the authContext analog, and direct `this.x = { get current }` handle-field assignment for the writable handles (appType/appSettings/appCustomization/openFeedbackModal) per the trackingService analog"
  - "Installed #tracking/#survey producers in the constructor AFTER the appSettings/userPreferences handle objects exist (D1 field-init order: class-field initializers run before the constructor body)"
  - "Pinned the appSettings field initializer to a single line via `// prettier-ignore` (exact directive) so prettier keeps it and the SSR field-initializer gate string matches; matches no-this-alias lint shape of the shipped authContext/trackingService analogs (pre-existing baseline lint pattern, no disable comment added to stay consistent)"

patterns-established:
  - "appContext is the orchestrator analog: most spread-sensitive shape (consumed by 3 downstream {...appContext} spreads), so every member is own-enumerable; the internal upstream-context spreads are the ones replaced this phase, NOT the downstream consumption (110-112)"

requirements-completed: [CLASS-04]

# Metrics
duration: 6min
completed: 2026-06-13
---

# Phase 109 Plan 02: appContext Class Conversion Summary

**Converted `initAppContext()`'s 368-line object-literal factory into `class AppContextProvider implements AppContext`, replacing the three internal `componentCtx`/`dataCtx`/`tracking` instance-spreads with explicit own-enumerable forwarding while preserving the SSR-correct appSettings/appCustomization synchronous-init merge verbatim — every downstream-spread-consumed member stays own-enumerable, build (client + SSR) + svelte-check + contexts vitest all green.**

## Performance

- **Duration:** ~6 min
- **Started:** 2026-06-12T23:14:24Z
- **Completed:** 2026-06-13T02:17:00Z
- **Tasks:** 2
- **Files modified:** 1

## Accomplishments
- Rewrote `appContext.svelte.ts` as `class AppContextProvider implements AppContext`, constructed via `new AppContextProvider()` inside `initAppContext()` at component-init time (same call site as the former factory).
- Removed the three internal instance-spreads (`{ ...componentCtx }` / `{ ...dataCtx }` / `{ ...tracking }`) — replaced with explicit own-enumerable forwarding:
  - **Stable members** (`t`, `translate` from componentCtx; `dataRoot`/`reactiveDataRoot`/`setDataRoot` from dataCtx; `sendTrackingEvent`/`sessionId`/`shouldTrack`/`startPageview`/`startEvent`/`track`/`submitAllEvents`/`resetAllEvents` from tracking) copied as OWN properties via `Object.assign(this, {...})` in the constructor.
  - **Getter-only reactive reads** (`locale`/`locales`/`darkMode`/`reactiveAppSettings`/`reactiveLocale`) installed via `Object.defineProperty(this, …, { enumerable: true, get })` (the authContext spread-safety mechanic).
  - **Writable handles** (`appType`/`appSettings`/`appCustomization`/`openFeedbackModal`) installed as `this.x = { get current, set, update }` handle objects closing over `const self = this` (the trackingService recipe).
  - **Held-handle fields** (`getRoute`/`userPreferences`/`popupQueue`/`surveyLink`) assigned the producer/context handle references directly.
- Converted the six detachable methods (`sendFeedback`, `setDataConsent`, `setFeedbackStatus`, `setSurveyStatus`, `startFeedbackPopupCountdown`, `startSurveyPopupCountdown`) to §18 arrow-function fields with bodies preserved verbatim; module-local `feedbackTimeout`/`surveyTimeout` became `#feedbackTimeout`/`#surveyTimeout` private fields.
- Preserved the SSR-correct merge (success criterion 3): `#appSettingsValue`/`#appCustomizationValue` are synchronous `$state` FIELD INITIALIZERS (run server + client), and the prev-ref-guarded re-merge `$effect`s live in the constructor (legal — component-init effect context).
- Kept `initAppContext(): AppContext` and `getAppContext()` byte-identical including both `error(500, ...)` guard strings and the module-level `Symbol()` CONTEXT_KEY.

## Task Commits

Each task was committed atomically:

1. **Task 1: Convert factory to AppContextProvider class (own-enumerable forwarding + arrow methods)** - `99ed853ff` (refactor)
2. **Task 2: Pin SSR appSettings merge to single-line field initializer + finalize factory wrappers** - `e61a0f815` (refactor)

## Files Created/Modified
- `apps/frontend/src/lib/contexts/app/appContext.svelte.ts` - rewritten as `class AppContextProvider implements AppContext`; internal upstream-context spreads removed; explicit own-enumerable forwarding in the constructor; SSR merge preserved as field initializers + constructor re-merge `$effect`s; byte-identical factory wrappers.

## Verification Results
- `grep -E '\.\.\.(componentCtx|dataCtx|tracking)\b'` → **zero hits** (internal instance-spreads replaced — success criterion 1).
- `grep 'class AppContextProvider implements AppContext'` + `grep 'new AppContextProvider()'` → **both match**.
- `grep 'mergeInitialAppSettings(staticSettings, dynamicSettings'` → **matches on one line**, and the call is a `$state(...)` FIELD INITIALIZER (not inside an `$effect`) — read-back confirmed (success criterion 3).
- Both `mergeAppSettings` and `mergeInitialAppSettings` imports retained.
- `prevAppSettingsData`/`prevAppCustomizationData` present as private fields; the re-merge `$effect`s appear inside the constructor body.
- `getAppContext()` / `initAppContext(): AppContext` signatures + both `error(500, ...)` guard strings byte-identical.
- `yarn build` → **green** (client + SSR, built in ~8s).
- `yarn svelte-check` → **151 errors / 0 new** vs the 151-error baseline (all pre-existing: qs declarations, password types, etc. — none in the appContext surface).
- `yarn vitest run src/lib/contexts/` → **98 passed / 19 files** (matches Plan 01's post-PoC-removal baseline — no regression).
- `npx prettier --check` on the file → **clean**.

## Decisions Made
- Followed the analog split exactly: `Object.defineProperty` for getter-only reactive reads (authContext mechanic), `this.x = { get current }` handle-field assignment for writable handles (trackingService recipe), `Object.assign` for stable forwarded members (componentContext composing-leaf copy).
- Installed `#tracking`/`#survey` producers in the constructor after the input handle objects exist (D1 field-init order — the v2.13 Phase 106 execution landmine documented in STATE).
- Pinned the appSettings field initializer to a single line with an exact `// prettier-ignore` directive so prettier keeps it and the Task 2 SSR field-initializer grep gate matches deterministically (an earlier directive with trailing text was ignored by prettier and re-wrapped).

## Deviations from Plan
None - plan executed exactly as written. (Both tasks operate on the single file; Task 1 authored the full class with SSR field initializers, Task 2 pinned the SSR merge line to satisfy the deterministic field-initializer gate and ran the client+SSR build, per the plan's task split where Task 2 owns the SSR-correctness gate + build.)

## Issues Encountered
- The Task 2 field-initializer grep gate (`mergeInitialAppSettings(staticSettings, dynamicSettings`) expects the call on a single line; prettier wraps long field initializers. Resolved with an exact `// prettier-ignore` directive (verified prettier --check clean afterward).
- `yarn lint:check` reports `@typescript-eslint/no-this-alias` on the `const self = this` capture — but this is a PRE-EXISTING baseline pattern: the shipped authContext (`:60`) and trackingService (`:131`) analogs carry the identical error with no eslint-disable comment, so lint is already nonzero on this repo. Matched the established convention (no disable comment added) to stay consistent with the canonical analogs. Not a plan gate (gates are svelte-check + build).

## User Setup Required
None - no external service configuration required (in-file refactor only).

## Next Phase Readiness
- appContext is now a spread-safe class with every member own-enumerable — ready for Plan 03's headless integrity test asserting `{ ...appContext }` captures all keys.
- The downstream `{ ...appContext }` spreads in candidateContext/voterContext/adminContext remain unbroken (not touched this phase; migrated in 110-112).

## Self-Check: PASSED

- `apps/frontend/src/lib/contexts/app/appContext.svelte.ts` exists and contains `class AppContextProvider implements AppContext`.
- Both task commits (`99ed853ff`, `e61a0f815`) found in git log.

---
*Phase: 109-appcontext-orchestrator-spread-fix-poc-removal*
*Completed: 2026-06-13*
