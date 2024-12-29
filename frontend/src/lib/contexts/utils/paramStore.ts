import { derived, type Readable } from 'svelte/store';
import { page } from '$app/stores';
import { type ArrayParam, type Param, parseParams } from '$lib/utils/route';

/**
 * Create a derived store that holds the value of a route or search parameter.
 * @param param - The name of the parameter.
 * @returns A readable store.
 */
export function paramStore<TParam extends Param>(
  param: TParam
): Readable<TParam extends ArrayParam ? Array<string> : string | undefined> {
  return derived(
    page,
    (page) => {
      const params = parseParams(page);
      return params[param];
    },
    undefined
  ) as Readable<TParam extends ArrayParam ? Array<string> : string | undefined>;
}
