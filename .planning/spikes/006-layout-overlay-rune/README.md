---
spike: 006
name: layout-overlay-rune
type: standard
validates: "Given a token-keyed overlay registry replacing StackedState + getLayoutContext(onDestroy) index plumbing, when nested mock routes mount and unmount in arbitrary order — including the canonical breaks-with-index-revert case (parent unmounts while child still live) — then (a) the effective merged settings reflect the live set of mounted overlays, (b) `$effect`-scoped auto-cleanup eliminates the onDestroy plumbing burden, (c) the producer effect does not loop infinitely (the same trap surfaced in Spike 002), (d) zero `svelte/store` imports remain"
verdict: VALIDATED
related: [002]
tags: [svelte5, runes, layout, stackedstate, untrack, migration]
---

# Spike 006 — Layout Settings Overlay as a Native Svelte 5 Rune

## What This Validates

Replace the production `apps/frontend/src/lib/contexts/utils/StackedState.svelte.ts`
(class with `implements Readable<T>` + `toStore()` + `subscribe` getter) AND the
production `getLayoutContext(onDestroy)` consumer pattern in
`apps/frontend/src/lib/contexts/layout/layoutContext.svelte.ts:169-181` with a
single rune-native API:

```ts
// Production today — 28 imperative push() callsites + onDestroy plumbing:
const { topBarSettings, pageStyles } = getLayoutContext(onDestroy);
topBarSettings.push({ progress: 'fixed-bottom' });
pageStyles.push({ drawer: { background: 'bg-base-300' } });

// Spike 006 — declarative, $effect-scoped:
const layout = getLayoutSettingsRune();
layout.useTopBar({ progress: 'fixed-bottom' });
layout.usePageStyles({ drawer: { background: 'bg-base-300' } });
```

**Robustness gain:** token-keyed registry instead of index-based stack.
The current `getLayoutContext(onDestroy)` snapshots stack indexes at call
time and reverts to those indexes in `onDestroy`. This is fragile when
multiple components push concurrently — if a parent layout unmounts before
its child, the parent's index becomes stale and the wrong slots get popped.
The token-keyed registry tracks each overlay by a unique id; revert removes
that exact entry regardless of stack position.

## Research

### Critical reuse from Spike 002

The naïve implementation of `push()`:

```ts
function push(overlay) {
  slots = [...slots, { id, overlay }];  // reads slots AND writes slots
}
```

triggers `effect_update_depth_exceeded` when called from inside an `$effect`
body (which is what `use()` does). This is the **exact same trap** surfaced
in Spike 002's dataRoot producer: an effect that reads and writes the same
`$state` enters a self-referential loop. The fix is identical — wrap the
read-side of the cycle in `untrack()`:

```ts
function push(overlay) {
  const id = ++nextId;
  untrack(() => { slots = [...slots, { id, overlay }]; });  // ← untrack the read
  ...
}
```

This pattern is now a CONVENTIONS-level invariant for any rune that wraps a
mutable collection consumed by `$effect`.

### Merge associativity

`mergeSettings()` from `@openvaa/app-shared` is associative — `merge(a, b)` then
`merge(result, c)` produces the same object as a single `reduce(merge, base, [a, b, c])`.
This means the registry approach (`current = slots.reduce(merge, base)`) is
mathematically equivalent to the strict-LIFO stack approach for the merge
result — only the cleanup semantics differ.

## Implementation

Three co-located files in `apps/frontend/src/routes/runes-test/layout-overlay/`:

1. **`SettingsOverlay.svelte.ts`** — generic overlay registry:
   - `settingsOverlay<TMerged, TOverlay>(base, mergeFn) → { current, push, use, size }`
   - `push(overlay) → () => void` — manual push, returns revert function
   - `use(overlay) → void` — `$effect`-scoped declarative push (auto-cleans on destroy)
   - Internal `slots` $state with untracked writes

2. **`layoutSettingsRune.svelte.ts`** — context module wrapping three overlays:
   - `initLayoutSettingsRune()` / `getLayoutSettingsRune()` context pair
   - Exposes `topBar`, `pageStyles`, `navigation` overlays + ergonomic
     `useTopBar(o)`, `usePageStyles(o)`, `useNavigation(o)` methods

