import { createBrowserClient } from '@supabase/ssr';
import { constants } from '$lib/utils/constants';
import type { Database } from '@openvaa/supabase-types';

let browserClient: ReturnType<typeof createBrowserClient<Database>> | null = null;

/**
 * Get or create the browser-side Supabase client.
 * Singleton -- safe to call multiple times.
 *
 * ⚠ THERE IS A SECOND MEMO UNDERNEATH THIS ONE. `@supabase/ssr@0.9.0`'s `createBrowserClient` keeps its own module-level `cachedBrowserClient` and returns it on every call after the first in a browser, DISCARDING the options each later caller passes. The `browserClient` memo above is therefore not what makes the client a singleton — the library already does that — but it is what makes the singleton NAMED, so every caller in this app reaches the same client through one function with one argument list. The rule that follows is the one WR-01 was about: nothing may hand this factory, or `createBrowserClient` directly, a per-load or per-request value such as a SvelteKit load `fetch`, because only the first caller's copy survives and it then outlives the load it belonged to.
 */
export function createSupabaseBrowserClient() {
  if (browserClient) return browserClient;
  browserClient = createBrowserClient<Database>(constants.PUBLIC_SUPABASE_URL, constants.PUBLIC_SUPABASE_ANON_KEY);
  return browserClient;
}
