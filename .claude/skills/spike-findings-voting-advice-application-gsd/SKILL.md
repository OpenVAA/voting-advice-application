---
name: spike-findings-voting-advice-application-gsd
description: Implementation blueprint from spike experiments. Requirements, proven patterns, and verified knowledge for migrating OpenVAA's legacy svelte/store bridges to fully idiomatic Svelte 5 runes. Auto-loaded during implementation work.
---

<context>
## Project: voting-advice-application-gsd

Convert OpenVAA's legacy `svelte/store` bridges in
`apps/frontend/src/lib/contexts/` (currently hybrid: `$state` internally, wrapped
in `toStore()` / `writable()` for `$store.X` template auto-subscribe and
`get(store)` imperative reads) into fully idiomatic Svelte 5 — pure runes
(`$state`, `$derived`, `$effect`), getter-based context exposure, no
`svelte/store` import. Validated via a temporary `/runes-test` route that
exercises both contexts end-to-end against the real Supabase backend without
touching production code paths.

Spike sessions wrapped: 2026-05-21 (spikes 001–005), 2026-05-22 (spike 006).
</context>

<requirements>
## Requirements

Non-negotiable design decisions surfaced during spiking. Every feature-area
reference honors these — and every real migration commit must honor them too.

- **No `svelte/store` imports in migrated contexts** — no `writable`, `readable`,
  `derived`, `toStore`, `fromStore`, `get`.
- **No `$store.X` template auto-subscribe** in consumers — template reads via
  `ctx.current.X` or local `$derived` alias.
- **No `get(store)` imperative reads** in producers — write-side mutation idiom
  must avoid both the bridge AND the infinite-loop trap that currently requires
  `get()`. (DataRoot producers use the `instance` non-reactive handle wrapped in
  `untrack()`.)
- **`untrack()` around write-after-read in `$effect`-scoped helpers** —
  rune-wrapped collections mutated by `$effect`-scoped helpers must isolate the
  read-write cycle. Repeats across DataRoot producer (Spike 002) and overlay
  registry (Spike 006). Without it: `effect_update_depth_exceeded` AND silent
  breakage of the global effect scheduler.
- **appSettings merge semantics preserved** — effective settings =
  `merge(staticSettings, dynamicSettings, page.data.appSettingsData)`, reactive
  on the third input, with a reference-equality guard against redundant merges.
- **dataRoot sequential-population semantics preserved** —
  `provideElectionData → provideConstituencyData → provideQuestionData →
  provideEntityData → provideNominationData` each triggers downstream
  `$derived` re-evaluation despite stable DataRoot object identity (version
  counter bumped via `Updatable.subscribe`).
- **Persistence helper centralized** — both voter and candidate answer stores
  route through a single `runeLocalStorage` helper that mirrors
  `localStorageWritable`'s versioned-payload format (`{ version, data }`),
  allowing direct retirement of the legacy helper once both callsites migrate.
- **Token-keyed registries replace index-based stacks** for layout overlays —
  robust against out-of-order mount/unmount; `$effect` cleanup replaces
  `onDestroy(...)` plumbing.
</requirements>

<findings_index>
## Feature Areas

| Area | Reference | Key Finding |
|------|-----------|-------------|
| Reactive Contexts | references/reactive-contexts.md | Two patterns: value-replace (`$state` + getter) for appSettings, split `current`/`instance` handles for DataRoot's mutation-in-place singleton. Producers use `instance` inside `untrack()` to break the infinite-loop trap that today requires `get(store)`. |
| Persistent Rune Stores | references/persistent-rune-stores.md | One `runeLocalStorage<T>(key, default)` helper retires the three-layer `$state → localStorageWritable → fromStore` bridge in both voter and candidate answer stores. After migration `localStorageWritable` + `persistedState.svelte.ts` become deletable. |
| Matching Integration | references/matching-integration.md | `matchStore.svelte.ts` and `nominationAndQuestionStore.svelte.ts` are already rune-native — zero migration work. The runtime proof: a single answer-button click recomputes all 80 matches and re-renders the top-5 table reactively. |
| Layout Overlay Registry | references/layout-overlay-registry.md | Token-keyed registry + declarative `use*()` consumer API replaces `StackedState` (`Readable<T>` shim) + `getLayoutContext(onDestroy)` index plumbing. 28 push callsites + 14 onDestroy plumbing sites become trivially editable; robust against out-of-order unmount. |

## Source Files

Original spike source files are preserved in `sources/` for complete reference.
Each spike's `README.md` includes the full investigation trail (initial design,
verification attempts, failures, fixes, browser-verified results).
</findings_index>

<production_landing_map>
## Production Landing Map

| Migration target | Current legacy surface | Spike | Reference |
|------------------|------------------------|-------|-----------|
| `apps/frontend/src/lib/contexts/app/appContext.svelte.ts` | `toStore()` bridge for `$appSettings.X` auto-subscribe (17+ template sites) | 001 | [[reactive-contexts]] |
| `apps/frontend/src/lib/contexts/data/dataContext.svelte.ts` + `routes/+layout.svelte` | `writable(dataRoot)` bridge + `get(dataRootStore)` workaround for infinite-loop trap | 002 | [[reactive-contexts]] |
| `apps/frontend/src/lib/contexts/voter/answerStore.svelte.ts` | `localStorageWritable` + `fromStore` three-layer bridge | 003 | [[persistent-rune-stores]] |
| `apps/frontend/src/lib/contexts/voter/matchStore.svelte.ts` | (none — already rune-native) | 004 | [[matching-integration]] |
| `apps/frontend/src/lib/contexts/voter/nominationAndQuestionStore.svelte.ts` | (none — already rune-native) | 004 | [[matching-integration]] |
| `apps/frontend/src/lib/contexts/candidate/candidateUserDataStore.svelte.ts` | 7-line edited-answer persistence bridge | 005 | [[persistent-rune-stores]] |
| `apps/frontend/src/lib/contexts/utils/persistedState.svelte.ts` (entire file) | `Writable<T>` + `toStore()` + `subscribe`-based persistence | 003+005 | [[persistent-rune-stores]] |
| `apps/frontend/src/lib/contexts/utils/StackedState.svelte.ts` (entire file) | `implements Readable<T>` + `toStore()` + LIFO index revert | 006 | [[layout-overlay-registry]] |
| `apps/frontend/src/lib/contexts/layout/layoutContext.svelte.ts` (`getLayoutContext(onDestroy)`) | `onDestroy`-plumbed index-revert pattern at 14+ callsites | 006 | [[layout-overlay-registry]] |

**Net effect of full migration:** every `import { * } from 'svelte/store'` site
in `apps/frontend/src/lib/contexts/**` and `apps/frontend/src/routes/**` can
be deleted. Template `$store.X` auto-subscribe sites become mechanical
search-and-replace (every one is enumerable via grep). No paradigm alteration
required — Svelte 5 runes are a strict superset of what these stores were doing.
</production_landing_map>

<metadata>
## Processed Spikes

- 001-appsettings-native-rune
- 002-dataroot-native-rune
- 003-voter-answer-store-rune
- 004-matchstore-integration
- 005-candidate-answer-store-rune
- 006-layout-overlay-rune
</metadata>
