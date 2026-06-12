---
spike: 021
name: class-localstorage
type: standard
validates: "Given localStorageState rebuilt as a class with a $state field and imperative persistence, when set/update run, then current is reactive and storage is written; the class constructs OUTSIDE any effect context (factory/SSR-safe, no $effect); and set/update survive detach via arrow fields"
verdict: VALIDATED
related: [003, 020]
tags: [svelte5, runes, class, localstorage, persistence, ssr, class-conversion]
---

# Spike 021: Group C — localStorage wrapping as a class

## What This Validates

GIVEN the production `localStorageState<T>(key, default) → { current, set, update }`
(`utils/persistedState.svelte.ts`) rebuilt as a class with a `$state` field,
WHEN `set`/`update` run,
THEN `current` is reactive, storage is written, the class constructs OUTSIDE any
effect context (factory/SSR-safe), and `set`/`update` survive detach.

## How to Run

```bash
cd apps/frontend
yarn vitest run src/lib/contexts/_spikes-020-class-conversion/021-class-localstorage.spike.svelte.test.ts
```

4 tests, <10ms.

## Results — VALIDATED

The persistence helper — the backing for `userPreferences`, `answers`, `sessionId`,
`isPreregistered`, `firstQuestionId` — ports cleanly to a class:

- **Constructs with no effect context.** The production helper deliberately persists
  *imperatively* inside `set`/`update`, **not** via `$effect`, "so the helper can be
  called outside component-init context (e.g. inside `initXxxContext()` factories)."
  The class preserves this: zero `$effect`, so `new PersistedState(...)` is legal at
  module/factory/SSR scope. (Contrast 023: a class with `$effect` in its constructor
  throws `effect_orphan` there.)
- **`current` is reactive.** A `$derived` off `instance.current.n` recomputes after
  `set`/`update`; the prototype getter tracks the `$state` field.
- **Persistence + rehydration intact.** Init reads stored value (rehydrate), default is
  persisted on first init (production CR-01), every write round-trips to storage.
- **`set`/`update` are ARROW fields** → `const { set, update } = persisted` keeps `this`
  (Spike 020 Group E). Critical, because persisted handles are frequently destructured.

## Implication

Group C's localStorage sub-pattern is a **drop-in class conversion** with one
non-negotiable: keep persistence imperative (arrow `set`/`update`), never `$effect`.
This is both the SSR-safety guarantee and the factory-constructability guarantee. The
`current` getter could even be dropped in favour of a public `value = $state(...)` field
read directly (Group A/B logic) — but keeping `current` preserves the existing consumer
API and the persistence-on-write encapsulation.
