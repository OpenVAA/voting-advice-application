# Phase 95: Domain A Wave 1 — Tier-1 Leaf Contexts - Research

**Researched:** 2026-06-04
**Domain:** Svelte 5 runes migration of leaf reactive contexts (paradigm-preserving, mechanical)
**Confidence:** HIGH (design is browser-verified by 16 spikes; this research grounds it in current code)

## Summary

This is **not** a design phase — the migration shape for every Tier-1 leaf context is already decided and browser-verified by spikes 001/002/003/005/006/008/010, and runnable reference implementations exist under `apps/frontend/src/routes/runes-test/`. The job of this research is to map each spike-decided shape onto the **exact current production file + line ranges** so the planner can write concrete, file-specific tasks, and to surface the **one structural tension Wave 1 must navigate**: the migrated contexts' *public exported surface* is still consumed via `$store.X` auto-subscribe / `fromStore()` across ~60 `.svelte` files, and those consumers are NOT migrated until Wave 3 (Phase 97's codemod). Therefore Wave 1 migrates the **internals** to pure runes but **must keep a temporary store-shaped bridge on the exported context properties** that downstream still reads as stores. `StackedState.svelte.ts` and `persistedState.svelte.ts` are NOT deleted here (that is Phase 98 / CLEAN-01).

The 5 leaf surfaces and their current store-bridge debt: (a) `appContext` — `toStore`/`fromStore` wrappers on every exported value + the SSR `$effect`-merge gap + mutative `mergeAppSettings`; (b) `dataContext` — `writable(dataRoot)` bridge + the documented `toStore` short-circuit workaround + version counter; (c) voter `answerStore` + candidate `candidateUserDataStore` — the `$state → localStorageWritable → fromStore` 3-layer bridge through `persistedState.svelte.ts`; (d) the layout overlay system — `StackedState` (`implements Readable<T>`) + `getLayoutContext(onDestroy)` index-revert; (e) `popupStore` — `toStore(() => firstItem)` + `subscribe`.

**Primary recommendation:** One plan per leaf surface (D-01 / 95-1, ~6 plans, parallel-eligible). Each plan ports the corresponding `runes-test/` reference implementation into the original file + symbol names (K1), keeps the exported public surface working via a thin temporary bridge for not-yet-migrated consumers, and verifies the existing unit + E2E suites stay green. The new shared helper ships as **`localStorageState<T>(key, default)`** in `persistedState.svelte.ts` (the proven `runeLocalStorage` body, renamed per K1). The appContext plan additionally closes the real SSR override gap by moving the DB-override merge to `$state` init and adds an explicit "server-rendered HTML carries the override" check.

<user_constraints>
## User Constraints (from 95-CONTEXT.md + v2.11-DECISIONS.md)

