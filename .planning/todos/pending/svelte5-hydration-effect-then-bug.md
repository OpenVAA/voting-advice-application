---
title: Fix Svelte 5 hydration bug — $state writes in $effect .then() don't trigger re-renders
priority: high
created: 2026-03-25
context: Phase 40/41 E2E test stabilization. Blocks 2 registration tests + 35 cascading tests.
---

# Svelte 5 hydration reactivity bug

`$state` writes inside `.then()` callbacks from `$effect` do NOT trigger DOM re-renders after SSR + hydration (full page loads). This affects:

1. **Candidate protected layout** (`apps/frontend/src/routes/candidate/(protected)/+layout.svelte`) — `ready = true` set inside `Promise.all(...).then(...)` leaves the component stuck at `<Loading />`. Server-side data loads succeed (confirmed via file-based debug logging), but the client DOM never updates.

2. **Root layout** (`apps/frontend/src/routes/+layout.svelte`) — same bug for popup queue store updates from `setTimeout`. Fixed with a `PopupRenderer` runes-mode wrapper component.

## Blocked tests (2 direct + 35 cascade)

- `candidate-registration.spec.ts:64` — "should complete registration via email link"
- `candidate-profile.spec.ts:51` — "should register the fresh candidate via email link"
- 4 serial tests in candidate-profile depend on the above
- 31 tests in re-auth-setup → candidate-app-settings → candidate-app-password → variant projects

The 35 cascading tests all pass independently (verified).

## Approaches tried that don't work

- `await tick()` after the `.then()` callback
- `untrack()` wrapper around the data application (writes inside untrack don't trigger re-renders either)
- Moving `$state` writes outside `untrack()` (still doesn't trigger)
- `$state(mounted)` guard with `onMount` to defer to second `$effect` run
- `page.reload()` / `page.goto()` in the test (full page loads all hit the same bug)

## What DOES work (for the popup case)

The `PopupRenderer` component pattern:
1. Runes-mode component with `onMount()` + manual store `.subscribe()`
2. `$state` mutations from the subscription callback DO trigger re-renders
3. Hidden `<span>` with reactive expression as "anchor" to force tracking

## Recommended fix

Refactor the protected layout's data loading to NOT use `$effect` + `.then()`. Options:
- Use `onMount` + `$effect` combo (onMount handles initial hydration, $effect handles navigation)
- Convert to a wrapper component pattern (like PopupRenderer)
- Migrate to synchronous data resolution with `untrack()` for `$dataRoot` mutations — but writes inside `untrack()` also don't trigger re-renders
- Wait for Svelte 5 bugfix (file upstream issue)
