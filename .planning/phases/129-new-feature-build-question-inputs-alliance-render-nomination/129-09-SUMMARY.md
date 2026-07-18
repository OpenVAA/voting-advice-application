---
phase: 129-new-feature-build-question-inputs-alliance-render-nomination
plan: 09
subsystem: frontend (voter question flow + question inputs)
tags: [frontend, svelte5, multi-choice, d-07, unblk-02, gap-closure, matching-integrity, wr-01]
status: complete

# Dependency graph
requires:
  - phase: 129-06
    provides: "QuestionChoices checkbox multi-select + min/max validity gate + D-05 locator contract"
  - phase: 129-08
    provides: "e2e/base seed with qu-opin-base-7-multichoice (minSelections 2/maxSelections 3); voter/candidate journey specs"
provides:
  - "isMultiChoiceCountValid pure helper — single source of truth for the D-07 selection-count formula (effectiveMin = minSelections ?? 1, effectiveMax = maxSelections ?? choiceCount)"
  - "OpinionQuestionInput multi-choice branch assigns the bound `valid` SYNCHRONOUSLY before bubbling onChange (same-stack read by the voter layout)"
  - "Voter questions layout: handleAnswer withholds out-of-range non-empty multi-choice arrays from setAnswer (existence-guarded delete); nextLabel ANDs opinionInputValid; deleteEpoch composite {#key} remount"
  - "QuestionChoices selectedMulti seed re-keyed on question.id with untracked selectedIds read (wipe-proof against the invalid-state answer deletion)"
affects: [Phase-130 EQTYP answerMultiChoice boundary tests]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "D-07 selection-count validity lives in one pure helper (isMultiChoiceCountValid) consumed by both the OpinionQuestionInput validity $effect and its synchronous onChange assignment — component and unit test stay in lockstep"
    - "$bindable writes propagate to the parent's bound $state within the same synchronous call stack, whereas an $effect push flushes after the event handler — a caller reading the bound value inside the onChange stack must have it assigned synchronously first"
    - "Question-keyed untrack seed (void question.id read + untrack(() => assign from prop)) preserves Q→Q re-seeding while decoupling in-progress local state from a prop that a parent may null mid-interaction; explicit clears routed via a delete-epoch {#key} remount instead of live prop-tracking"

key-files:
  created:
    - apps/frontend/src/lib/utils/multiChoiceValidity.ts
    - apps/frontend/src/lib/utils/multiChoiceValidity.test.ts
    - .planning/phases/129-new-feature-build-question-inputs-alliance-render-nomination/129-09-SUMMARY.md
  modified:
    - apps/frontend/src/lib/components/questions/OpinionQuestionInput.svelte
    - apps/frontend/src/lib/components/questions/OpinionQuestionInput.type.ts
    - apps/frontend/src/routes/(voters)/(located)/questions/+layout.svelte
    - apps/frontend/src/lib/components/questions/QuestionChoices.svelte

key-decisions:
  - "The literal WR-01 diff was NOT applied verbatim — two source-discovered hazards were neutralized: (1) the validity $effect flushes after the synchronous onChange dispatch, so `valid` is now ALSO assigned synchronously in the multi-choice onChange wrapper before bubbling; (2) QuestionChoices.selectedMulti live-tracked the selectedIds prop, so the invalid-state answer deletion would have wiped in-progress checkboxes — the seed is now question-keyed with an untracked prop read"
  - "The persistence gate deletes a previously-persisted answer only when one exists (answers.answers[question.id] != null) so a fresh invalid toggle fires no spurious answer_delete tracking event / store churn"
  - "nextLabel ANDs opinionInputValid (not just the non-null store term) so the last-question CTA reads Skip while invalid — this also neutralizes a legacy invalid answer left in localStorage before this fix (non-null value, false validity)"
  - "Explicit answer deletion re-uses a deleteEpoch counter folded into the {#key} expression (`${question.type}-${deleteEpoch}`) rather than live prop-tracking, so the question-keyed seed re-reads the now-absent answer and clears the boxes without reintroducing the mid-interaction wipe"

metrics:
  duration: 26min
  tasks: 3
  files: 6
  completed: 2026-07-18

requirements-completed: [UNBLK-02]
---

# Phase 129 Plan 09: Voter Multi-Choice Persistence Gate (D-07 / UNBLK-02 Gap Closure) Summary

Closes the single verified Phase-129 gap (129-VERIFICATION.md UNBLK-02 voter-side persistence; corroborated by 129-REVIEW.md WR-01): the voter questions layout no longer persists an out-of-range multi-choice selection into the answers store, so `MultipleChoiceCategoricalQuestion._normalizeValue`/matching only ever consumes selections satisfying the authored min/max — invalid = unanswered in both the store and the UI (D-07). Delivered via a unit-tested shared validity helper, synchronous `$bindable` validity propagation, a gated + existence-guarded voter persistence path, a `nextLabel` validity AND-term, a wipe-proof question-keyed checkbox seed, and a delete-epoch remount.

## What was built