### Locked Decisions
- **D-01 (95-1):** Split Wave 1 into **one plan per leaf context (~6 plans):** (a) `appContext` + SSR-gap fix, (b) `dataContext`, (c) answer stores + the shared persistence helper, (d) layout-overlay registry, (e) `popupStore`. Parallel-eligible (different files).
- **D-02 (95-2 + K1):** Introduce the shared helper as **`localStorageState<T>(key, default)`** — the spike-scratch name `runeLocalStorage` is NOT used in shipped code (no migration-era prefix per K1). It mirrors `localStorageWritable`'s versioned `{ version, data }` payload shape.
- **D-03 (95-2 + K1):** **No format-migration shim.** The payload format/key may change freely; stale old-format `localStorage` entries are ignored/overwritten. Dropping locally-cached voter answers on first post-migration load is acceptable. The three-layer `$state → localStorageWritable → fromStore` bridge is removed at both callsites.
- **D-04 (95-3):** The DB-override merge moves to `$state` init (NOT `$effect`, which doesn't run on the server). **Add an explicit verification** that server-rendered HTML already carries the DB override — no post-hydration "default → override" flash. `$effect` thereafter handles navigation-time updates only.
- **D-05:** `mergeAppSettings` becomes pure (`{ ...target, ...nonNull }`, no shared-ref mutation); the effective-settings merge stays reactive on `page.data.appSettingsData` behind the load-bearing reference-equality guard.
- **D-06:** Drop the `writable(dataRoot)` bridge and the `get(dataRootStore)` infinite-loop workaround; expose a `current`/`instance` split with `untrack()` around the write-after-read; the version counter still propagates sequential `provideElectionData → … → provideNominationData` population to downstream `$derived`.
- **D-07:** Token-keyed overlay registry + declarative `use*()` consumer API; `StackedState` and the `getLayoutContext(onDestroy)` index-revert plumbing are removed; `$effect` cleanup replaces `onDestroy`; robust to out-of-order mount/unmount. (Actual deletion of `StackedState.svelte.ts` lands in Phase 98.)
- **D-08:** `popupStore` becomes the queue-shaped Pattern-1 (a `get current()` getter; no `toStore(() => firstItem)` + `subscribe`).
- **D-09 (K1):** Rune-native replacements keep their **original file + symbol names** in place — no `rune…`/`…Native` suffixes. The only new symbol is `localStorageState` (neutral permanent name).
- **K1 (milestone-wide):** Temporary bridges/shims are allowed only during Waves 1–3 and must all be deleted by Phase 98 (Wave 4). End state: zero `svelte/store` bridges. No persistence-format migration shims.
- **DX-2:** No worktrees (`use_worktrees=false`) — single working tree, GSD atomic commits.
- **DX-4:** Trust the v2.10 close baseline as-is (82 E2E passed / 2 skipped) — no fresh baseline run before starting.

### Claude's Discretion
- Internal shape of `localStorageState` (as long as it's the versioned-payload core reused by `sessionStorageState` in Phase 96).
- File-level organization within each leaf migration.

### Deferred Ideas (OUT OF SCOPE)
- ❌ `matchStore` / `nominationAndQuestionStore` — already rune-native (spike 004). Do not touch.
- ❌ Re-architecting the context paradigm — migration is mechanical, paradigm-preserving.
- ❌ Consumer migration (`$store.X` → `ctx.current.X`) — that is Wave 3 / Phase 97 (CONS-01/02/03).
- ❌ Deletion of `StackedState.svelte.ts` / `persistedState.svelte.ts` and dropping `Readable<T>` from `.type.ts` — that is Wave 4 / Phase 98 (CLEAN-01).
- ❌ `survey` + `trackingService` secondary bridges (CTX-06) — Phase 96.
- ❌ `voterContext` / `candidateContext` factories + `sessionStorageState` (CTX-07) — Phase 96.
- ❌ `getRoute` migration (CTX-08) — Phase 97.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| CTX-01 | `appContext` pure runes: getters not stores; appSettings + appCustomization DB-override merge at `$state` init (closes SSR gap); `mergeAppSettings` pure; effective-settings merge reactive on `page.data.appSettingsData` behind the reference-equality guard. | Current file `appContext.svelte.ts:74-118` + `utils/settings.ts:12-20`; proven shape `runes-test/ssr-hydration/appSettingsVariantB.svelte.ts`. **Caveat:** exported `appSettings`/`appCustomization`/`appType`/`locale`/`locales`/`darkMode`/`getRoute`/`userPreferences`/`openFeedbackModal`/`popupQueue`/`surveyLink` are read by ~60 `.svelte` consumers via `$store`/`fromStore` — keep a temporary store-shaped surface until Wave 3. |
| CTX-02 | `dataContext` pure runes: drop `writable(dataRoot)` + `get(dataRootStore)` workaround; `current`/`instance` split with `untrack()`; version-counter sequential-population semantics preserved. | Current file `dataContext.svelte.ts:32-66`; proven shape `runes-test/contexts/dataRootRuneContext.svelte.ts`. **Caveat:** `dataRoot` is read as `$dataRoot` in 23 files — keep the `dataRoot` Readable bridge until Wave 3. `reactiveDataRoot.current` already exists and is consumed. |
| CTX-03 | voter `answerStore` + candidate `candidateUserDataStore` persist through one shared `localStorageState<T>` mirroring the versioned-payload format; the 3-layer bridge is gone at both callsites; no format-migration shim. | Current `answerStore.svelte.ts:1-57`, `candidateUserDataStore.svelte.ts:1-279`, helper `persistedState.svelte.ts:62-79`; proven shapes `runes-test/contexts/runePersistedState.svelte.ts` + `voterAnswerRuneStore.svelte.ts` + `candidateAnswerRuneStore.svelte.ts`. Both stores already expose getter-shaped public surfaces (`.answers`, `.current`) consumed downstream — no consumer bridge needed. |
| CTX-04 | Layout overlay system: token-keyed registry + declarative `use*()`; `StackedState` + `getLayoutContext(onDestroy)` index-revert removed; `$effect` cleanup; out-of-order-mount robust. | Current `StackedState.svelte.ts:21-85`, `layoutContext.svelte.ts:51-181`; 19 consumers call `getLayoutContext(onDestroy)`. Proven shapes `runes-test/layout-overlay/SettingsOverlay.svelte.ts` + `layoutSettingsRune.svelte.ts`. **Caveat:** consumers currently read `pageStyles.current` / `topBarSettings.current` / `navigationSettings.current` and call `getLayoutContext(onDestroy)` — the new `use*()` API changes the call shape, so this surface's consumers DO change in Wave 1 (they live in `routes/**`, not behind the codemod). See "Consumer Impact" below. |
| CTX-05 | `popupStore` pure runes, queue-shaped Pattern-1 (`get current()`, no `toStore` + `subscribe`). | Current `popupStore.svelte.ts:1-24`; proven shape `runes-test/popup-rune/popupRuneStore.svelte.ts`. **Caveat:** consumed via `fromStore(popupQueue)` in `routes/+layout.svelte:69` + `appContext` `popupQueue.push`. Keep a temporary `subscribe`/store surface OR migrate the single `+layout.svelte` consumer in-plan. |
</phase_requirements>

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| App settings + DB-override merge (CTX-01) | Frontend Server (SSR) | Browser | Must render correct override server-side; `$effect` only fires client-side, hence the SSR gap. |
| DataRoot reactive bridge (CTX-02) | Browser | — | Client-side reactive singleton; `DataRoot.subscribe()` is a domain abstraction. |
| Persisted answers (CTX-03) | Browser | — | `localStorage` is browser-only; SSR-gated on `browser`. |
| Layout overlay registry (CTX-04) | Browser | — | Per-component-lifetime overlay state, client-side. |
| Popup queue (CTX-05) | Browser | — | Client-side UI queue. |

## Standard Stack

No new external packages. This is an in-repo migration using runtime/framework primitives already present.

### Core (already in use)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Svelte | 5 (runes mode) | `$state` / `$derived` / `$effect` / getters; `untrack` from `svelte` | Project's frontend framework; runes are the migration target |
| SvelteKit | 2 | `$app/state` `page`, `$app/environment` `browser`, `$app/navigation` | Already the routing/SSR layer |
| `@openvaa/app-shared` | workspace | `mergeSettings` (associative deep-merge), `staticSettings`, `dynamicSettings` | Used by overlay registry + appSettings |
| `@openvaa/data` | workspace | `DataRoot`, `Updatable.subscribe()` | DataContext singleton + domain mutation abstraction |
| Vitest | (workspace) | Unit test runner (`vitest run`) | Existing test surface |
| Playwright | (workspace) | E2E (`playwright test`) | Existing E2E suite |

**Installation:** None required.

**`untrack` import:** `import { untrack } from 'svelte';` (NOT `svelte/store`). Used in CTX-02 (dataRoot producer write-after-read) and CTX-04 (overlay registry push/revert). This is a permitted import — only `svelte/store` is banned.

## Package Legitimacy Audit

Not applicable — this phase installs **no external packages**. All work uses existing workspace dependencies and Svelte/SvelteKit framework primitives already present in `apps/frontend`.

## Architecture Patterns

### Migration data flow (per leaf surface)

```
spike reference impl (runes-test/…)   ── port into ──►   original production file (K1: same name)
        │                                                         │
        │ proven shape, browser-verified                          │ internals = pure runes ($state/$derived/getters)
        ▼                                                         ▼
   { current }/{ answers } getter API                    exported context surface
                                                                  │
                                          ┌───────────────────────┴────────────────────────┐
                                          │                                                 │
                              consumer reads getter directly                  consumer still reads $store / fromStore
                              (already rune-shaped: answerStore,              (NOT migrated until Wave 3):
                               candidateUserDataStore, reactiveDataRoot)       appSettings, dataRoot, getRoute,
                                          │                                    darkMode, locale, userPreferences,
                                          ▼                                    popupQueue, appType, appCustomization
                                 no bridge needed                                          │
                                                                                          ▼
                                                                          KEEP a temporary store-shaped bridge
                                                                          on the EXPORTED property (deleted Wave 4)
```

### Pattern 1: Reactive context exposure via getter (CONVENTIONS §1)
**What:** `let v = $state(init); return { get current() { return v; } }`. Consumer reads `ctx.current` inside a tracking scope.
**When:** popupStore (CTX-05), appSettings internal value, dataRoot reactive handle.
**Example:** `runes-test/popup-rune/popupRuneStore.svelte.ts:33-52` (verified).

### Pattern 2: Split read/write handles for mutation-stable singletons (CONVENTIONS §2)
**What:** `{ get current() { void version; return root; }, get instance() { return root; } }`. Consumers use `current` (reactive via version counter); producers/effects use `instance` to avoid a read-dependency on the counter.
**When:** dataContext (CTX-02 / D-06).
**Example:** `runes-test/contexts/dataRootRuneContext.svelte.ts` (verified).

### Pattern 3: `untrack()` around write-after-read in `$effect`-scoped helpers (CONVENTIONS §3)
**What:** Any `$effect`-scoped helper that reads-then-writes the same `$state` (e.g. `slots = [...slots, x]`) must wrap the read side in `untrack()`, else `effect_update_depth_exceeded` AND the global effect scheduler silently breaks (subsequent components' `$effect`s never fire).
**When:** CTX-02 (dataRoot version producer), CTX-04 (overlay registry `push`/`revert`).
**Example:** `runes-test/layout-overlay/SettingsOverlay.svelte.ts:78-97` (verified — the `untrack` wraps both push and revert mutations).

### Pattern 7: Synchronous-init for SSR-aware contexts (CONVENTIONS §7) — THE CTX-01 CORE
**What:** Read `page.data.appSettingsData` SYNCHRONOUSLY at `$state` init and fold the DB override into the initial value. `$effect` then ONLY handles post-navigation `page.data` changes. `$effect` does not run on the server, so an `$effect`-only merge renders default HTML server-side and flashes to the override after hydration.
**When:** CTX-01 / D-04. Same fix applies to `appCustomizationData`.
**Example:** `runes-test/ssr-hydration/appSettingsVariantB.svelte.ts:45-71` (verified; carries `effectFired` / `initialMergeIncludedDbOverride` instrumentation that informs the D-04 explicit-check).

### Pattern 8: Pure merge for shared module singletons (CONVENTIONS §8) — CTX-01 / D-05
**What:** `mergeAppSettings` must be `{ ...target, ...nonNull }`, not `Object.assign(target, nonNull)`. The current version mutates the shared `staticSettings` module reference; masked today because only one appContext inits per session, but breaks the moment two contexts init (SSR variant pollution surfaced this in spike 008).
**Current bug:** `apps/frontend/src/lib/utils/settings.ts:19` — `return Object.assign(target, nonNull);`

### Pattern 5 + 6: Token-keyed registry + declarative `use*()` (CONVENTIONS §5/6) — CTX-04
**What:** Replace index-based LIFO stack + `onDestroy` revert with a token-keyed registry. `push(overlay)` returns a `() => void` revert token; `use(overlay)` wraps `$effect(() => push(overlay))` so cleanup is structural and out-of-order-mount safe.
**Example:** `runes-test/layout-overlay/SettingsOverlay.svelte.ts` + `layoutSettingsRune.svelte.ts` (verified).

### Anti-Patterns to Avoid
- **Destructure trap (CLAUDE.md "Context Destructuring Rule"):** never destructure reactive accessors out of a context — they capture the init-time value. MUST keep reproducing (per 95-CONTEXT specifics) — do not "fix" it.
- **Spread-of-context:** `{ ...ctxA, ...ctxB }` invokes getters once and freezes values. (Relevant to appContext's `...componentCtx`/`...dataCtx` spread — see landmine below.)
- **Reading a ref-stable `$state` proxy as a whole value** inside a tracking scope (CONVENTIONS §9) — relevant to dataRoot and getRoute; for Wave 1 it means never `toStore(() => dataRootSingleton)`.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| localStorage persistence + versioning | A bespoke per-store read/write | The single `localStorageState<T>` helper (ported `runeLocalStorage` body) | Versioned `{version,data}` payload + `requireUserDataVersion` expiry + `browser` gate already proven; Phase 96 reuses the same core for `sessionStorageState`. |
| Overlay merge | A custom LIFO merge | `mergeSettings` from `@openvaa/app-shared` | It is **associative** — that is what makes the token-registry result identical to the old strict-LIFO stack (verified constraint, spike 006). |
| DataRoot change notification | A custom diff/poll | DataRoot's existing `Updatable.subscribe()` bridged to a `$state` version counter | `subscribe()` is a domain abstraction (transactional mutation batching across nested `provide*`). Keep it intact; bridge via the counter. |
| `$state` deep clone | `structuredClone` | `JSON.parse(JSON.stringify(...))` | Svelte 5 `$state` proxies are NOT structurally cloneable. Both answer stores already do this — KEEP it (`answerStore.svelte.ts:23`, `candidateUserDataStore.svelte.ts:67`). |

**Key insight:** Every shape needed here already exists, browser-verified, under `runes-test/`. The migration is a port-and-rename, not invention. The only genuinely new code is keeping the exported store-shaped bridges alive for not-yet-migrated consumers.

## Runtime State Inventory

This is a code-only migration (no datastore/service/OS state changes). The one runtime-state consideration is **`localStorage` payload format**, addressed below.

| Category | Items Found | Action Required |
|----------|-------------|------------------|
| Stored data | `localStorage` keys: `VoterContext-answerStore`, `CandidateContext-candidateUserDataStore-editedAnswers`, `appContext-userPreferences`. Format is `{ version, data }`. | D-03: **no migration shim.** New `localStorageState` reads the same versioned format. If a plan changes the payload shape or key, stale entries are ignored/overwritten (acceptable answer loss). Keys SHOULD stay identical to avoid gratuitous loss, but format compatibility is NOT required. |
| Live service config | None — no external service stores the migrated symbols. | None — verified: the migration touches only frontend `lib/contexts/**` + `utils/settings.ts`. |
| OS-registered state | None. | None — verified. |
| Secrets/env vars | None. | None — verified. |
| Build artifacts | `runes-test/**` spike reference code remains in-tree (deleted with the route tree in a later milestone, not here). It is NOT shipped to users beyond being a dev route. | None for Wave 1 — do NOT delete `runes-test/` (it is the reference + still hosts Wave 2/3 spike code). |

**Nothing found** for live-service / OS / secrets categories — verified by scoping the change set to `apps/frontend/src/lib/contexts/**` and `apps/frontend/src/lib/utils/settings.ts`.

## Consumer Impact (what MUST keep working — the central Wave-1 constraint)

Wave 1 migrates context **internals** to runes but most exported properties are still read as stores by un-migrated consumers (Wave 3 / Phase 97 codemod migrates those). Wave 1 plans MUST keep these exported surfaces working via temporary bridges. Per-surface:

| Surface | Exported property | How consumers read it today | Consumer count | Wave-1 obligation |
|---------|-------------------|------------------------------|----------------|-------------------|
| appContext (CTX-01) | `appSettings`, `darkMode`, `locale`, `locales`, `getRoute`, `appCustomization`, `appType`, `userPreferences`, `openFeedbackModal`, `surveyLink`, `popupQueue` | `$appSettings.X` template auto-subscribe AND `fromStore(appSettingsStore)` (e.g. `Header.svelte:38`) | ~60 `.svelte` files read `$appSettings.`/`$getRoute(`/`$darkMode`/`$locale` etc. | KEEP store-shaped exported values (temporary `toStore` bridge on the exported property is allowed during Wave 1). Migrate only the INTERNAL `$state` + SSR merge + pure `mergeAppSettings`. `surveyLink`/`tracking` come from CTX-06 files (Phase 96) — appContext still consumes them via `toStore` args; leave those bridges. |
| dataContext (CTX-02) | `dataRoot` (Readable) | `$dataRoot` auto-subscribe | 23 files | KEEP a `dataRoot` Readable bridge (imperative `.set` from the `subscribe` callback, as today) until Wave 3. `reactiveDataRoot.current` already exists and is consumed by voter/candidate contexts + admin routes — preserve it. |
| answerStore (CTX-03) | `.answers` getter | `answers.answers` getter (voterContext.svelte.ts:358) | getter-shaped already | **No consumer bridge needed.** Only swap the internal `localStorageWritable + fromStore` for `localStorageState`. |
| candidateUserDataStore (CTX-03) | `.current`, `.hasUnsaved`, etc. getters | getter access (candidateContext) | getter-shaped already | **No consumer bridge needed.** Swap the internal `localStorageWritable + fromStore` (`_editedAnswersStore`/`editedAnswersState`) for `localStorageState`. |
| layout overlay (CTX-04) | `getLayoutContext(onDestroy)`, `pageStyles/topBarSettings/navigationSettings` (`StackedState`) | `const { pageStyles } = getLayoutContext(onDestroy)`; `.current` reads; `.push(...)` | **19 consumer files** in `routes/**` + nav components call `getLayoutContext(onDestroy)` | This surface's consumers live in `routes/**` (NOT behind the Wave-3 codemod which targets `$store.X`). The `use*()` API changes the call shape. **DECISION FOR PLANNER:** either (a) migrate all 19 callsites to the `use*()` API within the CTX-04 plan, or (b) keep `getLayoutContext(onDestroy)` + `StackedState` exports as a temporary compat surface and introduce the registry alongside. Given K1 + "robust to out-of-order mount/unmount", option (a) is the spike-intended end state, but it materially widens the CTX-04 plan. **Flag as Open Question O-1.** |
| popupStore (CTX-05) | `popupQueue` (Readable + push/shift) | `fromStore(popupQueue)` at `routes/+layout.svelte:69`; `popupQueue.push` in appContext; `popupQueue.shift()` | 1 direct `fromStore` consumer + appContext internal | Either keep a temporary `subscribe` on the return (cheap) OR migrate the single `+layout.svelte:69,230` consumer (`fromStore(popupQueue)` → `popupQueue.current`) in-plan. The spike reference already documents this 2-line consumer change (`popupRuneStore.svelte.ts:20-23`). Recommend migrating the one consumer; it's contained. |

## Current-Code Inventory (file + line ranges the planner cites in tasks)

### CTX-01 — `apps/frontend/src/lib/contexts/app/appContext.svelte.ts`
- `:4` — `import { fromStore, toStore } from 'svelte/store';` (the import to eliminate, but exported store-wrappers stay as temporary bridges).
- `:54-56` — `localeStore`/`localesStore`/`darkModeStore` via `toStore(() => componentCtx.X)` (temporary bridges; keep).
- `:62-68` — `appType` via `toStore` get/set (keep as bridge; internal `$state` already rune).
- `:74` — `appSettingsValue = $state(mergeAppSettings(staticSettings, dynamicSettings))` — **internal $state already exists**; the work is (a) fold the SSR DB override in at init, (b) make `mergeAppSettings` pure.
- `:75-80` — `appSettings = toStore(...)` exported bridge (keep until Wave 3).
- `:93-100` — **the SSR-gap `$effect`** that merges `page.data.appSettingsData` ONLY in `$effect` (runs client-only) + the **load-bearing reference-equality guard** (`prevAppSettingsData`). D-04: move the *initial* merge to `$state` init; `$effect` keeps the guard but handles only post-nav changes.
- `:102-118` — `appCustomization` `$state` + its own SSR-gap `$effect` (lines 112-118) + reference-equality guard (`prevAppCustomizationData`). Same D-04 fix.
- `:121` — `userPreferences = localStorageWritable('appContext-userPreferences', {})` — **depends on CTX-03's `localStorageState`**; either keep `localStorageWritable` here for Wave 1 (it survives until Phase 98) or move to `localStorageState`. NB userPreferences is exported as a `Writable` and consumed via `.update()` + `fromStore` (`:157`), so it must keep a `Writable`-compatible surface. **Recommend: leave `userPreferences` on `localStorageWritable` in Wave 1** (it's CTX-03-adjacent but the Writable surface is load-bearing for `.update()` consumers) — flag O-2.
- `:157` — `fromStore(userPreferences)` internal reactive read.
- `:212-235` — `setContext` return: `...componentCtx`, `...dataCtx`, `...tracking` spreads (spread-of-context risk — see landmine L-3) + the exported store-wrapped overrides.
- **SSR explicit check (D-04):** the spike's `effectFired`/`initialMergeIncludedDbOverride` instrumentation (variantB) is the model; the production verification is an E2E/SSR assertion that the server-rendered HTML contains the DB-override value (no post-hydration flash).

### CTX-01 — `apps/frontend/src/lib/utils/settings.ts`
- `:12-20` — `mergeAppSettings`; `:19` `return Object.assign(target, nonNull);` → make pure `return { ...target, ...nonNull };` (D-05). This file has NO `svelte/store` import; pure-function change only. Re-run any consumers/tests of `mergeAppSettings`.

### CTX-02 — `apps/frontend/src/lib/contexts/data/dataContext.svelte.ts`
- `:4` — `import { writable } from 'svelte/store';` (eliminate internal use; keep a `dataRoot` Readable bridge for `$dataRoot` consumers).
- `:6` — `import type { Readable } from 'svelte/store';` (type stays until Wave 4 / Phase 98).
- `:32-34` — `version = $state(0)` counter (keep — bridges `subscribe()` → `$derived`).
- `:36-49` — the `writable(dataRoot)` bridge + the long header comment documenting the `toStore` short-circuit (`get(dataRootStore)` infinite-loop workaround). D-06: drop the internal-only justification, but a `dataRoot` Readable surface must remain for the 23 `$dataRoot` consumers (imperative `.set` from the subscribe callback is the minimal bridge).
- `:52-55` — `dataRoot.subscribe(() => { version++; dataRootStore.set(dataRoot); })` — keep the `version++`; the `.set` becomes the temporary bridge.
- `:59-64` — `reactiveDataRoot = { get current() { void version; return dataRoot; } }` — already correct; add the `instance` handle per D-06 (Pattern 2).
- **Reference impl:** `runes-test/contexts/dataRootRuneContext.svelte.ts` (current/instance split, version counter, no `writable`).
- **dataContext.type.ts:2** — `import type { Readable }` stays (typed `dataRoot` bridge); the `reactiveDataRoot: { readonly current: DataRoot }` type already present — add `instance` if exposed.

### CTX-03 — helper `apps/frontend/src/lib/contexts/utils/persistedState.svelte.ts`
- `:2` — `import { toStore } from 'svelte/store';`, `:5` `import type { Writable }`.
- `:29-31` — `localStorageWritable` (KEEP — appContext.userPreferences + survey/tracking still consume it until Phase 96/98; it is NOT deleted in Wave 1 per CLEAN-01 = Phase 98).
- `:43-45` — `sessionStorageWritable` (KEEP — Phase 96 adds `sessionStorageState`; do not delete here).
- `:62-79` — `storageWritable` core (`$state` + `toStore` + `subscribe`-to-persist). **ADD** a new exported `localStorageState<T>(key, default): { current; set; update }` (the `runeLocalStorage` body, renamed) reusing the existing `getItemFromStorage`/`saveItemToStorage`/`getStorage` helpers (`:86-148`). Discretion: structure so Phase 96's `sessionStorageState` shares the versioned-payload core.
- **Reference impl:** `runes-test/contexts/runePersistedState.svelte.ts` (the proven `runeLocalStorage` — rename to `localStorageState` per D-02/K1). NB its inline `readVersioned`/`writeVersioned` duplicate the production helpers; in production, REUSE the existing `getItemFromStorage`/`saveItemToStorage` rather than re-implement.

### CTX-03 — voter `apps/frontend/src/lib/contexts/voter/answerStore.svelte.ts`
- `:1` — `import { fromStore } from 'svelte/store';` (eliminate).
- `:4` — `import { localStorageWritable } from '../utils/persistedState.svelte';` → `localStorageState`.
- `:16-17` — `const store = localStorageWritable(...); const storeState = fromStore(store);` → single `const store = localStorageState(...)`.
- `:19-47` — `store.update(...)` / `store.set(...)` calls map 1:1 to `localStorageState.update`/`.set`. Keep the `JSON.parse(JSON.stringify(...))` clone (`:23`) and `deepFreeze`.
- `:50-52` — `get answers() { return storeState.current; }` → `return store.current;`.
- **Reference impl:** `runes-test/contexts/voterAnswerRuneStore.svelte.ts` (verified; re-add the `startEvent` tracking hook which the spike intentionally omitted — keep production's `startEvent` param + calls at `:26,29,45`).
- No unit test currently exists for the voter answerStore (`apps/frontend/src/lib/contexts/voter/` has none) — see Validation Architecture / Wave 0.

### CTX-03 — candidate `apps/frontend/src/lib/contexts/candidate/candidateUserDataStore.svelte.ts`
- `:2` — `import { fromStore } from 'svelte/store';` (eliminate).
- `:3` — `import { localStorageWritable }` → `localStorageState`.
- `:38-42` — `_editedAnswersStore = localStorageWritable(...); editedAnswersState = fromStore(_editedAnswersStore);` → single `localStorageState`.
- `:56-77` `_current` `$derived.by` reads `editedAnswersState.current` → `_editedAnswersStore.current` (keep the JSON clone at `:67`).
- `:117-120`, `:200` — other `editedAnswersState.current` reads → `.current`.
- `:151-166` — `_editedAnswersStore.update(...)` / `.set(...)` map 1:1.
- The `$state` fields (`savedData`, `editedImage`, `editedTermsOfUseAccepted`) and the `answersLocked` `$effect` (`:51-53`) are already rune — unchanged.
- **Reference impl:** `runes-test/contexts/candidateAnswerRuneStore.svelte.ts`.
- **Existing unit test:** `candidateUserDataStore.svelte.test.ts` (4 `save()` tests) MUST stay green — it constructs the store and exercises save/merge paths. The `localStorageState` swap must not break it (the test mocks the data writer, not storage — verify storage gating under the vitest `browser=false` path still returns the default).

### CTX-04 — `apps/frontend/src/lib/contexts/utils/StackedState.svelte.ts` + `apps/frontend/src/lib/contexts/layout/layoutContext.svelte.ts`
- `StackedState.svelte.ts:1-2` — `import { toStore }` + `import type { Readable }`; `:21` `implements Readable<TMerged>`; `:69-75` `get subscribe()` via cached `toStore`. The registry (`SettingsOverlay`) replaces this. **NB: do NOT delete `StackedState.svelte.ts` in Wave 1** (CLEAN-01 = Phase 98). Introduce `SettingsOverlay`/registry; the question is whether `layoutContext` switches to it now (changing 19 consumers) — see O-1.
- `StackedState.svelte.test.ts` — 9 unit tests (constructor/push/revert/subscribe/simpleStackedState/mergeSettings-updater). If `StackedState` stays for Wave 1, these stay green untouched; if the registry replaces it, add equivalent registry tests.
- `layoutContext.svelte.ts:8` — `import { StackedState }`; `:54-67` three `new StackedState(...)` with `mergeSettings`; `:154-161` `setContext`; `:169-181` `getLayoutContext(onDestroy)` index-revert. D-07 replaces these with `settingsOverlay` + `use*()`; `$effect` cleanup replaces `onDestroy`.
- `layoutContext.type.ts:4,10,15,28` — `StackedState<...>` typed properties → `SettingsOverlayApi<...>`.
- **19 consumers** of `getLayoutContext(onDestroy)`: `routes/Layout.svelte:40`, `routes/Header.svelte:41`, `routes/MainContent.svelte:53`, plus `(voters)/+layout.svelte`, `(voters)/+page.svelte`, `(voters)/about|info|privacy/+page.svelte`, `questions/+layout.svelte`, `questions/category/[categoryId]/+page.svelte`, `candidate/**` (`+layout`, `preview`, `profile`, `settings`, `questions/+layout`), `admin/+layout.svelte`, `admin/login/+page.svelte`, `Banner.svelte`, nav components (`AdminNav`, `CandidateNav`, `VoterNav`, `NavItem`). These read `.current` and call `.push(...)`; the `use*()` migration changes both.
- **Reference impls:** `runes-test/layout-overlay/SettingsOverlay.svelte.ts` (`settingsOverlay` registry + `untrack`) + `layoutSettingsRune.svelte.ts` (the `initLayoutSettingsRune`/`getLayoutSettingsRune` + `use*()` API).

### CTX-05 — `apps/frontend/src/lib/contexts/app/popup/popupStore.svelte.ts`
- `:1` — `import { toStore } from 'svelte/store';` (eliminate).
- `:9-19` — `queue = $state([])` + `firstItem = $derived(queue[0])` + `push`/`shift` — already rune; KEEP.
- `:21-23` — `const store = toStore(() => firstItem); return { push, shift, subscribe: store.subscribe };` → `return { push, shift, get current() { return firstItem; } };` (Pattern 1).
- `popupStore.type.ts:1,8` — `Readable<PopupQueueItem | undefined> & {push,shift}` → `{ readonly current; push; shift }`. (Dropping `Readable` is technically a Wave-4 concern, but here the type IS the public surface; coordinate with the single consumer.)
- **Consumer:** `routes/+layout.svelte:69` `const popupQueueState = fromStore(popupQueue);` + `:230-237` reads `popupQueueState.current` / `popupQueue.shift()`. Migrate to `popupQueue.current` (2-line change per spike doc). `appContext.svelte.ts:131,167,184` uses `popupQueue.push` (unchanged).
- **Reference impl:** `runes-test/popup-rune/popupRuneStore.svelte.ts`.

### svelte/store import ledger after Wave 1 (informational — full removal is Phase 98)
Leaf files where the **internal** `svelte/store` use is eliminated but a **typed/bridge** surface may remain for un-migrated consumers: appContext (exported `toStore` bridges remain), dataContext (`dataRoot` Readable bridge + `Readable` type remain). Files where the import is fully removable in Wave 1: `answerStore.svelte.ts`, `candidateUserDataStore.svelte.ts`, `popupStore.svelte.ts` (and its `.type.ts` if the single consumer is migrated).

## Common Pitfalls

### Pitfall 1 (L-1): SSR `$effect`-doesn't-run gap (spike 008)
**What goes wrong:** Merging the DB override inside `$effect` renders default settings server-side; after hydration `$effect` fires and the page flashes default→override.
**How to avoid:** D-04 — synchronous `page.data.appSettingsData` read at `$state` init; `$effect` handles only post-nav changes. Add an explicit SSR assertion that server HTML carries the override.
**Warning signs:** A "default theme/logo flash" on slow connections; `effectFired` true on server in instrumentation.

### Pitfall 2 (L-2): `untrack()` write-after-read invariant (spikes 002, 006)
**What goes wrong:** A `$effect`-scoped helper doing `slots = [...slots, x]` (read+write same `$state`) → `effect_update_depth_exceeded` AND silently breaks the global effect scheduler (other components' `$effect`s never fire — hard to diagnose).
**How to avoid:** Wrap the read side in `untrack()` (CTX-02 version producer, CTX-04 registry push/revert). `import { untrack } from 'svelte';`.
**Warning signs:** Console `effect_update_depth_exceeded`; unrelated components stop reacting.

### Pitfall 3 (L-3): Reference-equality guard is load-bearing (verified constraint)
**What goes wrong:** Without the `prevAppSettingsData` guard (appContext `:93-100`), `mergeAppSettings` produces a new object on every nav even when SvelteKit returns the same cached loader payload → cascades through `entityTypes → nominationAndQuestionStore → filterStore`, recreating every `FilterGroup` (manifested as "filter badge disappears / portraits reload" in Phase 64). Svelte 4 stores absorbed this via `safe_not_equal`; raw `$state =` does not.
**How to avoid:** Preserve the guard in the D-04 `$effect`. Carry `prevAppSettingsData` initialized to the init-time value (variantB sets `prevData = initialDbData`).

### Pitfall 4 (L-4): `$state` proxies are not structurally cloneable (verified constraint)
**What goes wrong:** `structuredClone($stateProxy)` throws. Both answer stores rely on JSON clones.
**How to avoid:** KEEP `JSON.parse(JSON.stringify(...))` (`answerStore.svelte.ts:23`, `candidateUserDataStore.svelte.ts:67`). Do not "optimize" to `structuredClone`.

### Pitfall 5 (L-5): Spread-of-context de-reactivates getters
**What goes wrong:** appContext returns `{ ...componentCtx, ...dataCtx, ...tracking, ... }`. A spread invokes each getter ONCE and freezes the value — if any spread-in property is a reactive getter, it loses reactivity. (Sibling of the destructure trap; the documented production instance is `adminContext.svelte.ts:97`, fixed in Wave 3.)
**How to avoid:** Do not introduce new spreads of reactive getters in Wave 1. Keep the explicit store-wrapped overrides AFTER the spreads (as the current code does at `:216-234`). When in doubt, forward via explicit `get X()`.
**Warning signs:** A downstream `$derived(ctx.X)` never updates after a mutation that should have changed `X`.

### Pitfall 6 (L-6): mergeSettings associativity is what makes the registry equivalent (spike 006)
**What goes wrong:** If a non-associative merge were used, the token-registry's `reduce(base, …overlays)` would not equal the old strict-LIFO stack result.
**How to avoid:** Use `@openvaa/app-shared`'s `mergeSettings` (associative) in the registry — exactly as `layoutSettingsRune.svelte.ts` does. Do not swap in a custom merge.

### Pitfall 7 (L-7): Destructure trap must be PRESERVED, not fixed (95-CONTEXT specifics)
**What goes wrong:** A well-meaning "fix" to the destructure trap in Wave 1 would diverge from the CLAUDE.md rule and the Wave-3 codemod's audit expectations.
**How to avoid:** Leave consumer read patterns (`ctx.X` via `$derived`) as documented; do not change consumer destructuring semantics in Wave 1. Consumer migration is Wave 3.

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `writable`/`toStore`/`fromStore` bridges in contexts | Pure `$state`/`$derived`/getter | Svelte 5 runes (this milestone) | Removes 3-layer bridges; same runtime behavior, verified by spikes |
| `Object.assign(target, …)` settings merge | Pure spread `{ ...target, ...nonNull }` | This phase (D-05) | Stops shared-module mutation; SSR-safe |
| `$effect` DB-override merge | Synchronous `$state`-init merge | This phase (D-04) | Closes real SSR flash bug |
| `StackedState` index-based LIFO + `onDestroy` | Token-keyed registry + `use*()` `$effect` cleanup | This phase (CTX-04) | Out-of-order-mount robust; no `onDestroy` plumbing |

**Deprecated/outdated (still present, removed in Phase 98 not here):**
- `StackedState.svelte.ts`, `persistedState.svelte.ts` `localStorageWritable`/`sessionStorageWritable`, `Readable<T>` in `.type.ts` — temporary bridges that survive until Wave 4.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | The exported store-shaped surfaces (`appSettings`, `dataRoot`, etc.) MUST be kept as temporary bridges in Wave 1 because their `$store.X`/`fromStore` consumers aren't migrated until Wave 3. | Consumer Impact | If wrong (e.g. planner chooses to migrate consumers eagerly), the CTX plans widen massively and lose parallel-eligibility. Verified by grep: ~60 files read `$appSettings.`/`$getRoute(`/`$darkMode`/`$locale`; 23 read `$dataRoot`. Confidence HIGH. |
| A2 | `userPreferences` should stay on `localStorageWritable` (Writable) for Wave 1 because it's exported as `Writable` and consumed via `.update()` + `fromStore`. | CTX-01 inventory (O-2) | If forced onto `localStorageState` now, the `.update()`/`Writable` consumers (`DataConsent.svelte`, `SurveyBanner.svelte`, `(voters)/+layout.svelte`) break until Wave 3. Confidence MEDIUM — planner may prefer a `localStorageState`+temporary-Writable-bridge. |
| A3 | CTX-04's 19 `getLayoutContext(onDestroy)` consumers are migrated within the CTX-04 plan (option a), not deferred, since they live in `routes/**` outside the Wave-3 `$store.X` codemod scope. | Consumer Impact (O-1) | If deferred, a parallel temporary `StackedState`+`getLayoutContext` surface must coexist with the registry, adding complexity. Confidence MEDIUM — this is the biggest planning judgment call. |
| A4 | No new external packages and no datastore/service/OS state changes. | Runtime State Inventory | Low risk; verified by scoping to `lib/contexts/**` + `utils/settings.ts`. Confidence HIGH. |
| A5 | The v2.10 baseline (82 E2E passed / 2 skipped) is the green target; no fresh pre-run (DX-4). | Validation Architecture | If the baseline drifted since v2.10 close, "stays green" comparison is off. Confidence HIGH (locked decision). |

## Open Questions

1. **O-1 — CTX-04 consumer migration scope.** Does the CTX-04 plan migrate all 19 `getLayoutContext(onDestroy)` callsites to the `use*()` API now (spike-intended end state, but widens the plan and reduces parallelism), or introduce the registry + keep `getLayoutContext`/`StackedState` as a temporary compat surface until a later wave?
   - What we know: consumers live in `routes/**`, outside the Wave-3 `$store.X` codemod scope; the `use*()` API changes both the read shape (`.current`) and the push/cleanup shape.
   - Recommendation: migrate them in-plan (option a) — `StackedState` stays in-tree (deleted Phase 98) but `layoutContext` switches to the registry. Treat CTX-04 as the heaviest of the ~6 plans and possibly NOT parallel with the others if it churns shared `routes/` chrome (`Layout.svelte`/`Header.svelte`/`MainContent.svelte`).

2. **O-2 — `userPreferences` helper choice in Wave 1.** Keep `localStorageWritable` (Writable, no consumer change) or move to `localStorageState` with a temporary `Writable` bridge for `.update()` consumers?
   - Recommendation: keep `localStorageWritable` in Wave 1 (A2); it survives until Phase 98 anyway and its `Writable` surface is load-bearing for `.update()` callers.

3. **O-3 — popupStore type surface.** Dropping `Readable<...>` from `popupStore.type.ts` is technically a Wave-4 (CLEAN) act, but here the type IS the public surface and the single consumer (`+layout.svelte:69`) is easy to migrate. Decide whether the CTX-05 plan migrates that one consumer (recommended — contained) or keeps a temporary `subscribe`.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node/Yarn 4 workspace | build/test | ✓ (project standard) | per repo | — |
| Vitest | unit tests | ✓ | workspace | — |
| Playwright | E2E suite | ✓ | workspace | — |
| Local Supabase | E2E (`yarn dev`) | ✓ (CLI) | per repo | — |

No missing dependencies. This is an in-tree migration; no new tools required.

## Validation Architecture

> nyquist_validation not disabled in config — section included.

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest (unit, `vitest run`) + Playwright (E2E) |
| Config file | `apps/frontend` vitest config (workspace); `tests/playwright.config.ts` (root) |
| Quick run command | `yarn workspace @openvaa/frontend test:unit` (or `cd apps/frontend && yarn test:unit`) |
| Full suite command | root `yarn test:unit` (turbo) + `yarn test:e2e` (requires `yarn dev`) |

### Phase Requirements → Test Map
| Req | Behavior | Test Type | Automated Command | File Exists? |
|-----|----------|-----------|-------------------|-------------|
| CTX-01 | appSettings SSR override present in server HTML; no post-hydration flash | E2E / SSR smoke | Playwright (new assertion against rendered HTML for an app with a DB override) | ❌ Wave 0 (new E2E assertion) |
| CTX-01 | `mergeAppSettings` pure (no shared-ref mutation) | unit | `cd apps/frontend && yarn test:unit` (add a settings.ts unit test) | ❌ Wave 0 (no current test for `mergeAppSettings`) |
| CTX-02 | sequential `provide*` population triggers downstream `$derived` via version counter; no `effect_update_depth_exceeded` | E2E | voter/candidate journey specs (existing) — data loads & matches compute | ✅ existing E2E |
| CTX-03 (voter) | set/delete/reset persists + round-trips; frozen answers | unit | `cd apps/frontend && yarn test:unit` | ❌ Wave 0 (no `answerStore` unit test today) |
| CTX-03 (candidate) | save/merge paths preserve id + static fields | unit | `candidateUserDataStore.svelte.test.ts` | ✅ exists (4 tests) — must stay green after `localStorageState` swap |
| CTX-03 (helper) | `localStorageState` versioned read/write, expiry, SSR (browser=false) default | unit | `persistedState.svelte.test.ts` (extend with `localStorageState` cases) | ✅ exists for `localStorageWritable` — extend |
| CTX-04 | merged overlay equals old LIFO result; out-of-order mount/unmount correct; cleanup on destroy | unit | `StackedState.svelte.test.ts` (or new `SettingsOverlay` test) | ⚠️ exists for StackedState; add registry tests |
| CTX-04 | layout chrome (drawer bg, top-bar, nav hide) still correct across routes | E2E | existing voter/candidate journey specs | ✅ existing E2E |
| CTX-05 | popup queue push/shift/current; root-layout popup renders | E2E + unit | new popupStore unit test + existing feedback/survey popup E2E | ⚠️ partial |
| All | full E2E suite green vs v2.10 baseline (82 pass / 2 skip) | E2E | `yarn test:e2e` (after `yarn dev`) | ✅ baseline locked (DX-4) |

### Sampling Rate
- **Per task commit:** `cd apps/frontend && yarn test:unit` (fast; covers the touched leaf's unit tests).
- **Per plan merge:** root `yarn test:unit` (turbo, all packages) + `yarn lint:check`.
- **Phase gate:** full `yarn test:e2e` green (no regression vs the v2.10 82-pass/2-skip baseline) before `/gsd-verify-work`.

### Wave 0 Gaps
- [ ] `apps/frontend/src/lib/contexts/voter/answerStore.svelte.test.ts` — covers CTX-03 voter set/delete/reset/persistence (none exists today).
- [ ] `apps/frontend/src/lib/utils/settings.test.ts` — covers CTX-01/D-05 `mergeAppSettings` purity (asserts `target` not mutated).
- [ ] Extend `persistedState.svelte.test.ts` with `localStorageState` cases (versioned read/write, stale-version discard, SSR default).
- [ ] CTX-04: registry tests (`SettingsOverlay`) for out-of-order mount/unmount + cleanup, if the registry replaces `StackedState` in `layoutContext`.
- [ ] CTX-01: an SSR/E2E assertion that server-rendered HTML carries the DB override (the explicit D-04 check).
- [ ] CTX-05: a popupStore unit test for push/shift/current (the spike proved it in-browser; add a unit guard).

## Security Domain

> security_enforcement not explicitly false; however this phase has minimal security surface.

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V5 Input Validation | no | No new user input paths; migration preserves existing answer/data handling. |
| V6 Cryptography | no | No crypto. |
| V8 Data Protection | marginally | `localStorage` answer persistence is unchanged in scope; D-03 may DROP locally-cached answers on first post-migration load (acceptable per locked decision). No new PII surface. |

No new threat patterns introduced — the migration is behavior-preserving. The only data-handling change is the accepted one-time drop of stale-format `localStorage` answers (D-03), which is a deliberate, user-approved tradeoff, not a vulnerability.

## Sources

### Primary (HIGH confidence)
- Current production code (read in full this session): `appContext.svelte.ts`, `appContext.type.ts`, `utils/settings.ts`, `dataContext.svelte.ts`, `dataContext.type.ts`, `persistedState.svelte.ts`, `voter/answerStore.svelte.ts`, `answerStore.type.ts`, `candidate/candidateUserDataStore.svelte.ts`, `StackedState.svelte.ts`, `layout/layoutContext.svelte.ts`, `layoutContext.type.ts`, `popup/popupStore.svelte.ts`, `popupStore.type.ts`.
- Browser-verified spike reference impls (read this session): `runes-test/contexts/runePersistedState.svelte.ts`, `voterAnswerRuneStore.svelte.ts`, `runes-test/ssr-hydration/appSettingsVariantB.svelte.ts`, `runes-test/layout-overlay/SettingsOverlay.svelte.ts` + `layoutSettingsRune.svelte.ts`, `runes-test/popup-rune/popupRuneStore.svelte.ts`.
- `.planning/spikes/WRAP-UP-SUMMARY.md`, `.planning/spikes/CONVENTIONS.md` (Patterns 1-9, banned idioms, verified constraints).
- Consumer grep audits (this session): ~60 files read `$appSettings.`/`$getRoute(`/`$darkMode`/`$locale`; 23 read `$dataRoot`; 19 call `getLayoutContext(onDestroy)`; 1 `fromStore(popupQueue)` direct consumer.
- `95-CONTEXT.md`, `v2.11-DECISIONS.md`, `REQUIREMENTS.md` (locked decisions + binding constraints).
- `./CLAUDE.md` "Context Destructuring Rule (Svelte 5)" + svelte-warning-accepted format.

### Secondary / Tertiary
- None — all findings grounded in first-party codebase + locked planning docs. No web research needed.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — no new packages; all primitives in-repo and verified.
- Architecture/patterns: HIGH — every shape browser-verified by spikes with runnable references; this research only maps them to current files.
- Pitfalls: HIGH — all 7 surfaced and reproduced by spikes (008/002/006) or production (Phase 64 guard, Phase 61 destructure).
- Consumer-impact / bridge obligations: HIGH for counts (grep-verified); the two judgment calls (O-1, O-2) are MEDIUM and flagged for the planner/discuss.

**Research date:** 2026-06-04
**Valid until:** ~2026-07-04 (stable; in-repo migration, no fast-moving external deps)

## RESEARCH COMPLETE
