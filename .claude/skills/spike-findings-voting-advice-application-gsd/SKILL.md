---
name: spike-findings-voting-advice-application-gsd
description: Implementation blueprint from spike experiments. Requirements, proven patterns, and verified knowledge for two domains — (1) migrating OpenVAA's legacy svelte/store bridges to fully idiomatic Svelte 5 runes (spikes 001–012), and (2) fixing the perceived "redraw on Q→Q" symptom via View Transitions + layout-as-state restructure + a11y focus management (spikes 013–016). Auto-loaded during implementation work.
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

Spike sessions wrapped:

- 2026-05-21 (spikes 001–005)
- 2026-05-22 morning (spike 006)
- 2026-05-22 afternoon (spikes 007–011 — orchestration, SSR gap, codemod, inventory, HMR)
- 2026-05-22 evening (spike 012 — getRoute rune-native; Wave 3 unblocker)
- 2026-05-25 (spikes 013–016 — page navigation forensics, layout-as-state structural variants, View Transitions API integration, focus + a11y under transitions)

**Second-domain context (spikes 013–016):** User reported that navigating
between questions and between results views felt like the whole page was
redrawn with no components reused, and wanted transitions between views.
Spike 013 (production DOM-tagging) disproved the premise: SvelteKit ALREADY
reuses `+page.svelte` instances across param-only URL changes. The
user-perceived "redraw" is from reactive content-node regeneration inside
the persistent component shell (9/25 ≈ 36% of tracked elements survive a
Q→Q hop; ~64% are freshly generated). The load-bearing fix is View
Transitions (spike 015), additive on the existing structure. Spike 014b's
unified-layout-with-empty-leaf shape (matching the existing production
results pattern) is recommended for the questions branch as a follow-up
clarity refactor; spike 016 verifies the WCAG 2.1 AA gate (focus +
aria-live announcer + reduced-motion) on the chosen stack.
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
- **appSettings DB-override merge happens at `$state` init, NOT in `$effect`**
  (Spike 008). `$effect` does not run on the server, so an `$effect`-only
  merge produces SSR HTML that's missing the DB override. Read
  `page.data.appSettingsData` synchronously at init; the `$effect` then only
  handles navigation cases. **Same fix applies to `appCustomizationData`**.
- **`mergeAppSettings` must be a pure function** (Spike 008). Production today
  uses `Object.assign(target, nonNull)` which mutates the shared
  `staticSettings` reference. Switch to `{ ...target, ...nonNull }`.
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
  Wave 2 adds a `runeSessionStorage` sibling for `voterContext`'s
  `firstQuestionId`.
- **Token-keyed registries replace index-based stacks** for layout overlays —
  robust against out-of-order mount/unmount; `$effect` cleanup replaces
  `onDestroy(...)` plumbing.
- **Destructure trap is paradigm-preserving** (Spike 007). CLAUDE.md's
  "Context Destructuring Rule" applies unchanged to migrated rune-native
  voter/candidate contexts. Consumers must read reactive accessors via
  `ctx.X` and never destructure them. Spread-of-context (Spike 009's
  bonus finding) is a sibling-trap that must be audited separately.
- **Migration order respects dependency direction** (Spike 010). Tier 1 leaf
  contexts (appSettings, dataRoot, answer stores, popupStore, settingsOverlay)
  ship first; Tier 2 secondary bridges (survey, tracking, voterContext,
  candidateContext, getRoute) consume Tier 1 and ship next; consumer codemod
  runs in Wave 3; cleanup deletes in Wave 4.
- **`getRoute` over `$app/state.page` uses fine-grained per-field reads**
  (Spike 012). Pure `$derived.by` reading `page.params` / `page.route` /
  `page.url` as separate fields bypasses the documented `toStore`
  short-circuit trap on the page proxy's stable object reference. Never
  read `page` as a single value inside a tracking scope. No defensive
  `afterNavigate` republish is needed — fine-grained tracking handles
  every observed nav (path, query-param, locale).

### From Spikes 013–016 (page navigation + transitions + a11y):

