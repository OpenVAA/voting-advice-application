import qs from 'qs';
import { resolveRoute } from '$app/paths';
import { filterPersistent } from './filterPersistent';
import { isRouteParam, type Params } from './params';
import { parseParams } from './parseParams';
import { DEFAULT_PARAMS, ROUTE, type Route } from './route';
import { removeDuplicates } from '../removeDuplicates';

/**
 * Builds a route using the current route params and those passed to it. Some `Route`s have default parameters that can be omitted.
 * @param options - Either the name of the `Route` or an object with the more properties.
 * @param current - The current route params and url. This is automatically appended by the `getRoute` store.
 * @returns A URL string.
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

  // Due to naming discrepancies, we support both `locale` and `lang` for the `land` route param
  // TODO: Remove when the `[[lang=locale]]` route is changed to `[[locale=locale]]`
  if (locale) allParams.lang = locale;

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
  let url = resolveRoute(routeId, flattenParams(routeParams));
  if (Object.keys(searchParams).length) url += `?${qs.stringify(searchParams, { encodeValuesOnly: true })}`;
  return url;
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
       * `A synonym for `lang`
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
