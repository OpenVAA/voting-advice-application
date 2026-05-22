# Spike Wrap-Up Summary

**Date:** 2026-05-22
**Spikes processed:** 6 (001–006, all VALIDATED)
**Feature areas:** Reactive Contexts, Persistent Rune Stores, Matching Integration, Layout Overlay Registry
**Skill output:** `./.claude/skills/spike-findings-voting-advice-application-gsd/`
**Conventions:** `.planning/spikes/CONVENTIONS.md`

## Processed Spikes

| #   | Name                          | Type     | Verdict   | Feature Area              |
|-----|-------------------------------|----------|-----------|---------------------------|
| 001 | appsettings-native-rune       | standard | VALIDATED | Reactive Contexts         |
| 002 | dataroot-native-rune          | standard | VALIDATED | Reactive Contexts         |
| 003 | voter-answer-store-rune       | standard | VALIDATED | Persistent Rune Stores    |
| 004 | matchstore-integration        | standard | VALIDATED | Matching Integration      |
| 005 | candidate-answer-store-rune   | standard | VALIDATED | Persistent Rune Stores    |
| 006 | layout-overlay-rune           | standard | VALIDATED | Layout Overlay Registry   |

## Key Findings

### The frontend's reactive layer is already ~80% idiomatic Svelte 5

The remaining ~20% is concentrated in three surfaces, all proven migratable
without paradigm changes:
- `appContext` (Spike 001): drop `toStore()` wrapper, expose `get current()`.
- `dataContext` (Spike 002): drop `writable(dataRoot)` bridge AND
  `get(dataRootStore)` workaround; expose split `{ current, instance }` handles.
- `answerStore` + `candidateUserDataStore` (Spikes 003, 005): drop
  `localStorageWritable + fromStore` bridge in favor of a single
  `runeLocalStorage<T>` helper.

### Matching layer needs zero migration (Spike 004)

`matchStore.svelte.ts` and `nominationAndQuestionStore.svelte.ts` are already
fully rune-native. Spike 004 was a pivot from "rewrite matchStore" to "verify
matchStore works against the new rune-native answer store" — and it does, with
no code changes needed. A single answer-button click recomputes all 80 matches
and re-renders the top-5 table reactively.

### `untrack()` around write-after-read is a CONVENTIONS-level invariant

Discovered in Spike 002 (dataRoot producer), re-encountered in Spike 006
(overlay registry first verification attempt). Any rune-wrapped collection
mutated by an `$effect`-scoped helper that reads-then-writes the same `$state`
triggers `effect_update_depth_exceeded` AND silently breaks the global effect
scheduler — preventing subsequent components' `$effect`s from firing. The fix
is identical in both cases: wrap the read-side in `untrack()`.

### `StackedState` retires entirely (Spike 006)

The token-keyed overlay registry replaces both `StackedState.svelte.ts`
(`Readable<T>` shim + `toStore()` + LIFO index revert) AND the
`getLayoutContext(onDestroy)` consumer pattern. The new `use*()` API is
declarative — no `onDestroy` plumbing — and structurally robust against
out-of-order mount/unmount.

### After full migration: every `svelte/store` import in `lib/contexts/**` and `routes/**` deletes

The migration is paradigm-preserving — Svelte 5 runes are a strict superset of
what these stores were doing. All `$store.X` template auto-subscribe sites are
enumerable via grep and become mechanical search-and-replace to
`ctx.current.X`. 17+ `$appSettings.X` sites, 14+ `$dataRoot.X` sites, 28 layout
overlay push callsites + 14 `getLayoutContext(onDestroy)` plumbing sites — all
trivially editable post-migration. Three files become deletable entirely:
`persistedState.svelte.ts`, `StackedState.svelte.ts`, and the
`fromStore`/`localStorageWritable` import path.

## Verified Constraints for the Real Migration

- DataRoot's `Updatable.subscribe()` is a **domain abstraction** (transactional
  mutation batching across nested provides). Keep it intact; bridge to runes via
  the version counter.
- `mergeSettings()` is **associative** — required for the layout overlay
  registry approach to match the LIFO stack's merge result.
- `$state` proxies are **not structurally cloneable** — keep
  `JSON.parse(JSON.stringify(...))` defensive clones in voter answer store.
- The production `appContext` **reference-equality guard** at lines 93-100 is
  load-bearing (SvelteKit returns the same loader payload across navigations
  with matching loader inputs) — preserved in the spike.

## Where to Go Next

1. **Plan the real migration phases** — Path A first: appSettings (Spike 001
   landing) and dataRoot (Spike 002 landing) are independent and can be done in
   parallel. Path B follows: answer store migrations (Spikes 003 + 005) share
   the `runeLocalStorage` helper file. Path C: layout overlay registry
   (Spike 006) is independent of both.
2. **Mass `$store.X` consumer migration** — automatable via codemod once the
   contexts ship.
3. **Delete the dead files** — `persistedState.svelte.ts`,
   `StackedState.svelte.ts` — after their last callers move over.
