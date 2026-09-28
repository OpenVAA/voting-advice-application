# Phase 102: Handle-Idiom Spike (HANDLE-01) - Research

**Researched:** 2026-06-09
**Domain:** Svelte 5 runes — context-handle idiom design + cross-module reactivity mechanics
**Confidence:** HIGH (everything verified against the actual `apps/frontend/src` tree; the chosen idioms are already in production use in this same codebase)

<user_constraints>
## User Constraints (from CONTEXT.md + v2.12-DECISIONS.md)

### Locked Decisions
- **🔒 Read-only target (locked by HANDLE-02):** a plain reactive getter — consumers read `ctx.x`, **not** `ctx.x.current`.
- **D-01 (102-1 + R1):** Read-write handles get a **get/set accessor pair**, applied **at the context-property level** (`get x()` / `set x(v)` on the context object) so consumers read `ctx.x` and write `ctx.x = v`. The accessor pair is the *mechanism*; the **goal is to eliminate the nested `.current`, not retain it**. Chosen over the explicit setter-method form (`x.set(v)`) for the smaller consumer-site delta.
- **D-02 (102-2 — DEVIATION):** **Max-native EVERYWHERE.** Drive `.current` to zero on **both** the read-only **and** the read-write classes — accept the larger write-site churn. Handles the spike finds genuinely *cannot* shed `.current` are **documented with rationale**, not forced.
- **D-03 (102-3):** PoC slice = **minimal-but-representative**: ≥1 **read-only** handle (e.g. `appContext.darkMode` / `locale`), ≥1 **read-write** handle (e.g. voter `answers`), **plus the special derived `getRoute` handle**. Must build green and preserve the destructure-trap contract.
- **D-04 (102-4):** Treat `getRoute` (`{ readonly current: RouteBuilder }` derived handle, spike 012) as read-only and **fold it into the plain-getter idiom** (callable directly) — **unless** the spike finds the `$derived.by` shape genuinely needs the handle wrapper, then document it as a retained-handle exception.
- **Output (gates Phase 103):** the decision record must enumerate **all 40 handles** with per-handle classification (read-only / read-write / retained-handle-exception) and the exact target shape — this **is** the Phase 103 codemod scope.
- **R1 north star:** zero `.current` everywhere (max-native on both classes).
- **K1 no back-compat:** native replacements take over the original file + symbol names in place; `apps/frontend/src/**` only; `packages/**` untouched.

### Claude's Discretion
- Exact representative handles chosen for the PoC (beyond the 1-RO + 1-RW + getRoute floor).
- Decision-record file name/location under this phase dir.

