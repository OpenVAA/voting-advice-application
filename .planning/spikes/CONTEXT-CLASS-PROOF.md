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

## Verdict

A real OpenVAA context is now a Svelte 5 class with a `$state` field, verified across
typecheck + unit + SSR build, with the producer-side `untrack` payoff realized and zero
consumer churn. The migration order and the two new disciplines (own-property handles for
spread-safety; arrow-field writers) are confirmed against production code.