- **SvelteKit `+page.svelte` already reuses across param-only URL changes.**
  Established via DOM `data-mount-id` identity tests (Spike 014a iteration 2)
  and confirmed by production DOM tagging (Spike 014a iteration 3 — 9/25 ≈
  36% of tracked elements survive a Q→Q hop). The user-perceived "redraw"
  is from reactive content-node regeneration inside the persistent
  component shell — NOT from component remount. Structural remounting is
  not the problem to solve; the swap animation is.
- **View Transitions API integration uses `onNavigate(navigation => Promise(startViewTransition))`**
  (Spike 015). Inside the Promise, call `startViewTransition(async () => { resolve(); await navigation.complete; })`.
  Read `navigation.to?.url`, NOT `page.url`, for destination-based decisions
  (page.url reflects source URL during onNavigate).
- **`prefers-reduced-motion` is honored on BOTH JS and CSS layers** —
  `matchMedia` short-circuits `startViewTransition` in JS; CSS
  `@media (prefers-reduced-motion: reduce)` block nulls any animations
  that escape. **Svelte CSS parser caveat:** write
  `@media ... { :global(...) }`, NOT `:global(@media ...)` —
  the latter is rejected.
- **Focus management is EXPLICIT via `afterNavigate`** (Spike 016) — because
  the page doesn't remount, focus doesn't auto-reset. Apply inside
  `requestAnimationFrame(() => target.focus({ preventScroll: true }))`.
  `preventScroll: true` is MANDATORY to avoid fighting existing
  `goto({ noScroll: true })` guards.
- **Route-change announcement uses `aria-live="polite"` route announcer,
  NOT `<svelte:head><title>` updates** (Spike 016) — title-change SPA
  announcement support is inconsistent (NVDA/JAWS often don't fire). A
  dedicated `aria-live` region whose text derives from `page.params.X`
  is the universal fix.
- **Unified-layout-with-empty-leaf shape** (Spike 014b) mirrors the existing
  production results pattern at `results/[[electionTab]]/+layout.svelte`.
  Recommended for the questions branch migration: layout owns rendering,
  `[questionId]/+page.svelte` becomes an empty stub, `{#key question.type}`
  (NOT `{#key question.id}`) for variant remount.
- **`{#key question.type}` not `{#key question.id}`** (Spike 014b) — keying
  on the variant property (Likert vs open-text vs slider) keeps the input
  mounted within a run of same-variant questions while still remounting
  cleanly at variant boundaries.
- **Layout-owned `$state` survives navigation** (Spike 016) — answers
  accumulated in the layout's `$state` survive Q→Q nav for free. UX
  benefit: accidental nav doesn't wipe progress (additive to production
  answer-store persistence from Spike 003).
  </requirements>

<findings_index>

## Feature Areas

