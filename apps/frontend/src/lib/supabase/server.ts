import { createServerClient } from '@supabase/ssr';
import { constants } from '$lib/utils/constants';
import type { CookieOptions } from '@supabase/ssr';
import type { RequestEvent } from '@sveltejs/kit';
import type { SupabaseDatabase } from '$lib/api/adapters/supabase/supabaseAdapter.type';

/**
 * The cookie adapter `createSupabaseServerClient` writes this request's auth cookies through.
 *
 * `httpOnly: false` is set here rather than inherited from `@supabase/ssr`'s defaults. `routes/+layout.server.ts` and `routes/(voters)/(located)/+layout.server.ts` forward these cookies into the SSR payload, which is safe only because client JavaScript can already read them. Setting the flag after the spread keeps that contract in this file: making the cookies `httpOnly` means editing this line, whose test then fails, and revisiting both payload filters.
 *
 * Kept separate from the client factory so the write path can be tested without constructing a client; see `server.test.ts`.
 * @param event - The request event whose cookie jar is read and written.
 * @returns The `getAll`/`setAll` pair `createServerClient` expects.
 */
export function createSupabaseCookieAdapter(event: RequestEvent) {
  return {
    getAll: () => event.cookies.getAll(),
    setAll: (cookiesToSet: Array<{ name: string; value: string; options: CookieOptions }>) => {
      cookiesToSet.forEach(({ name, value, options }) => {
        event.cookies.set(name, value, { ...options, httpOnly: false, path: '/' });
      });
    }
  };
}

/**
 * Create a Supabase server client with cookie-based auth.
 * Call this once per request in hooks.server.ts and attach to event.locals.
 */
export function createSupabaseServerClient(event: RequestEvent) {
  return createServerClient<SupabaseDatabase>(constants.PUBLIC_SUPABASE_URL, constants.PUBLIC_SUPABASE_ANON_KEY, {
    cookies: createSupabaseCookieAdapter(event)
  });
}
