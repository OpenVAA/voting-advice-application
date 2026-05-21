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

## Spikes

| # | Name | Type | Validates | Verdict | Tags |
|---|------|------|-----------|---------|------|
| 001 | appsettings-native-rune | standard | Rune-only `appSettings` context with reactive merge; template + `.ts` consumers without `$store` | VALIDATED | svelte5, runes, context, settings |
| 002 | dataroot-native-rune | standard | Rune-only `dataRoot` context with version-counter reactivity for stable-identity mutation; reactive consumers + non-reactive producer without `get()` | VALIDATED | svelte5, runes, context, dataroot, untrack |
