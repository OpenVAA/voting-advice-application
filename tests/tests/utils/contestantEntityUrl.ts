import { fillRouteId, parseParamSegment } from './buildRoute';
// Use direct import to avoid loading other modules which depend on `$app/...`
import { ROUTE } from '../../../apps/frontend/src/lib/routes/route';
import { escapeRegExp } from '../../../apps/frontend/src/lib/utils/regexp';
import type { Route } from '../../../apps/frontend/src/lib/routes/route';
import type { RouteParams } from './buildRoute';

/**
 * The entity segment of a Contestant App URL, as the source of a regular-expression fragment: a slash, a served entity type, a slash and a canonical uuid.
 *
 * The segment is required: every entity page is served under its entity, so a pattern built on it rejects the same path without one. Such a path is one the app resolves by a redirect, and `buildEntityLessRoute` builds it.
 */
export const ENTITY_SEGMENT_SOURCE =
  '(?:/(?:candidate|organization)/[0-9a-fA-F]{8}-(?:[0-9a-fA-F]{4}-){3}[0-9a-fA-F]{12})';

/** The names of the two params that make up the entity segment of a route id. */
const ENTITY_PARAM_NAMES: ReadonlyArray<string> = ['entityType', 'entityId'];

/** The Contestant App's root path, as the source of a regular-expression fragment. */
const APP_ROOT_SOURCE = '/contestant';

/**
 * What a pattern accepts after the page's own path. Each form also accepts a query or a fragment after it.
 * - `exact`: nothing but an optional trailing slash.
 * - `child`: exactly one further segment, such as a question id.
 * - `any`: nothing, or any slash-led continuation.
 */
export type ContestantUrlTail = 'exact' | 'child' | 'any';

const TAIL_SOURCE: Record<ContestantUrlTail, string> = {
  exact: '/?(?=[?#]|$)',
  child: '/[^/?#]+/?(?=[?#]|$)',
  any: '(?=[/?#]|$)'
};

/**
 * The source of `subPath` as a regular-expression fragment.
 * @throws If `subPath` is not a slash-led path without a trailing slash, a query or a fragment.
 */
function subPathSource(subPath: string): string {
  if (!/^\/[^?#]*[^/?#]$/.test(subPath))
    throw new Error(
      `contestantEntityUrl: "${subPath}" is not a sub-path of an entity. Write it as "/profile" or "/questions".`
    );
  return escapeRegExp(subPath);
}

/**
 * A pattern for the URL of one page of a contestant entity, with or without a locale prefix. The path without an entity segment does not match.
 * @param subPath - The page's path below the entity, with a leading slash, e.g. `/profile`.
 * @param tail - What may follow the page's path. The default accepts the page itself and nothing below it.
 * @returns A pattern without flags, safe to test repeatedly.
 * @throws If `subPath` is not a slash-led path without a trailing slash.
 */
export function contestantUrlRe(subPath: string, tail: ContestantUrlTail = 'exact'): RegExp {
  return new RegExp(`${APP_ROOT_SOURCE}${ENTITY_SEGMENT_SOURCE}${subPathSource(subPath)}${TAIL_SOURCE[tail]}`);
}

/**
 * A pattern for any URL of the Contestant App that is not `subPath` or below it: the page has been left for another page of the app.
 *
 * The named page is rejected under an entity and without one, because the path without an entity segment is a request for the same page. The pattern does not know the app's pages, so every other path under the app's root matches.
 * @param subPath - The path of the page left, with a leading slash, e.g. `/profile`.
 * @returns A pattern without flags, safe to test repeatedly.
 * @throws If `subPath` is not a slash-led path without a trailing slash.
 */
export function contestantUrlOutsideRe(subPath: string): RegExp {
  return new RegExp(`${APP_ROOT_SOURCE}(?=[/?#]|$)(?!${ENTITY_SEGMENT_SOURCE}?${subPathSource(subPath)})`);
}

/**
 * A pattern for the URL of a contestant entity's home page, with or without a locale prefix: the app's root, the entity segment and nothing below it. The app's root itself does not match.
 * @returns A pattern without flags, safe to test repeatedly.
 */
export function contestantHomeUrlRe(): RegExp {
  return new RegExp(`${APP_ROOT_SOURCE}${ENTITY_SEGMENT_SOURCE}/?(?=[?#]|$)`);
}

/**
 * Whether a path is a contestant entity's home page. The same test as `contestantHomeUrlRe`, on the whole of a path rather than inside a URL.
 * @param pathname - A path without its locale prefix, query and fragment.
 */
export function isContestantHomePath(pathname: string): boolean {
  return new RegExp(`^${APP_ROOT_SOURCE}${ENTITY_SEGMENT_SOURCE}/?$`).test(pathname);
}

/**
 * A pattern for the URL of the Contestant App's root, with or without a locale prefix: the root carries no entity. It is where a pending gate is shown, and from where a user with one entity is redirected to that entity's home.
 * @returns A pattern without flags, safe to test repeatedly.
 */
export function contestantAppRootUrlRe(): RegExp {
  return new RegExp(`${APP_ROOT_SOURCE}/?(?=[?#]|$)`);
}

/**
 * Whether a path is the Contestant App's root. The same test as `contestantAppRootUrlRe`, on the whole of a path rather than inside a URL.
 * @param pathname - A path without its locale prefix, query and fragment.
 */
export function isContestantAppRootPath(pathname: string): boolean {
  return new RegExp(`^${APP_ROOT_SOURCE}/?$`).test(pathname);
}

/**
 * Remove the entity segment from a route id.
 * @param routeId - A SvelteKit route id.
 * @returns The route id without the param segments named `entityType` and `entityId`.
 */
export function dropEntitySegments(routeId: string): string {
  return routeId
    .split('/')
    .filter((segment) => {
      const param = parseParamSegment(segment);
      return !param || !ENTITY_PARAM_NAMES.includes(param.name);
    })
    .join('/');
}

/**
 * Build the path of a Contestant App route with the entity left out. The app resolves such a path to the user's single entity.
 * @param route - The name of the route.
 * @param locale - The value of the locale segment, where the route id holds one.
 * @param params - Values for the route's other param segments. An optional segment without a value is dropped.
 * @returns The path, without route groups, without the entity segment and without any bracketed segment.
 * @throws If a required or rest param segment other than the entity's two has no value.
 */
export function buildEntityLessRoute({
  route,
  locale,
  params
}: {
  route: Route;
  locale: string;
  params?: RouteParams;
}): string {
  return fillRouteId({ route, routeId: dropEntitySegments(ROUTE[route]), locale, params });
}
