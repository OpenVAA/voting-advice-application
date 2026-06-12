---
phase: 107-leaf-contexts-proof-reconciliation
reviewed: 2026-06-13T08:30:00Z
depth: standard
files_reviewed: 7
files_reviewed_list:
  - apps/frontend/src/lib/contexts/auth/authContext.svelte.ts
  - apps/frontend/src/lib/contexts/auth/authContext.svelte.test.ts
  - apps/frontend/src/lib/contexts/component/componentContext.svelte.ts
  - apps/frontend/src/lib/contexts/component/darkMode.svelte.ts
  - apps/frontend/src/lib/contexts/component/componentContext.svelte.test.ts
  - apps/frontend/src/lib/contexts/data/dataContext.svelte.ts
  - apps/frontend/src/lib/contexts/filter/filterContext.svelte.ts
findings:
  critical: 0
  warning: 2
  info: 1
  total: 3
status: clean
---

# Phase 107: Code Review Report

**Reviewed:** 2026-06-13T08:30:00Z
**Depth:** standard
**Files Reviewed:** 7
**Status:** issues_found

## Summary

Phase 107 converts `authContext` and `componentContext` from factory closures to `class AuthContextProvider implements AuthContext` and `class ComponentContextProvider implements ComponentContext`, with `dataContext` and `filterContext` receiving doc-comment-only reconciliation passes.

The core implementation is sound. The spread-safety mechanism (private `#isAuthenticated = $derived(...)` + own-enumerable constructor accessor for auth; `Object.assign(this, getI18nContext())` for i18n members in component) is correctly applied and headlessly verified. Arrow-function fields on all four DataWriter wrappers are correctly shaped. The `dataContext`/`filterContext` files are confirmed comment-only via the diff gate. Consumer byte-identity for candidateContext, adminContext, and appContext is confirmed — none were modified in Phase 107 commits.

Two pre-existing issues surface under the Phase 107 changes and warrant tracking: one error-string capitalization bug in `componentContext` (pre-existing, carried forward into the new class shape) and one test coverage gap where the spread test does not assert that `darkMode` is absent from the spread (the design intent). One informational note on the error string covers a naming inconsistency introduced before this phase.

No correctness, security, or data-loss findings attributable to Phase 107 changes.

## Warnings

### WR-01: Error strings in `getComponentContext` / `initComponentContext` have wrong casing and pluralisation

**File:** `apps/frontend/src/lib/contexts/component/componentContext.svelte.ts:53,62`
**Issue:** Both guard strings were pre-existing in the factory closure and were faithfully preserved during the class conversion (byte-identical guards requirement). However they are now permanently embedded in the class shape and will be read by every caller hitting a misconfigured context at runtime. The messages say `'GetComponentsContext() called before initComponentContext()'` and `'InitComponentsContext() called for a second time'` — the function names are capitalised (`Get...`, `Init...`) and pluralised (`Components` instead of `Component`), making them misleading in stack traces and error UIs. The correct names are `getComponentContext()` and `initComponentContext()`. Compare: `authContext.svelte.ts:105` correctly uses lowercase `'getAuthContext() called before initAuthContext()'`.
**Fix:** Update the two string literals to match the actual exported function names:
```ts
// line 53
error(500, 'getComponentContext() called before initComponentContext()');
// line 62
error(500, 'initComponentContext() called for a second time');
```
**Status:** Fixed in commit `682ba3263` — all 4 unit tests pass.

### WR-02: `componentContext.svelte.test.ts` does not assert that `darkMode` is absent from the spread

**File:** `apps/frontend/src/lib/contexts/component/componentContext.svelte.test.ts:44-55`
**Issue:** The spread-safety test (Behavior 1) correctly asserts that the four i18n members (`locale`, `locales`, `t`, `translate`) survive `{ ...new ComponentContextProvider() }`. However it does not assert that `darkMode` is NOT in the spread. This matters because `darkMode` is intentionally a prototype delegation getter — it must NOT be carried by the spread (appContext reads it via direct access and overrides it post-spread). Without the negative assertion, a future refactor that accidentally promotes `darkMode` to an own-enumerable property would go undetected by this test.
**Fix:** Add a negative assertion to the existing spread test case:
```ts
expect('darkMode' in spread).toBe(false); // prototype getter — must not survive the spread
```
**Status:** Fixed in commit `85a48fa41` — all 4 unit tests pass.

## Info

### IN-01: `componentContext.svelte.test.ts` does not test that the `darkMode` spread snapshot is coherent with `appContext` override

**File:** `apps/frontend/src/lib/contexts/component/componentContext.svelte.test.ts`
**Issue:** The test suite exercises spread-safety for i18n members and delegation for `darkMode`, but has no case that mirrors the actual appContext spread contract: `{ ...componentCtx }` followed by a `darkMode` override. The spread-of-context design is complex enough (and the appContext line ~297 contract is load-bearing) that a test asserting the full spread-then-override sequence would pin the behavior at the Phase 107 contract. This is a coverage gap, not a regression risk at present, since appContext exercises it at integration level.
**Fix (optional):** Add a test case:
```ts
it('darkMode is not in the spread, allowing the appContext override to be the sole source', () => {
  const spread = { ...new ComponentContextProvider() };
  expect('darkMode' in spread).toBe(false);
  // Simulate the appContext post-spread override
  const merged = { ...spread, darkMode: true };
  expect(merged.darkMode).toBe(true);
});
```
This is subsumed by the WR-02 fix above (which adds the negative assertion to the existing test); a separate case is optional.

---

_Reviewed: 2026-06-13T08:30:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
