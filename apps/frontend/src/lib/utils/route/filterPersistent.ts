import { isPersistentSearchParam, isRouteParam } from './params';
import type { Params } from './params';

/**
 * Filter out any non-persistent search parameters from the given params. Used to remove them from the `current` route when updating the URL.
 *
 * Name-disjoint dissociation rule (see phase 88):
 * ----------------------------------------------------------------
 * `electionId` lives ONLY in `PERSISTENT_SEARCH_PARAMS` (the AVAILABLE-
 * array search-side surface), and `electionTab` lives ONLY in
 * `ROUTE_PARAMS` (the SELECTED-singular route-side surface). This
 * function preserves BOTH via the simple `isRouteParam(key) ||
 * isPersistentSearchParam(key)` concatenation below, with no name
 * collision because the two arrays are name-disjoint. See the block
 * comment in `params.ts` for the full dissociation contract.
 *
 * @param params - Combined params.
 * @returns A new object with all route params and persistent search parameters.
 */
export function filterPersistent(params: Partial<Params>): Partial<Params> {
  return Object.fromEntries(
    Object.entries(params).filter(([key]) => isRouteParam(key) || isPersistentSearchParam(key))
  );
}
