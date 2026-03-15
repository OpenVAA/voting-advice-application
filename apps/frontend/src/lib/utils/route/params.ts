////////////////////////////////////////////////////////////////////
// Param names
////////////////////////////////////////////////////////////////////

/**
 * An allowed route or search parameter.
 */
export type Param = RouteParam | PersistentSearchParam;

/**
 * The names of the `Params` that are route params.
 */
export const ROUTE_PARAMS = ['categoryId', 'entityId', 'entityType', 'jobId', 'lang', 'questionId'] as const;

export type RouteParam = (typeof ROUTE_PARAMS)[number];

export function isRouteParam(key: string): key is RouteParam {
  return ROUTE_PARAMS.includes(key as RouteParam);
}

/**
 * The names of the `Params` that are search params that will persist between route changes, i.e. they will be picked up from the `current` route.
 */
export const PERSISTENT_SEARCH_PARAMS = ['constituencyId', 'electionId'] as const;

export type PersistentSearchParam = (typeof PERSISTENT_SEARCH_PARAMS)[number];

export function isPersistentSearchParam(key: string): key is PersistentSearchParam {
  return PERSISTENT_SEARCH_PARAMS.includes(key as PersistentSearchParam);
}

////////////////////////////////////////////////////////////////////
// Param value types
////////////////////////////////////////////////////////////////////

/**
 * The names of the `Params` that are accept multiple values. Make sure these match the types in `Params`.
 */
export const ARRAY_PARAMS = ['constituencyId', 'electionId'] as const;

export type ArrayParam = (typeof ARRAY_PARAMS)[number];

export function isArrayParam(key: string): key is ArrayParam {
  return ARRAY_PARAMS.includes(key as ArrayParam);
}

/**
 * The types route or query params.
 */
export type NamedParams = {
  [TParam in Param]: TParam extends ArrayParam ? string | Array<string> : string;
};

/**
 * Any params that can be passed to `buildRoute`.
 */
export type Params = NamedParams & Record<string, string | Array<string>>;
