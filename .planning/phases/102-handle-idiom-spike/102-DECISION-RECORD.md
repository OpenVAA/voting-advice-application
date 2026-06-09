# Phase 102 Decision Record — Context-Handle Idiom Classification (HANDLE-01)

**Authored:** 2026-06-09
**Status:** Awaiting DX-5 human review (gates Phase 103)
**Scope authority:** This document IS the finalized Phase-103 codemod scope. Phase 103 rewrites ONLY the named handles enumerated in the inventory tables below — a **named-handle allowlist**, NOT a blanket `.current` regex.

> Verification basis: every `file:line` below was audited against the live tree on 2026-06-09 via `grep -rn "readonly current" apps/frontend/src/lib/contexts/` plus a direct read of each handle's `.type.ts` declaration. Classification is an **audit of the existing type-declaration shape**, not a re-derivation from call sites. The RESEARCH.md draft inventory (tables A/B/C/D) was confirmed against the tree; the deltas found during verification are noted inline.

## Classification rule (binding method)

Each handle is classified by its **type-declaration shape**, which already encodes read-only vs read-write:

| Type shape | Class | Phase-103 target shape |
|------------|-------|------------------------|
| `{ readonly current: T }` (pure) | **read-only** | plain getter — consumer reads `ctx.x` (was `ctx.x.current`) |
| `{ readonly current: T; set; (update?) }` | **read-write** | `get x()/set x(v)` accessor pair at the **context-property level** — consumer reads `ctx.x`, writes `ctx.x = v` (D-01) |
| custom store shape (`current` + domain methods: `push`/`shift`/`setAnswer`/`use`/…) | **retained-handle exception** | unchanged — handle/store object kept; documented per-handle reason |

North star (D-02 / R1): **zero `.current` everywhere** is the default posture — every handle gets a removal target UNLESS it is one of the documented retained exceptions below. The accessor pair (D-01) is the *mechanism* for read-write; the *goal* is to eliminate the nested `.current`, not retain it.

Mechanic that makes this sound (CLAUDE.md "Context Destructuring Rule"): removing `.current` does NOT remove the getter — it moves the getter up one level, from `ctx.x.current` (getter on the inner handle) to `ctx.x` (getter on the context-object property). The reactive edge survives because the property is still a getter that re-invokes per read in the consumer's tracking scope. Destructuring the new flat `ctx.x` accessor remains wrong (the trap is unchanged).

---

## A. Read-only handles (pure `{ readonly current }`) → plain getter

