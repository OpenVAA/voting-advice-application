---
phase: 106-group-f-helper-classes
plan: 02
subsystem: frontend-contexts
tags: [svelte5, context-as-class, layout-overlay, untrack, refactor]
requires:
  - "settingsOverlay() factory (utils/SettingsOverlay.svelte.ts) — pre-class"
  - "SettingsOverlay.svelte.test.ts (regression gate)"
provides:
  - "class SettingsOverlay<TMerged, TOverlay> implements SettingsOverlayApi"
  - "settingsOverlay() factory — now returns new SettingsOverlay(base, merge)"
  - "SettingsOverlayApi interface — UNCHANGED (still exported)"
affects:
  - "apps/frontend/src/lib/contexts/layout/layoutContext.svelte.ts (3 registries — byte-identical, unchanged)"
  - "apps/frontend/src/routes/(voters)/+layout.svelte (consumer — byte-identical, unchanged)"
tech-stack:
  added: []
  patterns:
    - "Svelte 5 class: private #state slots + $derived current, prototype getters, arrow-field methods (§18)"
    - "untrack-guarded write-after-read in push/revert (§22) preserved verbatim"
    - "$derived field that reads constructor params is initialized in the constructor (not a field initializer) to avoid use-before-init ordering"
key-files:
  created: []
  modified:
    - "apps/frontend/src/lib/contexts/utils/SettingsOverlay.svelte.ts"
decisions:
  - "Initialized #current $derived in the constructor rather than as a class-field initializer: a field initializer reading this.#base runs before the constructor assigns it (TS use-before-init error #2729), which raised svelte-check to 152 (+1 over the 151 baseline). Constructor init keeps the baseline at 151 and the regression gate green."
  - "Task 2 added no test case: the existing SettingsOverlay.svelte.test.ts (5 cases) is the behavioral contract and passes unchanged — no class-specific edge (detached-this / re-merge-on-base-change) surfaced that warranted a new case (A11)."
metrics:
  duration: ~3min
  completed: 2026-06-12
---

# Phase 106 Plan 02: SettingsOverlay Helper Class Summary

Converted the `settingsOverlay()` factory-closure into a real Svelte 5 `class SettingsOverlay` implementing the unchanged `SettingsOverlayApi`, preserving the token-keyed overlay registry mechanic (`$state` slots + associative `$derived` `mergeSettings` reduce + `untrack`-guarded push/revert) verbatim; the existing 5-case regression gate passes unchanged and all 3 layoutContext registries + `(voters)/+layout.svelte` are byte-identical.

## What Was Built

- **`class SettingsOverlay<TMerged, TOverlay = TMerged> implements SettingsOverlayApi`** in `utils/SettingsOverlay.svelte.ts`:
  - Private fields `#base`, `#merge` (from constructor params), `#nextId`, `#slots = $state<...>([])`, and `#current` (the `$derived` associative reduce).
  - `push` and `use` are **arrow-function fields** (§18) — `push` captures `this` when called from inside `$effect` bodies (via `use`) or detached by consumers; `use` is the ONE permitted `$effect` (call-site cleanup, post-construction reaction, not init — §20).
  - `current` and `size` are **prototype getters** (this handle is not spread — Spike 020 finding A).
  - The **`untrack`-guarded write-after-read** in both `push` (the spread append) and the revert filter is preserved verbatim — the guard breaks the `effect_update_depth` loop + silent-scheduler-disable hazard (§22). File still has exactly 2 `untrack(` sites.
  - `alreadyReverted` idempotency latch preserved.
- **`settingsOverlay()` factory** retained, now `return new SettingsOverlay(base, merge)` (A1).
- **`SettingsOverlayApi` interface** — exported and unchanged (consumed by layoutContext + (voters)/+layout.svelte).
- The detailed file header (StackedState supersession, token-keyed registry rationale, associative-merge guarantee, `untrack` rationale) was ported onto the class docblock.

## Tasks

| Task | Name | Commit | Files |
| ---- | ---- | ------ | ----- |
| 1 | Convert settingsOverlay() to class SettingsOverlay (untrack + associative merge verbatim) | 37d1c6148 | apps/frontend/src/lib/contexts/utils/SettingsOverlay.svelte.ts |
| 2 | Green gate — SettingsOverlay class boundary | (no source change; verification only) | — |

## Verification

- `yarn vitest run src/lib/contexts/utils/SettingsOverlay.svelte.test.ts` — 5/5 green (regression gate unchanged).
- `yarn vitest run src/lib/contexts/` — 85/85 green across 17 files.
- `yarn build` — client + SSR bundles compiled (exit 0, built in ~8s).
- `yarn svelte-check` — 151 errors (= baseline; zero new errors over 151), 0 in SettingsOverlay/consumers.
- `git diff layoutContext.svelte.ts (voters)/+layout.svelte` — EMPTY (consumers byte-identical, A4).
- Acceptance: 1 `class SettingsOverlay`; 2 `untrack(` sites; `push = (` / `use = (` arrow fields; only executable `$effect` is inside `use`; `export interface SettingsOverlayApi` intact.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] `$derived` field use-before-init ordering**
- **Found during:** Task 2 (svelte-check raised 152 errors, +1 over the 151 baseline).
- **Issue:** Declaring `#current = $derived(this.#slots.reduce(..., this.#base))` as a class-field initializer reads `this.#base` before the constructor assigns it — class-field initializers run before the constructor body, so TS flagged "Property '#base' is used before its initialization" at `SettingsOverlay.svelte.ts:85`.
- **Fix:** Declared `#current: TMerged` without an initializer and assigned `this.#current = $derived(...)` in the constructor after `#base`/`#merge` are set. Added an explaining comment.
- **Files modified:** apps/frontend/src/lib/contexts/utils/SettingsOverlay.svelte.ts
- **Commit:** 37d1c6148 (amended into Task 1 — same file).

## Self-Check: PASSED

- FOUND: apps/frontend/src/lib/contexts/utils/SettingsOverlay.svelte.ts
- FOUND commit: 37d1c6148