| Area                          | Reference                                     | Key Finding                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| ----------------------------- | --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Reactive Contexts             | references/reactive-contexts.md               | Three patterns: SSR-aware value-replace (`$state` + getter + synchronous-init from `page.data`) for appSettings, split `current`/`instance` handles for DataRoot's mutation-in-place singleton, `$derived.by` over per-field `page` reads for getRoute (Spike 012 — Wave 3 unblocker). **Production has a real SSR gap** — the `$effect`-only merge skips the DB override on the server (Spike 008). Producers use `instance` inside `untrack()` to break the infinite-loop trap that today requires `get(store)`.                                                                                                                                                             |
| Persistent Rune Stores        | references/persistent-rune-stores.md          | One `runeLocalStorage<T>(key, default)` helper retires the three-layer `$state → localStorageWritable → fromStore` bridge in both voter and candidate answer stores. After migration `localStorageWritable` + `persistedState.svelte.ts` become deletable. Add `runeSessionStorage` sibling in Wave 2 for `voterContext`'s `firstQuestionId`.                                                                                                                                                                                                                                                                                                                                  |
| Matching Integration          | references/matching-integration.md            | `matchStore.svelte.ts` and `nominationAndQuestionStore.svelte.ts` are already rune-native — zero migration work. The runtime proof: a single answer-button click recomputes all 80 matches and re-renders the top-5 table reactively.                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| Layout Overlay Registry       | references/layout-overlay-registry.md         | Token-keyed registry + declarative `use*()` consumer API replaces `StackedState` (`Readable<T>` shim) + `getLayoutContext(onDestroy)` index plumbing. 28 push callsites + 14 onDestroy plumbing sites become trivially editable; robust against out-of-order unmount.                                                                                                                                                                                                                                                                                                                                                                                                          |
| Context Orchestration         | references/context-orchestration.md           | Rune-native `voterContext` / `candidateContext` factory that composes upstream contexts via `getXContext()` and exposes 18+/30+ reactive accessors as getters. **Destructure trap reproduces identically** in the rune-native version (Spike 007) — CLAUDE.md rule applies unchanged. **HMR DX is non-degraded** (Spike 011) but masks the destructure trap during remount — run the codemod audit pass.                                                                                                                                                                                                                                                                       |
| Consumer Migration Codemod    | references/consumer-migration-codemod.md      | Pure-Node, dependency-free codemod rewrites 146 `$store.X` template sites across 45 files in ~1 hour. Two passes: rewrite + destructure-trap audit. **Surfaces a real production bug** in AdminNav (destructure of `isAuthenticated`) and a related spread-of-context anti-pattern in `adminContext.svelte.ts:97`. Idempotent and dry-run by default.                                                                                                                                                                                                                                                                                                                          |
| Migration Inventory & Order   | references/migration-inventory-and-order.md   | Complete Tier 1/2/3 inventory of 18 files in `lib/contexts/**` importing from `svelte/store`. 4-wave migration order respects dependencies — Wave 1 leaf contexts in parallel, Wave 2 secondary bridges, Wave 3 codemod-driven consumer migration, Wave 4 cleanup deletes. Generalized popupStore pattern shows queue-shaped stores follow [[reactive-contexts]] Pattern 1.                                                                                                                                                                                                                                                                                                    |
| Page Navigation & Transitions | references/page-navigation-and-transitions.md | The user-perceived "redraw on Q→Q" is a render-cycle problem, not a remount-cycle problem — SvelteKit already reuses `+page.svelte` instances across param-only URL changes (production: 9/25 ≈ 36% of tracked elements survive a hop). Load-bearing fix is **View Transitions** via `onNavigate(navigation => Promise(startViewTransition))` — ~1 day to wire, additive on existing structure. Optional Wave B: adopt unified-layout-with-empty-leaf shape for `/questions` (matches existing results pattern; cleaner reads). WCAG 2.1 AA passes with `afterNavigate(focus({preventScroll: true}))` + `aria-live="polite"` route announcer + reduced-motion belt-and-braces. |

## Source Files

Original spike source files are preserved in `sources/` for complete reference.
Each spike's `README.md` includes the full investigation trail (initial design,
verification attempts, failures, fixes, browser-verified results).
</findings_index>

<production_landing_map>

## Production Landing Map

