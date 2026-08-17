---
phase: 61-voter-app-question-flow
reviewed: 2026-04-24T10:00:00Z
depth: standard
files_reviewed: 11
files_reviewed_list:
  - packages/data/src/utils/typeGuards.ts
  - packages/data/src/utils/typeGuards.test.ts
  - packages/data/src/index.ts
  - apps/frontend/src/lib/components/questions/QuestionChoices.type.ts
  - apps/frontend/src/lib/components/questions/QuestionChoices.svelte
  - apps/frontend/src/lib/components/questions/OpinionQuestionInput.svelte
  - apps/frontend/src/lib/contexts/voter/voterContext.svelte.ts
  - apps/frontend/src/routes/(voters)/(located)/questions/+page.svelte
  - apps/frontend/src/lib/contexts/candidate/candidateContext.svelte.ts
  - apps/frontend/src/routes/candidate/(protected)/questions/+layout.svelte
  - tests/tests/specs/voter/voter-questions.spec.ts
findings:
  critical: 0
  warning: 2
  info: 1
  total: 3
status: issues_found
---

# Phase 61: Code Review Report

**Reviewed:** 2026-04-24T10:00:00Z
**Depth:** standard
**Files Reviewed:** 11
**Status:** issues_found

## Summary

Phase 61 delivers the voter-app question flow: BooleanQuestion support in QuestionChoices, the OpinionQuestionInput boolean branch, voterContext QUESTION-03 migration to pure `$state`, candidateContext QUESTION-04 push-based `$state`+`$effect` pattern, and regression gate E2E tests.

The boolean pseudo-choice dispatch (`'yes'/'no'` → `boolean`) is correct. The `booleanToChoiceId` mapping is symmetric with the `onChange` adapter (`d.value === 'yes'`). The `triggerCallback` guard (`value == null → return`) prevents the adapter from ever receiving a null and producing a spurious `false`. The i18n keys use `common.answer.yes/no` as specified. The testId constants in `testIds.ts` match all `data-testid` attributes in the voter questions page. The voterContext QUESTION-03 migration is clean — no leftover `sessionStorageWritable` for `selectedQuestionCategoryIds`, and the `hasSeededCategorySelection` guard prevents clobbering user de-selections. Type guards (`isBooleanQuestion`, `isQuestion`, `isNomination`) correctly handle the camelCase `OBJECT_TYPE` string values via `endsWith`. The E2E test selectors are stable (keyed via `testIds` constants) and the assertions are sound.

Two warnings were found, both in `candidateContext.svelte.ts`:
1. Two `$effect` blocks call `getElection`/`getConstituency` without error handling, unlike the equivalent derivations in `voterContext.svelte.ts` which wrap the same calls in `try/catch`.
2. A dead validation check (copy-paste error) inside `nextInfoQuestions.flatMap` that can never fire.

One info item: a minor JSDoc typo in `typeGuards.ts`.

## Warnings

### WR-01: Missing error handling around `getElection`/`getConstituency` in candidateContext effects

**File:** `apps/frontend/src/lib/contexts/candidate/candidateContext.svelte.ts:127-149`
**Issue:** Two `$effect` blocks map nomination IDs directly to `DataRoot` lookups without error handling. `dr.getElection(n.electionId)` (line 135) and `dr.getConstituency(n.constituencyId)` (line 147) both throw `DataNotFoundError` if the ID is not found (e.g., stale session after a data migration or election deletion). An unhandled throw inside a Svelte 5 `$effect` propagates to the nearest error boundary and crashes the candidate app silently. The equivalent derivations in `voterContext.svelte.ts` (lines 83-89 and 103-109) both use `try/catch` and redirect gracefully.

**Fix:** Wrap the `.map()` calls in try/catch, consistent with the voterContext pattern:

```typescript
$effect(() => {
  const dr = reactiveDataRoot.current;
  const current = userData.current;
  if (!current || !dr.elections?.length) {
    selectedElections = [];
    return;
  }
  try {
    selectedElections = removeDuplicates(
      current.nominations.nominations.map((n) => dr.getElection(n.electionId))
    );
  } catch (e) {
    logDebugError(`[candidateContext selectedElections] Error fetching election: ${e}`);
    selectedElections = [];
  }
});

$effect(() => {
  const dr = reactiveDataRoot.current;
  const current = userData.current;
  if (!current || !dr.constituencies?.length) {
    selectedConstituencies = [];
    return;
  }
  try {
    selectedConstituencies = removeDuplicates(
      current.nominations.nominations.map((n) => dr.getConstituency(n.constituencyId))
    );
  } catch (e) {
    logDebugError(`[candidateContext selectedConstituencies] Error fetching constituency: ${e}`);
    selectedConstituencies = [];
  }
});
```

### WR-02: Dead validation check inside `nextInfoQuestions.flatMap` (copy-paste error)

**File:** `apps/frontend/src/lib/contexts/candidate/candidateContext.svelte.ts:193-198`
**Issue:** `nextInfoCats` is defined on line 187-189 as `nextQuestionCategories.filter(qc => qc.type !== QUESTION_CATEGORY_TYPE.Opinion)` — it exclusively contains non-Opinion categories. The guard inside the `.flatMap` on line 195 checks `if (c.type === QUESTION_CATEGORY_TYPE.Opinion ...)` which can never be true. This appears to be a copy-paste from the adjacent `nextOpinionQuestions.flatMap` block (lines 199-204). The check silently does nothing but misleads the reader into believing it provides a safety net.

```typescript
// BEFORE — dead check (c is always non-Opinion inside nextInfoCats)
const nextInfoQuestions = nextInfoCats.flatMap((c) => {
  const questions = c.getApplicableQuestions({ elections, constituencies, entityType });
  if (c.type === QUESTION_CATEGORY_TYPE.Opinion && questions.some((q) => !q.isMatchable))
    error(500, `Some opinion questions in category ${c.id} is not matchable.`);
  return questions;
});

// AFTER — remove the dead branch
const nextInfoQuestions = nextInfoCats.flatMap((c) =>
  c.getApplicableQuestions({ elections, constituencies, entityType })
);
```

## Info

### IN-01: JSDoc grammar typo in typeGuards.ts ("a any" instead of "any")

**File:** `packages/data/src/utils/typeGuards.ts:25, 39, 53, 60, 73, 86`
**Issue:** Multiple JSDoc comments read "Check if an object is a any subtype of `X`." — the article should be "any" (without "a"). Cosmetic only; no functional impact.
**Fix:** Change `"is a any subtype"` to `"is any subtype"` in the six affected JSDoc lines.

---

_Reviewed: 2026-04-24T10:00:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
