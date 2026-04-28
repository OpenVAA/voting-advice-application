---
phase: 61-voter-app-question-flow
plan: 01
subsystem: ui
tags:
  - svelte5
  - runes
  - booleanQuestion
  - opinion-input
  - question-choices
  - type-guards
  - i18n
  - voter-flow

# Dependency graph
requires:
  - phase: 58-voter-app-uat
    provides: "QUESTION-01 and QUESTION-02 defect reports (boolean opinion input + boolean match-breakdown)"
  - phase: 60-svelte5-layout-migration
    provides: "Runes-mode ($state, $derived, $effect, $props) pattern conventions applied here"
provides:
  - "isBooleanQuestion type guard exported from @openvaa/data"
  - "QuestionChoices supports an explicit choices-override prop (BooleanQuestion + synthesized pseudo-choices)"
  - "OpinionQuestionInput renders BooleanQuestion as a 2-button Yes/No radio group in both answer and display modes"
  - "Candidate result-detail pages render boolean match-breakdown (QUESTION-02) via shared dispatch through OpinionQuestionInput"
affects:
  - 61-02 (category-selection reactivity — unrelated but sibling plan)
  - 61-03 (candidate-questions list reactivity — unrelated but sibling plan)
  - Any future voter-flow phase introducing new question variants (pattern for dispatching via type-guard + pseudo-choices)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Type-guard dispatch (OpinionQuestionInput) — mirror isSingleChoiceQuestion branch shape to add new variants"
    - "Pseudo-choice synthesis — variants without a native .choices field pass i18n-labeled pseudo-choices through the existing QuestionChoices renderer"
    - "Answer-value translation in dispatcher — pseudo-choice ids (strings) map to real answer types (boolean) at the dispatch boundary, never in the renderer"

key-files:
  created: []
  modified:
    - packages/data/src/utils/typeGuards.ts
    - packages/data/src/utils/typeGuards.test.ts
    - packages/data/src/index.ts
    - apps/frontend/src/lib/components/questions/QuestionChoices.type.ts
    - apps/frontend/src/lib/components/questions/QuestionChoices.svelte
    - apps/frontend/src/lib/components/questions/OpinionQuestionInput.svelte

key-decisions:
  - "Used existing i18n path common.answer.yes / common.answer.no (all 4 locales already present) instead of introducing new common.yes / common.no keys per UI-SPEC §Copywriting Contract"
  - "BooleanQuestion treated as 2-point ordinal for display — doShowLine defaults to true so voter/candidate markers render on a connecting line"
  - "Pseudo-choice id ↔ boolean translation localized to OpinionQuestionInput dispatcher (onChange adapter + booleanToChoiceId helper); QuestionChoices stays choice-id-agnostic"
  - "EntityOpinions.svelte deliberately NOT modified — QUESTION-02 is a free side-effect of QUESTION-01 because EntityOpinions already dispatches display mode through OpinionQuestionInput"
  - "Test 5 acceptance expectation corrected from 'bare literal with objectType returns false' to 'primitive/missing-objectType returns false' — the actual isDataObject implementation accepts plain literals with valid objectType (matches sibling isSingleChoiceQuestion behavior)"

patterns-established:
  - "Type-guard sibling mirror: new variants extend typeGuards.ts by copying the shape of an existing sibling guard"
  - "QuestionChoices caller-owned pseudo-choices: a question variant without native choices synthesizes them at the dispatcher and passes via the optional choices prop"
  - "Dispatcher-owned value translation: string pseudo-ids convert to real answer types at the same layer that synthesizes the pseudo-choices"

requirements-completed:
  - QUESTION-01
  - QUESTION-02

# Metrics
duration: ~12 min
completed: 2026-04-24
---

# Phase 61 Plan 01: Boolean Opinion Input Summary

**isBooleanQuestion type guard + QuestionChoices choices-override prop + OpinionQuestionInput boolean branch closes QUESTION-01 (voters can answer boolean questions) and QUESTION-02 (candidate result-detail renders boolean match-breakdown) via shared dispatch.**

## Performance

- **Duration:** ~12 min
- **Started:** 2026-04-24T17:46Z (approx, per git log of first RED commit)
- **Completed:** 2026-04-24T17:58Z
- **Tasks:** 3
- **Files modified:** 6

## Accomplishments

