import { ADMIN, CONTESTANT, VOTER } from '$lib/routes/route';
import type { AnalyticsApp } from './modes';

/** The root route id of each app. */
const APP_ROOTS: ReadonlyArray<readonly [root: string, app: AnalyticsApp]> = [
  [VOTER, 'voter'],
  [CONTESTANT, 'contestant'],
  [ADMIN, 'admin']
];

/**
 * The app a route belongs to, read from the first segment of its route id.
 *
 * Takes a SvelteKit route id, never a pathname, so neither a locale prefix nor a parameter value can change the answer. The comparison is by whole segment: `/contestants` is not under `/contestant`. The browser and the relay both call this, so an event's app is derived one way only.
 *
 * @param routeId - A SvelteKit route id, e.g. `page.route.id`.
 * @returns The app whose root is the id or holds it, or `undefined` for a route outside the three apps, such as an endpoint.
 */
export function appOfRoute(routeId: string): AnalyticsApp | undefined {
  for (const [root, app] of APP_ROOTS) if (routeId === root || routeId.startsWith(`${root}/`)) return app;
  return undefined;
}
