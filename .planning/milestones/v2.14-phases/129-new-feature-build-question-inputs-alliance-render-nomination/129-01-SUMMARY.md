---
phase: 129-new-feature-build-question-inputs-alliance-render-nomination
plan: 01
subsystem: data
tags: [matching, question-types, categorical, type-guards, openvaa-data]

# Dependency graph
requires:
  - phase: (existing @openvaa/data model)
    provides: SingleChoiceCategoricalQuestion binary-subdimension reference impl; MultipleChoiceQuestion._ensureValue
provides:
  - MultipleChoiceCategoricalQuestion is matchable (isMatchable / normalizedDimensions / _normalizeValue) via binary subdimensions per D-06
  - isNumberQuestion type guard exported from @openvaa/data
affects: [129-04 OpinionQuestionInput dispatch, 129-06, matching of multi-choice categorical opinion questions]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Binary-subdimension normalization for multi-select categorical: one dimension per choice, selected=Max/unselected=Min (D-06)"
    - "Zero-selection ([]) and missing value both normalize to all-MISSING_VALUE arrays (D-07 zero-as-unanswered)"

key-files:
  created: []
  modified:
    - packages/data/src/objects/questions/variants/multipleChoiceCategoricalQuestion.ts
    - packages/data/src/objects/questions/variants/multipleChoiceCategoricalQuestion.test.ts
    - packages/data/src/utils/typeGuards.ts
    - packages/data/src/index.ts

key-decisions:
  - "No 2-choice single-dimension shortcut (unlike SingleChoiceCategoricalQuestion): a 2-choice multi-select still yields 2 dimensions because both choices can be selected simultaneously (D-06)"
  - "Empty selection ([]) treated identically to MISSING_VALUE — all-MISSING_VALUE subdimension array (D-07)"
  - "isNumberQuestion mirrors isBooleanQuestion (objectType === OBJECT_TYPE.NumberQuestion), avoiding instanceof in frontend per CLAUDE.md instance-check caveat"

patterns-established:
  - "Multi-select categorical matching via per-choice binary subdimensions"

requirements-completed: [UNBLK-02, UNBLK-05]

coverage:
  - id: D1
    description: "MultipleChoiceCategoricalQuestion is matchable with choices.length binary subdimensions; selected choices map to COORDINATE.Max, unselected to COORDINATE.Min (D-06)"
    requirement: "UNBLK-02"
    verification:
      - kind: unit
        ref: "packages/data/src/objects/questions/variants/multipleChoiceCategoricalQuestion.test.ts#Should be matchable"
        status: pass
      - kind: unit
        ref: "packages/data/src/objects/questions/variants/multipleChoiceCategoricalQuestion.test.ts#Should have one binary subdimension per choice (no 2-choice shortcut, D-06)"
        status: pass
      - kind: unit
        ref: "packages/data/src/objects/questions/variants/multipleChoiceCategoricalQuestion.test.ts#Should normalize selected choices to Max and unselected to Min in choices order"
        status: pass
    human_judgment: false
  - id: D2
    description: "Missing value and empty selection ([]) both normalize to an all-MISSING_VALUE subdimension array (D-07 zero-as-unanswered)"
    requirement: "UNBLK-02"
    verification:
      - kind: unit
        ref: "packages/data/src/objects/questions/variants/multipleChoiceCategoricalQuestion.test.ts#Should normalize a missing value to an all-MISSING_VALUE subdimension array"
        status: pass
      - kind: unit
        ref: "packages/data/src/objects/questions/variants/multipleChoiceCategoricalQuestion.test.ts#Should normalize an empty selection ([]) to an all-MISSING_VALUE subdimension array (D-07)"
        status: pass
    human_judgment: false
  - id: D3
    description: "isNumberQuestion type guard narrows to NumberQuestion and is exported from @openvaa/data for plan 04's frontend input dispatch"
    requirement: "UNBLK-05"
    verification:
      - kind: unit
        ref: "node -e import('./dist/index.js') => typeof isNumberQuestion === 'function' (verified after yarn build --filter=@openvaa/data)"
        status: pass
    human_judgment: false

# Metrics
duration: 6min
completed: 2026-07-18
status: complete
---

# Phase 129 Plan 01: MultipleChoiceCategorical Matching + isNumberQuestion Guard Summary

**MultipleChoiceCategoricalQuestion made matchable via per-choice binary subdimensions (D-06), plus an exported `isNumberQuestion` type guard for the plan-04 frontend input dispatch.**

## Performance

