import qs from 'qs';
import { resolveRoute } from '$app/paths';
import { localizeHref } from '$lib/paraglide/runtime';
import { filterPersistent } from './filterPersistent';
import { isRouteParam } from './params';
import { parseParams } from './parseParams';
import { DEFAULT_PARAMS, ROUTE } from './route';
import { removeDuplicates } from '../removeDuplicates';
import type { locales as paraglideLocales } from '$lib/paraglide/runtime';
import type { Params } from './params';
import type { Route } from './route';

/**
 * Builds a route using the current route params and those passed to it. Some `Route`s have default parameters that can be omitted.
 *
 * Name-disjoint dissociation rule (Phase 88 Plan 88-02):
 * ----------------------------------------------------------------
 * `buildRoute({ electionTab: 'X' })` routes `X` to the PATH SEGMENT via
 * `isRouteParam('electionTab') === true` (the route-side SELECTED-singular
 * surface; new in Plan 88-02). `buildRoute({ electionId: 'X' })` routes
 * `X` to the SEARCH SIDE via `isPersistentSearchParam('electionId') === true`
 * (the search-side AVAILABLE-array surface; unchanged from prior phases).
 * The two keys never alias.
 *
 * A caller wanting BOTH surfaces populated (set the selected election AND
 * scope to a specific available pool) passes BOTH keys:
 *
 *   buildRoute({
 *     route: 'Results',
 *     electionTab: 'test-el-reg',                         // → /results/test-el-reg/...
 *     electionId: ['test-el-reg', 'test-el-mun']          // → ?electionId[0]=test-el-reg&electionId[1]=test-el-mun
 *   });
 *
 * `electionTab` is NOT in `ARRAY_PARAMS` (route segment is always
 * singular), so passing an array there would type-error at compile time.
 * `electionId` IS in `ARRAY_PARAMS`, so the search-side AVAILABLE-array
 * semantics are preserved end-to-end. See the block comments in
 * `params.ts`, `parseParams.ts`, and `filterPersistent.ts` for the full
 * dissociation contract.
 *
 * @param options - Either the name of the `Route` or an object with the more properties.
 * @param current - The current route params and url. This is automatically appended by the `getRoute` store.
 * @returns A URL string with locale prefix added by Paraglide.
 */
export function buildRoute(
  options: RouteOptions,
  current?: {
    params?: Record<string, string>;
    route?: { id?: string | null };
    url?: URL;
  }
): string {
  // Handle calls with just the route name
  if (typeof options === 'string') options = { route: options };

  // Parse options and combine params
  const { route, locale, ...params } = options;
  const allParams = {
    ...(route && route in DEFAULT_PARAMS ? DEFAULT_PARAMS[route] : {}),
    ...(current ? filterPersistent(parseParams(current)) : {}),
    ...params
  };

  // Divide params into route and search params
  const routeParams: Record<string, string | Array<string> | undefined> = {};
  const searchParams: Record<string, string | Array<string> | undefined> = {};
  for (const [key, value] of Object.entries(allParams)) {
    // Clean up arrays
    let clean = value;
    if (Array.isArray(value)) {
      clean = removeDuplicates(value).sort();
      if (clean.length === 0) clean = '';
      else if (clean.length === 1) clean = clean[0];
    }
    // Select param set
    if (isRouteParam(key)) routeParams[key] = clean;
    else searchParams[key] = clean;
  }

  // The route passed as argument, the current route or a default one (Home)
  const routeId = route ? ROUTE[route] : current?.route?.id || ROUTE.Home;

  // Build url
  // reason: SvelteKit's `resolveRoute` typings demand a literal route-id and a
  // params record narrowed to that route. We assemble both dynamically from the
  // generic ROUTE map at runtime, so the literal-type contract cannot be honored
  // structurally — `as any` is the documented escape hatch for this pattern.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let url = resolveRoute(routeId as any, flattenParams(routeParams) as any);
  if (Object.keys(searchParams).length) url += `?${qs.stringify(searchParams, { encodeValuesOnly: true })}`;

  // Add locale prefix via Paraglide
  return localizeHref(url, locale ? { locale: locale as (typeof paraglideLocales)[number] } : undefined);
}

/**
 * Either the name of the `Route` or an object with the more properties.
 */
export type RouteOptions =
  | Route
  | ({
      /**
       * The name of the `Route`
       */
      route?: Route;
      /**
       * The locale to use for URL localization. If not provided, uses current locale.
       */
      locale?: string;
    } & Partial<Params>);

/**
 * Flatten possible array values in `Params`.
 */
function flattenParams(params: Partial<Params>): Partial<Record<keyof Params, string>> {
  return Object.fromEntries(
    Object.entries(params).map(([key, value]) => [key, Array.isArray(value) ? value.join('/') : value])
  );
}
