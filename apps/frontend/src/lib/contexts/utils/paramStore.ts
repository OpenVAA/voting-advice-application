import { page } from '$app/stores';
import { parseParams } from '$lib/utils/route';
import { parsimoniusDerived } from './parsimoniusDerived';
import type { Readable } from 'svelte/store';
import type { ArrayParam, Param } from '$lib/utils/route';

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