- **Duration:** ~6 min
- **Started:** 2026-07-18T10:26Z
- **Completed:** 2026-07-18T10:29Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments
- Filled the matching TODO in `MultipleChoiceCategoricalQuestion`: `isMatchable` returns true, `normalizedDimensions === choices.length` (no 2-choice shortcut), and `_normalizeValue` maps selected choices to `COORDINATE.Max` and unselected to `COORDINATE.Min` in choices order (D-06).
- Missing value and empty selection (`[]`) both normalize to an all-`MISSING_VALUE` subdimension array so an unanswered multi-choice question contributes no matching distance (D-07).
- Added and exported `isNumberQuestion` type guard from `@openvaa/data`, mirroring `isBooleanQuestion` (objectType check, no `instanceof`).
- No `packages/matching/` edits — the engine already consumes categorical subdimension arrays unchanged (D-06).

## Task Commits

Each task was committed atomically:

1. **Task 1 (RED): failing tests for MultipleChoiceCategorical matching** - `1b346e38b` (test)
2. **Task 1 (GREEN): implement matching trio (D-06)** - `e06001029` (feat)
3. **Task 2: add isNumberQuestion type guard + export** - `64394f98f` (feat)

**Plan metadata:** _(this SUMMARY + STATE/ROADMAP)_ (docs: complete plan)

_Note: Task 1 was TDD (test → feat); no refactor commit was needed._

## Files Created/Modified
- `packages/data/src/objects/questions/variants/multipleChoiceCategoricalQuestion.ts` - Implemented `isMatchable`, `normalizedDimensions`, `_normalizeValue`; updated JSDoc; removed TODO.
- `packages/data/src/objects/questions/variants/multipleChoiceCategoricalQuestion.test.ts` - Replaced the obsolete "not yet matchable" test with 5 matching cases (matchable, dimension count, binary normalization, missing, empty).
- `packages/data/src/utils/typeGuards.ts` - Added `isNumberQuestion` guard + `NumberQuestion` type import.
- `packages/data/src/index.ts` - Exported `isNumberQuestion` (alphabetical position).

## Decisions Made
- **No 2-choice single-dimension shortcut** for multi-select (diverges from `SingleChoiceCategoricalQuestion`): both choices can be selected at once, so a 2-choice question yields 2 dimensions. Documented in a code comment (D-06).
- **Empty selection = unanswered:** `[]` normalizes identically to `MISSING_VALUE` (D-07).
- **`isNumberQuestion` via `objectType` check** (not `instanceof`) per the CLAUDE.md instance-check caveat, so the plan-04 frontend branch can import it safely.

## Deviations from Plan

None - plan executed exactly as written.

The plan's verify commands referenced `yarn test:unit` inside `packages/data`, but that package exposes no `test:unit` script (tests run via `yarn vitest run` against `packages/data/vitest.config.ts`). Used `yarn vitest run` — same suite, same result. This is a command-invocation detail, not a behavioral deviation.

## Issues Encountered
None. TDD RED confirmed all 5 new tests failed against the unimplemented class; GREEN made them pass with the full 244-test data suite green and `yarn build --filter=@openvaa/data` clean.

## Threat Model Verification
- **T-129-01 (Tampering, `_normalizeValue`)** mitigated as planned: values are routed through `MultipleChoiceQuestion._ensureValue` (ensureArray + ensureUnique) before normalization — crafted/unknown choice ids cause `ensureValue` to return `MISSING_VALUE` (the whole array), and any id that did reach the Set simply fails the `selected.has()` check and maps to `Min` (no throw path). Empty/missing → all-`MISSING_VALUE`.
- **Prohibition (no `packages/matching/` edits, flagged unverified):** confirmed — no files under `packages/matching/` were touched.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- `MultipleChoiceCategoricalQuestion` is now matchable; downstream matching of multi-choice categorical opinion questions works without engine changes.
- `isNumberQuestion` is importable from `@openvaa/data` — plan 04's `OpinionQuestionInput.svelte` dispatch branch (D-03) can consume it.

## Self-Check: PASSED
- FOUND: packages/data/src/objects/questions/variants/multipleChoiceCategoricalQuestion.ts (matching trio, TODO removed)
- FOUND: packages/data/src/objects/questions/variants/multipleChoiceCategoricalQuestion.test.ts (5 passing cases)
- FOUND: packages/data/src/utils/typeGuards.ts (isNumberQuestion)
- FOUND: packages/data/src/index.ts (isNumberQuestion export; importable from dist)
- FOUND commits: 1b346e38b, e06001029, 64394f98f

---
*Phase: 129-new-feature-build-question-inputs-alliance-render-nomination*
*Completed: 2026-07-18*
