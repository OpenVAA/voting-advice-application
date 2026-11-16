import { createBrowserClient } from '@supabase/ssr';
import { constants } from '$lib/utils/constants';
import type { SupabaseDatabase } from '$lib/api/adapters/supabase/supabaseAdapter.type';

let browserClient: ReturnType<typeof createBrowserClient<SupabaseDatabase>> | null = null;

/**
 * Get or create the browser-side Supabase client. Safe to call repeatedly.
 *
 * `@supabase/ssr`'s `createBrowserClient` already keeps one module-level client in a browser and returns it on every later call, discarding the options later callers pass. This memo gives that singleton one named entry point with one argument list. Never hand this factory, or `createBrowserClient` directly, a per-load or per-request value such as a SvelteKit load `fetch`: only the first caller's copy survives, and it outlives the load it belonged to.
 */
export function createSupabaseBrowserClient() {
  if (browserClient) return browserClient;
  browserClient = createBrowserClient<SupabaseDatabase>(
    constants.PUBLIC_SUPABASE_URL,
    constants.PUBLIC_SUPABASE_ANON_KEY
  );
  return browserClient;
}
