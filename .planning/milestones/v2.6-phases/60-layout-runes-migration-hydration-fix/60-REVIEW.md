---
phase: 60-layout-runes-migration-hydration-fix
reviewed: 2026-04-24T00:00:00Z
depth: standard
files_reviewed: 5
files_reviewed_list:
  - apps/frontend/src/routes/+layout.svelte
  - apps/frontend/src/routes/candidate/(protected)/+layout.svelte
  - apps/frontend/src/lib/components/accordionSelect/AccordionSelect.svelte
  - apps/frontend/src/lib/utils/email.ts
  - tests/tests/specs/voter/voter-popup-hydration.spec.ts
findings:
  critical: 0
  warning: 1
  info: 5
  total: 6
status: issues_found
---

# Phase 60: Code Review Report

**Reviewed:** 2026-04-24
**Depth:** standard
**Files Reviewed:** 5
**Status:** issues_found

## Summary

The phase-60 refactor is well-executed. The `$derived` + separate `$effect` pattern is applied consistently to both root and protected layouts, `untrack(...)` is correctly used around all side-effect writes that touch tracked state, and the `get(store)` pattern avoids the `effect_update_depth_exceeded` trap that the previous `$dataRoot.update(() => ...)` auto-subscription form introduced. The PopupRenderer workaround is cleanly inlined with no stale imports left behind, the SSR guards in `email.ts` are correct, and the `AccordionSelect` `untrack` fix mirrors the layout pattern.

No BLOCKING or HIGH-severity issues. One WARNING: the protected layout declares `layoutState: 'loading' | 'error' | 'terms' | 'ready'` as a `$derived`, but the derivation can never produce `'loading'` — the template branch for that state is dead, and the `Loading` component import is consequently unused. Several INFO items flag small cleanups (redundant describe config in the new spec, a narrow type-cast, a shape comment mismatch). None block phase closure.

## Warnings

### WR-01: Unreachable `'loading'` branch in protected layout

**File:** `apps/frontend/src/routes/candidate/(protected)/+layout.svelte:94-100, 147-148`
**Issue:** `layoutState` is declared as `$derived<'loading' | 'error' | 'terms' | 'ready'>` but the ternary expression only produces `'error'`, `'terms'`, or `'ready'` — no code path can yield `'loading'`. The `{:else if layoutState === 'loading'} <Loading />` template branch (line 147-148) is therefore dead, and the `Loading` import (line 20) exists only to serve that dead branch. This is not a correctness bug in production — the user just never sees a loading flash — but:
  1. It's inconsistent with the declared type (misleading for future readers who assume all four states are reachable).
  2. It leaves a `Loading` import that lints as "unused via dead branch" to any linter smart enough to flag it.
  3. The phase summary (`60-03-SUMMARY.md`) explicitly notes the enum was retained "per RESEARCH §Alternatives — clean readable branch shape" — keeping `'loading'` in the literal union while no branch produces it defeats that goal.

Note: the root layout took the opposite approach — it uses separate `error` / `ready` / `underMaintenance` `$derived` signals with `{#if error}{:else if !ready}<Loading>{:else if underMaintenance}{:else}` — and `ready` IS a reachable `false` state on the root path because it goes `false → true` on the very first `$derived` evaluation during SSR. The protected layout does not re-render its `'loading'` state because the loader is always `await`ed upstream and the first `$derived` evaluation immediately picks the resolved branch.

**Fix:** Pick one of the following:

Option A (recommended — tighten the union):
```ts
// 3-way enum — `'loading'` is unreachable post-refactor because the loader always awaits.
const layoutState = $derived<'error' | 'terms' | 'ready'>(
  validity.state === 'error'
    ? 'error'
    : !validity.candidate.termsOfUseAccepted && !termsAcceptedLocal
      ? 'terms'
      : 'ready'
);
```
Then remove the `{:else if layoutState === 'loading'}` branch at line 147-148 and drop the `import { Loading } from '$lib/components/loading';` on line 20.

Option B (keep `'loading'` but justify it): add a comment explaining why the state is declared-but-unreachable (e.g., "reserved for future async validation path; currently unreachable because loader always `await`s") and accept the dead import.

Recommend Option A — the tight union is more truthful and smaller.

## Info

### IN-01: Redundant `test.describe.configure({ mode: 'serial' })` in new hydration spec

**File:** `tests/tests/specs/voter/voter-popup-hydration.spec.ts:41, 46`
**Issue:** `test.describe.configure({ mode: 'serial', timeout: 60000 })` is called at module level (line 41), and then `test.describe.configure({ mode: 'serial' })` is called again inside the describe block (line 46). The second is redundant — the module-level call already applies `mode: 'serial'` to every describe in the file.

