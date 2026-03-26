---
title: Convert layouts to Svelte 5 runes mode (root + protected candidate)
priority: high
created: 2026-03-24
context: Phase 40/41 fixes revealed a Svelte 5 reactivity bug where $state writes inside .then() callbacks from $effect (or store-derived updates from setTimeout) do NOT trigger DOM re-renders after SSR+hydration. This affects both the root layout (popup rendering) and the candidate protected layout (data loading). Workarounds are in place but the proper fix is full runes migration.
---

# Convert layouts to Svelte 5 runes mode

Two layouts are still in Svelte 4 legacy mode or use patterns incompatible with Svelte 5's hydration reactivity:

1. **Root layout** (`apps/frontend/src/routes/+layout.svelte`) — Svelte 4 legacy mode
2. **Candidate protected layout** (`apps/frontend/src/routes/candidate/(protected)/+layout.svelte`) — Runes mode but uses `$effect` + `.then()` pattern that fails during hydration

## Why

Svelte 5's hydration has a reactivity bug where `$state` writes made inside `.then()` callbacks from `$effect`, or store updates from `setTimeout`, do NOT trigger DOM re-renders on the initial page load (SSR + hydration). This manifests as:

1. **Root layout**: `{#if $popupQueue}` blocks never render when the popup store is updated from a setTimeout callback. Fixed with a `PopupRenderer` runes-mode wrapper component.
2. **Protected candidate layout**: `ready = true` set inside `Promise.all(...).then(...)` inside `$effect` doesn't update the `{:else if !ready}` block, leaving the page stuck at "Loading…" after a full page load. Server-side data loading succeeds (confirmed), but the client DOM never updates. This blocks 2 E2E registration tests.

The `.then()` path works for SvelteKit client-side navigation (where the component is created on the client) but NOT for full page loads (SSR + hydration). The pattern works for existing auth-setup users (who navigate via client-side form action) but fails for newly registered users who arrive via `page.goto()` (full page load).

**Approaches tried that DON'T work:**
- `await tick()` after the `.then()` callback
- `untrack()` wrapper for the data application
- Moving `$state` writes outside `untrack()`
- Using a `$state(mounted)` guard with `onMount`
- `page.reload()` in the test

**Root cause**: Svelte 5 doesn't schedule re-renders for `$state` mutations that occur in microtasks (`.then()`) during the initial `$effect` run after hydration.

## Skip if

This is already covered by a complete runes migration milestone (check ROADMAP.md for a "root layout runes" or "full runes migration" phase). The v1.3/v1.4 milestones migrated content and candidate components but may have left the root layout in legacy mode intentionally.

## Scope

- Replace `export let data` with `let { data } = $props()`
- Replace `$:` reactive blocks with `$derived` / `$effect`
- Replace `<slot />` with `{@render children()}`
- Replace `$store` auto-subscriptions with explicit patterns if needed
- Remove the `PopupRenderer` workaround if direct store rendering works after migration
- Test all existing E2E tests pass after migration
