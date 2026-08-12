---
phase: 129-new-feature-build-question-inputs-alliance-render-nomination
plan: 03
subsystem: ui
tags: [sveltekit, voter-app, nominations, data-loader, dataRoot]

# Dependency graph
requires:
  - phase: 129
    provides: "(located) layout loader parity reference (questionData + nominationData return shape)"
provides:
  - "/nominations route loader now fetches questionData via getQuestionData({ locale })"
  - "nominations +layout.svelte consumer provides questionData into dataRoot (provideQuestionData)"
affects: [phase-130-nominations-spec-assertion, all-nominations-entity-render]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Unscoped all-nominations question fetch: locale-only getQuestionData (electionId optional) returns all categories/questions"

key-files:
  created: []
  modified:
    - "apps/frontend/src/routes/(voters)/nominations/+layout.ts"
    - "apps/frontend/src/routes/(voters)/nominations/+layout.svelte"

key-decisions:
  - "getQuestionData called locale-only (no electionId) for the unscoped all-nominations route — matches RESEARCH: GetQuestionsOptions.electionId optional"
  - "Consumer wiring added in nominations +layout.svelte (it did NOT previously apply questionData) to mirror the (located) layout's provideQuestionData path"

patterns-established:
  - "Loader/consumer parity: a questionData key added to a loader must be matched by a provideQuestionData call in the route's consuming layout, guarded by isValidResult"

requirements-completed: [UNBLK-04]

coverage:
  - id: D1
    description: "/nominations loader returns questionData via getQuestionData({ locale }) with .catch((e) => e) wrapping, parity with the (located) layout"
    requirement: "UNBLK-04"
    verification:
      - kind: automated_ui
        ref: "yarn build --filter=@openvaa/frontend (exit 0)"
        status: pass
      - kind: manual_procedural
        ref: "dev-server probe: curl http://localhost:5173/nominations → HTTP 200, layout shell renders, no runtime error string in SSR output"
        status: pass
    human_judgment: false
  - id: D2
    description: "nominations consumer applies questionData into dataRoot (provideQuestionData) so all-nominations entities render with question data; ordering + multiplicity unchanged"
    requirement: "UNBLK-04"
    verification:
      - kind: e2e
        ref: "Wave-4 full E2E gate (plan 08) is the suite-level backstop; dedicated /nominations assertion lands in Phase 130"
        status: unknown
    human_judgment: true
    rationale: "Full client-render + entity-render behavior with e2e/base seed needs the Phase-130 spec assertion / wave-4 suite; SSR probe confirms no crash but not full entity population."

# Metrics
duration: 2min
completed: 2026-07-18
status: complete
---

# Phase 129 Plan 03: Nominations Loader Question Data Fetch Summary

**The /nominations loader now fetches question data via locale-only getQuestionData and provides it into dataRoot, reaching parity with the (located) layout so all-nominations entities render with question data available (UNBLK-04, D-11 core-fetch-only).**

## Performance

- **Duration:** ~2 min
- **Started:** 2026-07-18T07:34:33Z
- **Completed:** 2026-07-18T07:36:03Z
- **Tasks:** 1
- **Files modified:** 2

## Accomplishments
- Added `questionData: dataProvider.getQuestionData({ locale: lang }).catch((e) => e)` to the `/nominations` `+layout.ts` load return, alongside the untouched `nominationData` entry.
- Wired the nominations `+layout.svelte` consumer to apply `questionData` into `dataRoot` via `provideQuestionData`, mirroring the `(located)` layout's parity contract (the consumer previously did NOT apply questionData at all — this was the actual gap, not just the loader).
- Verified `yarn build --filter=@openvaa/frontend` exits 0.
- Dev-server probe of `/nominations` returns HTTP 200 and renders the layout shell with no runtime error in SSR output.

## Task Commits

Each task was committed atomically:

1. **Task 1: Add questionData fetch to the nominations loader (D-11)** - `7e38595dc` (feat)

**Plan metadata:** (this SUMMARY + STATE/ROADMAP) — `docs(129-03)` commit follows.

## Files Created/Modified
- `apps/frontend/src/routes/(voters)/nominations/+layout.ts` - Added `questionData` fetch (locale-only) to the load return, parity with `(located)/+layout.ts`.
- `apps/frontend/src/routes/(voters)/nominations/+layout.svelte` - `$effect` now tracks `data.questionData` in addition to `data.nominationData`; `update()` validates questionData via `isValidResult` and calls `ctx.dataRoot.provideQuestionData(questionData)` inside the `dataRoot.update()` block.

## Decisions Made
- **Locale-only getQuestionData:** `electionId` is optional in `GetQuestionsOptions` (confirmed in `getDataOptions.type.ts` — `GetQuestionsOptions = GetDataOptionsBase & FilterByElection`); with no electionId all categories/questions are returned, which is correct for the unscoped all-nominations route. Matches the plan's `prohibitions` guidance (do not scope to an electionId).
- **Consumer wiring required:** The plan flagged this as conditional ("if the consumer does NOT apply questionData, wire it identically"). Inspection confirmed `nominations/+layout.svelte` only applied nominationData, so the consumer was wired to provide questionData into dataRoot — mirroring `(located)/+layout.svelte:91-96`, guarded by `isValidResult(questionData, { allowEmpty: true })`.

## Deviations from Plan

None - plan executed exactly as written. The consumer wiring was an explicitly-anticipated conditional branch of Task 1's action ("If the nominations route's consumer does NOT apply questionData, wire it identically to the located route's consumer"), not an out-of-scope deviation.

## Issues Encountered
None. The dev-server probe surfaced apparent "500" and "error" substrings in the SSR HTML; on inspection these were a config value (`showSurveyPopup: 500`), SVG path data, and error-message component boilerplate — not runtime errors. HTTP status was 200 throughout.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- `/nominations` now has question data available in dataRoot for entity rendering (UNBLK-04 satisfied).
- The nominating-org display in candidate profile remains explicitly DEFERRED (D-11 — own RPC + type-regen slice), out of this plan's scope.
- The dedicated `/nominations` E2E assertion lands in Phase 130; the wave-4 full-suite gate (plan 08) is the suite-level backstop.

## Self-Check: PASSED
- FOUND: apps/frontend/src/routes/(voters)/nominations/+layout.ts (questionData key present)
- FOUND: apps/frontend/src/routes/(voters)/nominations/+layout.svelte (provideQuestionData present)
- FOUND: commit 7e38595dc

---
*Phase: 129-new-feature-build-question-inputs-alliance-render-nomination*
*Completed: 2026-07-18*
