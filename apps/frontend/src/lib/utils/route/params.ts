////////////////////////////////////////////////////////////////////
// Param names
////////////////////////////////////////////////////////////////////

/**
 * An allowed route or search parameter.
 */
export type Param = RouteParam | PersistentSearchParam;

////////////////////////////////////////////////////////////////////
// Name-disjoint dissociation rule (Phase 88 Plan 88-02)
// ----------------------------------------------------------------
// `ROUTE_PARAMS` and `PERSISTENT_SEARCH_PARAMS` are intentionally
// NAME-DISJOINT — no string appears in both arrays. The two surfaces
// are read via different SvelteKit primitives:
//   - ROUTE_PARAMS members are surfaced via `page.params.<key>` (and
//     emitted onto the URL path by `buildRoute` via SvelteKit's
//     `resolveRoute`).
//   - PERSISTENT_SEARCH_PARAMS members are surfaced via
//     `url.searchParams` / `qs.parse(url.search)` (and emitted by
//     `buildRoute` via `qs.stringify`).
//
// The election-related keys illustrate the rule:
//   - `electionTab` is the ROUTE-side key — a singular SELECTED election
//     whose `/results/[[electionTab]]/...` page is being rendered.
//   - `electionId` is the SEARCH-side key — the AVAILABLE-array of
//     elections the voter chose at `/elections`, drives
//     nomination/question filtering via `voterContext.selectedElections`.
// The two never collide because they have DIFFERENT identifiers in code
// (`electionTab` ≠ `electionId`). A caller wanting both surfaces
// populated (set the selected election AND scope to a specific
// available pool) passes both keys to `buildRoute`:
//   `buildRoute({ route: 'Results', electionTab: 'foo', electionId: ['foo', 'bar'] })`.
//
// `constituencyId` follows the same search-side pattern (AVAILABLE
// constituencies surface).
////////////////////////////////////////////////////////////////////

/**
 * The names of the `Params` that are route params.
 */
export const ROUTE_PARAMS = [
  'categoryId',
  'electionTab',
  'entity',
  'entityId',
  'entityTab',
  'entityType',
  'id',
  'jobId',
  'questionId'
] as const;

export type RouteParam = (typeof ROUTE_PARAMS)[number];

export function isRouteParam(key: string): key is RouteParam {
  return ROUTE_PARAMS.includes(key as RouteParam);
}

/**
 * The names of the `Params` that are search params that will persist between route changes, i.e. they will be picked up from the `current` route.
 *
 * NOTE: `electionId` is the SEARCH-side AVAILABLE-array surface; its
 * route-side SELECTED-singular counterpart is `electionTab` in
 * `ROUTE_PARAMS` (see name-disjoint dissociation block above).
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
 *
 * `electionTab` is NOT a member of this array — the route segment is
 * always singular (one selected election per results-tab render).
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
