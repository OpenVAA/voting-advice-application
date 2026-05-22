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

### 7. Synchronous-init for SSR-aware contexts

When a context's value depends on `page.data` (or any other load-driven
input that's available during SSR), read it SYNCHRONOUSLY at `$state` init
— do not rely on `$effect` for the initial merge, because `$effect` does
not run on the server.

```ts
// WRONG — $effect doesn't run during SSR; HTML renders default value only
let value = $state(mergeAppSettings(staticSettings, dynamicSettings));
$effect(() => {
  if (page.data?.appSettingsData) value = mergeAppSettings(value, page.data.appSettingsData);
});

// CORRECT — synchronous init reads page.data on both server and client
const initialDb = page.data?.appSettingsData;
let initial = pureMerge(staticSettings, dynamicSettings);
if (initialDb && !(initialDb instanceof Error)) {
  initial = pureMerge(initial, initialDb);
}
let value = $state(initial);
// $effect now ONLY handles the page.data-changed-after-nav case
$effect(() => { /* re-merge only if page.data changes */ });
```

Established in Spike 008. The production `appContext.svelte.ts:74-100` has
the bug (and Spike 001's first draft inherited it).

### 8. Pure merge for shared module singletons

When merging settings or other objects sourced from module singletons
(e.g. `staticSettings`, `dynamicSettings`), prefer pure spread-based
merging over `Object.assign(target, ...)`. Mutating shared module objects
leaks across context initializations.

```ts
// WRONG — mutates target (production mergeAppSettings does this)
function mergeAppSettings(target, additional): AppSettings {
  return Object.assign(target, nonNull);
}

// CORRECT — pure
function pureMerge(target, additional) {
  const nonNull = Object.fromEntries(Object.entries(additional).filter(([, v]) => v != null));
  return { ...target, ...nonNull };
}
```

Established in Spike 008 (discovered while writing the SSR test — two
variants polluted each other's `$state` through the shared `staticSettings`
reference until the spike switched to a local pure merge).

### 9. `$derived.by` over per-field reads for reference-stable `$state` proxies

When a `$state` proxy's **object reference is stable** but its **internal
fields mutate** (the canonical example: SvelteKit's `$app/state.page`),
read the proxy field-by-field inside a `$derived.by` callback. Never read
the proxy as a single value inside a tracking scope.

```ts
// WRONG — tags the dependency at the proxy-object level; ref-stability
// short-circuits propagation.
const builder = $derived.by(() => {
  const p = page;
  return (opts) => buildRoute(opts, p);
});

// CORRECT — per-field reads; one fine-grained dependency per field.
const builder = $derived.by(() => {
  const { params, route, url } = page;
  return (opts) => buildRoute(opts, { params, route, url });
});
```

The trap was originally surfaced via `derived(toStore(() => page), …)` in
production's `getRoute.svelte.ts:18-30`: `toStore` wraps the getter in an
internal `render_effect` whose `set(value)` short-circuits on
`Object.is(prev, next)`, and the page-proxy reference never changes. The
same logical hazard applies — at a different mechanism — to any
`$derived` that captures `page` as a single value: subsequent reads
through the captured handle may or may not establish per-field deps
depending on usage context, and the safe default is to read fields
explicitly inside the tracking scope.

Production migration target: `apps/frontend/src/lib/contexts/app/getRoute.svelte.ts`.
Established in Spike 012 — multi-step nav verified clean, defensive
`afterNavigate` republish proven structurally redundant (matched the
no-defensive variant on every observed step).

## Anti-Patterns

### Destructure trap (CLAUDE.md → Context Destructuring Rule)

```ts
// WRONG — captures init-time value, never updates
const { selectedElections, opinionQuestions } = getVoterContext();

// CORRECT — read at call site each time
const ctx = getVoterContext();
const elections = $derived(ctx.selectedElections);
const questions = $derived(ctx.opinionQuestions);
```

Established by Phase 61 production fix; reproduced & verified in Spike 007.
Spike 009's codemod has a destructure-trap audit pass that flags every
matching callsite.

### Spread-of-context (sibling of destructure trap)

```ts
// WRONG — spread invokes each getter ONCE at spread time, captures VALUES
const adminContext = { ...appContext, ...authContext, jobs };

// CORRECT — re-declare the getters in the composing context
const adminContext = {
  // explicit forwarding preserves the getter chain
  get isAuthenticated() { return authContext.isAuthenticated; },
  get t() { return authContext.t; },
  ...
};
// OR — keep auth as a separate handle the caller pulls explicitly
return { auth: authContext, jobs };
```

Discovered in Spike 009 — `apps/frontend/src/lib/contexts/admin/adminContext.svelte.ts:97`
uses spread, which de-reactivates the auth context's `$derived` accessors.
This is a sibling-trap that the codemod's destructure audit picks up
indirectly (via the visible consumer-side `const { isAuthenticated } = getAdminContext()`).

## HMR Considerations (Spike 011)

- `$state` in `.svelte` files resets on HMR — this is correct behavior.
- `runeLocalStorage` survives HMR cycles via storage-rehydration on remount.
- Class-instance singletons (DataRoot) held by parent layout context
  survive — child HMR doesn't trigger parent remount.
- **The destructure trap is silently masked during HMR** — the trap
  consumer re-captures at remount with current values. Do not assume
  HMR-driven manual testing has validated destructure-trap absence; run
  the Spike 009 codemod audit pass instead.

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