### Deferred Ideas (OUT OF SCOPE)
- Forcing `.current` removal where the spike deems it infeasible — a documented spike *outcome*, not a failure.
- Any `packages/**` change; behavioral/UX change; the `videoPreferences`/Store→State/SWEEP work (Phases 104–105).
- The `jobStore` / `cookieStore` rename exclusions (Phase 104 concern, not this spike).
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| HANDLE-01 | Classify the 40 `{ readonly current }` handles read-only vs read-write, choose one canonical runes-native idiom per class, prove on a representative slice. Output: decision record + working PoC. (Spike — gates HANDLE-02/03.) | This research: (1) the complete handle inventory + classification (§Handle Inventory); (2) the Svelte 5 mechanics that decide each idiom + the cross-module reactivity rule that forces the wrapper to exist at all (§Svelte 5 Mechanics); (3) the read-write idiom is **already proven in this codebase** at `candidateContext.svelte.ts:391-396` / `adminContext.svelte.ts:112-117` (§Don't Hand-Roll, §Code Examples); (4) the PoC slice design (§PoC Design); (5) the codemod-scope enumeration the decision record must produce (§Codemod-Scope Implications). |
</phase_requirements>

## Summary

This phase is a **spike with two deliverables: a decision record + a working PoC**. The user's idiom choices are already locked (read-only → plain getter `ctx.x`; read-write → `get x()/set x(v)` accessor pair at context-property level; zero `.current` everywhere). The research question is **technical feasibility and the cleanest mechanics**, plus surfacing any handle that genuinely cannot shed `.current` with a concrete Svelte-5 reason.

The single most important finding: **both target idioms are already shipping in this exact codebase.** The read-write `get x()/set x(v)` accessor pair the user picked (D-01) is in production at `apps/frontend/src/lib/contexts/candidate/candidateContext.svelte.ts:391-396` (`get isPreregistered()` returning `_isPreregistered.current`, paired with `set isPreregistered(v)` calling `_isPreregistered.set(v)`) and at `adminContext.svelte.ts:112-117` / `layoutContext.svelte.ts:79-125`. The read-only plain getter is the dominant pattern across all rune-native contexts. **Nothing in this spike is novel invention — it is generalizing two already-proven in-tree idioms across the remaining `.current`-shaped handles.** That makes feasibility HIGH-confidence and the residual risk almost entirely mechanical (codemod correctness, atomic landing), not architectural.

The empirical inventory differs from the brief's round numbers and the planner must use the real figures. The brief says "40 `{ readonly current }` declarations, ~524 `.current` read sites." The actual tree (verified 2026-06-09) has **~26 distinct context-handle type declarations / producers** in `lib/contexts/**` and **~423 context-handle `.current` read sites** once Svelte built-ins and unrelated `.current` properties are excluded (`Tween.current` from `svelte/motion`, `password.current`, `event.current`, `this.current`, etc.). The brief's "40 / ~524" is the raw grep including non-handle noise. The spike must enumerate the *real* handles — the decision record is the Phase 103 scope, so a wrong count there poisons the codemod.

**Primary recommendation:** Classify by the **existing type-declaration shape**, not by re-deriving read-only/read-write from scratch. The codebase already encodes the answer: handles typed `{ readonly current }` (pure) are **read-only**; handles typed `{ readonly current; set; update }` (the `PersistedState`/inline shape) are **read-write**; custom store shapes (`PopupStore`, `CandidateUserDataStore`) are **retained-handle exceptions** (their write surface is domain methods, not a generic `set`). Apply the two already-proven idioms; document the ~3 custom-shape handles as retained exceptions with the per-handle reason the user asked for. Land the PoC with the Phase-97 **additive-getter atomic-commit** technique so the build is green at every boundary.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Context handle reactivity (read) | Frontend client (Svelte runes) | — | `$state`/`$derived` live in the browser runtime; getters re-invoke in the consumer tracking scope |
| Context handle SSR-correct init | Frontend SSR server | Frontend client | appSettings/appCustomization DB-override merge must happen at `$state` init (runs on server) not in `$effect` (client-only) — Spike 008 invariant; unchanged by this phase but must not be regressed |
| Handle write surface | Frontend client | — | Writes mutate factory-scoped `$state` via setter/method; never crosses a tier boundary |
| Codemod (Phase 103) | Build-time tooling (Node script) | — | Pure-Node text rewrite over `.svelte`/`.ts`; archived under `.planning/` after it lands |

All work is `apps/frontend/src/**` client/SSR-tier Svelte code. No API/DB/CDN tier is touched (K1).

## Handle Inventory + Classification

> This is the empirical core. The decision record reproduces and finalizes this table; it **is** the Phase 103 codemod scope. All `file:line` verified against the tree on 2026-06-09.

### Classification rule (read the existing type shape — don't re-derive)

The codebase already encodes read-only vs read-write in the handle's **type declaration**:

| Type shape | Class | Target idiom |
|------------|-------|--------------|
| `{ readonly current: T }` (pure) | **read-only** | plain getter `get x()` → consumer reads `ctx.x` |
| `{ readonly current: T; set(v); update(fn) }` | **read-write** | accessor pair `get x()/set x(v)` (+ keep `update` as a method *or* drop if unused) → consumer reads `ctx.x`, writes `ctx.x = v` |
| custom store shape (`current` + domain methods like `push`/`shift`/`setAnswer`) | **retained-handle exception** | keep the handle/store object; document why |

This rule is mechanically checkable from the `.type.ts` files and removes ambiguity — the spike's classification is an audit of the type declarations, not a fresh read/write trace of 423 call sites.

### A. Read-only handles (pure `{ readonly current }`) → plain getter

| # | Handle | Declaration site | Value type | ~reads | Notes |
|---|--------|------------------|-----------|--------|-------|
| 1 | `locale` | `app/appContext.type.ts:25` | `string` | 7 | PoC read-only candidate |
| 2 | `locales` | `app/appContext.type.ts:29` | `ReadonlyArray<string>` | 2 | |
| 3 | `darkMode` | `app/appContext.type.ts:33`; producer `component/darkMode.svelte.ts:9` | `boolean` | 7 | **PoC read-only candidate**; producer is a clean 1-getter factory |
| 4 | `reactiveAppSettings` | `app/appContext.type.ts:65` | `AppSettings` | 10 | read-only mirror over the same `$state` as `appSettings` |
| 5 | `reactiveLocale` | `app/appContext.type.ts:70` | `string` | 2 | read-only mirror |
| 6 | `getRoute` | `app/appContext.type.ts:74`; producer `app/getRoute.svelte.ts:40` | `RouteBuilder` | **151** | DERIVED (`$derived.by`); see D-04 analysis below — **foldable into plain getter** |
| 7 | `surveyLink` | `app/appContext.type.ts:78`; producer `app/survey.svelte.ts:5,21` | `string \| undefined` | 2 | `ReactiveHandle<T>` alias |
| 8 | `sessionId` | `app/tracking/trackingService.type.ts:45` | `string` | 3 | |
| 9 | `shouldTrack` | `app/tracking/trackingService.type.ts:49` | `boolean` | 4 | |
| 10 | `dataRoot` | `data/dataContext.type.ts:10` | `DataRoot` | 36 | mutation-in-place singleton; read-only handle (writes go via `reactiveDataRoot.instance`) |
| 11 | `reactiveDataRoot.current` | `data/dataContext.type.ts:16` | `DataRoot` | 21 | **split handle** — `.current` is read-only-reactive; `.instance` is the non-reactive write path (see exception E3) |
| 12 | `routeTitle` | `layout/layoutContext.type.ts:91` | `string` | 2 | |
| 13 | `popupQueue.current` | `app/popup/popupStore.type.ts:12` | `PopupQueueItem \| undefined` | 4 | read of the queue head; the *write* surface (`push`/`shift`) makes the whole object a retained exception — see E1 |

### B. Read-write handles (`{ readonly current; set; update }`) → accessor pair

| # | Handle | Declaration site | Value type | ~reads | ~writes (`.set`/`.update`) | Notes |
|---|--------|------------------|-----------|--------|-----------|-------|
| 14 | `appSettings` | `app/appContext.type.ts:55-59` | `AppSettings` | **113** | merged internally + a few set sites | "writable but should not be written under normal circumstances"; SSR-init invariant (Spike 008) must survive |
| 15 | `appCustomization` | `app/appContext.type.ts:46-50` | `AppCustomization` | 13 | internal | same SSR-init invariant |
| 16 | `appType` | `app/appContext.type.ts:37-41` | `AppType` | 9 | 3 (`appType.set('voter'\|'candidate'\|'admin')` in the 3 root `+layout.svelte`) | clean read-write; small write surface |
| 17 | `userPreferences` | `app/appContext.type.ts:83-87`; backed by `localStorageState` | `UserPreferences` | 11 | several `.update(...)` in appContext | backed by `PersistedState` (`utils/persistedState.svelte.ts:20-27`) |
| 18 | `sendTrackingEvent` | `app/tracking/trackingService.type.ts:38-41` | `TrackingHandler \| null \| undefined` | 1 | set externally | `{ current; set }` (no `update`) |
| 19 | `openFeedbackModal` | `app/appContext.type.ts:96-99` | `(() => void) \| undefined` | 6 | set internally | `{ current; set }` (no `update`); flagged `TODO: Refactor when Cand App is refactored` |

### C. Retained-handle exceptions (custom store shape) — document, do not force

| # | Handle | Declaration site | Shape | Reason to retain (the user-requested explanation) |
|---|--------|------------------|-------|---------------------------------------------------|
| E1 | `popupQueue` (`PopupStore`) | `app/popup/popupStore.type.ts:7-22` | `{ readonly current; push(item); shift() }` | The write surface is **domain queue methods** (`push`/`shift`), not a value set. A `get popupQueue()/set popupQueue(v)` pair makes no semantic sense (you don't *replace* the queue head). `.current` here is "the head of the queue," a derived read; the object must stay a handle. Consumers reading `popupQueue.current` *could* be folded to a `get popupQueueHead()` getter, but that is a rename, not a `.current` removal, and risks confusing the queue API. **Recommend: retain `popupQueue` as a store object; its `.current` read is an accepted residual** (or, if the spike wants zero `.current`, add a read-only `get head()` alias — a discretion call for the PoC). |
| E2 | `candidateUserData` (`CandidateUserDataStore`) | `candidate/candidateUserDataStore.type.ts:11-108` | `{ readonly current; init; reset; setAnswer; save; … + reactive `unsavedQuestionIds`/`hasUnsaved`/… }` | `.current` is a **composite derived value** (saved data ∪ unsaved edits) with a large domain-method write surface (`setAnswer`, `setImage`, `save`, `reloadCandidateData`). There is no single `set(v)` — writes are semantic operations. This is a full domain store, not a value handle. **Recommend: retained exception.** Its consumer reads (`userData.current`, 19 sites) stay as `.current` *or* are exposed through `candidateContext` getters (which several already are). |
| E3 | `reactiveDataRoot.instance` | `data/dataContext.type.ts:16` | `{ readonly current; readonly instance }` | `.instance` is the **deliberately non-reactive** write path (Spike 002 Pattern 2). It exists precisely so producer `$effect`s can mutate DataRoot inside `untrack()` without forming the read-write infinite loop (`effect_update_depth_exceeded`). Collapsing it into the reactive `current` getter **reintroduces the bug the split was created to fix.** `.current` (the reactive read) *can* be folded to a plain getter; `.instance` **must** keep its distinct non-reactive identity. This is the canonical example of "a getter/setter pair cannot reconstruct the reactive edge." **Recommend: `dataRoot` reads fold to plain getter; `reactiveDataRoot` keeps the `current`/`instance` split as a documented retained exception.** |

### D. Generic handle helpers / type aliases (not consumer-facing — touched by the conform step)

| Handle source | Site | Disposition |
|---------------|------|-------------|
| `PersistedState<T>` (`{ current; set; update }`) | `utils/persistedState.svelte.ts:20-27` | The backing helper for read-write handles. **Keep the helper** (it is the right `$state`-backed primitive); the *exposure* of its `.current` at the context-property level is what changes — lift to `get/set` on the context object. |
| `ReactiveHandle<T>` alias | `app/survey.svelte.ts:5`, `app/tracking/trackingService.svelte.ts:14` | Local `{ readonly current: T }` alias. Read-only; folds to plain getter on the consuming context. |
| `SettingsOverlay` `.current` | `utils/SettingsOverlay.svelte.ts:36` | `TMerged` read; classify per its consumer usage during the conform step (likely read-only). |
| `layoutContext` `.current` (Progress) | `layout/layoutContext.type.ts:78` | **NOT a handle** — `Tween<number>.current` from `svelte/motion`. **MUST be excluded from the codemod** (false-positive trap). Same for `password.current`, `event.current`, `this.current`, `row.current`, `updated.current`. |

### Count reconciliation (flag for the planner)

| Source | Declarations | `.current` read sites |
|--------|-------------|----------------------|
| Brief / CONTEXT.md | "40" | "~524" |
| **Verified tree (2026-06-09)** | **~26 distinct handle decls/producers** in `lib/contexts/**` (counting each typed handle property; the raw `grep -c "readonly current"` returns 36, inflated by JSDoc comment lines) | **~423 context-handle reads** (577 raw `.current` minus Svelte-built-in/non-handle noise: `Tween` ×4, `this` ×28, `password`/`event`/`row`/`updated`/`b`/`first`/`second`/etc.) |

**The "40 / ~524" figures are raw greps that include comments and non-handle `.current` properties.** The spike MUST produce the de-noised inventory above as the authoritative scope. `getRoute.current` (151) + `appSettings.current` (113) alone are 62% of all real reads — getting those two right is most of the codemod.

## Svelte 5 Mechanics That Decide the Idiom

> This section answers the user's explicit ask: *surface the actual Svelte 5 constraints that force a handle to keep `.current`, and cite the mechanics.* Verified against Svelte 5.53.12 (installed) + the in-tree spike findings.

### Why the `{ readonly current }` handle exists at all

`$state` / `$derived` are **compiler-rewritten signals, not values.** Two hard constraints make a wrapper necessary across a context/module boundary:

1. **You cannot export a reassignable `$state`/`$derived` binding directly and keep it reactive across the boundary.** `export let x = $state(0)` exported and imported elsewhere gives the importer the *value at import time*, not a live signal — reassignments in the producer are invisible to the consumer. [CITED: svelte.dev/docs/svelte/$state — "you cannot export a stateful variable from a `.svelte.js` module if it is reassigned"]. The fix is to **wrap the read in a function/getter** that re-executes inside the consumer's tracking scope: `get current() { return value; }`. The getter re-invokes on every read, re-establishing the dependency edge each time.

2. **The destructure trap (CLAUDE.md "Context Destructuring Rule").** Destructuring a getter (`const { current } = ctx`) invokes it **once** at destructure time and binds the captured value — subsequent reads of the local are not getter calls, so they don't propagate invalidation. Reading `ctx.current` (or, post-migration, `ctx.x`) re-invokes the getter in the tracking scope each time, preserving the edge. **This is why the handle is NOT vestigial** (REQUIREMENTS.md is explicit). [VERIFIED: codebase — CLAUDE.md "Context Destructuring Rule"; reproduced in spike 007].

**Critical consequence for D-01/D-02:** Removing `.current` does **not** mean removing the getter. It means **moving the getter up one level** — from `ctx.x.current` (getter on the inner handle) to `ctx.x` (getter on the context object property). The reactive edge is preserved *because the property is still a getter*. The handle's job (wrap the signal in a getter) is unchanged; only the nesting depth changes. **This is the entire mechanical basis of the milestone, and it is sound.**

### Read-only class → plain getter (HIGH confidence — already universal in-tree)

Confirmed: a getter on the context object preserves reactivity through the consumer tracking scope because it re-invokes per read. Every rune-native context in the tree already does this (`darkMode.svelte.ts:23-25`, `getRoute.svelte.ts:45-49`, `appContext.svelte.ts` getters). For read-only handles, the transform is: drop the inner `{ readonly current }` wrapper, expose the value directly as a `get x()` on the parent context object. Consumer `ctx.x.current` → `ctx.x`. **Zero reactivity risk** — same getter mechanism, one less hop.

### Read-write class → `get x()/set x(v)` accessor pair (HIGH confidence — ALREADY IN PRODUCTION HERE)

The user's D-01 idiom is **not hypothetical** — it ships today in this codebase:

```ts
// apps/frontend/src/lib/contexts/candidate/candidateContext.svelte.ts:391-396 [VERIFIED: codebase]
get isPreregistered() {
  return _isPreregistered.current;   // _isPreregistered is a PersistedState handle
},
set isPreregistered(v) {
  _isPreregistered.set(v);           // setter delegates to the handle's set()
},
```

```ts
// apps/frontend/src/lib/contexts/admin/adminContext.svelte.ts:112-117 [VERIFIED: codebase]
get userData() { return _userData; },     // _userData is factory-scoped $state
set userData(v) { _userData = v; },        // setter reassigns the $state directly
```

Also at `candidateContext.svelte.ts:401` (`set newUserEmail`), `:431`/`:437` (preregistration ids), `layoutContext.svelte.ts:79,107,113,119,125`. **Svelte 5.53.12 compiles and tracks these correctly** (they are in the shipped, green, E2E-passing v2.11 build).

Two valid backing forms, both proven:
- **Backed by a `PersistedState`/handle** (the `appSettings`/`userPreferences`/`appType` case): `get x() { return _handle.current; } set x(v) { _handle.set(v); }`. The inner handle keeps persistence/versioning; the accessor pair is the public surface. This is exactly `candidateContext.svelte.ts:391-396`.
- **Backed by raw factory `$state`** (the `appType`/`userData` case): `get x() { return _x; } set x(v) { _x = v; }`. This is `adminContext.svelte.ts:112-117`.

For the read-write handles (#14–19), the transform lifts the existing `{ get current(){...}; set(v){...}; update(fn){...} }` *handle object* into a property-level `get x()/set x(v)` accessor pair on the parent context. The `.update(fn)` capability, where used, becomes either an `update` method retained alongside the accessor pair or is rewritten as `ctx.x = fn(ctx.x)` at the (few) call sites. **The accessor pair preserves the destructure-trap contract identically** — reading `ctx.x` re-invokes the getter; writing `ctx.x = v` re-invokes the setter. (Destructuring `const { x } = ctx` still captures a snapshot and is still wrong — the rule is unchanged.)

### What genuinely CANNOT shed `.current` — the concrete reasons (user-requested)

1. **`reactiveDataRoot.instance` (E3)** — the non-reactive write path. A getter/setter pair on a single property **cannot** reconstruct two distinct reactivity semantics (reactive read via `current` + non-reactive write-access via `instance`) on one identifier. The split exists to break the write-after-read infinite loop (`effect_update_depth_exceeded`, Spike 002). Folding it reintroduces the bug. The reactive `current` *can* fold to a plain getter; `instance` must remain a distinct non-reactive handle accessor. **Reason: cross-effect reactivity isolation; one accessor pair cannot encode two reactivity modes.**

2. **`popupQueue` / `PopupStore` (E1)** — `.current` is a *derived view of a queue* (the head), with a domain write surface (`push`/`shift`). There is no meaningful `set(v)` (you don't assign the head). A getter is fine; an accessor *pair* is semantically wrong. **Reason: the write surface is domain operations, not value assignment — `set x(v)` has no coherent meaning.**

3. **`candidateUserData` / `CandidateUserDataStore` (E2)** — `.current` is a composite `$derived` (saved ∪ unsaved) with ~12 domain methods and async DB operations. No single `set(v)`. **Reason: composite-derived read + multi-method semantic write surface; not a value handle.**

4. **`getRoute` — analysis for D-04 (foldable, NOT a forced exception):** `getRoute` is `{ readonly current: $derived.by(...) }`. The `$derived.by` lives inside `createGetRoute()` (a component-init-context function — see the producer header at `getRoute.svelte.ts:11-17`). The `.current` getter just returns the derived value. **Folding to a plain getter is feasible:** the parent `appContext` already calls `createGetRoute()` at init; exposing `get getRoute() { return _builder.current; }` (where `_builder = createGetRoute()`) makes consumers call `ctx.getRoute(opts)` directly. The `$derived.by` wrapper does NOT need to surface as `.current` to consumers — it only needs to be read inside a getter that re-invokes per access (which a plain context-property getter does). **Verdict: fold getRoute into the plain-getter idiom (honors D-04 default).** The one caveat to verify in the PoC: `createGetRoute()` must keep being called from component-init context (it is, in `initAppContext`) — the producer's `$derived.by` requirement is about *where it's created*, not *how it's exposed*. [CONFIDENCE: HIGH — the exposure layer is independent of the `$derived.by` init-context requirement; the PoC confirms this empirically.]

## Standard Stack

No new packages. This is a pure-refactor spike inside the existing stack.

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| svelte | 5.53.12 [VERIFIED: node_modules/svelte/package.json] | Runes (`$state`, `$derived`, `$derived.by`), getters/setters | Already the project's framework; the target idioms compile + track on this version (shipped in green v2.11 build) |
| Node (built-in `fs`/`path`) | repo Node | Phase 103 codemod (out of scope for 102, but the PoC may stub it) | Phase 97 precedent: pure-Node dependency-free codemod, dry-run by default |

**No installation.** No external dependency. No Package Legitimacy Audit needed (zero packages installed).

## Architecture Patterns

### Idiom transformation map (the decision-record core)

```
READ-ONLY handle:
  type:     { readonly current: T }                 →  (folds away; value typed directly on parent)
  producer: get current() { return value; }         →  parent: get x() { return value; }
  consumer: ctx.x.current                            →  ctx.x

READ-WRITE handle:
  type:     { readonly current: T; set; update }     →  parent property typed T (get/set)
  producer: { get current(){…}, set(v){…}, update }  →  parent: get x(){return _h.current}
                                                                 set x(v){_h.set(v)}
                                                         (keep _h = PersistedState/$state internally)
  consumer (read):  ctx.x.current                     →  ctx.x
  consumer (write): ctx.x.set(v)                       →  ctx.x = v
  consumer (update): ctx.x.update(fn)                  →  ctx.x = fn(ctx.x)  (or retain .update method)

RETAINED EXCEPTION (popupQueue / candidateUserData / reactiveDataRoot.instance):
  unchanged — documented with the per-handle reason above.
```

### Atomic-landing pattern (Phase 97 precedent — load-bearing for Phase 103, validated in the PoC)

Phase 97 migrated ~278 sites off store bridges in **one commit with no red boundary** using the **additive-getter** technique: keep the old shape additively while adding the new one, rewrite the producer + run the codemod in a single commit, so the build is green before and after, transiently red only mid-task. [VERIFIED: `.planning/milestones/v2.11-phases/97-domain-a-wave-3-getroute-consumer-codemod/97-02-SUMMARY.md`]. The PoC should demonstrate the same shape on its slice: add the plain getter / accessor pair *additively* alongside the `.current` handle, migrate the slice's consumers, confirm green, then (in 103) remove the residual `.current`.

### Recommended PoC structure

```
.planning/phases/102-handle-idiom-spike/
├── 102-DECISION-RECORD.md       # all ~26 handles classified + target shape (= Phase 103 scope)
└── (PoC lands in real source, additively, behind the atomic technique)

apps/frontend/src/lib/contexts/
├── component/darkMode.svelte.ts        # PoC read-only #1 (cleanest factory)
├── app/appContext.svelte.ts            # PoC read-only (locale) + read-write (appType) + getRoute fold
└── app/appContext.type.ts              # type changes for the PoC slice
```

### Anti-Patterns to Avoid

- **Re-deriving read-only/read-write by tracing 423 call sites.** Read the type declaration instead (`{ readonly current }` = RO; `{ … set; update }` = RW). The codebase already encodes the answer.
- **Including `Tween.current` / `password.current` / `this.current` in the codemod scope.** These are NOT handles. The decision record's scope list must be an *allowlist of named handles*, not a blanket `.current` regex.
- **Collapsing `reactiveDataRoot.instance` into a getter/setter.** Reintroduces `effect_update_depth_exceeded` (E3).
- **Destructuring the new `ctx.x` accessors.** The destructure trap is unchanged — `const { appType } = ctx` is still wrong; read `ctx.appType` / `$derived(ctx.appType)`.
- **Doing the read-write merge in `$effect` for appSettings/appCustomization.** Spike 008 SSR invariant: the DB-override merge stays at `$state` init. The accessor-pair migration must not move it.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Read-write accessor surface | A novel "writable rune handle" abstraction | The in-tree `get x()/set x(v)` pattern at `candidateContext.svelte.ts:391-396` / `adminContext.svelte.ts:112-117` | Already proven, green, E2E-passing on Svelte 5.53.12 |
| Persisted read-write value | A new persistence layer | Existing `PersistedState` (`utils/persistedState.svelte.ts`) backing the accessor pair | Versioned `{version,data}` payload, SSR-gated, already the standard |
| Derived route builder | Reworking the `$derived.by` shape | Existing `createGetRoute()` (`getRoute.svelte.ts:40`) — just change the *exposure*, not the producer | The `$derived.by` per-field-read shape solves the `toStore` short-circuit trap (Spike 012); don't touch it |
| Consumer migration (Phase 103) | Manual editing 423 sites | The Phase 97 pure-Node idempotent dry-run codemod pattern (archived at `.planning/archive/spike-009-store-codemod.mjs`) | Proven on ~278 sites in ~25 min, idempotent, with a destructure-trap audit pass |

**Key insight:** This spike invents nothing. Both idioms and the atomic-landing + codemod machinery already exist in this repo. The spike's job is **classification + a feasibility PoC + a finalized scope list**, not design.

## Runtime State Inventory

> This is a code-refactor phase (no rename, no data migration, no external service config). Categories below verified explicitly.

| Category | Items Found | Action Required |
|----------|-------------|------------------|
| Stored data | **None affecting the spike.** `localStorage`/`sessionStorage` keys backing `PersistedState` handles (`VoterContext-answerStore`, `appContext-userPreferences`, etc.) are unchanged — the migration changes the *exposure idiom*, not the storage key or payload shape. | None — verified: the accessor pair delegates to the same `PersistedState`, same keys. |
| Live service config | **None.** No external service (Supabase, n8n, Datadog) embeds `.current` or handle names. | None — verified by scope (frontend-only, K1). |
| OS-registered state | **None.** No OS-level registration references these handles. | None. |
| Secrets/env vars | **None.** No env var or secret key references `.current` handle names. | None. |
| Build artifacts | **None for the spike.** Phase 103's archived codemod is a `.planning/` artifact; no `egg-info`/compiled-binary staleness. | None for 102; Phase 103 archives its codemod script under `.planning/`. |

## Common Pitfalls

### Pitfall 1: Codemod scope built from a blanket `.current` regex
**What goes wrong:** `Tween.current` (svelte/motion), `password.current`, `event.current`, `this.current` get rewritten → broken build / wrong behavior.
**Why it happens:** The brief's "~524" count is a raw grep that includes these. 577 raw `.current` vs ~423 real handle reads.
**How to avoid:** Decision record uses an **allowlist of named handles** (the inventory table), not a regex over `.current`. The Phase 97 codemod was per-store-name for exactly this reason.
**Warning signs:** Any `.current` rewrite touching `layout/`'s `Progress`/`Tween`, form `password`, or `this.current`.

### Pitfall 2: Folding `reactiveDataRoot.instance` away
**What goes wrong:** `effect_update_depth_exceeded` at runtime; producer `$effect`s loop.
**Why it happens:** Treating the `current`/`instance` split as redundant.
**How to avoid:** Document E3 as a retained exception; only fold the reactive `current`, never `instance`.
**Warning signs:** Any change touching `dataContext.svelte.ts` producer effects or removing `untrack()`.

### Pitfall 3: Moving the appSettings DB-merge into the accessor migration
**What goes wrong:** SSR HTML misses the DB override → first-paint flash (Spike 008 gap).
**Why it happens:** Refactoring the read-write handle tempts touching the merge logic.
**How to avoid:** The merge stays at `$state` init synchronously from `page.data.appSettingsData`. The accessor-pair change is *only* the exposure surface.
**Warning signs:** Any `$effect`-based initial merge appearing in `appContext.svelte.ts`.

### Pitfall 4: Destructure trap re-introduced by the new flatter surface
**What goes wrong:** `ctx.appType` looks like a plain property → someone destructures it → stale value.
**Why it happens:** The flatter `ctx.x` surface is *more* tempting to destructure than `ctx.x.current` was.
**How to avoid:** Keep the destructure-trap audit pass (Phase 97 codemod Pass 2) in Phase 103; the PoC verifies the canonical `$derived(ctx.x)` read pattern holds.
**Warning signs:** `const { appType, appSettings, ... } = getAppContext()` for a reactive accessor.

## Code Examples

### Read-only fold (darkMode — PoC #1)
```ts
// CURRENT producer — component/darkMode.svelte.ts:22-26 [VERIFIED: codebase]
return { get current() { return dark; } };
// Consumer today: darkMode.current

// PoC TARGET — expose on the parent appContext directly:
// appContext.svelte.ts:
const _darkMode = createDarkMode();           // keep the factory (owns the matchMedia listener)
// ...in the returned context object:
get darkMode() { return _darkMode.current; }  // plain getter — consumer reads ctx.darkMode
```

### Read-write accessor pair (appType — PoC read-write, smallest write surface)
```ts
// CURRENT — appContext.svelte.ts:63-73 [VERIFIED: codebase]
let appTypeValue = $state<AppType>(undefined);
const appType = {
  get current() { return appTypeValue; },
  set(v) { appTypeValue = v; },
  update(fn) { appTypeValue = fn(appTypeValue); }
};
// Consumer today: appType.current (read), appType.set('voter') (write, 3 sites)

// PoC TARGET — accessor pair on the context object (proven shape: adminContext.svelte.ts:112-117):
get appType() { return appTypeValue; },
set appType(v) { appTypeValue = v; }
// Consumer: ctx.appType (read), ctx.appType = 'voter' (write)
```

### Read-write backed by PersistedState (the appSettings/userPreferences shape)
```ts
// Proven in production — candidateContext.svelte.ts:391-396 [VERIFIED: codebase]
get isPreregistered() { return _isPreregistered.current; },  // _isPreregistered: PersistedState
set isPreregistered(v) { _isPreregistered.set(v); }
// For userPreferences with .update consumers, either keep an `update` method
// alongside, or rewrite the few call sites to: ctx.userPreferences = fn(ctx.userPreferences)
```

### getRoute fold (D-04)
```ts
// Producer unchanged — getRoute.svelte.ts:40-50 ($derived.by per-field; DO NOT touch)
const _getRoute = createGetRoute();           // returns { readonly current: RouteBuilder }
// PoC TARGET on appContext:
get getRoute() { return _getRoute.current; }  // consumer: ctx.getRoute(opts)  (was ctx.getRoute.current(opts))
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `svelte/store` bridges (`toStore`/`fromStore`/`writable`/`get`) | `{ readonly current }` rune handles | v2.4 + v2.11 (Phases 60-64, 95-98) | The `.current` handle IS the current state of the art in this repo |
| `$store.X` template auto-subscribe | `handle.current.X` | v2.11 Phase 97 codemod | The consumer reads this spike now flattens |
| `ctx.x.current` nested read | `ctx.x` plain getter / `ctx.x = v` accessor pair | **v2.12 Phase 102/103 (this milestone)** | The terminal flattening — zero `.current` |

**Deprecated/outdated:**
- Treating `.current` as vestigial — it is NOT (destructure-trap survival; REQUIREMENTS.md explicit). The handle/getter stays; only the nesting flattens.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | The exact handle *count* is ~26 distinct decls / ~423 real reads (vs brief's 40 / ~524). | Handle Inventory | LOW — figures are de-noised greps; the spike re-runs the inventory authoritatively. If the spike finds more handles, the decision record (not this research) is the binding scope. |
| A2 | `getRoute` exposure can fold to a plain getter without disturbing the `$derived.by` init-context requirement. | Svelte 5 Mechanics §4 | LOW — the PoC empirically confirms (D-04 explicitly allows a retained-exception fallback if not). Verified that exposure ≠ creation-context. |
| A3 | `popupQueue.current` head-read is best left as a retained `.current` (or aliased to `get head()`). | Exception E1 | LOW — a discretion call; either path is defensible and documented. |
| A4 | `userPreferences.update(fn)` call sites can be rewritten to `ctx.userPreferences = fn(...)` or retain an `update` method. | Read-write idiom | MEDIUM — the spike should count the `.update` call sites for these handles to confirm the consumer-delta is acceptable; not yet enumerated per-handle. |

## Open Questions

1. **Does any read-write handle have a `.update(fn)` consumer site that can't cleanly become `ctx.x = fn(ctx.x)`?**
   - What we know: `appType`, `userPreferences`, `appCustomization`, `appSettings` expose `update`; ~11 `.set`/`.update` write sites total across the app-context read-write handles.
   - What's unclear: the exact per-handle `.update` vs `.set` split at call sites (not yet enumerated — A4).
   - Recommendation: the spike enumerates `.update`/`.set` per read-write handle during classification; D-01's "smaller consumer-site delta" rationale assumes most writes are simple `.set`. If `.update` is common for a handle, retain an `update` method alongside the accessor pair (still removes `.current`).

2. **`popupQueue` — accept residual `.current` or add `get head()` alias?**
   - What we know: 4 read sites; write surface is `push`/`shift`.
   - Recommendation: PoC-discretion (D-03 lets the PoC choose handles); document whichever in the decision record.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| svelte | runes idioms | ✓ | 5.53.12 | — |
| yarn / turbo | `yarn build`, `yarn typecheck`, `yarn test:unit` | ✓ | repo-pinned | — |
| Supabase local | E2E touchpoint (only if PoC validation runs E2E) | assumed ✓ | per CLAUDE.md | typecheck + unit + build are the primary PoC gate; E2E optional for a spike |

**Missing dependencies with no fallback:** None.
**Missing dependencies with fallback:** E2E is the heaviest gate; for a spike PoC, typecheck + build + targeted unit + the destructure-trap audit are sufficient proof (full E2E is Phase 103's gate per 103-1 + K3).

## Validation Architecture

> nyquist_validation treated as enabled (no explicit `false` found). The spike's PoC must *prove* the idiom; this maps how.

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest (unit) + Playwright (E2E) |
| Config file | per-workspace `vitest` config; `yarn test:unit` at root |
| Quick run command | `yarn workspace @openvaa/frontend test:unit` |
| Full suite command | `yarn test:unit` (all) ; `yarn test:e2e` (requires `yarn dev`) |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| HANDLE-01 | PoC read-only handle (`darkMode`/`locale`) reads reactively via `ctx.x` (no `.current`) | typecheck + unit | `yarn workspace @openvaa/frontend check` (svelte-check) + targeted vitest | ✅ svelte-check; ❌ targeted PoC unit (Wave 0) |
| HANDLE-01 | PoC read-write handle (`appType`) reads `ctx.x` + writes `ctx.x = v` | typecheck + unit | svelte-check + a unit asserting set→get round-trip | ❌ Wave 0 |
| HANDLE-01 | `getRoute` folds to `ctx.getRoute(opts)`, rebuilds per nav (no stale closure) | unit/integration | reuse the spike-012 multi-nav assertion shape (answerStore.svelte.test.ts is the in-tree unit precedent) | ❌ Wave 0 (optional — producer unchanged) |
| HANDLE-01 | Destructure-trap contract preserved on the new flat surface | static audit | Phase 97 codemod Pass-2 audit run against the PoC files | ✅ (archived script `.planning/archive/spike-009-store-codemod.mjs`) |
| HANDLE-01 | Build green at every commit boundary (atomic-landing technique) | build | `yarn build` (frontend) | ✅ |

### Sampling Rate
- **Per task commit:** `yarn workspace @openvaa/frontend check` (svelte-check/typecheck) + `yarn build` (frontend).
- **Per wave merge:** `yarn test:unit` (frontend) + destructure-trap audit pass.
- **Phase gate:** PoC builds green + decision record complete + destructure-trap count == baseline (1 intentional demo). Full E2E is Phase 103's gate (K3 single-E2E mid-chain), not 102's — a spike PoC is proven by typecheck + build + targeted unit.

### Wave 0 Gaps
- [ ] A targeted unit test for the read-write accessor round-trip (`ctx.x = v` → `ctx.x === v`) — model on `answerStore.svelte.test.ts`.
- [ ] (Optional) reuse the spike-012 multi-nav assertion if the PoC touches `getRoute` exposure.
- [ ] Confirm the destructure-trap audit script runs against the PoC slice (script exists; needs pointing at PoC files).

*(Framework is fully present; gaps are PoC-specific assertions, not infrastructure.)*

## Security Domain

> `security_enforcement` not found as explicit `false`; included for completeness. This is a pure client-side refactor with no security surface.

### Applicable ASVS Categories
| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | Auth context (`authContext`) reactivity is touched only insofar as `isAuthenticated`/`isPreregistered` are reactive accessors — already handled correctly (AdminNav destructure bug fixed in Phase 97); this phase must not re-break it |
| V3 Session Management | no | `sessionId` handle is read-only; no change to session semantics |
| V4 Access Control | no | — |
| V5 Input Validation | no | No new inputs; pure exposure refactor |
| V6 Cryptography | no | — |

### Known Threat Patterns for this stack
| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Reactive-auth staleness (destructure trap on `isAuthenticated`) | Tampering/EoP (stale auth UI) | The destructure-trap contract — read via `ctx.X`; audit pass in Phase 103. The PoC must not destructure auth accessors. |

No new attack surface; pure refactor; the green gate is the contract (REQUIREMENTS Out-of-Scope: no behavioral change).

## Sources

### Primary (HIGH confidence)
- Codebase `apps/frontend/src/lib/contexts/**` — all `file:line` in this doc verified via grep/Read on 2026-06-09. Notably: `candidateContext.svelte.ts:391-396` (proven get/set accessor pair), `adminContext.svelte.ts:112-117`, `appContext.type.ts` (handle type shapes), `dataContext.type.ts` (the `current`/`instance` split), `getRoute.svelte.ts:40-50`, `persistedState.svelte.ts:20-27`, `darkMode.svelte.ts:9-27`.
- `node_modules/svelte/package.json` — svelte 5.53.12.
- CLAUDE.md "Context Destructuring Rule (Svelte 5)" — the hard invariant.
- `.planning/v2.12-DECISIONS.md`, `102-CONTEXT.md`, `REQUIREMENTS.md` — locked scope.
- `Skill("spike-findings-voting-advice-application-gsd")` — SKILL.md + references (reactive-contexts.md, persistent-rune-stores.md, consumer-migration-codemod.md, context-orchestration.md) + spike 012 source.
- `.planning/milestones/v2.11-phases/97-domain-a-wave-3-getroute-consumer-codemod/97-02-SUMMARY.md` — the atomic-landing + codemod precedent (~278 sites, no red boundary).

### Secondary (MEDIUM confidence)
- svelte.dev/docs/svelte/$state — "cannot export a reassigned stateful variable from a `.svelte.js` module" (the cross-module reactivity constraint that forces the getter wrapper). [CITED — corroborated by the in-tree getter-wrapper convention.]

### Tertiary (LOW confidence)
- None — every load-bearing claim is verified in-tree.

## Metadata

**Confidence breakdown:**
- Handle inventory + classification: HIGH — read directly from type declarations; counts de-noised against raw greps.
- Idiom feasibility (both classes): HIGH — both target idioms already ship in this codebase on the installed Svelte version.
- Retained-exception reasoning (E1/E2/E3): HIGH — E3 is the documented Spike-002 anti-loop split; E1/E2 are domain-store shapes by inspection.
- getRoute fold (D-04): HIGH — exposure layer is independent of the `$derived.by` init-context requirement; PoC confirms.
- Exact `.update` vs `.set` per-handle write split: MEDIUM — enumerate during the spike (Open Question 1 / A4).

**Research date:** 2026-06-09
**Valid until:** 2026-07-09 (stable — internal codebase + pinned Svelte version; only drifts if the contexts are edited before the spike runs)
