---
phase: 106-group-f-helper-classes
plan: 03
subsystem: frontend-contexts
tags: [svelte5, class-conversion, persisted-state, context-as-class, CLASS-01]
requires:
  - "PersistedState<TValue> interface (pre-existing public contract)"
  - "getItemFromStorage / saveItemToStorage / getStorage (versioned-payload helpers, unchanged)"
provides:
  - "class PersistedStateImpl<TValue> implements PersistedState<TValue> — Svelte 5 class with #value $state field, get current, imperative arrow set/update, CR-01 init-persist in constructor"
  - "storageState() — retained internal factory, now returns new PersistedStateImpl(...)"
  - "localStorageState() / sessionStorageState() — retained thin wrappers (unchanged signatures)"
affects:
  - "userPreferences (appContext, P109) and answers (answerStore, P110) keep reading the same { current, set, update } API"
tech-stack:
  added: []
  patterns:
    - "Svelte 5 class with private #value $state field assigned in constructor body (depends on constructor param `stored`, so NOT a field initializer — avoids the read-before-init landmine)"
    - "imperative persistence inside arrow set/update (NEVER $effect) — keeps the class SSR/factory-constructable (no effect_orphan, A7/§21/§23)"
    - "CR-01 default-persist-on-init as a synchronous constructor side-effect (browser-gated inside saveItemToStorage), not an $effect (§20)"
key-files:
  created: []
  modified:
    - "apps/frontend/src/lib/contexts/utils/persistedState.svelte.ts"
decisions:
  - "Used class name PersistedStateImpl (A10) to avoid clashing with the exported PersistedState<TValue> interface that the 7 consumers depend on."
  - "No test changes (A11): the existing 15-case regression gate covers the class verbatim — versioned localStorage, raw sessionStorage, CR-01 init-persist, SSR browser=false, no-migration-shim, round-trip-via-fresh-handle (which exercises detached set). No class-specific edge surfaced that warranted a new case."
metrics:
  duration: ~2min
  completed: 2026-06-12
---

# Phase 106 Plan 03: persistedState Helper Class Summary

Converted the `storageState()` closure-return handle in `utils/persistedState.svelte.ts` into a real Svelte 5 class `PersistedStateImpl<TValue>` (private `#value` `$state` field, `get current`, imperative arrow `set`/`update`), preserving the versioned-payload read, the D-03 no-migration-shim, and the CR-01 default-persist-on-init verbatim — consumers byte-identical (CLASS-01).

## What Was Built

- **`class PersistedStateImpl<TValue> implements PersistedState<TValue>`** — the reactive core is a private `#value` `$state` field; `get current()` reads it. `set`/`update` are arrow-function fields (§18) that mutate `#value` then persist IMPERATIVELY via `saveItemToStorage` (never `$effect` — A7/§21), keeping the class constructable outside any effect context.
- **CR-01 init-persist** preserved verbatim as a synchronous constructor-body side-effect: `if (stored === null) saveItemToStorage(type, key, defaultValue)` — browser-gated inside the helper, so SSR is a no-op (§20, not an `$effect`).
- **`storageState()`** rewritten to `return new PersistedStateImpl(type, key, defaultValue)`.
- **`localStorageState()` / `sessionStorageState()`** unchanged thin wrappers; **`PersistedState<TValue>` interface**, `StorageType`, and the `getItemFromStorage`/`saveItemToStorage`/`getStorage` helpers UNCHANGED (versioned `{ version, data }` localStorage + `requireUserDataVersion` expiry + removeItem on stale = D-03; raw browser-gated sessionStorage).

## Landmine Avoided

The 106-02 landmine (a `$state`/`$derived` field initializer reading a private field assigned by the constructor → svelte-check +1) does NOT apply here because `#value` is assigned in the **constructor body** (it depends on the `stored` read), not as a field initializer. `#type`/`#key` are likewise constructor-body assignments. svelte-check held at the 151 baseline (zero new errors).

## Tasks Completed

| Task | Name | Commit | Files |
| ---- | ---- | ------ | ----- |
| 1 | Convert storageState() handle to a class with imperative arrow set/update | 003c13431 | apps/frontend/src/lib/contexts/utils/persistedState.svelte.ts |
| 2 | Green gate — persistedState class boundary | (verification only — no source change) | — |

## Verification

- `yarn vitest run src/lib/contexts/utils/persistedState.svelte.test.ts` — 15/15 green (versioned + raw + CR-01 + SSR + no-shim).
- `yarn vitest run src/lib/contexts/` — 85/85 green (full contexts suite, 17 files).
- `yarn build` — client + SSR bundles compiled (built in ~8s, `@sveltejs/adapter-node` done).
- `yarn svelte-check` — 2665 files, **151 ERRORS** (= baseline, zero NEW), 0 warnings.
- No `$effect(` in the file (imperative persistence preserved — grep count 0).
- Consumer byte-identity: `git diff --stat` of answerStore / appContext / trackingService / candidateUserDataStore / candidateContext / voterContext / appContext.type EMPTY (A4).

## Acceptance Criteria (all met)

Task 1:
- class count (`PersistedStateImpl|PersistedState`) = 1 ✓
- `set = (` / `update = (` arrow fields = 2 ✓
- `$effect(` count = 0 ✓
- `requireUserDataVersion` present (×2) + `removeItem` present (D-03 no-shim) ✓
- `export interface PersistedState` present; `localStorageState`/`sessionStorageState` still exported ✓
- existing 15 cases pass unchanged ✓

Task 2:
- contexts vitest exit 0 ✓
- build exit 0 (client + SSR) ✓
- svelte-check ≤ 151 ✓
- consumer diff EMPTY ✓

## Deviations from Plan

None — plan executed exactly as written. No deviation rules triggered; no test case added (A11 — no class-specific edge surfaced).

## Self-Check: PASSED

- `apps/frontend/src/lib/contexts/utils/persistedState.svelte.ts` — FOUND (modified, class landed).
- Commit `003c13431` — FOUND in git log.
