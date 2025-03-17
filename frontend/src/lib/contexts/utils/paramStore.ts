import { page } from '$app/stores';
import { type ArrayParam, type Param, parseParams } from '$lib/utils/route';
import { parsimoniusDerived } from './parsimoniusDerived';
import type { Readable } from 'svelte/store';

/**
 * Create a derived store that holds the value of a route or search parameter.
 * @param param - The name of the parameter.
 * @returns A readable store.
 */
export function paramStore<TParam extends Param>(
  param: TParam
): Readable<TParam extends ArrayParam ? Array<string> : string | undefined> {
  return parsimoniusDerived(
    page,
    (page) => parseParams(page)[param] as TParam extends ArrayParam ? Array<string> : string | undefined,
    { differenceChecker: JSON.stringify }
  );
}
