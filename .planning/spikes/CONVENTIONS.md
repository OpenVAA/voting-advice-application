# Spike Conventions

Patterns and stack choices established across the runes-test spike sessions.
New spikes follow these unless the question requires otherwise.

## Stack

- **Frontend**: SvelteKit 2 + Svelte 5 (runes mode). All spike code is
  ESM TypeScript with no transpilation step beyond what SvelteKit/Vite
  does already.
- **Demo route**: `/runes-test/*` — co-located spike code (contexts +
  components) lives next to the demo `+page.svelte` files. Deletion of
  the route tree deletes all spike code.
- **Backend**: real Supabase against the seeded `default` template
  (327 candidates, 1 election, 5 constituencies, 24 questions). No
  fixtures — spikes exercise the production data path.

## Banned Idioms (in all rune-native spike code)

The whole point of these spikes is to eliminate the bridge layer between
runes and legacy stores. The following are NEVER permitted in spike files:

- `import { * } from 'svelte/store'` — no `writable`, `readable`, `derived`,
  `get`, `toStore`, `fromStore`, `Readable`, `Writable`, `Unsubscriber`.
- Template `$store.X` auto-subscribe.
- `get(store)` imperative reads.
- `store.subscribe(cb)` consumer-side subscriptions.

Type-only imports of `Readable`/`Writable` are also avoided — there's no
reason to leak the legacy interface shape into rune code.

## Patterns

### 1. Reactive context exposure via getter

```ts
export function initFooRune(): FooRune {
  let value = $state<FooShape>(initial);
  return setContext(KEY, {
    get current() { return value; }  // tracking dependency at call site
  });
}
```

Template consumers read `ctx.current.X` (no `$ctx`). `.ts` consumers
optionally alias via `const x = $derived(ctx.current.X)` for ergonomics.
The destructure trap (CLAUDE.md "Context Destructuring Rule") still
applies — never destructure reactive accessors.

### 2. Split read/write handles for mutation-stable singletons

When a singleton's identity is stable but its internal state mutates
(e.g. DataRoot.provide* methods), expose TWO handles:

```ts
{
  get current() { void version; return root; },  // reactive (via version $state)
  get instance() { return root; }                // non-reactive
}
```

Consumers use `current`. Producers (effects that mutate) use `instance`
to avoid establishing a read dependency on the version counter. Pattern
established in Spike 002.

### 3. `untrack()` around write-after-read in $effect-scoped helpers

When a rune-wrapped collection is mutated by an `$effect`-scoped helper
(e.g. `slots = [...slots, newItem]`), the spread reads the same `$state`
the assignment writes. This creates an immediate `effect_update_depth_exceeded`
loop AND breaks the global effect scheduler, silently blocking subsequent
components' $effects.

**Fix:** wrap the read-side in `untrack()`:

```ts
function push(value) {
  untrack(() => { slots = [...slots, value]; });
}
```

Applies to: any helper used inside an `$effect` body that needs to
read-then-write the same `$state`. Established in Spike 002 (dataRoot
producer), re-encountered and confirmed in Spike 006 (overlay registry).

### 4. Rune-native localStorage persistence

`runeLocalStorage<T>(key, default) → { current, set, update }` from
Spike 003 is the canonical replacement for `localStorageWritable` +
`fromStore` bridges. Version-wrapper payload format matches production
(`{ version: number, data: T }`).

### 5. Token-keyed registry > index-based stack

For multi-component overlays (layout settings, popups, modal stacks),
prefer a registry keyed by a unique token (returned from `push()`) over
an index-based stack. Indexes drift when mounts/unmounts interleave;
tokens don't. Established in Spike 006.

### 6. Declarative `use*()` consumer API for scoped overlays

When the lifetime of an effect should match a component's lifetime,
expose a one-liner helper that internalizes `$effect`:

```ts
function use(overlay) {
  $effect(() => push(overlay));  // push returns the revert function
}
```

Callers do not import `onDestroy`, do not manage tokens, do not snapshot
indexes. Established in Spike 006.

## Tools & Libraries

- `untrack` from `svelte` — used for breaking read-write cycles in
  $effect-scoped helpers. Pattern repeats across spikes 002 and 006.
- `@openvaa/app-shared`'s `mergeSettings` — deep-merge utility used by
  layout overlay registry. Associative, which is what makes the registry
  approach equivalent to the strict-LIFO stack approach.
- `@openvaa/data`'s `Updatable.subscribe()` — domain abstraction for
  DataRoot mutation notifications, kept intact and bridged to runes via
  a version counter in Spike 002.

## File Layout

- Spike artifacts (READMEs, investigation trails): `.planning/spikes/NNN-*/`
- Runnable spike code: `apps/frontend/src/routes/runes-test/` (deletable)
- Sub-routes for isolated context scopes: `runes-test/<spike-area>/+layout.svelte`
  (e.g. `runes-test/layout-overlay/` has its own layout context)
