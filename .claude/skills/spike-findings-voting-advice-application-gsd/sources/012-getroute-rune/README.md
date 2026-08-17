# Spike 012 — `getRoute` rune-native

## Verdict

**VALIDATED.** Approach C (`$derived.by` over per-field reads of
`$app/state.page`) replaces the production `writable<RouteBuilder>` +
`afterNavigate(set)` shape at full functional parity, with no
`svelte/store` imports, no `toStore` short-circuit risk, and zero
defensive `afterNavigate` belt-and-suspenders required.

The documented Svelte 5 trap in
`apps/frontend/src/lib/contexts/app/getRoute.svelte.ts:18-30` is
genuinely `toStore`-specific (the `render_effect` short-circuit on
object-reference equality is internal to `toStore`'s wrapping). Pure
`$derived.by` over `page.params` / `page.route` / `page.url`
establishes one fine-grained dependency per field — bypasses the trap
by construction.

## Question

Can `createGetRoute()` in
`apps/frontend/src/lib/contexts/app/getRoute.svelte.ts` migrate from its
current `writable + afterNavigate(set)` imperative-republish shape to a
rune-native `{ get current(): RouteBuilder }`, while avoiding the
documented `toStore`-on-`$app/state.page` short-circuit trap?

Sub-question (open at briefing): is an `afterNavigate`-driven defensive
republish (Approach D) needed as belt-and-suspenders on top of
`$derived.by` (Approach C), or is the fine-grained tracking sufficient?

## What was built

A side-by-side comparison route at
`apps/frontend/src/routes/runes-test/getroute-rune/`:

- `getRouteRuneStore.svelte.ts` — four candidate variants exposed as
  `{ readonly current: RouteBuilder }`:
  - **A** — Snapshot captured once at init (negative control, must stay
    stale)
  - **B** — Per-call getter, re-reads `page.X` per consumer call
    (positive control, must always match ground truth)
  - **C** — `$derived.by` over per-field reads (PRIMARY candidate)
  - **D** — C + `afterNavigate` increment of a `version` `$state` that
    the `$derived.by` reads first (belt-and-suspenders)
- `spike012Context.svelte.ts` — Symbol-keyed context exposing the
  bundle. Layout-scoped init is what makes variant A's snapshot
  survive client-side route hops (otherwise A would reset every time
  a `+page.svelte` remounts).
- `+layout.svelte` — `initSpike012Variants()` once at layout mount.
- `+page.svelte` — table renders all four variants × three test inputs
  (`{}`, `{route:'About'}`, `{route:'Questions', questionId:'demo-q'}`)
  plus the live `page` ground truth and `D.navCount`.
- `nested/+page.svelte` — destination route inside the same layout
  scope so A's snapshot is observably stale once you navigate away.

Banned idioms verified absent: no `svelte/store` import; no
`toStore`/`fromStore`/`writable`/`derived` (store-derived); no
`get(store)`; no template `$store.X` auto-subscribe.

## Evidence of validation

Multi-step client-side navigation sequence executed in Chrome against
the running dev server:

| Step            | URL after nav                             | A snapshot                          | B per-call                  | C $derived.by               | D + afterNavigate           | C ≡ B |
| --------------- | ----------------------------------------- | ----------------------------------- | --------------------------- | --------------------------- | --------------------------- | ----- |
| mount           | `/runes-test/getroute-rune/`              | `/runes-test/getroute-rune`         | `/runes-test/getroute-rune` | `/runes-test/getroute-rune` | `/runes-test/getroute-rune` | ✓     |
| → nested        | `/runes-test/getroute-rune/nested`        | `/runes-test/getroute-rune` (stale) | `/.../nested`               | `/.../nested`               | `/.../nested`               | ✓     |
| → back          | `/runes-test/getroute-rune/`              | `/runes-test/getroute-rune`         | `/.../getroute-rune`        | `/.../getroute-rune`        | `/.../getroute-rune`        | ✓     |
| → nested?demo=1 | `/runes-test/getroute-rune/nested?demo=1` | `/runes-test/getroute-rune` (stale) | `/.../nested`               | `/.../nested`               | `/.../nested`               | ✓     |
| → nested?demo=2 | `/runes-test/getroute-rune/nested?demo=2` | `/runes-test/getroute-rune` (stale) | `/.../nested`               | `/.../nested`               | `/.../nested`               | ✓     |
| → back          | `/runes-test/getroute-rune/`              | `/runes-test/getroute-rune`         | `/.../getroute-rune`        | `/.../getroute-rune`        | `/.../getroute-rune`        | ✓     |

`D.navCount` reached `6` after the sequence — confirms `afterNavigate`
fired on every transition (initial nav + 5 link clicks). Console clean
across all transitions: no `effect_update_depth_exceeded`, no
hydration mismatches, no Svelte errors or warnings beyond Vite's
`connecting…`/`connected.` debug lines.

## Answers to open clarifier questions

1. **Why 3 variants instead of just 1?** The spike landed with FOUR
   variants — A (snapshot, negative control), B (per-call getter,
   positive control), C ($derived.by, primary), D (C + afterNavigate
   defensive). The fourth was the open question at briefing time. The
   negative control (A) is essential because without it, "C tracks
   navigation correctly" is unfalsifiable — when A, B, C, D all agree
   on the start route, the read could be vacuous; A being demonstrably
   stale while B/C/D track is what proves the others are actually
   evaluating.
2. **Why is the `toStore` trap `toStore`-specific?** The trap is in
   `toStore`'s internal `render_effect` `set(value)` guard which uses
   `Object.is` (or reference equality) to short-circuit no-op writes.
   The `$app/state.page` proxy's object reference never changes, so
   `toStore(() => page)`'s render_effect sees the same reference on
   every nav and skips the propagation. Pure `$derived.by` reading
   `page.params`/`page.route`/`page.url` as separate fields never goes
   through `toStore`, so the short-circuit doesn't apply — and Svelte 5
   fine-grained tracking establishes one dependency per field that the
   nav-mutation invalidates correctly. Empirically confirmed by the
   table above.
3. **What does VALIDATED look like?** All six rows of the table show
   `C ≡ B` = ✓, A demonstrably stale on every off-route step, console
   clean, `D.navCount` increments. Verification gate from
   `.continue-here.md` met in full.
4. **Producer-vs-consumer scope.** This spike is **producer-only**:
   it migrates `getRoute.svelte.ts` to a rune-native shape. The 134
   `$getRoute(opts)` consumer sites are the codemod's job (the
   Spike 009 destructure-trap audit + template-auto-subscribe rewrite
   pass covers them).
