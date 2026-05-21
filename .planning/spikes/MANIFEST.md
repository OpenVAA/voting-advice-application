# Spike Manifest

## Idea

Convert OpenVAA's legacy `svelte/store` bridges in `apps/frontend/src/lib/contexts/` (currently hybrid: `$state` internally, wrapped in `toStore()` / `writable()` for `$store.X` template auto-subscribe and `get(store)` imperative reads) into **fully idiomatic Svelte 5** — pure runes (`$state`, `$derived`, `$effect`), getter-based context exposure, no `svelte/store` import. Build a temporary `/runes-test` route that exercises both contexts end-to-end against the real Supabase backend without touching production code paths.

## Requirements

Established constraints from the user. Non-negotiable for the real migration.

- **No `svelte/store` imports in migrated contexts** — no `writable`, `readable`, `derived`, `toStore`, `fromStore`, `get`.
- **No `$store.X` template auto-subscribe** in consumers — template reads via `ctx.current.X` or local `$derived` alias.
- **No `get(store)` imperative reads** in producers — write-side mutation idiom must avoid both the bridge AND the infinite-loop trap that currently requires `get()`.
- **Spike is non-invasive** — parallel rune contexts shadowing the real ones; no production-code mutation. Temp `/runes-test` route only.
- **appSettings merge semantics preserved** — effective settings = merge(staticSettings, dynamicSettings, page.data.appSettingsData), reactive on the third input.
- **dataRoot sequential-population semantics preserved** — `provideElectionData → provideConstituencyData → provideQuestionData → provideEntityData → provideNominationData` each triggers downstream `$derived` re-evaluation despite stable DataRoot object identity.
- **Persistence helper centralized** — both voter and candidate answer stores route through a single `runeLocalStorage` helper that mirrors `localStorageWritable`'s versioned-payload format, allowing direct retirement of the legacy helper once both callsites migrate.

## Findings Summary (post-Spike 005)

The OpenVAA frontend's reactive layer is **already ~80% idiomatic Svelte 5**.
The remaining ~20% is concentrated in three surfaces, all addressed by these spikes:

| Production file | Legacy surface | Spike | Migration shape |
|-----------------|----------------|-------|-----------------|
| `appContext.svelte.ts` | `toStore()` bridge for `$appSettings.X` auto-subscribe (17+ template sites) | 001 | Replace with `appSettings.current.X` reads everywhere |
| `dataContext.svelte.ts` + `routes/+layout.svelte` | `writable(dataRoot)` bridge + `get(dataRootStore)` workaround for infinite-loop trap | 002 | Replace dual export with `{ current, instance }` split; eliminate `get()` |
| `answerStore.svelte.ts` (voter) | `localStorageWritable` + `fromStore` three-layer bridge | 003 | Single `runeLocalStorage<Answers>(key, default)` |
| `matchStore.svelte.ts` (voter) | (none — already rune-native) | 004 | ZERO migration work |
| `candidateUserDataStore.svelte.ts` | 7-line legacy surface for edited-answer persistence | 005 | Single `runeLocalStorage` swap |
| `persistedState.svelte.ts` (utility) | `Writable<T>` + `toStore()` + `subscribe`-based persistence | 003+005 | Replaced by `runePersistedState.svelte.ts`; old file becomes deletable |

**Net effect of full migration:** every `import {*} from 'svelte/store'` site in
`apps/frontend/src/lib/contexts/**` and `apps/frontend/src/routes/**` can be deleted.
Template `$store.X` auto-subscribe sites become mechanical search-and-replace
(every one is enumerable via grep). No paradigm alteration required — Svelte 5
runes are a strict superset of what these stores were doing.

## Spikes

| # | Name | Type | Validates | Verdict | Tags |
|---|------|------|-----------|---------|------|
| 001 | appsettings-native-rune | standard | Rune-only `appSettings` context with reactive merge; template + `.ts` consumers without `$store` | VALIDATED | svelte5, runes, context, settings |
| 002 | dataroot-native-rune | standard | Rune-only `dataRoot` context with version-counter reactivity for stable-identity mutation; reactive consumers + non-reactive producer without `get()` | VALIDATED | svelte5, runes, context, dataroot, untrack |
| 003 | voter-answer-store-rune | standard | Rune-native voter answer store via shared `runeLocalStorage` helper — eliminates `$state→toStore→fromStore` three-layer bridge | VALIDATED | svelte5, runes, store, localStorage, voter, answers |
| 004 | matchstore-integration | standard | Production `matchStore` (already rune-native) works zero-diff with rune-native `voterAnswerRuneStore` — full reactive re-ranking on answer change | VALIDATED | svelte5, runes, matching, voter, integration |
| 005 | candidate-answer-store-rune | standard | Scoped rune rewrite of candidateUserDataStore edited-answer layer — drops `fromStore`/`localStorageWritable`, composite `$derived.by` merge preserved | VALIDATED | svelte5, runes, store, candidate, answers |
