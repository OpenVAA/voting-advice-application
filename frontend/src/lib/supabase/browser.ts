import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';
import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '@openvaa/supabase-types';

let browserClient: ReturnType<typeof createBrowserClient<Database>> | null = null;

/**
 * Get or create the browser-side Supabase client.
 * Singleton -- safe to call multiple times.
 */
export function createSupabaseBrowserClient() {
  if (browserClient) return browserClient;
  browserClient = createBrowserClient<Database>(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY);
  return browserClient;
}