5. **Include Approach D?** **No** — D matched C on every observed
   step, including across query-param-only transitions (which is the
   minimal-change case where fine-grained tracking is least likely
   to fire if it had a gap). The `afterNavigate` defensive layer is
   redundant given $derived.by per-field tracking and would only add
   complexity (an additional `$state` counter + an additional
   afterNavigate subscription) without behavioral benefit. The
   production migration should use the C shape.

## Production migration plan (Wave 3 — careful)

Replace the production producer (currently
`apps/frontend/src/lib/contexts/app/getRoute.svelte.ts`) with:

```ts
import { page } from '$app/state';
import { buildRoute } from '$lib/utils/route';
import type { RouteOptions } from '$lib/utils/route';

export type RouteBuilder = (options: RouteOptions) => string;

export function createGetRoute(): { readonly current: RouteBuilder } {
  const builder = $derived.by<RouteBuilder>(() => {
    const { params, route, url } = page;
    return (options) => buildRoute(options, { params, route, url });
  });
  return {
    get current() {
      return builder;
    }
  };
}
```

The Wave 3 callout from Spike 010 is satisfied: the trap remains
documented in the file header (with the spike-derived rationale for
why `$derived.by` over per-field reads bypasses it), the function
signature changes from `Readable<RouteBuilder>` to `{ current:
RouteBuilder }`, and all 134 consumer sites need the codemod-driven
rewrite from `$getRoute(opts)` to `getRoute.current(opts)`.

The codemod from Spike 009 already covers the destructure-trap audit
that this rename surfaces (consumers who did `const { getRoute } =
ctx; $getRoute(opts)` would break under the destructure trap if
`current` were a getter and the destructured handle were a static
binding — but `getRoute` is itself a stable reference, so
destructuring `getRoute` itself is fine; what must NOT be destructured
is `getRoute.current`).

## Anti-patterns confirmed

| Pattern                                                | Why it fails                                                                                                                                                                                                    | Spike evidence                                                                                                                                                        |
| ------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `derived(toStore(() => page), …)`                      | `toStore`'s internal `render_effect.set` short-circuits on `Object.is(prevPage, page)` — the page proxy is reference-stable, so `set` never fires and the wrapping `derived` never re-evaluates                 | Documented in the production file header; the spike does not re-test this because it requires `svelte/store` imports that the spike conventions ban                   |
| `$derived(() => page)` capturing the whole page object | Would store a reference to the proxy; whether subsequent field reads through the captured reference establish dependencies is implementation-defined and fragile                                                | Not tested directly — Approach A's snapshot capture (destructuring `page` once outside any tracking scope) gives the same negative result and is the unambiguous case |
| Mount-scoped variant init for nav-survival behavior    | Variant state survives only within the SAME component instance — a `+page.svelte`-scoped init resets the snapshot every nav, making "A stays stale" untestable. Layout-scoped init survives child-page remounts | This spike re-initialized variants at layout scope (`spike012Context.svelte.ts` + `+layout.svelte`) precisely so A's stale-snapshot claim is observable               |

## Required reading (in order, for the production migration)

1. `apps/frontend/src/lib/contexts/app/getRoute.svelte.ts` — header
   comment documents the trap; the production file is what's being
   replaced.
2. `apps/frontend/src/routes/runes-test/getroute-rune/getRouteRuneStore.svelte.ts`
   — the canonical four-variant comparison; Approach C is the
   migration target.
3. `.planning/spikes/CONVENTIONS.md` — Patterns 1 (getter-exposed
   context), 8 (pure merge — not directly applicable but the conventions
   that govern the producer shape).
4. `.planning/spikes/010-adjacent-store-bridges/README.md` — the
   Wave 3 inventory that flagged `getRoute` as careful.

## Infrastructure notes

- Spike does not require Supabase. `yarn workspace @openvaa/frontend
dev` alone is enough; the spike exercises only `$app/state.page` +
  `$app/navigation` + the pure `buildRoute` util.
- Spike code lives entirely under
  `apps/frontend/src/routes/runes-test/getroute-rune/` — delete the
  directory to remove all spike code.

## Files

- `apps/frontend/src/routes/runes-test/getroute-rune/getRouteRuneStore.svelte.ts`
- `apps/frontend/src/routes/runes-test/getroute-rune/spike012Context.svelte.ts`
- `apps/frontend/src/routes/runes-test/getroute-rune/+layout.svelte`
- `apps/frontend/src/routes/runes-test/getroute-rune/+page.svelte`
- `apps/frontend/src/routes/runes-test/getroute-rune/nested/+page.svelte`
- `.planning/spikes/012-getroute-rune/README.md` (this file)
