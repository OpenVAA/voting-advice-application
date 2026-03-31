import { derived } from 'svelte/store';
import { page } from '$app/state';
import { toStore } from 'svelte/store';
import { buildRoute } from '$lib/utils/route';
import type { RouteOptions } from '$lib/utils/route';

const pageStore = toStore(() => page);

/**
 * A store for building routes. It returns a function that takes `RouteOptions` and returns a URL string.
 * NB. Routes are built using a store, so that any parameter changes affect all routes in the app.
 */
export const getRoute = derived(
  pageStore,
  ({ params, route, url }) =>
    (options: RouteOptions) =>
      buildRoute(options, { params, route, url }),
  (options: RouteOptions) => buildRoute(options)
);
