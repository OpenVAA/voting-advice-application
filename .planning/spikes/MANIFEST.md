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

### From Spike 013-016 (nav/transitions):

- **SvelteKit `+page.svelte` already reuses across param-only URL changes** — established by Spike 013 + 014a. The user-perceived "redraw" on Q→Q is NOT a mount-cycle problem; it is a reactive-render-cycle problem affecting ~64% of visible DOM content nodes inside the persistent component shell.
- **Structural layout promotion is a code-clarity move, not a perf fix** — Spike 014a established that the mount stability the user wanted already exists. Hoisting chrome into `questions/+layout.svelte` is still worthwhile for code readability, but does NOT change Q→Q visual behavior.
- **The transitions layer (Spike 015) is the load-bearing fix for the perceived redraw** — confirmed by 014a's findings.

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
| 006 | layout-overlay-rune | standard | Token-keyed overlay registry + `$effect`-scoped auto-cleanup replaces `StackedState` + `getLayoutContext(onDestroy)` index plumbing. Robust against out-of-order mount/unmount | VALIDATED | svelte5, runes, layout, stackedstate, untrack |
| 007 | context-orchestration-end-to-end | standard | Rune-native voterContext (and/or candidateContext) factory exposing `selectedElections`/`opinionQuestions`/`matches`/`profileComplete` as getters; verifies the destructure trap is observable + the cascade `appContext.userData → dataContext.init → voterContext` propagates correctly | VALIDATED | svelte5, runes, context, voter, candidate, orchestration, destructure-trap |
| 008 | ssr-hydration-runes | standard | appSettings + dataRoot rune contexts under SSR; verifies whether server-rendered HTML reflects DB-override merge (`$effect`-driven merge does NOT run during SSR — potential real-bug discovery) and whether hydration is clean | VALIDATED | svelte5, runes, ssr, hydration, appsettings |
| 009 | store-codemod-feasibility | standard | ts-morph (or jscodeshift) codemod for mechanical `$appSettings.X` / `$dataRoot.X` / `$darkMode` template rewrites; verifies the consumer migration is 1-day mechanical vs 1-week manual | VALIDATED | svelte5, codemod, ts-morph, migration |
| 010 | adjacent-store-bridges | standard | Inventory of remaining `svelte/store` imports across `lib/contexts/**`; spike one representative bridge (popupStore) to confirm Spike 001's value-replace pattern generalizes; produce 4-wave migration order | VALIDATED | svelte5, runes, popup, inventory, migration-order |
| 011 | hmr-rune-contexts | standard | Vite HMR behavior on rune context edits + consumer edits; verifies $effects don't leak, state is cleanly preserved-or-reset, DX is non-degraded | VALIDATED | svelte5, runes, hmr, vite, dx |
| 012 | getroute-rune | standard | Rune-native `getRoute` producer: `$derived.by` over per-field `$app/state.page` reads bypasses the documented `toStore` short-circuit trap on the page-proxy object reference; `afterNavigate` defensive layer proven redundant | VALIDATED | svelte5, runes, route, sveltekit, page-state, after-navigate |
| 013 | nav-mount-forensics | standard | Given the production voter route tree, when navigating Q→Q / Q→Results / electionTab→electionTab / entityTab→entityTab, then a mount/destroy ledger proves which components re-instantiate vs persist — foundation for restructure decisions | VALIDATED | sveltekit, navigation, mount-forensics, layouts, observability |
| 014a | nested-layout-promotion | comparison | Hoisting `MainContent` + hero + heading scaffold into `+layout.svelte` keeps shared chrome mounted across Q→Q; child `+page.svelte` renders only the question body. **Reframe:** SvelteKit already reuses `+page.svelte` across param changes; the user-perceived "redraw" is from reactive DOM regeneration of ~64% of content nodes (proven via production-page DOM tagging), not from component remount | VALIDATED | sveltekit, layouts, restructure, comparison |
| 014b | single-page-url-keyed | comparison | Layout owns ALL rendering (mirrors production results pattern); `+page.svelte` is empty stub; `{#key questionId}` is runtime opt-in. **Head-to-head with 014a:** both achieve mount stability identically — choice is organizational. Recommendation: 014b shape + `{#key question.type}` for mixed variants | VALIDATED | sveltekit, url-as-state, key-block, comparison |
| 015 | view-transitions-api | standard | `onNavigate(document.startViewTransition)` integration delivers cross-fade/slide transitions WITHOUT structural change. **3 navigations → 3 transitions, ~310ms each.** Honors `prefers-reduced-motion` and a destination-URL opt-out flag. Production-ready; ~1 day to wire. | VALIDATED | sveltekit, view-transitions, transitions, onnavigate |
| 016 | focus-and-a11y-during-transitions | standard | Winner of 014b + 015 stack preserves keyboard focus, screen-reader title announcements, `aria-live` regions, `prefers-reduced-motion` honoring — WCAG 2.1 AA gate. **23ms click→focus latency; focus lands DURING animation (not after) for smooth perception.** Production wiring ~2 days, ship-able in two 1-day waves. | VALIDATED | a11y, transitions, focus-management, reduced-motion, wcag, aria-live |
