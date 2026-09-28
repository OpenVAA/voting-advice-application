import { browser } from '$app/environment';
import { createDataWriter } from '$lib/api/dataWriter';

/**
 * Throw unless running in a browser. The context writer sites assert this before building a writer, so the `browser` arm can take the tab's memoised Supabase client without an adapter checking its own environment.
 */
export function assertBrowser(): void {
  if (!browser) throw new Error('Writer methods in contexts can only be called in a browser environment');
}

/**
 * Build a `DataWriter` for one browser write. Every call returns a fresh writer over the tab's memoised Supabase client.
 * @returns A new writer.
 */
export function prepareDataWriter(): ReturnType<typeof createDataWriter> {
  assertBrowser();
  return createDataWriter({ fetch, browser: true });
}
