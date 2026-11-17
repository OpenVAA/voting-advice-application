// Use direct import to avoid loading other modules which depend on `$app/...`
import { ROUTE } from '../../../apps/frontend/src/lib/routes/route';
import type { Route } from '../../../apps/frontend/src/lib/routes/route';

/** The locale segment of a route id, replaced by the locale rather than by a param value. */
const LOCALE_SEGMENT = '[[lang=locale]]';

/**
 * Values for the param segments of a route id, by param name.
 */
export type RouteParams = Readonly<Record<string, string | undefined>>;

/**
 * A param segment of a route id.
 */
export interface ParamSegment {
  /** The param name, without brackets, rest dots or matcher. */
  name: string;
  /** `required` for `[name]`, `optional` for `[[name]]`, `rest` for `[...name]`; each also in its `=matcher` form. */
  kind: 'required' | 'optional' | 'rest';
}

/**
 * Read one segment of a route id as a param segment.
 * @param segment - One slash-separated segment of a route id.
 * @returns The param it declares, or `undefined` when the segment is static text or a route group.
 */
export function parseParamSegment(segment: string): ParamSegment | undefined {
  const optional = /^\[\[([^\]=]+)(?:=[^\]]+)?\]\]$/.exec(segment);
  if (optional) return { name: optional[1], kind: 'optional' };
  const rest = /^\[\.\.\.([^\]=]+)(?:=[^\]]+)?\]$/.exec(segment);
  if (rest) return { name: rest[1], kind: 'rest' };
  const required = /^\[([^\]=]+)(?:=[^\]]+)?\]$/.exec(segment);
  if (required) return { name: required[1], kind: 'required' };
  return undefined;
}

/**
 * Turn a route id into a path: route groups are dropped, the locale segment becomes the locale and every param segment is filled from `params`.
 * @param route - The name the route id is known by, used in the error message.
 * @param routeId - The SvelteKit route id to fill.
 * @param locale - The value of the locale segment, where the route id holds one.
 * @param params - Values for the param segments. An optional segment without a value is dropped.
 * @returns The path. It never holds a bracketed segment.
 * @throws If a required or rest param segment has no value.
 */
export function fillRouteId({
  route,
  routeId,
  locale,
  params = {}
}: {
  route: string;
  routeId: string;
  locale: string;
  params?: RouteParams;
}): string {
  return routeId
    .split('/')
    .map((segment) => {
      if (segment === LOCALE_SEGMENT) return locale;
      if (segment.startsWith('(')) return undefined;
      const param = parseParamSegment(segment);
      if (!param) return segment;
      const value = params[param.name];
      if (value) return value;
      if (param.kind === 'optional') return undefined;
      throw new Error(
        `buildRoute: the param "${param.name}" of route "${route}" (${routeId}) is not filled. Pass it in \`params\`.`
      );
    })
    .filter((segment) => segment !== undefined)
    .join('/');
}

/**
 * A limited route builder to use in testing because we cannot use the real `buildRoute` that depends on Svelte kit.
 * @param route - The name of the route.
 * @param locale - The value of the locale segment, where the route id holds one.
 * @param params - Values for the route's param segments. An optional segment without a value is dropped.
 * @returns The path, without route groups and without any bracketed segment.
 * @throws If a required or rest param segment has no value.
 */
export function buildRoute({ route, locale, params }: { route: Route; locale: string; params?: RouteParams }): string {
  return fillRouteId({ route, routeId: ROUTE[route], locale, params });
}
