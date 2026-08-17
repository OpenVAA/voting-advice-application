---
phase: 123-svelte-5-idiom-polish-lifecycle-reactive-state
reviewed: 2026-06-18T00:00:00Z
depth: standard
files_reviewed: 6
files_reviewed_list:
  - apps/frontend/src/lib/contexts/candidate/candidateContext.svelte.ts
  - apps/frontend/src/lib/contexts/candidate/candidateContext.svelte.test.ts
  - apps/frontend/src/lib/contexts/candidate/candidateUserDataState.svelte.ts
  - apps/frontend/src/lib/contexts/candidate/candidateUserDataState.svelte.test.ts
  - apps/frontend/src/lib/i18n/tests/__mocks__/app-navigation.ts
  - apps/frontend/vitest.config.ts
findings:
  critical: 0
  warning: 2
  info: 3
  total: 5
status: issues_found
---

# Phase 123: Code Review Report

**Reviewed:** 2026-06-18T00:00:00Z
**Depth:** standard
**Files Reviewed:** 6
**Status:** issues_found

## Summary

This is a behavior-neutral Svelte 5 idiom-polish phase. The production surface area is two
fixes plus new test code and a vitest mock/alias:

1. **candidateContext.svelte.ts:378** — added the missing `entityType` argument to the
   blocks-path `getApplicableQuestions({ elections, constituencies, entityType })` call. This is
   **correct**: every sibling call in the same `$effect` (`:363`, `:364`, `:369`, `:372`) already
   passes `entityType: ENTITY_TYPE.Candidate`, and `QuestionCategory.getApplicableQuestions`
   filters by entity type. The previously-omitted argument meant the blocks computation could
   include questions that do not apply to candidates while the flat `opinionQuestions` list
   (built at `:372` with `entityType`) excluded them — a genuine consistency bug, now resolved.

2. **candidateUserDataState.svelte.ts:152 + :279** — switched the truthy guards
   (`this.#editedTermsOfUseAccepted ?` / `if (image || termsOfUseAccepted)`) to explicit
   `!== undefined` tri-state guards. This is **correct** and is the central fix: `null` is a
   meaningful EDITED value for `termsOfUseAccepted` (user revoked acceptance), distinct from
   `undefined` (unedited). The old truthy guard silently dropped an edited `null`, so a revocation
   never reached `updateEntityProperties`. Test 5/Test 6 lock both halves of the contract.

The fixes themselves are sound. Findings below concern a residual tri-state inconsistency the
fix exposes but does not close (`#current` still uses `??`), and minor test-quality gaps.

## Warnings

### WR-01: `#current` composite still discards an edited `null` for `termsOfUseAccepted` (tri-state inconsistency the fix leaves open)

**File:** `apps/frontend/src/lib/contexts/candidate/candidateUserDataState.svelte.ts:78`
**Issue:** The phase fix establishes the tri-state contract that an edited `null` is a real value
that must persist (Test 5, plus the `!== undefined` guards at `:152` and `:279`). But the
`#current` composite still folds the edited value in with the nullish-coalescing operator:

```ts
termsOfUseAccepted: this.#editedTermsOfUseAccepted ?? termsOfUseAccepted,
```