### Task 1 — Pure validity helper + synchronous valid assignment (TDD)
- **`apps/frontend/src/lib/utils/multiChoiceValidity.ts`** (new): `isMultiChoiceCountValid({ count, minSelections?, maxSelections?, choiceCount })` — the single source of truth for the D-07 count formula (`effectiveMin = minSelections ?? 1`, `effectiveMax = maxSelections ?? choiceCount`), extracted byte-for-byte from the formula previously inlined in the component's validity `$effect`.
- **`multiChoiceValidity.test.ts`** (new, RED→GREEN): 17 assertions covering the min2/max3/choiceCount5 boundary matrix (0/1 → false, 2/3 → true, 4 → false), the omitted-min fallback (0 → false, 1 → true), the omitted-max fallback (count === choiceCount → true), and both-omitted (1..choiceCount → true, 0 → false), plus `null`-equivalence cases.
- **`OpinionQuestionInput.svelte`**: imports the helper; a local `computeMultiChoiceValid(count)` narrows on `isMultipleChoiceQuestion`, reads `minSelections`/`maxSelections` via `getCustomData` + `question.choices.length`, and delegates to the helper. The validity `$effect` now delegates to it (retaining the mount seed / question-identity / non-multi-choice reset responsibilities). Crucially, the multi-choice `onChange` wrapper assigns `valid = computeMultiChoiceValid(d.value.length)` **synchronously before** bubbling `onChange`, so the voter layout's `handleAnswer` reads fresh validity in the same call stack (the `$effect` push flushes too late for that read).
- **`OpinionQuestionInput.type.ts`**: `valid` JSDoc extended to note the synchronous multi-choice propagation.

### Task 2 — Voter persistence gate + nextLabel + wipe-proof seed + delete-epoch
- **`+layout.svelte` `handleAnswer`**: after the existing empty-array → deleteAnswer branch, a new guard — when `Array.isArray(value) && !opinionInputValid`, `setAnswer` is NOT called; any previously-persisted answer is deleted **only if it exists** (`answers.answers[question.id] != null`), then returns. An out-of-range selection is treated as in-progress/unanswered and never reaches matching.
- **`+layout.svelte` `nextLabel`**: extended with `&& opinionInputValid` alongside the existing non-null term, so a last-position invalid selection shows Skip (not Results) — also neutralizes legacy invalid localStorage answers.
- **`+layout.svelte` delete-epoch**: `let deleteEpoch = $state(0)` (outside the `{#key}`), incremented in `handleDelete` after `deleteAnswer`; the `{#key}` expression is now `` `${question.type}-${deleteEpoch}` `` so an explicit delete remounts QuestionChoices and its question-keyed seed re-reads the now-absent answer and visually clears the boxes. Same-type Q→Q reuse is unchanged (deleteEpoch only bumps on the delete button).
- **`QuestionChoices.svelte`**: `untrack` added to the svelte import; the `selectedMulti` seed `$effect` rewritten to track `question.id` (void read) and assign from `selectedIds` inside `untrack()`. The prop is deliberately not live-tracked, so the invalid-state answer deletion (which nulls `selectedIds`) no longer wipes the voter's checked boxes mid-interaction. The radio `selected` sync, `handleToggle`, `multiConstraints`, and all markup (D-05 locator contract: `data-testid="question-choice"`, `name="questionChoices-{question.id}"`, `checkbox-primary h-32 w-32`) are byte-identical.

### Task 3 — Full E2E cardinal gate
- Ran against a fresh `yarn db:reset` + `yarn db:seed --template e2e/base` + one fresh dev server on :5173.
- **`yarn test:e2e`: 125 passed, 0 failed, 0 did-not-run (10.3m), exit 0** — matches the 129-08 baseline. voter-journey.spec.ts (checkbox walk: first click = intentionally-unpersisted invalid 1-selection, second click persists + enables Next) and candidate-journey.spec.ts both pass in the same run.

## Verification results

| Gate | Result |
| ---- | ------ |
| `yarn test:unit --run multiChoiceValidity` | 17 passed |
| `yarn test:unit --run` (full frontend) | 759 passed / 54 files (was 742 — +17 new, none fail) |
| `yarn check` (svelte-check) | 0 errors, 0 warnings, 2092 files |
| `yarn build --filter=@openvaa/frontend` | exit 0 |
| `yarn test:e2e` (cardinal) | 125 passed, 0 failed, 0 did-not-run, exit 0 |

## Deviations from Plan

None - plan executed exactly as written. The two "hazards" (stale $bindable timing, selectedMulti prop-sync wipe) were explicitly called out in the plan and handled as specified; `computeMultiChoiceValid` additionally narrows on `isMultipleChoiceQuestion` for type-safe `question.choices` access (the original inline formula was narrowed by its enclosing guard) — a mechanical type-safety detail, not a behavioral deviation.

## Authentication gates

None.

## Known Stubs

None. No placeholder values, empty-collection stubs, or unwired data introduced.

## Threat surface scan

No new security-relevant surface introduced beyond the plan's `<threat_model>`. The plan's T-129-10 (Tampering — voter persistence path) is mitigated exactly as specified: non-empty out-of-range arrays never reach `answers.setAnswer`, so matching only consumes selections satisfying the authored min/max. T-129-11 (client-side gate bypass) remains an accepted UX/data-quality constraint (not a security boundary); the nextLabel/answered AND-terms additionally neutralize legacy/hand-edited invalid stored values at the UI layer.

## TDD Gate Compliance

Task 1 followed RED→GREEN: `test(129-09)` commit (47374aec1, failing boundary-matrix test) precedes the `feat(129-09)` implementation commit (321c4987b). No REFACTOR commit needed.

## Self-Check: PASSED

All created/modified files exist on disk; all task commits present in git history:
- FOUND: apps/frontend/src/lib/utils/multiChoiceValidity.ts
- FOUND: apps/frontend/src/lib/utils/multiChoiceValidity.test.ts
- FOUND: apps/frontend/src/lib/components/questions/OpinionQuestionInput.svelte
- FOUND: apps/frontend/src/lib/components/questions/OpinionQuestionInput.type.ts
- FOUND: apps/frontend/src/routes/(voters)/(located)/questions/+layout.svelte
- FOUND: apps/frontend/src/lib/components/questions/QuestionChoices.svelte
- FOUND commit 47374aec1 (test), 321c4987b (feat), f92896248 (fix)