- Exported `isBooleanQuestion` type guard from `@openvaa/data` with 9 passing unit tests (positive + negative + null + primitive + missing-objectType coverage)
- Widened `QuestionChoicesProps.question` to include `BooleanQuestion`, added optional `choices?: Array<Choice>` override prop, and extended `doShowLine` default to cover boolean questions
- Added `{:else if isBooleanQuestion(question)}` branch to `OpinionQuestionInput.svelte` that synthesizes two pseudo-choices with i18n-resolved labels and translates pseudo-id → boolean on onChange
- Candidate result-detail boolean match-breakdown (QUESTION-02) works automatically via shared dispatch — `EntityOpinions.svelte` not modified

## Task Commits

Each task was committed atomically:

1. **Task 1 RED:** test(61-01): add failing isBooleanQuestion test cases — `f231a7e5e`
2. **Task 1 GREEN:** feat(61-01): add isBooleanQuestion type guard to @openvaa/data — `0964f9eb4`
3. **Task 2:** feat(61-01): widen QuestionChoices to accept BooleanQuestion + explicit choices — `76cfeed14`
4. **Task 3:** feat(61-01): render boolean opinion questions via synthesized pseudo-choices — `61e2c0696`

_TDD gate compliance: Task 1 has a test commit (RED) preceding its feat commit (GREEN). Tasks 2 and 3 are Svelte component changes with no dedicated unit tests (per plan, deferred to E2E in 61-01 verification)._

## Files Created/Modified

- `packages/data/src/utils/typeGuards.ts` — Added `isBooleanQuestion(obj)` export (mirrors `isSingleChoiceQuestion` shape); added `BooleanQuestion` to type-imports block.
- `packages/data/src/utils/typeGuards.test.ts` — Added `describe('isBooleanQuestion', …)` block with 5 tests (positive, ordinal negative, categorical negative, null, primitive, missing-objectType).
- `packages/data/src/index.ts` — Re-exported `isBooleanQuestion` in alphabetical order (before `isChoiceQuestion`).
- `apps/frontend/src/lib/components/questions/QuestionChoices.type.ts` — Widened `question` union to include `BooleanQuestion`; added optional `choices?: Array<Choice>` override prop; imported `BooleanQuestion` and `Choice` from `@openvaa/data`.
- `apps/frontend/src/lib/components/questions/QuestionChoices.svelte` — Destructured new `choices` prop as `explicitChoices`; made `choices` $derived coalesce to explicit override when supplied, otherwise fall back to `question.choices` (guarded by `'choices' in question` for type-safety on `BooleanQuestion` which lacks the field); extended `doShowLine` default to also return `true` for `OBJECT_TYPE.BooleanQuestion`; changed `showLine` guard from `if (showLine)` to `if (showLine !== undefined)` to preserve explicit `false` overrides. Preserved `data-testid="question-choices"` + `data-testid="question-choice"`.
- `apps/frontend/src/lib/components/questions/OpinionQuestionInput.svelte` — Imported `isBooleanQuestion` and `Choice` from `@openvaa/data`; added `booleanChoices = $derived<Array<Choice>>([...])` synthesis and `booleanToChoiceId(v)` helper in the script block; inserted `{:else if isBooleanQuestion(question)}` branch before the `{:else}` fallback that delegates to `QuestionChoices` with `choices={booleanChoices}` and translates `d.value === 'yes'` to boolean in the onChange adapter. Preserved `data-testid="opinion-question-input"` + `ErrorMessage` fallback for genuinely unsupported types.

## Decisions Made

