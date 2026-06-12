# Context-as-class — production proof (dataContext)

**Date:** 2026-06-12
**Status:** landed in working tree, fully verified (not yet a milestone phase)
**Builds on:** CONTEXT-MEMBER-AUDIT.md + Spikes 017, 020-023

## What this proves

The audit/spike line concluded "yes, contexts can become Svelte 5 classes." This is
the first **real production context** converted, end-to-end, as proof. `dataContext`
was chosen because it exercises the hardest group (C, version-bridge over `DataRoot`) —
the whole 002→017→022 spike line targeted it — and because converting it lets us delete
the producer-side `untrack` workaround, the concrete payoff.

## The change (3 files)

1. **`apps/frontend/src/lib/contexts/data/dataContext.svelte.ts`** — `initDataContext()`
   now returns a `class DataContextProvider`. The reactive core is a private
   `#version = $state(0)` FIELD, bumped (untracked) on every `DataRoot.update()`
   notification — the version-bridge, now class-shaped (Spike 022).
2. **`apps/frontend/src/lib/contexts/data/dataContext.type.ts`** — added `setDataRoot`
   to the `DataContext` type. Because `AppContext = … & DataContext & …`, this
   propagates to `AppContext` with no other type edits.
3. **`apps/frontend/src/routes/+layout.svelte`** — the DataRoot producer now calls
   `setDataRoot((dr) => dr.update(() => dr.provide*(...)))`. **The hand-written
   `untrack(...)` and the `reactiveDataRoot.instance` read are gone** (the `untrack`
   import was dropped). This is the Spike 017/022 read/write split, in production.

## Two spike findings that shaped the design

### A. You cannot spread a class INSTANCE to re-expose it
`appContext` re-exposes dataContext via `{ ...dataCtx }`. Spreading a class **instance**
copies only own-enumerable properties — **prototype getters/`$state`/`$derived`
accessors are silently dropped**. So the idiomatic "flatten to `get dataRoot(): DataRoot`
on the prototype" would have made `appContext.reactiveDataRoot` `undefined` at runtime
and broken every downstream consumer.

**Resolution for this proof:** expose the public handles (`dataRoot`, `reactiveDataRoot`)
and the `setDataRoot` writer as **own instance properties** (assigned in the constructor /
arrow field). Own properties spread correctly, so the consumer API
(`reactiveDataRoot.current`) stays **byte-identical** — zero consumer churn. The reactive
core is still a class `$state` field, which is the point of the idiom.

> The fully-idiomatic alternative (prototype getters + `{ ...dataCtx }` → explicit
> getter forwarding in appContext) is the correct end-state, but it is the
> spread-of-context refactor (CONVENTIONS Anti-Pattern) and touches appContext +
> consumers — deliberately deferred to the real migration phase to keep this proof to
> 3 files.

### B. `setDataRoot` is an arrow field (the `$state#Classes` `this` caveat)
`setDataRoot` is destructured off the context (`const { setDataRoot } = initAppContext()`).
A regular method would lose `this` on detach; an **arrow-function field** captures it
(Spike 020 Group E). Confirmed working through the spread + destructure path.

## Verification (all green)

| Gate | Result |
|------|--------|
| `yarn svelte-check` | **151 errors / 0 warnings — identical with and without the change** (stash-compared). Zero new type errors. The 151 are pre-existing (`qs` decls, supabase `Json` typing, DataWriter Promise typing). |
| `yarn vitest run src/lib/contexts/` | **85/85 pass** (17 files) |
| `yarn build --filter=@openvaa/frontend` | **✓ built** — client + **SSR server** bundles compile with the class |

### Side effect — hardened a pre-existing flaky spike test
Running the full context suite surfaced that **Spike 017's contrast test was already
flaky** (times out in isolation AND on baseline with my change stashed). Its
`toThrow(/effect_update_depth_exceeded/)` assertion is unreliable: under load the
reactive-read loop reschedules across flush cycles and the synchronous depth-guard never
fires — exactly the guard-vs-spin nondeterminism Spike 022 documents for a class private
`#version`. Hardened 017 to the cap-and-assert-unbounded pattern (matching 022). This is
corroboration of the 022 finding, not a regression from the conversion.

## What was deliberately NOT done (deferred to the real phase)

- Flattening the consumer read API (`reactiveDataRoot.current` → bare) — that's the
  Phase-103 codemod across ~10 files.
- Fixing `appContext`'s `{ ...dataCtx }` spread to explicit forwarding (needed only if
  the handles become prototype getters).
- Migrating the **candidate** producer (`candidate/(protected)/+layout.svelte`) — it
  still uses `reactiveDataRoot.instance`, which the class retains for back-compat. Left
  as-is to demonstrate the class is a drop-in for existing `.instance` consumers; it can
  move to `setDataRoot` whenever convenient.

## Trial-set expansion — `filterContext` + `darkMode` (2026-06-12)

Two more leaf contexts converted, widening the proof across the remaining groups.

