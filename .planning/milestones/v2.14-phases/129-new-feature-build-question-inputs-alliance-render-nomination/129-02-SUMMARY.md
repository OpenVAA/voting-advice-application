---
phase: 129-new-feature-build-question-inputs-alliance-render-nomination
plan: 02
subsystem: data
tags: [customData, jsonb, supabase-adapter, numberQuestion, matching, question-types]

# Dependency graph
requires:
  - phase: 129-01
    provides: question-input plumbing / discriminated question data union foundation
provides:
  - "Six typed CustomData['Question'] keys: min, max, minItems, maxItems, minSelections, maxSelections"
  - "Supabase getQuestionData bridge lifting custom_data.min/max into top-level NumberQuestionData.min/max for number rows"
affects: [129-04, 129-08, question-inputs, alliance-render, nomination, slider, matching]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "customData JSONB as the extension home for question-input constraint metadata (mirrors maxlength/filterable precedent)"
    - "type-gated customData → top-level field bridge in the Supabase question mapper (mirrors the allowOpen column bridge)"

key-files:
  created: []
  modified:
    - packages/app-shared/src/data/customData.type.ts
    - apps/frontend/src/lib/api/adapters/supabase/dataProvider/supabaseDataProvider.ts
    - apps/frontend/src/lib/api/adapters/supabase/dataProvider/supabaseDataProvider.test.ts

key-decisions:
  - "customData is the chosen extension point for min/max/item/selection counts — no DB migration (JSONB blob)"
  - "min/max bridge fires only for row.type === 'number' with typeof-number guarded values; non-numeric JSONB dropped, absent keys omitted via spread-conditional"

patterns-established:
  - "Number-question range authored under custom_data.{min,max}; the provider bridge is what makes NumberQuestion.isMatchable true"

requirements-completed: [UNBLK-01, UNBLK-02, UNBLK-05]

coverage:
  - id: D1
    description: "Six typed CustomData['Question'] keys (min, max, minItems, maxItems, minSelections, maxSelections) with JSDoc; app-shared builds"
    requirement: "UNBLK-01"
    verification:
      - kind: unit
        ref: "yarn build --filter=@openvaa/app-shared (exit 0)"
        status: pass
    human_judgment: false
  - id: D2
    description: "Supabase getQuestionData bridges custom_data.min/max into top-level NumberQuestionData.min/max for number rows only; non-number rows and absent ranges get no top-level fields"
    requirement: "UNBLK-05"
    verification:
      - kind: unit
        ref: "apps/frontend/src/lib/api/adapters/supabase/dataProvider/supabaseDataProvider.test.ts#bridges custom_data.min/max into top-level min/max for number questions only"
        status: pass
    human_judgment: false

# Metrics
duration: 2min
completed: 2026-07-18
status: complete
---

# Phase 129 Plan 02: customData question keys + number min/max bridge Summary

**Six typed `CustomData['Question']` keys (D-02 item counts, D-07 selection counts, number range) plus a type-gated Supabase bridge that lifts `custom_data.min/max` into top-level `NumberQuestionData.min/max`, making seeded number questions matchable.**

## Performance

- **Duration:** 2 min
- **Started:** 2026-07-18T07:30:31Z
- **Completed:** 2026-07-18T07:32:36Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments
- Added six optional number keys to `CustomData['Question']` with `maxlength`-style JSDoc: `min`/`max` (number answer-value range), `minItems`/`maxItems` (MultipleTextInput row counts, D-02), `minSelections`/`maxSelections` (multi-choice selection counts, D-07). Types only, JSONB-backed, no DB migration.
- Bridged `custom_data.min/max` into top-level `NumberQuestionData.min/max` in `getQuestionData`'s row mapper — number rows only, `typeof`-number guarded (non-numeric JSONB dropped, T-129-02), absent keys omitted via spread-conditional so `NumberQuestion`'s zero-range check never trips on pass-through values.
- This makes Supabase-served number questions with authored `custom_data` ranges matchable (`NumberQuestion.isMatchable` → true) and gives the plan-04 slider its bounds — previously never populated (no DB column, no bridge).

## Task Commits

Each task committed atomically:

1. **Task 1: Add the six customData.Question keys** - `a14b413fb` (feat)
2. **Task 2 (TDD): Bridge customData.min/max → NumberQuestionData.min/max**
   - RED: `464c25d08` (test) — three failing bridge cases
   - GREEN: `70f2c8830` (feat) — type-gated bridge in getQuestionData

_No REFACTOR commit — implementation was minimal and clean._

## Files Created/Modified
- `packages/app-shared/src/data/customData.type.ts` - Six new documented Question keys
- `apps/frontend/src/lib/api/adapters/supabase/dataProvider/supabaseDataProvider.ts` - Number min/max bridge in the getQuestionData row mapper
- `apps/frontend/src/lib/api/adapters/supabase/dataProvider/supabaseDataProvider.test.ts` - Three new bridge unit cases mirroring the allowOpen-bridge test

## Decisions Made
- Followed plan as specified. `customData` (JSONB) chosen as extension point — smallest honest extension, mirrors existing `maxlength`/`filterable` precedent and the info-number seed row already using `custom_data: { min, max }`.
- Bridge values passed through untouched (no defaulting): `NumberQuestion` throws on zero range, so absent keys are omitted rather than set to `undefined`/`null` for JSONB parity and DataProvisionError safety.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None.

## Threat Mitigations
- **T-129-02 (Tampering, low):** `typeof value === 'number'` guard on lifted min/max — non-numeric JSONB values are dropped, never coerced. `NumberQuestion` constructor independently rejects a zero range. Verified via the "text row with custom_data.min does not receive top-level min" test case.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- `NumberQuestionData.min/max` now flows from authored `custom_data` — plan 04 slider and matching can rely on populated bounds.
- Plan 08 seed rows authoring `custom_data: { min, max }` on number opinion questions will now be effective.
- The four count keys (minItems/maxItems/minSelections/maxSelections) are typed and ready for the D-02 MultipleTextInput and D-07 multi-choice consumers.

## Self-Check: PASSED
- FOUND: packages/app-shared/src/data/customData.type.ts (six keys present)
- FOUND: supabaseDataProvider.ts (row.type === 'number' bridge)
- FOUND: supabaseDataProvider.test.ts (three new cases, 47/47 pass)
- FOUND commits: a14b413fb, 464c25d08, 70f2c8830

---
*Phase: 129-new-feature-build-question-inputs-alliance-render-nomination*
*Completed: 2026-07-18*