When the user edits `termsOfUseAccepted` to `null`, `this.#editedTermsOfUseAccepted` is `null`,
so `null ?? termsOfUseAccepted` falls through to the **saved** value. Consequently `current`
(consumed by the UI and by the candidate context's downstream derivations) does NOT reflect a
pending `null` edit, even though `hasUnsaved` becomes `true` (via `#unsavedProperties` at `:152`,
which now correctly flags it) and `save()` will send the `null` (via `:279`). This is an internal
inconsistency: the store reports "you have unsaved changes" and will persist `null`, yet
`current` shows the old value until the save round-trips. Behaviorally subtle but real — and it is
the exact same null-vs-undefined trap the phase set out to close, left half-fixed one line away
from the change site.
**Fix:** Mirror the `:152`/`:279` tri-state guard in the composite:

```ts
termsOfUseAccepted:
  this.#editedTermsOfUseAccepted !== undefined ? this.#editedTermsOfUseAccepted : termsOfUseAccepted,
```

If intentionally left out of scope for behavior-neutrality, add a `// reason:` note at `:78`
pointing at the asymmetry so a future reader does not "fix" `:279` back to truthy to match `:78`.

### WR-02: No test covers `current` reflecting a pending `null` termsOfUseAccepted edit

**File:** `apps/frontend/src/lib/contexts/candidate/candidateUserDataState.svelte.test.ts:192-205`
**Issue:** Test 5 asserts that `save()` SENDS `termsOfUseAccepted: null` to the writer, which
exercises the `:279` guard. But no test reads `store.current?.candidate.termsOfUseAccepted` after
`setTermsOfUseAccepted(null)` and before `save()`. That read is precisely the path that exposes
WR-01 — the suite would pass even though `current` is stale for an edited `null`. The tri-state
coverage is therefore one-sided (write path only, not the composite-read path).
**Fix:** Add an assertion (independent of whether WR-01 is fixed — make it assert the intended
behavior so it goes RED against the current `??`):

```ts
store.setTermsOfUseAccepted(null);
flushSync();
expect(store.current?.candidate.termsOfUseAccepted).toBeNull();
expect(store.hasUnsaved).toBe(true);
```

## Info

### IN-01: `makeQuestionCategory` builds an unused `question` local

**File:** `apps/frontend/src/lib/contexts/candidate/candidateContext.svelte.test.ts:39-43`
**Issue:** The `question` object constructed inside `makeQuestionCategory` is never referenced —
the returned fake's `getApplicableQuestions` is the shared spy (`:48`), whose return value is set
per-test via `spies.getApplicableQuestions.mockReturnValue(...)` at `:113`. The local `question`
is dead. It also drifts: the JSDoc at `:34-36` claims the category "returns a non-empty array of
matchable-question-shaped fakes" but that array actually comes from the test's `mockReturnValue`,
not from this local.
**Fix:** Delete the `question` local (and trim the JSDoc to describe the spy wiring), or wire it
into a `mockReturnValue([question])` default so the harness is self-contained.

### IN-02: Single-assertion-only test cannot prove behavior-neutrality of the `entityType` fix

**File:** `apps/frontend/src/lib/contexts/candidate/candidateContext.svelte.test.ts:135-139`
**Issue:** The test asserts only that every `getApplicableQuestions` call received
`entityType === Candidate`. It does not assert that adding `entityType` did not change the
resulting `questionBlocks` content versus a no-`entityType` baseline — i.e. it proves the argument
is passed, not that passing it is behavior-neutral for this fixture. Because the fake
`getApplicableQuestions` ignores its argument (returns a fixed `mockReturnValue` regardless), the
test by construction cannot detect whether `entityType` filtering would change output. For a phase
whose contract is "behavior-neutral idiom polish," that is the property worth pinning. This is a
coverage-depth observation, not a correctness defect.
**Fix:** Optionally assert `provider.questionBlocks.blocks.length` / `.questions` shape so a future
refactor that breaks the blocks computation is caught, not just the argument shape.

### IN-03: `app-navigation` stub omits `goto`'s real return contract

**File:** `apps/frontend/src/lib/i18n/tests/__mocks__/app-navigation.ts:11`
**Issue:** The stub `goto` resolves to `undefined`. Production code chains off it —
`candidateContext.svelte.ts:507` does `goto(...).then(this.#reset)` and the `preregister` /
`exchangeCodeForIdToken` paths `return await goto(...)`. The stub's `Promise<void>` is compatible
with `.then(...)`, so this is fine today, but any future test that drives `#logout` / `preregister`
through this stub gets a no-op navigation with no observable effect. Low risk; flagged so a future
author knows the stub is a resolvable placeholder (as its own JSDoc states) and per-test
`vi.mock('$app/navigation', …)` is required to assert navigation behavior.
**Fix:** None required. Keep the per-test mock pattern (already documented at the stub's `:9` and at
`candidateContext.svelte.test.ts:100-101`).

---

_Reviewed: 2026-06-18T00:00:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
