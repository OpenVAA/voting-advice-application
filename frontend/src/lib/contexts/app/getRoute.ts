import { derived } from 'svelte/store';
import { page } from '$app/stores';
import { buildRoute, type RouteOptions } from '$lib/utils/route';

/**
 * A store for building routes. It returns a function that takes `RouteOptions` and returns a URL string.
 * NB. Routes are built using a store, so that any parameter changes affect all routes in the app.
 */
export const getRoute = derived(
  page,
  ({ params, route, url }) =>
    (options: RouteOptions) =>
      buildRoute(options, { params, route, url }),
  (options: RouteOptions) => buildRoute(options)
);
