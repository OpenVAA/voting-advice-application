import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '@openvaa/supabase-types';
import { constants } from '$lib/utils/constants';

let browserClient: ReturnType<typeof createBrowserClient<Database>> | null = null;

/**
 * Get or create the browser-side Supabase client.
 * Singleton -- safe to call multiple times.
 */
export function createSupabaseBrowserClient() {
  if (browserClient) return browserClient;
  browserClient = createBrowserClient<Database>(constants.PUBLIC_SUPABASE_URL, constants.PUBLIC_SUPABASE_ANON_KEY);
  return browserClient;
}
