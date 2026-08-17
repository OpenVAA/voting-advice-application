---
spike: 022
name: class-version-bridge
type: standard
validates: "Given the dataRoot/FilterGroup version-bridge re-expressed as a class (private #version $state, get dataRoot(), arrow setDataRoot), when a producer mutates through the setter, then Spike 017's read/write split holds in the class shape — PLUS a sharper hazard: the class private-#version loop self-perpetuates WITHOUT tripping Svelte's synchronous depth-guard"
verdict: VALIDATED
related: [017, 002, 020]
tags: [svelte5, runes, class, dataroot, filtergroup, untrack, version-bridge, class-conversion]
---

# Spike 022: Group C — version-bridge singleton as a class

## What This Validates

GIVEN the foreign mutable singleton bridge (DataRoot / FilterGroup: stable identity,
mutated in place, `version++` on `subscribe`) re-expressed as a class with a private
`#version` `$state`, a bare `get dataRoot()`, and an arrow `setDataRoot(updater)`,
WHEN a producer mutates through the setter,
THEN Spike 017's read/write split holds in the class shape — and a sharper hazard
surfaces.

## How to Run

```bash
cd apps/frontend
yarn vitest run src/lib/contexts/_spikes-020-class-conversion/022-class-version-bridge.spike.svelte.test.ts
```

4 tests, ~25ms.

## Results — VALIDATED (with a new hazard)

- **The 017 split holds as a class.** A `$derived` off `instance.dataRoot.electionData`
  recomputes after `setDataRoot(...)`; a producer `$effect` calling `setDataRoot` runs
  **once** (no loop) because the setter's internal `untrack` means the producer takes no
  dependency on `#version`. `setDataRoot` is an arrow field → survives detach.
- **This group does NOT simplify away.** As the audit predicted, the version counter is
  intrinsic to wrapping a non-rune library object. The cleanest class form is exactly
  this: private `#root` + private `#version` + reactive getter + `setX(updater)`. The
  E3 `{ current, instance }` handle collapses (017), but the bridge itself stays.

### New hazard — the private-`#version` loop spins SILENTLY

In Spike 017 the contrast case (a producer that reads the *reactive* getter then
mutates) tripped Svelte's synchronous `effect_update_depth_exceeded` guard — a loud,
catchable throw. **In the class shape with a private `#version` field, the identical
loop does NOT trip the guard.** It reschedules across flush cycles instead of
synchronously, so it just spins (the test timed out at 5s before being re-written to cap
iterations and assert unbounded re-runs).

Consequence: the encapsulated `setDataRoot`/`untrack` is **more** load-bearing in the
class shape, not less — because misusing the reactive getter on the write side fails
*silently* (a hang/perf-death) rather than with a guard error a developer would notice
immediately. Producers MUST go through `setDataRoot`; reading `instance.dataRoot` to
mutate is a silent infinite loop.

> Mechanism note: not root-caused to certainty here — the working hypothesis is that the
> private-field signal's write-then-invalidate reschedules the effect on a later
> microtask/flush rather than within the same synchronous run the depth-guard counts.
> The *observable* — unbounded re-runs with no thrown guard — is what matters for the
> migration discipline and is deterministically reproduced.

## Implication

Convert the version-bridge contexts (`dataContext`, `filterContext`) to classes with the
private `#root`/`#version` + `get`/`setX(updater)` shape. Treat the write-side
`untrack` encapsulation as a hard invariant (it now guards a *silent* failure mode), and
keep an eye out for a possible upstream Svelte report on the private-field-loop
depth-guard gap.