Additionally, `test.setTimeout(60000)` inside the test body (line 123) is redundant with the module-level `timeout: 60000` already set on line 41. Harmless but clutters the test.

**Fix:** Drop line 46 (`test.describe.configure({ mode: 'serial' })`) and line 123 (`test.setTimeout(60000)`). Keep the module-level configure on line 41.

### IN-02: Hand-rolled `validity` union type would be clearer with a named alias

**File:** `apps/frontend/src/routes/+layout.svelte:82-94`
**Issue:** The inline type annotation on the `validity` `$derived.by` is 3 lines of union, which is readable but hard to scan. The protected layout sibling (`candidate/(protected)/+layout.svelte:68-89`) inlines the same pattern but more tersely via discriminated-union `state: 'error' | 'resolved'`. The root layout uses the `'error' in validity` narrowing idiom instead, which works but is a less common TS pattern and requires the explicit wide type annotation to compile.

**Fix (optional):** Consider aligning the two layouts on the same narrowing idiom (discriminated union with `state: 'error' | 'resolved'`), or extract the `validity` shape to a named type. Not blocking — both forms are correct TS.

### IN-03: `as DPDataType[...]` double-cast after `isValidResult` narrowing

**File:** `apps/frontend/src/routes/+layout.svelte:90-92`, `apps/frontend/src/routes/candidate/(protected)/+layout.svelte:83`
**Issue:** Both layouts cast loader data via `as DPDataType['electionData']` (etc.) after `isValidResult(...)` returns `true`. But `isValidResult` is already a type guard (`result is DPDataType[TData]` per `apps/frontend/src/lib/api/utils/isValidResult.ts:11`). The cast should be redundant — TS should already know the narrowed type.

The reason the casts are needed: `isValidResult` narrowing applies to the argument at the call site, but the surrounding `if (!isValidResult(data.appSettingsData, ...)) return ...;` + subsequent non-local read `validity.appSettingsData` in the `$effect` breaks narrowing because the narrowed binding is scoped to the `$derived.by` callback. Once you enter the return object, TS sees `data.appSettingsData` as the wider loader union again.

This is the same pattern used in Plan 60-02's existing code (per comment on line 76-80 of protected layout). The cast IS safe, but the comment in the protected layout correctly notes it; the root layout lacks the equivalent justification comment on lines 90-92.

**Fix (optional):** Add a one-line comment in root `+layout.svelte:90-92` mirroring the protected layout's cast-justification (protected layout line 76-80).

### IN-04: `popupQueueState` comment on line 182 references removed variable context

**File:** `apps/frontend/src/routes/+layout.svelte:181-182`
**Issue:** The comment block on lines 181-182 reads: "popupItem reactivity is handled inline at the template tail via popupQueueState + {@const Component = item.component}". This is accurate for the implementation on lines 227-237, but its position inside the `<script>` block (between `feedbackModalRef` setup and the `fontUrl` constant) is orphaned — there is no adjacent code the comment describes. Future readers may wonder why the comment is there.

**Fix (optional):** Move the comment down to immediately above the template-tail popup renderer (line 227), or delete it (the code at 227-237 is self-explanatory).

### IN-05: Test spec does not assert popup content identity, only presence

**File:** `tests/tests/specs/voter/voter-popup-hydration.spec.ts:160-162`
**Issue:** The assertion chain is `page.getByRole('dialog')` → `waitFor visible` → `expect(toBeVisible)`. This verifies a dialog exists, but does not verify it's specifically the `FeedbackPopup` (vs `DataConsentPopup`, `Notification`, `PreregisteredNotification`, or any other dialog that might render during the test). The `suppressInterferingPopups` + the `showFeedbackPopup: 2` setting should pin the content, but if a future change adds a new dialog to the hydration path, the test would false-pass.

For reference, `voter-popups.spec.ts:108` asserts `dialog.locator('h3').first()` after the dialog appears, but that still doesn't check the heading text.

**Fix (optional):** Assert on a specific testId or a stable heading text unique to `FeedbackPopup`, e.g. `await expect(dialog).toContainText(<feedback-popup-specific-string>);` or `await expect(dialog.getByTestId(testIds.voter.feedbackPopup.root)).toBeVisible();` (if such a testId exists). Not required for the LAYOUT-03 gate — the current assertion is sufficient for the specific regression it targets — but would harden the test against future coupling.

---

_Reviewed: 2026-04-24_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
