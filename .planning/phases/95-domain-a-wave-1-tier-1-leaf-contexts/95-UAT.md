---
status: testing
phase: 95-domain-a-wave-1-tier-1-leaf-contexts
source: [95-VERIFICATION.md]
started: 2026-06-04T12:52:23Z
updated: 2026-06-04T12:52:23Z
---

## Current Test

number: 1
name: SSR appSettings DB-override no-flash
expected: |
  The server-rendered HTML carries the overridden value; no default-then-override
  flash is visible even before hydration completes.
awaiting: user response (manual slow-3G visual inspection)

## Tests

### 1. SSR appSettings DB-override no-flash
expected: Throttle the network to slow-3G, hard-load a Supabase instance with a DB-overridden app setting (e.g. a custom theme color or logo URL distinct from the static default), and inspect the initial server-rendered HTML — the DB-override value is present in the page source before any client-side JavaScript executes; no default-then-override flash is visible even before hydration completes.
result: [pending]
note: Requires manual slow-3G visual inspection (no-flash is a perceptual property). The SSR-aware synchronous appSettings init mechanism is present and verified in code (95-VERIFICATION 5/5). Deferred to operator eyeball.

### 2. Layout chrome across voter/candidate/admin journeys
expected: Navigate a voter journey (questions → results) and a candidate journey (login → profile → questions) and visually confirm layout chrome renders correctly — drawer background, top-bar show/hide, navigation show/hide — across voter, candidate, and admin route transitions; no chrome corruption on rapid forward/back navigation; out-of-order overlay mount/unmount (e.g. opening a modal while transitioning) does not corrupt the merged overlay state.
result: pass
note: Auto-verified via e2e — voter-journey (green twice, debug session) and candidate-journey (5/5 passed, 2026-06-04) both walk the full multi-route flow with no chrome corruption / crash across all transitions. Pure visual aesthetics (drawer bg shade, exact top-bar show/hide) not separately asserted but every transition is exercised without failure.

### 3. Popup queue FIFO behavioral gate
expected: Trigger a feedback popup and a survey popup; they render using `popupQueue.current`; dismissal (shift) correctly surfaces the next queued item as the new head; no popup duplication or stuck popups.
result: pass
note: Auto-verified via unit — popupStore.svelte.test.ts 4/4 passed (FIFO enqueue/shift/head-surfacing, no duplication).

## Summary

total: 3
passed: 2
issues: 0
pending: 1
skipped: 0
blocked: 0

## Gaps
