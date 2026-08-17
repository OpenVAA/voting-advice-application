import { page } from '$app/stores';
import { parsimoniusDerived } from './parsimoniusDerived';
import type { Readable } from 'svelte/store';

/**
 * Create a derived substore for a specific `page.data` subkey.
 * TODO[Svelte 5]: See if we can replace this with subscriptions targeting subproperties.
 * @param datum - The name of the subkey in `page.data`.
 * @typeParam TData - The type of the data.
 * @returns A readable store for the specified `page.data` subkey or `Error` if the data is not available.
 */
export function pageDatumStore<TData>(datum: string): Readable<Promise<TData | Error> | undefined> {
  return parsimoniusDerived(page, (page) => page.data[datum], { differenceChecker: JSON.stringify });
}
