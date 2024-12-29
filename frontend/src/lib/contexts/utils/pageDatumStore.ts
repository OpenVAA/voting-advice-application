import { derived, type Readable } from 'svelte/store';
import { page } from '$app/stores';

/**
 * Create a derived substore for a specific `page.data` subkey.
 * TODO[Svelte 5]: See if we can replace this with subscriptions targeting subproperties.
 * @param datum - The name of the subkey in `page.data`.
 * @typeParam TData - The type of the data.
 * @returns A readable store for the specified `page.data` subkey or `Error` if the data is not available.
 */
export function pageDatumStore<TData>(datum: string): Readable<Promise<TData | Error> | undefined> {
  return derived(page, ({ data }) => data?.[datum]);
}
