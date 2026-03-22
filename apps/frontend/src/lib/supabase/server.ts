import { createServerClient } from '@supabase/ssr';
import type { Database } from '@openvaa/supabase-types';
import type { RequestEvent } from '@sveltejs/kit';
import { constants } from '$lib/utils/constants';

/**
 * Create a Supabase server client with cookie-based auth.
 * Call this once per request in hooks.server.ts and attach to event.locals.
 */
export function createSupabaseServerClient(event: RequestEvent) {
  return createServerClient<Database>(constants.PUBLIC_SUPABASE_URL, constants.PUBLIC_SUPABASE_ANON_KEY, {
    cookies: {
      getAll: () => event.cookies.getAll(),
      setAll: (cookiesToSet) => {
        cookiesToSet.forEach(({ name, value, options }) => {
          event.cookies.set(name, value, { ...options, path: '/' });
        });
      }
    }
  });
}
