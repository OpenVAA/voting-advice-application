import { isAdminRoute, isContestantRoute, isVoterRoute } from '$lib/routes';
import type { AnalyticsApp } from './modes';

/**
 * The app a route belongs to, read from the first segment of its route id.
 *
 * Takes a SvelteKit route id, never a pathname, so neither a locale prefix nor a parameter value can change the answer. The comparison is by whole segment: `/contestants` is not under `/contestant`. The browser and the relay both call this, so an event's app is derived one way only.
 *
 * @param routeId - A SvelteKit route id, e.g. `page.route.id`.
 * @returns The app whose root is the id or holds it, or `undefined` for a route outside the three apps, such as an endpoint.
 */
export function appOfRoute(routeId: string): AnalyticsApp | undefined {
  if (isVoterRoute(routeId)) return 'voter';
  if (isContestantRoute(routeId)) return 'contestant';
  if (isAdminRoute(routeId)) return 'admin';
  return undefined;
}
