import { browser } from '$app/environment';
import { createDataWriter } from '$lib/api/dataWriter';

/**
 * The browser invariant the context writer sites share, asserted in one place rather than at each of the nineteen call sites.
 * It is what makes the `browser` arm's client source a fact: the factories take the tab's memoized Supabase client because the caller has already proven it is running in a tab, so no adapter has to sniff its own environment.
 */
export function assertBrowser(): void {
  if (!browser) throw new Error('Writer methods in contexts can only be called in a browser environment');
}

/**
 * Build a `DataWriter` for ONE browser write, over the tab's memoized Supabase client.
 * @returns A writer nothing else holds a reference to.
 */
export function prepareDataWriter(): ReturnType<typeof createDataWriter> {
  assertBrowser();
  return createDataWriter({ fetch, browser: true });
}
