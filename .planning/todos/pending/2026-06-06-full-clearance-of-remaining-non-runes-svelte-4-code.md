---
created: 2026-06-06T16:12:58.464Z
title: Full clearance of remaining non-runes Svelte 4 code
area: frontend
priority: medium
milestone: next (v2.12+)
files: []
resolves_phase: 105
---

## Problem

v2.11 (Phases 95-100) migrated the **contexts + routes** tree to Svelte 5 runes and
scoped its guarantee to `lib/contexts/**` + `routes/**` (decision 98-2). The rest of
the frontend (`lib/components`, `lib/utils`, `dynamic-components`, candidate
components) was NOT swept — so legacy Svelte 4 patterns still lurk there and can
break at runtime when they consume a now-rune-native producer.

**This is not hypothetical — it shipped a real crash in Phase 101:**
`apps/frontend/src/lib/dynamic-components/entityList/EntityListWithControls.svelte`
still bridged the appContext `locale` via `fromStore(locale)`, but the 97/98
migration made `locale` a `{ readonly current }` rune handle and removed the store
shape — so `fromStore` called `.subscribe` on a non-store and threw
`store.subscribe is not a function`, crashing the **entire voter results render** on
election selection (fixed in `ccf40c8e5`; sibling `EntityListControls.svelte` had the
same miss). The codemod simply didn't reach these files.

Residual Svelte 4 patterns to hunt frontend-wide:
- `svelte/store` imports + `fromStore` / `toStore` / `get(store)` / `$store`
  auto-subscribe on migrated handles
- `export let` props → `$props()`; `$$Props` / `$$restProps` / `$$slots`
- `createEventDispatcher` / `on:event` forwarding → callback props
- `<slot>` → snippets (`{@render}` / `{#snippet}`)
- reactive `$:` statements → `$derived` / `$effect`
- `bind:` rationale-comment leftovers (see [[2026-05-08-cleanup-65-01-bind-rationale-comments]])

## Solution

TBD — next-milestone sweep:
1. Land + widen the `svelte/store` ESLint guard to the whole `apps/frontend/src/**`
   tree (the enforcement companion, [[2026-06-04-extend-svelte-store-eslint-guard-app-wide]])
   to SURFACE store-import residuals.
2. Add lint rules / greps for the other Svelte-4 idioms above (`export let`,
   `$$Props`, `createEventDispatcher`, `<slot>`, `$:`).
3. Triage + migrate each to runes; for anything intentionally kept, add an explicit
   allow + rationale.
4. Run the full E2E + unit suites after the sweep — the EntityList crash proves these
   residuals are load-bearing, not cosmetic.

Backed by the `spike-findings-voting-advice-application-gsd` skill (rune-migration
patterns: reactive context shapes, `.current` handles, destructure-trap, codemod).