### `darkMode` (Group B — primitive)
`component/darkMode.svelte.ts` — `createDarkMode()` now returns a `class DarkMode`
instance. Reactive core is a private `#dark` `$state` field; `matchMedia` read + the
`change` listener (an **arrow function**, capturing `this`) are set up in the constructor
behind a `browser` guard. **No `$effect`** → SSR-safe and constructable anywhere.
`current` is a **prototype getter** (safe — `componentContext` reads it via its own
`get darkMode()`; the handle is NOT spread).

### `filterContext` (Group C — version-bridge over `FilterGroup`)
`filter/filterContext.svelte.ts` — `initFilterContext()` now returns a class. `#version`
`$state` field is the bridge counter; `#filterGroup` is a `$derived` field; mutators are
**arrow fields**; getters are prototype getters (not spread — consumed via `fctx.version`
/ `fctx.filterGroup`).

**New production finding — `$effect` in a class constructor works.** The `onChange`
bridge lives in an `$effect` **in the constructor**. This is the first production use of
that shape, and it confirms Spike 023's distinction precisely: `$effect`-in-constructor
throws `effect_orphan` only when constructed *outside* an effect context — but
`filterContext` is constructed by `initVoterContext()` during component init (an effect
context), so it runs cleanly, and its cleanup still detaches the handler on scope change.

### Verification (both)
- `svelte-check`: **151/0, identical to baseline** — zero new errors, none in the
  converted files.
- `yarn vitest run src/lib/contexts/filter/`: **8/8** (harness-backed); full context
  suite **85/85**.
- `yarn build`: **✓** (client + SSR).
- Consumers (`componentContext`, `voterContext` delegation, `EntityListWithControls`)
  untouched — both factory APIs are byte-identical.

## Verdict

Three real OpenVAA contexts are now Svelte 5 classes with `$state` fields — covering
Group C version-bridge (`dataContext`, `filterContext`) and Group B primitive
(`darkMode`) — each verified across typecheck + unit + SSR build with zero consumer churn.
The `dataContext` producer-side `untrack` payoff is realized; `filterContext` adds the
first production `$effect`-in-constructor. The disciplines hold against real code:
own-property handles where spread (dataContext), prototype getters where not
(filter/darkMode), arrow-field writers throughout, and no `$effect` for
initialization/merge (only for post-construction bridges, in an effect context).

## Decision — LOCKED (2026-06-12)

**Contexts become Svelte 5 classes with `$state`/`$derived` fields. DataRoot and
Filters stay classes (version-bridge), NOT svelte/store.** The spike line (audit →
020-023 → three production conversions) is closed; the direction is committed.

### Stores were explicitly considered for DataRoot/Filters and rejected

The Svelte docs note stores remain good for "complex asynchronous data streams" or
"more manual control over … listening to changes," and `writable.set(sameRef)` fires on
identical object refs (via `safe_not_equal`), which would let a producer ping consumers
after an in-place mutation and drop the `#version` counter. Real and elegant — but for
this codebase it loses:

- **Consumers are `.svelte.ts` rune modules**, where `$store.X` auto-subscribe is
  unavailable; reactive consumption requires `fromStore(store).current`, which is the
  `subscribe → $state` version-bridge in a costume — the same bridge plus a **redundant
  second observable** (DataRoot is already observable via `Updatable.subscribe`).
- **`set(sameRef)` is `version++` with implicit semantics**, riding `safe_not_equal`'s
  object-always-fires quirk — the exact over-fire footgun the team already removed in
  Phase 64 (`appContext.svelte.ts:108-113`: "filter badge disappears on drawer open /
  portraits reload on close").
- It would **reverse the shipped MANIFEST requirement** (no `svelte/store` in migrated
  contexts) and split the paradigm for two contexts only.

The store wins exactly one cell — producer ergonomics — and `setDataRoot` already
captured most of that. **Revisit only if** DataRoot/Filters become genuinely streaming
(incremental/paginated arrival, backpressure, cancellation); today `provide*`/`setRule`
are synchronous, so "async data streams" does not apply.

### Status / handoff to the real migration

This is spike-proven on three contexts, not a completed migration. The full conversion is
a future phase (not yet planned). Carry-over for that phase:

- Convert remaining contexts tier by tier: Group-F factories (`PopupStore`,
  `VideoController`, `SettingsOverlay`, persistence helper) → leaf contexts
  (`component`, `auth`) → orchestrators (`app`, `voter`, `candidate`).
- Where a context is spread into a parent (the `appContext` `{ ...dataCtx }` pattern),
  either keep own-property handles or fix the parent to explicit getter forwarding
  (CONVENTIONS "Spread-of-context").
- Optional cleanups deferred from the proof: flatten the `reactiveDataRoot.current`
  consumer read API to bare (Phase-103 codemod territory); migrate the candidate
  producer from `.instance` to `setDataRoot`.
- Disciplines are codified in CONVENTIONS §17-22; the destructure rule (CLAUDE.md +
  Phase-103 PASS 3/4) survives class conversion unchanged.
