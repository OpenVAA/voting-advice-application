/**
 * SPIKE 012 — Rune-native `getRoute` candidate shapes.
 *
 * Goal: replace `createGetRoute()` (writable + afterNavigate imperative
 * republish in `apps/frontend/src/lib/contexts/app/getRoute.svelte.ts`) with a
 * fully rune-native producer, while bypassing the documented Svelte 5
 * `toStore` short-circuit trap (object-reference equality on the long-lived
 * `$app/state.page` proxy — see the file header in the production source).
 *
 * Four variants are exposed in parallel so they can be compared side-by-side
 * against the SAME `page` updates. Each variant returns the same public
 * surface: `{ get current(): RouteBuilder }` (CONVENTIONS Pattern 1).
 *
 *   A — Snapshot at init       — negative control (must stay stale)
 *   B — Per-call getter        — control (re-reads page.X on every call)
 *   C — $derived.by per-field  — PRIMARY candidate (fine-grained tracking)
 *   D — C + afterNavigate bump — belt-and-suspenders (open question)
 *
 * Banned idioms (per .planning/spikes/CONVENTIONS.md):
 *   - no `svelte/store` imports
 *   - no `toStore` / `fromStore` / `writable` / `derived` (store-derived)
 *   - no `get(store)` reads
 *
 * Producer-only scope. The 134 `$getRoute(opts)` consumer sites in the rest
 * of the codebase are the codemod's job (Spike 009 inventory).
 */
import { afterNavigate } from '$app/navigation';
import { page } from '$app/state';
import { buildRoute } from '$lib/utils/route';
import type { RouteOptions } from '$lib/utils/route';

export type RouteBuilder = (options: RouteOptions) => string;

// ─────────────────────────────────────────────────────────────────────
// Variant A — Snapshot (negative control)
// ─────────────────────────────────────────────────────────────────────
//
// Capture `params`/`route`/`url` ONCE at producer-init time. The closure
// holds the captured values forever; subsequent navigations are invisible.
// Used in the demo to PROVE that other variants are tracking by contrast.
export function getRouteVariantA_snapshot(): { readonly current: RouteBuilder } {
  const { params, route, url } = page;
  function fn(options: RouteOptions): string {
    return buildRoute(options, { params, route, url });
  }
  return {
    get current() {
      return fn;
    }
  };
}

// ─────────────────────────────────────────────────────────────────────
// Variant B — Per-call getter (positive control)
// ─────────────────────────────────────────────────────────────────────
//
// `current` allocates a fresh closure on every consumer read. The closure
// reads `page.params`/`page.route`/`page.url` per-call, so it always sees
// the latest values. Works; the cost is per-read allocation × 134 sites.
export function getRouteVariantB_perCall(): { readonly current: RouteBuilder } {
  return {
    get current() {
      return (options) =>
        buildRoute(options, { params: page.params, route: page.route, url: page.url });
    }
  };
}

// ─────────────────────────────────────────────────────────────────────
// Variant C — $derived.by per-field (PRIMARY)
// ─────────────────────────────────────────────────────────────────────
//
// $derived.by computation reads `page.params`/`page.route`/`page.url` AS
// SEPARATE FIELDS. Svelte 5 fine-grained tracking establishes one
// dependency per field; navigations mutate each field in place, the
// $derived re-evaluates, and the memoized closure is rebuilt. One closure
// allocation per nav, not per consumer read.
//
// Bypasses the `toStore` trap by construction: never reads `page` as a
// single value (which would tag the dependency at the proxy-object level
// and trigger the render_effect short-circuit on reference equality).
export function getRouteVariantC_derivedBy(): { readonly current: RouteBuilder } {
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

// ─────────────────────────────────────────────────────────────────────
// Variant D — C + afterNavigate version bump (belt-and-suspenders)
// ─────────────────────────────────────────────────────────────────────
//
// Identical read shape to C, plus a defensive `version` $state that
// `afterNavigate` increments. The $derived.by reads `version` first, so
// even if fine-grained tracking had a gap (it shouldn't — that's what C
// is testing), the imperative bump forces re-evaluation. Used to ANSWER
// the open question "is the defensive layer worth keeping?"
//
// Must be invoked inside a component-init context (afterNavigate
// registers against the active component) — same constraint as the
// production createGetRoute().
export function getRouteVariantD_derivedByPlusAfterNavigate(): {
  readonly current: RouteBuilder;
  readonly navCount: number;
} {
  let version = $state(0);
  afterNavigate(() => {
    version += 1;
  });
  const builder = $derived.by<RouteBuilder>(() => {
    void version;
    const { params, route, url } = page;
    return (options) => buildRoute(options, { params, route, url });
  });
  return {
    get current() {
      return builder;
    },
    get navCount() {
      return version;
    }
  };
}