| Migration target                                                                                  | Current legacy surface                                                                                                                                                                             | Spike      | Reference                                                       |
| ------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- | --------------------------------------------------------------- |
| `apps/frontend/src/lib/contexts/app/appContext.svelte.ts`                                         | `toStore()` bridge for `$appSettings.X` auto-subscribe (17+ template sites) + `$effect`-only DB merge (SSR gap) + mutative `mergeAppSettings`                                                      | 001, 008   | [[reactive-contexts]]                                           |
| `apps/frontend/src/lib/contexts/data/dataContext.svelte.ts` + `routes/+layout.svelte`             | `writable(dataRoot)` bridge + `get(dataRootStore)` workaround for infinite-loop trap                                                                                                               | 002        | [[reactive-contexts]]                                           |
| `apps/frontend/src/lib/contexts/voter/answerStore.svelte.ts`                                      | `localStorageWritable` + `fromStore` three-layer bridge                                                                                                                                            | 003        | [[persistent-rune-stores]]                                      |
| `apps/frontend/src/lib/contexts/voter/matchStore.svelte.ts`                                       | (none — already rune-native)                                                                                                                                                                       | 004        | [[matching-integration]]                                        |
| `apps/frontend/src/lib/contexts/voter/nominationAndQuestionStore.svelte.ts`                       | (none — already rune-native)                                                                                                                                                                       | 004        | [[matching-integration]]                                        |
| `apps/frontend/src/lib/contexts/candidate/candidateUserDataStore.svelte.ts`                       | 7-line edited-answer persistence bridge                                                                                                                                                            | 005        | [[persistent-rune-stores]]                                      |
| `apps/frontend/src/lib/contexts/utils/persistedState.svelte.ts` (entire file)                     | `Writable<T>` + `toStore()` + `subscribe`-based persistence                                                                                                                                        | 003+005    | [[persistent-rune-stores]]                                      |
| `apps/frontend/src/lib/contexts/utils/StackedState.svelte.ts` (entire file)                       | `implements Readable<T>` + `toStore()` + LIFO index revert                                                                                                                                         | 006        | [[layout-overlay-registry]]                                     |
| `apps/frontend/src/lib/contexts/layout/layoutContext.svelte.ts` (`getLayoutContext(onDestroy)`)   | `onDestroy`-plumbed index-revert pattern at 14+ callsites                                                                                                                                          | 006        | [[layout-overlay-registry]]                                     |
| `apps/frontend/src/lib/contexts/app/popup/popupStore.svelte.ts`                                   | `toStore(() => firstItem)` + `subscribe` getter                                                                                                                                                    | 010        | [[migration-inventory-and-order]]                               |
| `apps/frontend/src/lib/contexts/voter/voterContext.svelte.ts`                                     | `fromStore(appSettings) + fromStore(locale) + sessionStorageWritable(firstQuestionId) + fromStore(...)` (18+ reactive accessors)                                                                   | 007        | [[context-orchestration]]                                       |
| `apps/frontend/src/lib/contexts/candidate/candidateContext.svelte.ts`                             | `fromStore(appSettings) + fromStore(locale) + fromStore(getRoute)` (30+ reactive accessors)                                                                                                        | 007        | [[context-orchestration]]                                       |
| `apps/frontend/src/lib/contexts/app/survey.svelte.ts`                                             | `fromStore(appSettings) + fromStore(sessionId)` + `toStore(() => linkValue)`                                                                                                                       | 010        | [[migration-inventory-and-order]]                               |
| `apps/frontend/src/lib/contexts/app/tracking/trackingService.svelte.ts`                           | `fromStore(appSettings + userPreferences + sessionId)` + `toStore(...)`                                                                                                                            | 010        | [[migration-inventory-and-order]]                               |
| `apps/frontend/src/lib/contexts/app/getRoute.svelte.ts`                                           | `writable(routeFn)` + custom `afterNavigate` workaround (see file header)                                                                                                                          | 010, 012   | [[reactive-contexts]] Pattern 3 — VALIDATED Wave 3 unblocker    |
| `apps/frontend/src/lib/contexts/utils/dataCollectionStore.ts`                                     | Accepts `Readable<DataRoot>` + `Readable<Array<Id>>`; returns `Readable<Array<TObject>>`                                                                                                           | 010        | [[migration-inventory-and-order]]                               |
| `apps/frontend/src/lib/contexts/admin/adminContext.svelte.ts:97`                                  | `{ ...appContext, ...authContext, ... }` spread de-reactivates the auth-context `$derived` accessors                                                                                               | 009        | [[consumer-migration-codemod]] (spread-of-context anti-pattern) |
| `apps/frontend/src/lib/dynamic-components/navigation/admin/AdminNav.svelte:33`                    | `const { isAuthenticated, t, getRoute } = getAdminContext()` — likely production bug                                                                                                               | 009        | [[consumer-migration-codemod]] (destructure-trap finding)       |
| All 146 `$store.X` template auto-subscribe sites in 45 `.svelte` files                            | mechanical search-and-replace via codemod                                                                                                                                                          | 009        | [[consumer-migration-codemod]]                                  |
| `apps/frontend/src/routes/+layout.svelte`                                                         | (no transitions / no aria-live announcer / no focus-on-nav)                                                                                                                                        | 015, 016   | [[page-navigation-and-transitions]] Wave A                      |
| `apps/frontend/src/routes/Header.svelte`, `Layout.svelte`, `MainContent.svelte`                   | (no `view-transition-name` assignments)                                                                                                                                                            | 015        | [[page-navigation-and-transitions]] Wave A                      |
| `apps/frontend/src/routes/(voters)/(located)/questions/[questionId]/+page.svelte`                 | Chrome (MainContent + hero + heading + actions snippets) defined IN the page; recommended pattern hoists this into the parent `questions/+layout.svelte` matching the existing results route shape | 014a, 014b | [[page-navigation-and-transitions]] Wave B                      |
| `apps/frontend/src/lib/components/questions/OpinionQuestionInput.svelte` (or surrounding wrapper) | (no `{#key question.type}` for variant remount)                                                                                                                                                    | 014b       | [[page-navigation-and-transitions]] Wave B                      |
| `apps/frontend/src/lib/dynamic-components/questionHeading/QuestionHeading.svelte`                 | (no `data-focus-on-nav` / `tabindex="-1"` for the post-navigation focus target)                                                                                                                    | 016        | [[page-navigation-and-transitions]] Wave A                      |