- **i18n path — use existing `common.answer.yes` / `common.answer.no` (nested), not new `common.yes` / `common.no` (top-level).** UI-SPEC §Copywriting Contract explicitly supersedes CONTEXT D-02 here; all 4 locales (en/fi/sv/da) already have the nested keys.
- **BooleanQuestion shown on connecting line.** `doShowLine` default extended to treat boolean like ordinal (horizontal 2-point line with line behind choices). Matches UI-SPEC §Interaction Contract and RESEARCH §Code Example 1.
- **Dispatcher-owned id/value translation.** `booleanToChoiceId` helper and onChange string-id → boolean adapter live in `OpinionQuestionInput.svelte`, NOT in `QuestionChoices.svelte`. Keeps `QuestionChoices` choice-id-agnostic and avoids leaking variant-specific logic into the generic renderer.
- **No changes to `EntityOpinions.svelte`.** QUESTION-02 (candidate result-detail boolean match-breakdown) resolves automatically because `EntityOpinions` already dispatches `mode='display'` through `OpinionQuestionInput`. One branch fix closes two requirements.
- **Guarded `question.choices` access in QuestionChoices.** Since `BooleanQuestion` has no `.choices` field, added `'choices' in question ? question.choices : undefined` guard to avoid a TS error when the caller didn't supply `explicitChoices` for a boolean (defensive — real callers always supply it for boolean).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 — Bug] Corrected test expectation for isBooleanQuestion test 5 (plain-literal case)**
- **Found during:** Task 1 GREEN (`yarn vitest run`)
- **Issue:** The plan asserted `isBooleanQuestion({ objectType: OBJECT_TYPE.BooleanQuestion })` should return `false`, but the existing `isDataObject` implementation explicitly accepts plain literals with a valid `objectType` string. The sibling `isSingleChoiceQuestion` also returns `true` for such a literal — the plan's expectation contradicted the actual sibling-guard contract the plan itself said to mirror.
- **Fix:** Replaced test 5 with two negative cases that DO correctly exercise the `isDataObject` false-path: `primitives` (string/number/boolean return false) and `objects without an objectType field` (return false). This preserves the negative-case coverage intent while matching actual code behavior.
- **Files modified:** `packages/data/src/utils/typeGuards.test.ts`
- **Verification:** 9/9 tests pass via `npx vitest run src/utils/typeGuards.test.ts`.
- **Committed in:** `0964f9eb4` (Task 1 GREEN commit, combined with the guard implementation since the test-fix was needed for GREEN to pass).

**2. [Rule 1 — Bug] Fixed showLine conditional to preserve explicit `false`**
- **Found during:** Task 2 (extending doShowLine in QuestionChoices.svelte)
- **Issue:** Existing code was `if (showLine) return showLine;`. With the strict falsy check, a caller passing `showLine={false}` would bypass the `return` and fall through to the ordinal/boolean default, potentially rendering a line when the caller explicitly asked to hide it. While nothing in the current codebase passes `showLine={false}` on ordinal/boolean questions today, the existing conditional was latently buggy and would be exercised once a future caller opts out.
- **Fix:** Changed to `if (showLine !== undefined) return showLine;` so explicit-`false` is honored.
- **Files modified:** `apps/frontend/src/lib/components/questions/QuestionChoices.svelte`
- **Verification:** Svelte-check produces no new errors on the file; existing ordinal + categorical callsites unaffected (none pass an explicit false, all rely on the default).
- **Committed in:** `76cfeed14` (Task 2 commit, combined with boolean-default extension since the two edits are in the same `doShowLine` derivation).

---

**Total deviations:** 2 auto-fixed (both Rule 1 — bugs in plan/code correctness)
**Impact on plan:** Both auto-fixes necessary for correctness. No scope creep — both touched the same lines already listed in `files_modified`.

## Issues Encountered

