import { isPersistentSearchParam, isRouteParam, type Params } from './params';

/**
 * Filter out any non-persistent search parameters from the given params. Used to remove them from the `current` route when updating the URL.
 * @param params - Combined params.
 * @returns A new object with all route params and persistent search parameters.
 */
export function filterPersistent(params: Partial<Params>): Partial<Params> {
  return Object.fromEntries(
    Object.entries(params).filter(([key]) => isRouteParam(key) || isPersistentSearchParam(key))
  );
}
