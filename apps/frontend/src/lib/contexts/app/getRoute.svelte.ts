import { page } from '$app/state';
import { buildRoute } from '$lib/utils/route';
import type { RouteOptions } from '$lib/utils/route';

export type RouteBuilder = (options: RouteOptions) => string;

/**
 * Build a rune-native route builder seeded against the CURRENT `$app/state`
 * page. Returns a `{ readonly current: RouteBuilder }` handle (the canonical
 * rune-handle shape); consumers read `getRoute.current(opts)`.
 *
 * COMPONENT-INIT-CONTEXT REQUIREMENT: the rune-derived below (like the old
 * navigation-callback workaround it replaces) requires a runes/component-init
 * context. `createGetRoute()` MUST keep being called from `initAppContext` (it
 * is — appContext.svelte.ts). A future reader must NOT move it out of
 * component-init.
 *
 * Why a rune-derived reading `params`/`route`/`url` as SEPARATE fields (and NOT
 * `derived(toStore(() => page), …)`, the original shape)?
 * `$app/state.page` is a long-lived $state proxy — its OBJECT REFERENCE never
 * changes across navigations, only its internal fields mutate. The old
 * `derived(toStore(() => page), …)` wrapped the whole-page getter in an
 * internal `render_effect` whose `set(value)` short-circuited when the getter
 * returned the same reference, so the wrapping `derived` never re-fired and
 * consumers (notably the route-builder calls inside elections / constituencies
 * handleSubmit) kept holding a stale closure that built URLs against the page
 * state from when the route first mounted. The voter `/elections` →
 * `/constituencies` → `/questions` flow then lost `electionId` between hops and
 * `(located)/+layout.ts` redirected to `/elections` — the silent goto flake
 * tracked at multi-election.spec.ts:173.
 *
 * Reading `{ params, route, url } = page` as SEPARATE fields inside the derived
 * callback forms 3 fine-grained dependencies that every navigation invalidates
 * — so the derived re-evaluates and rebuilds the closure with fresh page state.
 * NEVER read `page` as a single whole value in the tracking scope (that
 * re-introduces the reference short-circuit).
 *
 * Mirrors the same per-field-read rune pattern applied to `dataContext.dataRoot`.
 */
class GetRoute {
  #builder = $derived.by<RouteBuilder>(() => {
    const { params, route, url } = page;
    return (options: RouteOptions) => buildRoute(options, { params, route, url });
  });

  // Prototype getter is SAFE here: getRoute is consumed via DIRECT property
  // access at appContext (`getRoute` own key), never spread — so no
  // own-enumerable accessor dance is required.
  get current(): RouteBuilder {
    return this.#builder;
  }
}

export function createGetRoute(): { readonly current: RouteBuilder } {
  return new GetRoute();
}