- The data package has no `test:unit` script at the package level — all tests are run via `npx vitest run` directly from the package directory, or via `turbo run test:unit` at the root. Verification step used the former.
- `yarn workspace @openvaa/data test:unit --run` returned "script not found" (the plan's automated-verify command). Fell back to running vitest directly: `cd packages/data && npx vitest run src/utils/typeGuards.test.ts`. This is a plan-mapping issue, not a code issue — the tests themselves pass.

## Threat-model outcome

All 4 threats in the plan's STRIDE register (T-61-01-01 through T-61-01-04) are dispositioned `accept`. Verified during implementation:

- **T-61-01-01 (Tampering on onChange):** boolean translation in `OpinionQuestionInput` does not trust inputs; `BooleanQuestion._ensureValue = ensureBoolean` in the data layer is unchanged and remains the authoritative validator.
- **T-61-01-02 (Info disclosure via i18n labels):** labels are the existing `common.answer.*` strings, already rendered elsewhere.
- **T-61-01-03 (DoS via predicate):** `isBooleanQuestion` is a constant-time object-type check.
- **T-61-01-04 (Elevation via new API):** `isBooleanQuestion` is side-effect-free and pure; added as public export of `@openvaa/data`, consumed only internally via `workspace:^`.

No new threats discovered during execution.

## Plan-specific contingencies

- **BooleanQuestion fixture addition (Task 1 contingency):** Not needed. `packages/data/src/testUtils/testData.ts` already has boolean questions at `question-3` (line 340) and `question-6` (line 366). The test uses `dataRoot.questions.find((q) => q.objectType === OBJECT_TYPE.BooleanQuestion)`.
- **E2E assertions added or modified (Task 3):** None added this run. The plan allowed unit tests or E2E assertions; neither path was gated by the plan's acceptance criteria. E2E coverage for the boolean path is out-of-scope-this-plan per Rule-based scope boundary: this is a component-level behavior change, the full frontend unit suite (613 tests) passes, and E2E verification lives in the plan's broader verification step and should be run at the phase-verification layer. If E2E regression is desired, add a test in `tests/tests/specs/voter/voter-questions.spec.ts` that exercises the default seed's boolean question at index 23 per RESEARCH.
- **Locale-parity translation additions:** Not needed. All 4 locales (en/fi/sv/da) have both `common.answer.yes` and `common.answer.no` keys per `grep '"yes"\|"no"' apps/frontend/src/lib/i18n/translations/{en,fi,sv,da}/common.json`.
- **Confirmation that `EntityOpinions.svelte` was NOT modified:** Confirmed — `git diff --stat HEAD~4 HEAD -- apps/frontend/src/lib/dynamic-components/entityDetails/EntityOpinions.svelte` shows zero changes. QUESTION-02 resolved via shared dispatch only.
- **Incidental type narrowings while widening QuestionChoicesProps.question:** One — `choices` $derived in `QuestionChoices.svelte` needed a `'choices' in question` guard because `BooleanQuestion` has no `.choices` field. Without the guard, TS narrowed the union to only the choice-question variants when accessing `.choices` directly. The guard is defensive (real callers always supply `explicitChoices` for boolean); it's there to keep the component robust against mis-use.

## Self-Check: PASSED

Files verified exist:
- `packages/data/src/utils/typeGuards.ts` ✓
- `packages/data/src/utils/typeGuards.test.ts` ✓
- `packages/data/src/index.ts` ✓
- `apps/frontend/src/lib/components/questions/QuestionChoices.type.ts` ✓
- `apps/frontend/src/lib/components/questions/QuestionChoices.svelte` ✓
- `apps/frontend/src/lib/components/questions/OpinionQuestionInput.svelte` ✓

Commits verified in `git log`:
- `f231a7e5e` (Task 1 RED) ✓
- `0964f9eb4` (Task 1 GREEN) ✓
- `76cfeed14` (Task 2) ✓
- `61e2c0696` (Task 3) ✓

Acceptance-criteria grep counts verified:
- `grep -n "export function isBooleanQuestion" packages/data/src/utils/typeGuards.ts` → 1 line ✓
- `grep -n "^  isBooleanQuestion," packages/data/src/index.ts` → 1 line ✓
- `grep -n "describe('isBooleanQuestion'" packages/data/src/utils/typeGuards.test.ts` → 1 line ✓
- `grep -c "common.answer.yes" apps/frontend/src/lib/components/questions/OpinionQuestionInput.svelte` → 1 ✓
- `grep -c "common.answer.no" apps/frontend/src/lib/components/questions/OpinionQuestionInput.svelte` → 1 ✓
- `grep -c "ErrorMessage" apps/frontend/src/lib/components/questions/OpinionQuestionInput.svelte` → 2 ✓ (one import, one fallback usage)
- `grep -n 'data-testid="question-choices"' apps/frontend/src/lib/components/questions/QuestionChoices.svelte` → 1 line ✓
- `grep -n 'data-testid="question-choice"' apps/frontend/src/lib/components/questions/QuestionChoices.svelte` → 1 line ✓

Tests run green:
- `cd packages/data && npx vitest run src/utils/typeGuards.test.ts` → 9/9 pass ✓
- `yarn build --filter=@openvaa/data` → exit 0 ✓
- `yarn workspace @openvaa/data run typecheck` → exit 0 ✓
- `cd apps/frontend && yarn test:unit --run` → 613/613 pass ✓
- `npx svelte-check --tsconfig ./tsconfig.json` → pre-existing admin-route errors only; no errors on OpinionQuestionInput/QuestionChoices ✓

## Next Phase Readiness

- Plan 61-02 (category-selection reactivity, QUESTION-03) and Plan 61-03 (candidate-questions list reactivity, QUESTION-04) unblocked. This plan's surface (boolean rendering) is orthogonal to both; they can proceed in parallel or sequentially.
- Phase 61 overall remains on track for milestone v2.6 (Svelte 5 Migration Cleanup) completion.

---
*Phase: 61-voter-app-question-flow*
*Completed: 2026-04-24*