**Net effect of full migration:** every `import { * } from 'svelte/store'` site
in `apps/frontend/src/lib/contexts/**` and `apps/frontend/src/routes/**` can
be deleted. Template `$store.X` auto-subscribe sites become mechanical
search-and-replace (every one is enumerable via grep AND mechanically rewritable
via the [[consumer-migration-codemod]]). No paradigm alteration required —
Svelte 5 runes are a strict superset of what these stores were doing.

**4-wave landing order (see [[migration-inventory-and-order]] for details):**

```
Wave 1 (parallel)  →  Tier 1 leaf contexts: appContext, dataContext, answerStore,
                      candidateUserDataStore, settingsOverlay+layoutContext, popupStore
Wave 2             →  Tier 2 secondary bridges + voterContext + candidateContext +
                      add runeSessionStorage helper
Wave 3             →  getRoute migration ([[reactive-contexts]] Pattern 3 — Spike 012) +
                      run consumer-migration-codemod on 179 .svelte files (146 $store.X
                      + 134 $getRoute(opts) sites)
Wave 4 (cleanup)   →  Delete persistedState.svelte.ts + StackedState.svelte.ts;
                      drop Readable<T> from .type.ts files; fix AdminNav +
                      adminContext spread; optional ESLint rule from codemod
```

**Page navigation & transitions (independent from the rune migration —
spikes 013–016 are additive and can ship before/after/independently):**

```
Wave A (1d)  →  Root layout: onNavigate + startViewTransition coupling;
                aria-live route announcer; afterNavigate(focus) hook;
                prefers-reduced-motion belt-and-braces; view-transition-name
                on Header/MainContent/hero/QuestionActions. No structural
                change — standalone cosmetic + a11y improvement.
Wave B (1d)  →  Adopt 014b shape for /questions: hoist all rendering from
                [questionId]/+page.svelte into parent questions/+layout.svelte
                (mirrors existing production results pattern); +page.svelte
                becomes empty stub; {#key question.type} for variant remount.
```

</production_landing_map>

<metadata>
## Processed Spikes

- 001-appsettings-native-rune
- 002-dataroot-native-rune
- 003-voter-answer-store-rune
- 004-matchstore-integration
- 005-candidate-answer-store-rune
- 006-layout-overlay-rune
- 007-context-orchestration-end-to-end
- 008-ssr-hydration-runes
- 009-store-codemod-feasibility
- 010-adjacent-store-bridges
- 011-hmr-rune-contexts
- 012-getroute-rune
- 013-nav-mount-forensics
- 014a-nested-layout-promotion
- 014b-single-page-url-keyed
- 015-view-transitions-api
- 016-focus-and-a11y-during-transitions
  </metadata>