| # | Handle | Declaration site (file:line) | Value type | Class | Phase-103 target shape |
|---|--------|------------------------------|-----------|-------|------------------------|
| A1 | `locale` | `app/appContext.type.ts:25` | `string` | read-only | plain getter `get locale()` → `ctx.locale` |
| A2 | `locales` | `app/appContext.type.ts:29` | `ReadonlyArray<string>` | read-only | plain getter → `ctx.locales` |
| A3 | `darkMode` | `app/appContext.type.ts:33`; producer `component/darkMode.svelte.ts:9` | `boolean` | read-only | plain getter → `ctx.darkMode` *(PoC #1, Plan 02)* |
| A4 | `reactiveAppSettings` | `app/appContext.type.ts:65` | `AppSettings` | read-only | plain getter → `ctx.reactiveAppSettings` (read-only mirror over the same `$state` as `appSettings`) |
| A5 | `reactiveLocale` | `app/appContext.type.ts:70` | `string` | read-only | plain getter → `ctx.reactiveLocale` (read-only mirror) |
| A6 | `getRoute` | `app/appContext.type.ts:74`; producer `app/getRoute.svelte.ts:40` | `RouteBuilder` (DERIVED) | read-only | plain getter → `ctx.getRoute(opts)`. **D-04 verdict: fold to a plain getter (NOT a forced exception).** See §getRoute below. *(PoC, Plan 02)* |
| A7 | `surveyLink` | `app/appContext.type.ts:78`; producer `app/survey.svelte.ts:5,15` | `string \| undefined` | read-only | plain getter → `ctx.surveyLink` (`ReactiveHandle<T>` alias) |
| A8 | `sessionId` | `app/tracking/trackingService.type.ts:45` | `string` | read-only | plain getter → `ctx.sessionId` |
| A9 | `shouldTrack` | `app/tracking/trackingService.type.ts:49` | `boolean` | read-only | plain getter → `ctx.shouldTrack` |
| A10 | `dataRoot` | `data/dataContext.type.ts:10` | `DataRoot` | read-only | plain getter → `ctx.dataRoot` (mutation-in-place singleton; writes go via `reactiveDataRoot.instance`, see E3) |
| A11 | `reactiveDataRoot.current` | `data/dataContext.type.ts:16` | `DataRoot` | read-only (reactive read of a split handle) | the reactive `.current` read folds to a plain getter; the `.instance` write path is a **retained exception (E3)** — the handle object itself stays |
| A12 | `routeTitle` | `layout/layoutContext.type.ts:35`; type `RouteTitle` at `:86-92` | `string` | read-only | plain getter → `ctx.routeTitle` (written internally by `setRouteTitle(...)`, a declarative `$effect`-scoped registrar — not a value `set(v)`) |

**Generic read-only helpers / aliases (touched by the conform step, not consumer-facing handle names):**

| Source | Site | Disposition |
|--------|------|-------------|
| `ReactiveHandle<T>` alias (`{ readonly current: T }`) | `app/survey.svelte.ts:5`, `app/tracking/trackingService.svelte.ts:14` | Local read-only alias. Folds to a plain getter on the consuming context. Not a separate codemod target beyond the named handles it backs. |
| `PersistedState<T>` (`{ current; set; update }`) | `utils/persistedState.svelte.ts:20-27` | The backing primitive for read-write handles (A4-class for read, B-class for write). **Keep the helper** — only the *exposure* of its `.current` at the context-property level changes (lift to `get/set` on the context object). |

---

## B. Read-write handles (`{ readonly current; set; (update?) }`) → `get x()/set x(v)` accessor pair

| # | Handle | Declaration site (file:line) | Value type | Class | Phase-103 target shape |
|---|--------|------------------------------|-----------|-------|------------------------|
| B13 | `appSettings` | `app/appContext.type.ts:55-59` | `AppSettings` | read-write | accessor pair `get appSettings()/set appSettings(v)`. **SSR-init invariant (Spike 008) must survive** — the DB-override merge stays at `$state` init, NOT in an accessor/`$effect`. "Writable but should not be written under normal circumstances." |
| B14 | `appCustomization` | `app/appContext.type.ts:46-50` | `AppCustomization` | read-write | accessor pair `get appCustomization()/set appCustomization(v)`. Same SSR-init invariant as B13. |
| B15 | `appType` | `app/appContext.type.ts:37-41` | `AppType` | read-write | accessor pair `get appType()/set appType(v)` over factory `$state` (proven shape `adminContext.svelte.ts:112-117`). Clean, small write surface (3 sites: `appType.set(...)` in the 3 root `+layout.svelte`). *(PoC read-write, Plan 02)* |
| B16 | `userPreferences` | `app/appContext.type.ts:83-87`; backed by `PersistedState` | `UserPreferences` | read-write | accessor pair `get userPreferences()/set userPreferences(v)` delegating to the `PersistedState` handle (`get` → `_h.current`, `set` → `_h.set`). `.update(fn)` call sites become `ctx.userPreferences = fn(ctx.userPreferences)` OR retain an `update` method alongside the pair (still removes `.current`). See Open Item A4 below. |
| B17 | `sendTrackingEvent` | `app/tracking/trackingService.type.ts:38-41` | `TrackingHandler \| null \| undefined` | read-write | accessor pair `get sendTrackingEvent()/set sendTrackingEvent(v)`. Shape is `{ current; set }` (no `update`). |
| B18 | `openFeedbackModal` | `app/appContext.type.ts:96-99` | `(() => void) \| undefined` | read-write | accessor pair `get openFeedbackModal()/set openFeedbackModal(v)`. Shape is `{ current; set }` (no `update`). Flagged `TODO: Refactor when Cand App is refactored` — refactor is out of this milestone; the idiom fold still applies. |

**Read-write idiom is already in production (not novel):** `candidateContext.svelte.ts:391-396` (`get isPreregistered()` → `_isPreregistered.current` / `set isPreregistered(v)` → `_isPreregistered.set(v)`, PersistedState-backed) and `adminContext.svelte.ts:112-117` (`get userData()` → `_userData` / `set userData(v)` → `_userData = v`, raw `$state`-backed). Both backing forms are proven on the installed Svelte 5.53.12 in the shipped, green, E2E-passing v2.11 build. The accessor pair preserves the destructure-trap contract identically.

---

## C. Retained-handle exceptions (custom store shape) — documented, NOT forced

Each retained exception carries the per-handle Svelte-5-mechanic reason it cannot shed `.current`, per the user's explicit ask.

### E1 — `popupQueue` (`PopupStore`)
- **Declaration:** `app/appContext.type.ts:91` (property `popupQueue: PopupStore`); type `app/popup/popupStore.type.ts:7-22` — `{ readonly current: PopupQueueItem | undefined; push(item); shift() }`.
- **Reason (Svelte-5 mechanic):** The write surface is **domain queue methods** (`push`/`shift`), not a value assignment. There is no coherent `set(popupQueue, v)` — you do not *replace* the queue head; you enqueue/dequeue. A `get popupQueue()/set popupQueue(v)` accessor pair is therefore semantically meaningless: `set x(v)` has no defined behavior for a queue. `.current` here is a derived read (the head of the queue). **Disposition:** retain `popupQueue` as a store object; its `.current` head-read is an accepted residual. (Discretionary alternative, deferred to Phase 103 PoC budget: add a read-only `get head()` alias to reach literal zero `.current` — a rename, not a `.current` removal; either path is documented and defensible — see Open Item A3.)

### E2 — `candidateUserData` (`CandidateUserDataStore`)
- **Declaration:** type `candidate/candidateUserDataStore.type.ts:11-108` — `{ readonly current; init; reset; resetUnsaved; reloadCandidateData; save; setAnswer; resetAnswer; resetAnswers; setImage; resetImage; setTermsOfUseAccepted; resetTermsOfUseAccepted; + reactive unsavedQuestionIds/unsavedProperties/hasUnsaved/savedCandidateData }`.
- **Reason (Svelte-5 mechanic):** `.current` is a **composite `$derived`** value (saved data ∪ unsaved edits) fronting a large **multi-method semantic write surface** (`setAnswer`, `setImage`, `save`, `reloadCandidateData`, …) including async DB operations. There is no single `set(v)` that could round-trip the composite — writes are semantic domain operations, not value replacement. This is a full domain store, not a value handle. **Disposition:** retained exception. Its consumer reads (`userData.current`) stay as `.current` OR are surfaced through existing `candidateContext` getters (several already are).

### E3 — `reactiveDataRoot.instance`
- **Declaration:** `data/dataContext.type.ts:16` — `reactiveDataRoot: { readonly current: DataRoot; readonly instance: DataRoot }`.
- **Reason (Svelte-5 mechanic):** `.instance` is the **deliberately non-reactive** write/read path that exists specifically so producer `$effect`s can mutate `DataRoot` inside `untrack()` WITHOUT forming the read-after-write infinite loop (`effect_update_depth_exceeded`) — the Spike-002 anti-loop split (Pattern 2). A single `get/set` accessor pair on one identifier **cannot encode two distinct reactivity modes** (reactive read via `current` + non-reactive access via `instance`) on the same property; collapsing the split reintroduces the bug it was created to fix. **Disposition:** the reactive `.current` read folds to a plain getter (counted as A11); `.instance` MUST keep its distinct non-reactive identity, so the `reactiveDataRoot` **handle object is retained** as a documented exception. This is the canonical "a getter/setter pair cannot reconstruct the reactive edge" case.

### E4 — `topBarSettings` (`SettingsOverlayApi`) *(delta found during verification — not in RESEARCH table C; promoted from RESEARCH table D)*
- **Declaration:** `layout/layoutContext.type.ts:10` (property `topBarSettings: SettingsOverlayApi<TopBarSettings, DeepPartial<TopBarSettings>>`); type `utils/SettingsOverlay.svelte.ts:34-37` — `{ readonly current: TMerged; push; use; size }` where `current` is a `$derived` over a token-keyed overlay registry merged in mount order.
- **Reason (Svelte-5 mechanic):** Same class as E1 — `.current` is a **`$derived` composite** (the mount-order merge of the overlay registry); the write surface is the **declarative `$effect`-scoped registrars** (`useTopBar(...)` / `.use(...)` / `setRouteTitle(...)` / `push`), whose cleanup is `$effect`-scoped to avoid index drift. There is no value `set(v)` — you register/deregister overlays, you do not assign the merged result. **Disposition:** retained exception (the `SettingsOverlayApi` object stays); `.current` is an accepted residual read. The `routeTitle` *value* it feeds is folded separately as a plain getter (A12).

---

## Codemod scope = named-handle allowlist (NOT a `.current` regex)

Phase 103 rewrites **only** the named handles in tables A and B above (read-only → plain getter; read-write → accessor pair). The retained exceptions (E1 `popupQueue`, E2 `candidateUserData`, E3 `reactiveDataRoot.instance`, E4 `topBarSettings`) are NOT codemodded. The following `.current` properties are **false positives** that MUST be excluded from any codemod scope — they are not context handles:

| Excluded `.current` | Origin | Site |
|---------------------|--------|------|
| `Tween<number>.current` | `svelte/motion` (Progress bar) | `layout/layoutContext.type.ts:78` (`Progress.current: Tween<number>`) |
| `password.current` | form/input local ref | various form components |
| `event.current` | DOM/event local ref | various |
| `this.current` | class/`bind:this` ref | ~28 sites |
| `row.current` | iteration/table local | various |
| `updated.current` | `$app/state` `updated` store handle (SvelteKit built-in) | various |

A blanket `.current` regex would rewrite `Tween.current` and the form/DOM refs above → broken build / wrong behavior. The scope is therefore the **allowlist of named handles**, mirroring the Phase-97 per-store-name codemod approach.

## Count reconciliation

| Source | Declarations | `.current` read sites |
|--------|-------------|----------------------|
| Brief / CONTEXT.md | "40" | "~524" |
| **Verified tree (2026-06-09)** | **18 named codemod-target handles** (A1–A12 read-only incl. the `reactiveDataRoot.current` reactive read = 12 rows; B13–B18 read-write = 6 rows) **+ 4 retained exceptions (E1–E4)** = **22 named context handles total**. Raw `grep -c "readonly current"` over `lib/contexts/` returns **36**, inflated by JSDoc comment lines and the false-positive `Tween`/`RouteTitle`-comment hits. | **~423 context-handle reads** — the brief's **524** is the raw `grep -rE "\.current\b"` over all of `apps/frontend/src` (verified: 524 exactly), which includes the Svelte-built-in / non-handle `.current` noise above (`Tween` ×4, `this` ×~28, `password`/`event`/`row`/`updated`/etc.). After excluding that noise, ~423 are real context-handle reads. |

**Binding figure:** the **de-noised named-handle allowlist** in tables A + B (18 codemod targets, 4 retained exceptions). The brief's "40 / ~524" raw greps are NOT the scope — they include comments and non-handle `.current` properties. The two highest-leverage handles, `getRoute.current` (~151 reads) + `appSettings.current` (~113 reads), are ~62% of all real reads; getting those two right is most of the Phase-103 codemod.

## `getRoute` — D-04 analysis (foldable to a plain getter, NOT a forced exception)

`getRoute` is `{ readonly current: $derived.by(...) }` (producer `getRoute.svelte.ts:40-50`). The `$derived.by` per-field-read shape (reading `{ params, route, url } = page` as SEPARATE fields) solves the spike-012 `toStore` reference short-circuit and MUST NOT be touched. **The exposure layer is independent of the `$derived.by` init-context requirement:** `createGetRoute()` must keep being called from component-init context (it is, in `initAppContext`) — that requirement is about *where the derived is created*, not *how it is exposed*. Exposing `get getRoute() { return _builder.current; }` on the context object makes consumers call `ctx.getRoute(opts)` directly. **Verdict: fold `getRoute` into the plain-getter idiom (A6), honoring D-04's default.** Plan 02's PoC confirms this empirically (assumption A2).

## Open items carried to Phase 103 (documented, non-blocking)

- **A3 — `popupQueue` residual:** accept `.current` head-read OR add a `get head()` alias for literal-zero `.current`. Discretionary; either is documented. Default: accept residual.
- **A4 — `userPreferences.update(fn)` sites:** rewrite to `ctx.userPreferences = fn(ctx.userPreferences)` OR retain an `update` method alongside the accessor pair. Enumerate `.update` vs `.set` per read-write handle during the codemod; D-01's "smaller consumer-site delta" assumes most writes are simple `.set`.

---

## DX-5 human-review gate

This record is the **DX-5 spike gate**. The autonomous chain **pauses here** for human review before Phase 103's codemod scope is locked. A wrong count or a mis-classified handle here poisons the entire codemod (build break or reactivity regression). Approve only if the per-handle classification, target shapes, retained-exception reasons, allowlist exclusions, and count reconciliation above are exactly the scope you want codemodded in Phase 103.
