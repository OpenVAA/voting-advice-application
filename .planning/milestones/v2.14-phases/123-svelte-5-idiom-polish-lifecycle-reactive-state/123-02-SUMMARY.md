---
phase: 123-svelte-5-idiom-polish-lifecycle-reactive-state
plan: 02
subsystem: candidate-context
tags: [svelte5, runes, candidate-context, candidate-store, tri-state, regression-test, bugfix, RUNES-05]

requires:
  - phase: 123-svelte-5-idiom-polish-lifecycle-reactive-state
    plan: 01
    provides: "Wave-0 Bug-1 RED regression test + pinned svelte-check baseline (151 errors / 1 warning)"
provides:
  - "Bug 1 fix — entityType passed to the questionBlocks-path getApplicableQuestions call (candidateContext.svelte.ts:378), turning the Wave-0 RED test GREEN"
  - "Bug 2 fix — tri-state !== undefined guards so an explicit termsOfUseAccepted: null reaches updateEntityProperties while an unedited (undefined) value is skipped"
  - "Bug 2 regression tests — Test 5 (explicit null persists) + Test 6 (unedited undefined skipped) in candidateUserDataState.svelte.test.ts"
affects: [123-03, 123-04 (criterion-4 gate held at baseline; candidate questions E2E flow re-confirms behavior-neutrality)]

tech-stack:
  added: []
  patterns:
    - "Tri-state contract enforcement: undefined = unedited (skip); null OR string = edited (send) — guarded with !== undefined rather than truthy checks"

key-files:
  created: []
  modified:
    - apps/frontend/src/lib/contexts/candidate/candidateContext.svelte.ts
    - apps/frontend/src/lib/contexts/candidate/candidateUserDataState.svelte.ts
    - apps/frontend/src/lib/contexts/candidate/candidateUserDataState.svelte.test.ts

key-decisions:
  - "Bug 1: single-property addition at :378 mirroring the three sibling getApplicableQuestions calls; zero blast radius beyond questionBlocks. No new declaration/import (entityType already in scope at :359)."
  - "Bug 2: changed ONLY the termsOfUseAccepted sub-expression at the changed-props filter (:150) and the save guard (:276); #editedImage truthy guard and the load-bearing merge at :286 left byte-for-byte unchanged."
  - "Line :150 was reformatted across multiple lines by Prettier to satisfy line-length after the longer !== undefined expression; the only logic change is the terms sub-expression."

requirements: [RUNES-05]

metrics:
  duration: ~6min
  completed: 2026-06-17
  tasks: 3
  files: 3
---

# Phase 123 Plan 02: Bug 1 + Bug 2 Context Fixes Summary

Fixed the two known RUNES-05 candidate-context bugs with minimal, scope-disciplined diffs, each guarded by a regression test. Bug 1 (one-line `entityType` addition) turns the Wave-0 RED test GREEN; Bug 2 (two `!== undefined` tri-state guards) lets an explicit `termsOfUseAccepted: null` persist while keeping the string path byte-for-byte neutral. Full frontend unit suite green (769/769); svelte-check held at the pinned baseline (151 errors / 1 warning, delta 0).

## What Was Built

### Task 1 — Bug 1 fix (`candidateContext.svelte.ts:378`)
Changed the `nextBlocks` computation's `getApplicableQuestions` argument from `{ elections, constituencies }` to `{ elections, constituencies, entityType }`, mirroring the three sibling calls at :364/369/372 (and the `appliesTo` filter at :363). `entityType = ENTITY_TYPE.Candidate` was already in scope (declared at :359 in the same `$effect` body) — no new declaration or import. `git diff` shows exactly one changed line. The Wave-0 `candidateContext.svelte.test.ts` (previously RED with `AssertionError: expected undefined to be 'candidate'`) now passes GREEN.

### Task 2 — Bug 2 fix (`candidateUserDataState.svelte.ts:150,276` + Tests 5/6)
Two scoped `!== undefined` guards honoring the tri-state contract (`undefined` = unedited → skip; `null` OR `string` = edited → send):
1. Changed-props filter (:150): `this.#editedTermsOfUseAccepted ? 'termsOfUseAccepted' : undefined` → `this.#editedTermsOfUseAccepted !== undefined ? 'termsOfUseAccepted' : undefined`. The `#editedImage` truthy guard on the same expression is unchanged (`#editedImage` is `ImageWithFile | undefined`, not tri-state). Prettier reformatted the array literal across lines to satisfy line-length — cosmetic only; logic change is the terms sub-expression alone.
2. Save guard (:276): `if (image || termsOfUseAccepted)` → `if (image || termsOfUseAccepted !== undefined)`. The `image` truthy term is unchanged.

The load-bearing merge at :286 was left byte-for-byte unchanged. Added Test 5 (explicit `null`: `updateEntityProperties` called once with `properties.termsOfUseAccepted` toBeNull) and Test 6 (unedited undefined: `updateEntityProperties` not called) after Test 4. Existing Test 3 (string-timestamp path) passes unchanged — proving byte-for-byte string-path neutrality.

### Task 3 — Per-plan gate
- `yarn workspace @openvaa/frontend test:unit`: **769 passed (769)** across 60 test files — full suite green, including Tests 5+6 and the now-green Bug-1 candidateContext test.
- `yarn workspace @openvaa/frontend check`: `COMPLETED 2088 FILES 151 ERRORS 1 WARNINGS 30 FILES_WITH_PROBLEMS`.

## Criterion-4: svelte-check vs pinned baseline

| Metric | Pinned baseline (123-BASELINE.md) | Post-fix | Delta |
|--------|-----------------------------------|----------|-------|
| ERRORS | 151 | **151** | 0 |
| WARNINGS | 1 | **1** | 0 |

No net-new svelte-check error in any file touched by this plan. Criterion 4 satisfied.

## Diff scope verification

- `candidateContext.svelte.ts`: exactly one changed line (:378), the `entityType` property addition.
- `candidateUserDataState.svelte.ts`: only the two `termsOfUseAccepted` sub-expressions changed (:150 terms term, :276 save guard); `#editedImage` guard and the :286 merge untouched.
- `candidateUserDataState.svelte.test.ts`: Tests 5+6 appended inside the existing `describe('candidateUserDataState.save()')` block; no existing test modified.

## Deviations from Plan

None — plan executed exactly as written. (The Prettier line-reformat at :150 is a formatter artifact of the longer expression, not a behavioral or scope deviation; the terms sub-expression is the sole logic change.)

## Known Stubs

None. The test fakes (`makeFakeWriter`, `makeUserData`) are intentional test doubles, not production stubs.

## Commits

- `ac45bea6c` fix(123-02): pass entityType to blocks-path getApplicableQuestions
- `b36243050` fix(123-02): honor tri-state termsOfUseAccepted with !== undefined guards

## Self-Check: PASSED

All three modified files exist on disk with the described changes. Both task commits (`ac45bea6c`, `b36243050`) are present in git history. Full frontend unit suite is GREEN (769/769) — the previously-failing Bug-1 test now passes and Bug-2 Tests 5+6 pass. svelte-check reports 151 errors / 1 warning, exactly at the pinned baseline (delta 0).
