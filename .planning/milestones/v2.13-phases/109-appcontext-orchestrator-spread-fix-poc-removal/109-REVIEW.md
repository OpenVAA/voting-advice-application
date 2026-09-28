---
phase: 109-appcontext-orchestrator-spread-fix-poc-removal
reviewed: 2026-06-12T23:35:52Z
depth: standard
files_reviewed: 4
files_reviewed_list:
  - apps/frontend/src/lib/contexts/app/appContext.svelte.ts
  - apps/frontend/src/lib/contexts/app/appContext.type.ts
  - apps/frontend/src/lib/contexts/component/darkMode.svelte.ts
  - apps/frontend/src/lib/contexts/app/appContext.spread.svelte.test.ts
findings:
  critical: 0
  warning: 2
  info: 2
  total: 4
status: clean
fixed_at: 2026-06-13T02:39:00Z
fix_commit: cbd3f0bd3
---

# Phase 109: Code Review Report

**Reviewed:** 2026-06-12T23:35:52Z
**Depth:** standard
**Files Reviewed:** 4
**Status:** clean (all findings fixed in `cbd3f0bd3`)

## Summary

Phase 109 converts `initAppContext()`'s object-literal factory into `class AppContextProvider implements AppContext`, replaces the three internal upstream-context instance-spreads (`{ ...componentCtx }` / `{ ...dataCtx }` / `{ ...tracking }`) with explicit own-enumerable forwarding, removes all Phase-102 `_poc*` scaffolding, and adds a headless spread-regression test.

The core spread-safety invariant is correctly implemented: all 32 `AppContext` members are own-enumerable on the constructed instance, verified both by manual cross-reference of `appContext.type.ts` against the constructor and by the new `appContext.spread.svelte.test.ts`. The SSR merge semantics (synchronous `$state` field initializers + prev-ref-guarded re-merge `$effect`s in the constructor) are preserved. PoC removal is complete — zero `_poc` hits, zero `createDarkMode` hits, deleted test accounts for exactly the −3 `it()` count observed.

Two warnings and two informational findings are raised. There are no blockers and no behavioral regressions introduced.

## Warnings

> **FIXED** in `cbd3f0bd3` — comment block at lines 100-106 replaced with the concise two-line note matching the actual export seam.

### WR-01: Stale comment in test file misdescribes AppContextProvider's export status

**File:** `apps/frontend/src/lib/contexts/app/appContext.spread.svelte.test.ts:100-106`
**Issue:** The block comment at lines 100-106 opens with "`AppContextProvider` is not exported (only the factory wrappers are)" — a factually false claim. `AppContextProvider` was exported as a test seam in Plan 03 (commit `8f9b6f5f3`). The comment then walks through two workarounds that were considered but not used, before landing on the approach that was actually implemented. A reader encountering this comment after line 107's `const { AppContextProvider } = await import('./appContext.svelte')` sees a direct contradiction: "not exported" immediately followed by a named export import.

The comment is vestigial RED-phase reasoning that was never cleaned up after the GREEN-phase fix. A future maintainer modifying this test could be misled into believing the export is somehow non-standard or needs to be worked around differently.

**Fix:** Replace lines 100-106 with a concise note that matches the actual implementation:
```ts
// `AppContextProvider` is exported as a documented test seam (109-03).
// Production code must use the `initAppContext()` / `getAppContext()` factory wrappers.
const { AppContextProvider } = await import('./appContext.svelte');
```

---

> **FIXED** in `cbd3f0bd3` — the five read-only reactive handles (`locale`, `locales`, `darkMode`, `reactiveAppSettings`, `reactiveLocale`) now use stable own-enumerable handle FIELDs assigned once in the constructor (`this.locale = { get current() {...} }`), giving reference-equal reads and a single stable reference per member, consistent with the writable/held handles. Inner `get current()` still reads live state. Spread test (live-read + own-enumerability) green: 101/101.

### WR-02: Object.defineProperty getter-of-factory creates a new handle object on every read

**File:** `apps/frontend/src/lib/contexts/app/appContext.svelte.ts:262-306`
**Issue:** The five `Object.defineProperty` members (`reactiveAppSettings`, `reactiveLocale`, `locale`, `locales`, `darkMode`) use the pattern:
```ts
Object.defineProperty(this, 'locale', {
  enumerable: true,
  configurable: true,
  get: () => ({          // outer getter
    get current() {      // inner getter (closes over self)
      return self.#componentCtx.locale;
    }
  })
});
```
Each access of `appContext.locale` invokes the outer getter and returns a **brand-new** `{ get current() }` object. This means:
- `appContext.locale !== appContext.locale` evaluates to `true` (two different objects).
- `{ ...appContext }.locale !== appContext.locale` (spread captures one fresh object; subsequent reads on the original create other fresh objects).

