import { writable } from 'svelte/store';
import { page } from '$app/state';
import { afterNavigate } from '$app/navigation';
import { buildRoute } from '$lib/utils/route';
import type { Readable } from 'svelte/store';
import type { RouteOptions } from '$lib/utils/route';

export type RouteBuilder = (options: RouteOptions) => string;

/**
 * Build a route-builder store seeded against the CURRENT `$app/state` page.
 * `afterNavigate` republishes the function on every navigation so callers
 * always see the latest `params`/`route`/`url`.
 *
 * Must be invoked inside a component-init context (`initAppContext`'s call
 * site) — `afterNavigate` registers a callback against the active component.
 *
 * Why not `derived(toStore(() => page), …)` (the previous shape)?
 * `$app/state.page` is a long-lived $state proxy — its OBJECT REFERENCE
 * never changes across navigations, only its internal state mutates.
 * Svelte 5's `toStore` wraps the getter in an internal `render_effect` whose
 * `set(value)` short-circuits when the getter returns the same reference, so
 * the wrapping `derived` never re-fires and consumers (notably
 * `$getRoute(...)` inside elections / constituencies handleSubmit) keep
 * holding a stale closure that builds URLs against the page state from when
 * the route first mounted. The voter `/elections` → `/constituencies` →
 * `/questions` flow then loses `electionId` between hops and
 * `(located)/+layout.ts` redirects to `/elections` — the silent goto flake
 * tracked at multi-election.spec.ts:173. Imperative republish via
 * `afterNavigate` bypasses the toStore short-circuit reliably.
 *
 * Mirrors the same pattern applied to `dataContext.dataRoot` for the
 * `DataRoot` singleton.
 */
export function createGetRoute(): Readable<RouteBuilder> {
  const buildFn: () => RouteBuilder = () => {
    const { params, route, url } = page;
    return (options: RouteOptions) => buildRoute(options, { params, route, url });
  };
  const store = writable<RouteBuilder>(buildFn());
  const setStore = (store as { set: (v: RouteBuilder) => void }).set;
  afterNavigate(() => setStore(buildFn()));
  return store;
}
