---
spike: 017
name: readwrite-split-dataroot
type: standard
validates: "Given a dataRoot context exposing bare `get dataRoot()` (reactive) + `setDataRoot(updater)` (mutation via internal untrack), when a producer effect runs provide* through the setter, then no { current, instance } split is needed and no self-trigger loop occurs"
verdict: VALIDATED
related: [002, 007]
tags: [svelte5, runes, context, dataroot, untrack, readwrite-split]
---

# Spike 017: read/write split eliminates `{ current, instance }`

## What This Validates

GIVEN a dataRoot context exposing a bare reactive `get dataRoot()` (the user's
proposed `readonly foo`, internally version-gated) **plus** a `setDataRoot(updater)`
write method that internalizes `untrack`,
WHEN a producer `$effect` mutates DataRoot through `setDataRoot`,
THEN the public non-reactive `.instance` READ handle is no longer needed, reads
stay reactive, and no `effect_update_depth_exceeded` loop occurs.

This is the highest-risk, idea-defining spike: if routing mutation through a
setter can't cleanly replace the `{ current, instance }` split (Spike 002 /
CONVENTIONS §2) without reintroducing the infinite-loop trap (CONVENTIONS §3),
the whole simplification doesn't pay off.

## Why `.instance` exists today

Production (`apps/frontend/src/lib/contexts/data/dataContext.svelte.ts:57-65`):

```ts
const reactiveDataRoot = {
  get current()  { void version; return dataRoot; }, // reactive (reads version)
  get instance() { return dataRoot; }                // non-reactive (skips version)
};
```

`version` is a `$state` bumped (untracked) inside `dataRoot.subscribe(...)`.
Consumers read `.current` (reactive). Producers read `.instance` so the
mutating effect does NOT take a read-dependency on `version` — otherwise
`provide*() → subscribe → version++` retriggers the producer effect → loop.

**Key observation that motivated the spike** — the production producer
(`+layout.svelte:115-132`) is already **belt-AND-braces**:

```ts
$effect(() => {
  ...
  untrack(() => {                       // ← already untracks the write
    const dr = reactiveDataRoot.instance; // ← AND uses the non-reactive read
    dr.update(() => { dr.provideElectionData(...); dr.provideConstituencyData(...); });
  });
});
```

Inside `untrack(...)`, the `.current` getter's `void version` read would ALSO be
untracked — so `.instance` and `.current` are equivalent there. Either mechanism
alone breaks the loop. That redundancy is the tell: if the `untrack` moves
*inside* a `setDataRoot` setter, the public `.instance` handle becomes dead.

## How to Run

```bash
cd apps/frontend
yarn vitest run src/lib/contexts/_spikes-017-019/017-readwrite-split-dataroot.spike.svelte.test.ts
```

3 tests, ~4s (test 3 deliberately spins an effect to Svelte's recursion cap
before throwing — the stack-trace dump in the output is that expected throw).

## What to Expect

- **Test 1 (reactivity survives the bare getter):** a `$derived` off
  `ctx.dataRoot.electionData.length` records `0`, then `3` after
  `ctx.setDataRoot(dr => dr.update(() => dr.provideElectionData([1,2,3])))`. The
  bare getter (no `.current`) propagates the update.
- **Test 2 (no loop, no `.instance`):** a producer `$effect` that calls
  `setDataRoot` runs **exactly once** — the setter's internal `untrack` means the
  effect takes no dependency on `version`. No `.instance` handle is present in the
  context at all.
- **Test 3 (contrast):** the SAME producer reading a reactive getter (`ctx.current`)
  then mutating **throws `effect_update_depth_exceeded`** — proving the loop is
  real and that the non-reactive write path is what removes it.

## Investigation Trail

1. **Modeled DataRoot's reactive contract, not its data.** A `FakeDataRoot` with
   stable identity + `subscribe(cb)` + `update(fn)` (run-then-notify) +
   `provideElectionData`. The reactive-graph fact under test is independent of
   `@openvaa/data`'s semantics; CONVENTIONS already records that the bridge is
   `Updatable.subscribe()` + a version counter, which is exactly what's modeled.
2. **Built the proposed split** — `get dataRoot()` (reads `version`, reactive) +
   `setDataRoot(updater)` wrapping `untrack(() => updater(root))`. No `.instance`.
3. **First run:** all 3 green on the first execution. The contrast test (3.3s)
   confirms the loop guard fires when the producer reads the reactive getter,
   isolating the version-read as the loop's sole cause.
4. **Why this generalizes to real DataRoot:** the production loop is driven purely
   by *reading `version`* inside the mutating effect (documented verbatim at
   `+layout.svelte:108-113`). `setDataRoot` hands the producer the raw instance
   without ever evaluating the version-gated getter → the read never happens →
   no loop, regardless of DataRoot's internal complexity.

## Results

**VERDICT: VALIDATED.**

The `{ current, instance }` split collapses to a **read/write split**:

```ts
return {
  get dataRoot() { void version; return root; },     // READ  — reactive, bare (no .current)
  setDataRoot(updater) { untrack(() => updater(root)); } // WRITE — encapsulates the non-reactive path
};
```

- **`.instance` (E3) is eliminable, not just renamed.** The only reason it was
  public was to give producers a non-reactive read; `setDataRoot` provides that
  path internally, so no consumer can accidentally reach for a non-reactive read
  handle anymore.
- **The hand-written `untrack` at the producer call site disappears too** —
  `+layout.svelte`'s producer becomes
  `ctx.setDataRoot(dr => dr.update(() => dr.provideElectionData(...)))`, no
  `untrack`, no `.instance`.
- **Reactivity is preserved** across the bare getter exactly as `.current` did
  (both are getters reading `version`; the only change is the consumer spelling).

### Surprises

- The win is specifically about the **write** concern. The non-reactive read
  handle existed only to serve mutation; once mutation is a first-class method,
  the handle has no other consumer. This is the cleanest of the three claims.
- Caveat carried to Spike 019: making the READ side a *bare getter* (dropping
  `.current`) is exactly the shape that is **most** exposed to the destructure
  trap. 017 wins on the write side; whether the read side regresses on
  destructuring is 019's question.