3. **`MockRoute.svelte`** — a fake "route" component that demonstrates the
   consumer pattern. Mounts overlays at component init, unmounts via
   `$effect` cleanup. No `onDestroy` import, no index bookkeeping.

Demo at `/runes-test/layout-overlay` with three independently toggleable
mock routes (A = parent layout, B = child layout, C = page) and a live
effective-settings panel.

## How to Run

```bash
yarn db:start
# navigate to: http://localhost:5173/runes-test/layout-overlay
# Toggle the three checkboxes in various orders.
# Effective settings panel + overlay counts should reflect the live set.
```

## What to Expect

- **None mounted**: defaults (progress=hide, drawer=bg-base-100, nav.hide=false). All counts=0.
- **A only**: progress=fixed-bottom, feedback=show, drawer=bg-base-200. topBar=1, pageStyles=1.
- **A+B+C**: progress=fixed-top (C wins, last in mount order), drawer=bg-base-300 (C wins), feedback=show (A's overlay still active), return=show (B), help=show (C), nav.hide=true (B). topBar=3, pageStyles=2, navigation=1.
- **Unmount A while B+C live**: feedback drops back to hide, all other B+C overlays preserved. topBar=2, pageStyles=1, navigation=1.

## Investigation Trail

- **2026-05-22** — Initial design: token-keyed registry to fix the index-drift
  fragility in production `StackedState`. Wrote `settingsOverlay` factory +
  `layoutSettingsRune` context wrapper + demo page.
- **2026-05-22 first verification attempt** — Route A mounted correctly, but
  Routes B and C silently failed to push their overlays. DOM checkboxes
  toggled, Svelte $state variables for routeB/routeC stayed `false`. Diagnosed
  via console.log scan: `Svelte error: effect_update_depth_exceeded` —
  same trap as Spike 002. Root cause: `push()` body did
  `slots = [...slots, { ... }]` — a read-and-write of the same `$state`
  inside an `$effect`. This not only loops within the failing component
  but also breaks the global effect scheduler, blocking subsequent
  components' `$effect`s from firing.
- **2026-05-22 fix** — Wrap the read-side of the cycle in `untrack()`, same
  pattern that fixed the dataRoot producer in Spike 002. Re-verified:
  - All three routes mount + push correctly (sizes 3/2/1)
  - Effective merge matches predictions
  - Unmount-out-of-order (A first, while B+C live) produces correct
    cleanup with no overlay drift
  - Console clean, no effect_update_depth_exceeded

## Results

**Verdict:** VALIDATED ✓

| Test                                        | Expected                                              | Actual | Pass |
|---------------------------------------------|-------------------------------------------------------|--------|------|
| None mounted                                | defaults, counts 0/0/0                                | ✓      | ✓    |
| A only                                      | progress=fixed-bottom, drawer=bg-base-200             | ✓      | ✓    |
| A+B+C                                       | progress=fixed-top, drawer=bg-base-300, all overlays  | ✓      | ✓    |
| Unmount A while B+C live (robustness test)  | feedback→hide, other B+C overlays preserved           | ✓      | ✓    |
| Unmount all                                 | back to defaults, all counts=0                        | ✓      | ✓    |
| Console clean (no effect_update_depth_exc.) | no errors after untrack fix                           | ✓      | ✓    |

**Signal for the real migration:**

1. **Producer pattern is now a 1-line caller idiom** — every existing
   `topBarSettings.push({...})` migrates to `layout.useTopBar({...})`. No
   `onDestroy` import. No index snapshot. 28 callsites become trivially
   editable; risk of consumer error drops to near zero.

2. **`untrack()` around write-after-read is the CONVENTIONS-level invariant.**
   Any rune-wrapped collection mutated by `$effect`-scoped helpers must
   isolate the read-write cycle. Add to `.planning/spikes/CONVENTIONS.md`
   alongside the Spike 002 finding.

3. **`StackedState.svelte.ts` retires entirely.** No production code paths
   require it after the migration. The `Readable<T>` + `toStore()` + cached
   `subscribe` getter are all eliminated.

4. **`getLayoutContext(onDestroy)` retires entirely.** Its `onDestroy`
   callback registers go away — the `use*()` helpers handle cleanup.
   Migration of the 14+ `getLayoutContext(onDestroy)` callsites is a
   mechanical search-and-replace: remove the `onDestroy` arg + import.

5. **No `svelte/store` imports in any spike file.** Confirmed by grep.
