import type { Route } from './route';

/**
 * The two routes that can be "home" in the Contestant App.
 */
export type ContestantHomeRoute = Extract<Route, 'ContestantAppEntityHome' | 'ContestantAppHome'>;

/**
 * Pick the route that "home" means on a page of the Contestant App: the home of the entity the URL names when it names one, the app root otherwise.
 *
 * An entity is named only by the `entityType` and `entityId` route params together, so one of them alone, or an empty value for either, leads to the app root.
 *
 * @param params - The route params of the current page.
 * @returns The key of the route to build the home link from.
 */
export function contestantHomeRoute(params: Readonly<Record<string, string | undefined>>): ContestantHomeRoute {
  return params.entityType && params.entityId ? 'ContestantAppEntityHome' : 'ContestantAppHome';
}
