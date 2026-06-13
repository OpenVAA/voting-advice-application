---
phase: 108-app-layer-producer-contexts
plan: 01
subsystem: ui
tags: [svelte5, runes, context-as-class, getRoute, survey, $derived, factory-wrapper]

# Dependency graph
requires:
  - phase: 106-svelte5-helper-classes
    provides: "popupStore class+factory-wrapper idiom (the SHAPE this plan mirrors)"
  - phase: 107-leaf-contexts
    provides: "authContext $derived field + prototype get current() class idiom reference"
provides:
  - "class GetRoute + createGetRoute() factory wrapper (getRoute.svelte.ts)"
  - "class Survey + surveyLink() factory wrapper (survey.svelte.ts)"
  - "Two lowest-blast-radius app-layer producers converted to Svelte 5 classes, ready for Phase 109 appContext orchestrator composition"
affects: [109-appcontext-orchestrator, 113-flatten, voter-candidate-admin-orchestrators]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "class + factory-wrapper export idiom for direct-access producers (prototype get current() is spread-safe when consumer is direct-access)"
    - "spike-012 per-field page read preserved verbatim inside a class $derived.by field"

key-files:
  created: []
  modified:
    - apps/frontend/src/lib/contexts/app/getRoute.svelte.ts
    - apps/frontend/src/lib/contexts/app/survey.svelte.ts

key-decisions:
  - "Used prototype get current() (not own-enumerable accessor) for both producers — both are DIRECT-ACCESS consumed in appContext (getRoute own key line 313/49, surveyLink: survey line 322/180), never spread, so no defineProperty dance required"
  - "Survey constructor stores injected appSettings/sessionId as private readonly fields; #linkValue $derived.by routes through this.#appSettings/this.#sessionId — body otherwise byte-identical to prior closure"
  - "getRoute #builder $derived.by callback preserves { params, route, url } = page per-field destructure verbatim (spike-012 mechanic guarding the multi-election goto flake)"

patterns-established:
  - "Direct-access producer class: private #field = $derived(.by)(...); prototype get current() { return this.#field; } + exported factory wrapper returning new X()"

requirements-completed: [CLASS-03]

# Metrics
duration: 1min
completed: 2026-06-12
---

# Phase 108 Plan 01: App-Layer Producer Contexts (getRoute + survey) Summary

**Converted the two DIRECT-ACCESS app-layer producers `getRoute` and `survey` from factory closures into Svelte 5 classes (`class GetRoute` / `class Survey`) with `$derived.by` fields and prototype `get current()`, keeping `createGetRoute()` / `surveyLink()` factory signatures and the spike-012 per-field page read byte-identical.**

## Performance

- **Duration:** 1 min
- **Started:** 2026-06-12T22:23:56Z
- **Completed:** 2026-06-12T22:25:24Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- `getRoute.svelte.ts`: factory closure replaced with `class GetRoute { #builder = $derived.by(...) }`; the load-bearing `const { params, route, url } = page` per-field destructure (spike-012, guards the `/elections → /constituencies → /questions` goto flake) preserved verbatim inside the callback. `createGetRoute(): { readonly current: RouteBuilder }` wrapper signature byte-identical.
- `survey.svelte.ts`: factory closure replaced with `class Survey` taking `{ appSettings, sessionId }` `ReactiveHandle` inputs in its constructor (stored as private readonly fields); `#linkValue = $derived.by(...)` routes the existing interpolation through the injected handles. `surveyLink({ appSettings, sessionId }): ReactiveHandle<string | undefined>` wrapper signature byte-identical.
- Both use prototype `get current()` (safe — both consumed via direct property access in appContext, never spread). No `$effect` for initial-value derivation in either producer.
- `survey.svelte.test.ts` passes 4/4 with the test file UNMODIFIED.
- `appContext.svelte.ts` call sites (createGetRoute line 49, surveyLink line 180) untouched and compile unchanged.

## Task Commits

Each task was committed atomically:

1. **Task 1: Convert getRoute.svelte.ts to a class** - `4a430839d` (refactor)
2. **Task 2: Convert survey.svelte.ts to a class** - `0c0365f64` (refactor)

_Note: These are structure-preserving conversions of existing producers. survey carries an existing 4-case test (the GREEN guard); getRoute has no test — its behavior is byte-identical and verified via grep + svelte-check._

## Files Created/Modified
- `apps/frontend/src/lib/contexts/app/getRoute.svelte.ts` - `class GetRoute` (#builder `$derived.by` field, prototype `get current()`) + unchanged `createGetRoute()` wrapper; `RouteBuilder` export and spike-012 header doc-comment preserved
- `apps/frontend/src/lib/contexts/app/survey.svelte.ts` - `class Survey` (#linkValue `$derived.by` field, constructor-injected `#appSettings`/`#sessionId`, prototype `get current()`) + unchanged `surveyLink()` wrapper; `ReactiveHandle<TValue>` type and doc-comments preserved

## Decisions Made
- Prototype `get current()` chosen over own-enumerable accessor for both producers: the consumption audit (108-PATTERNS.md) confirms both are direct-access in appContext (never spread), so the defineProperty / own-accessor dance is unnecessary.
- Survey injects its inputs via the constructor and reads them through `this.#appSettings.current` / `this.#sessionId.current` inside the `$derived.by`, keeping the reactive edge identical to the prior closure.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None. The vite-plugin-svelte warning for `svelte-visibility-change@0.6.0` (missing exports condition) is a pre-existing, unrelated dependency warning. `svelte-check` reports 0 errors in either converted file; the 151 repo-wide errors it surfaces are all pre-existing and in unrelated files (admin jobs, `qs` module typings, candidate settings, questions layouts) — out of scope per the SCOPE BOUNDARY rule.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Both producers are now Svelte 5 classes the Phase 109 appContext orchestrator conversion can compose. Back-compat `{ readonly current }` handle return shapes retained until Phase 113 FLATTEN; appContext `_poc*` surfaces untouched (Phase 109/113 scope).
- trackingService + popupStore (the other two Phase 108 producers) are handled in separate plans (108-02/108-03) — trackingService is the only spread-consumed producer requiring the own-enumerable accessor gate.

## Self-Check: PASSED

- FOUND: apps/frontend/src/lib/contexts/app/getRoute.svelte.ts
- FOUND: apps/frontend/src/lib/contexts/app/survey.svelte.ts
- FOUND: .planning/phases/108-app-layer-producer-contexts/108-01-SUMMARY.md
- FOUND: 4a430839d (Task 1)
- FOUND: 0c0365f64 (Task 2)

---
*Phase: 108-app-layer-producer-contexts*
*Completed: 2026-06-12*