This is not currently a bug — all downstream consumers only read `.current` (never compare handle references). The three downstream spread sites (`candidateContext:366`, `voterContext:488`, `adminContext:98`) destructure the handles once and use `.current` in `$derived` blocks, which is correct.

However, the pattern is subtly different from the writable handle fields (`appType`, `appSettings`, `appCustomization`, `openFeedbackModal`), which are genuine shared object references (the same object is accessible via both `instance.appType` and `spread.appType`). The Object.defineProperty members give **reference-unequal but behaviorally equivalent** results on each read. Any future code that does `if (ctx.locale === otherCtx.locale)` or uses the handle as a Map key would silently misbehave.

The stable handles pattern used by writable fields (assigning the handle object directly: `this.appType = { ... }` in the constructor) would be equally correct and would produce a single stable reference per member — the same approach used for `getRoute`, `userPreferences`, `popupQueue`, and `surveyLink`.

**Fix:** Replace the `Object.defineProperty` pattern for the five read-only reactive handles with direct assignment in the constructor:
```ts
// locale
this.locale = {
  get current() { return self.#componentCtx.locale; }
};
// (repeat for locales, darkMode, reactiveAppSettings, reactiveLocale)
```
This gives each member a stable own-enumerable value, eliminates per-read object allocation, and is consistent with how the writable handles and held handles are installed. The existing TypeScript field declarations (`readonly locale!: AppContext['locale'];`) already accommodate this — no type changes needed.

Note: this change would also make `spread.locale === instance.locale` (same reference), which is the correct mental model for a stable handle.

## Info

> **FIXED** in `cbd3f0bd3` — Test 2 renamed to "reactive member handles remain readable and live after the spread"; comment corrected to state the spread copies a live handle reference, not a value snapshot.

### IN-01: Test 2 "snapshot semantics" comment mischaracterizes actual behavior

**File:** `apps/frontend/src/lib/contexts/app/appContext.spread.svelte.test.ts:185-195`
**Issue:** Test 2 is named and described as asserting "snapshot semantics: a representative reactive member read through the spread snapshot reflects the value at spread time." The implication is that after `{ ...instance }`, the captured handle holds a frozen value from the moment of spreading.

This description is incorrect. The spread does copy the outer getter's return value as a data property — but the inner `get current()` on that captured object still reads `self.#componentCtx.locale` through a live closure. The spread handle is **not a snapshot**; `spread.locale.current` returns the live locale value at the time `.current` is read, not at the time of spreading.

The actual behavior (live inner getter) is strictly better for correctness — it means downstream orchestrators that spread `appContext` at init time still get live reads of locale/darkMode/etc. But a maintainer reading "snapshot semantics" could incorrectly conclude that the spread represents a point-in-time value and might not think to look for reactivity issues if the locale should change and isn't reflected.

**Fix:** Rename the test and correct the comment:
```ts
// Test 2 — handle integrity: reactive members remain readable through the spread;
// the inner getter reads live state (the spread is NOT a snapshot — .current is live).
it('reactive member handles remain readable and live after the spread', () => {
  const instance = setup();
  const spread = { ...instance };
  expect(spread.appSettings).toBeDefined();
  expect(spread.appSettings.current).toBeDefined();
  // locale.current reads through the inner getter → live componentCtx locale.
  expect(spread.locale.current).toBe('en');
});
```

---

> **FIXED** in `cbd3f0bd3` — popup stub updated to `{ current: undefined, push, shift }`, matching the real `PopupStore` surface (`popupStore.svelte.ts`); vestigial `subscribe` removed.

### IN-02: Popup test stub has incorrect shape (extra `subscribe`, missing `shift`/`current`)

**File:** `apps/frontend/src/lib/contexts/app/appContext.spread.svelte.test.ts:62`
**Issue:** The popup stub is:
```ts
popup: { push: (_item: unknown) => {}, subscribe: () => () => {} }
```
`PopupStore` does not have a `subscribe` method (the real `PopupStore` is a rune-native class with `push`, `shift`, and the prototype getter `current`). The stub is missing `shift` and `current`, and has an extra `subscribe` that looks like a vestigial Svelte store artifact from an earlier iteration of the mock.

This does not affect test correctness — the test only checks that the `popupQueue` key exists in `Object.keys(spread)` (Test 1) and does not access `spread.popupQueue.current` or `spread.popupQueue.shift()` in Tests 2-3. But the misshapen stub is misleading: it suggests `PopupStore` has store-style interface, which it does not.

**Fix:** Update the stub to match the `PopupStore` interface:
```ts
popup: {
  current: undefined,
  push: (_item: unknown) => {},
  shift: () => {}
}
```

---

_Reviewed: 2026-06-12T23:35:52Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
