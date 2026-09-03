import { createServerClient } from '@supabase/ssr';
import { constants } from '$lib/utils/constants';
import type { Database } from '@openvaa/supabase-types';
import type { CookieOptions } from '@supabase/ssr';
import type { RequestEvent } from '@sveltejs/kit';

/**
 * The cookie adapter `createSupabaseServerClient` writes this request's auth cookies through.
 *
 * ## ⚠ `httpOnly: false` is ASSERTED here, not inherited
 *
 * `routes/+layout.server.ts` and `routes/(voters)/(located)/+layout.server.ts` forward the request's Supabase auth cookies into the SSR payload, and the whole justification for doing so is that these cookies are already readable by client JavaScript. That property was previously a TRANSITIVE dependency on a third-party default — `@supabase/ssr`'s `DEFAULT_COOKIE_OPTIONS` sets `httpOnly: false` (`node_modules/@supabase/ssr/dist/main/utils/constants.js`) — spread into `event.cookies.set` by the line below. The day that default changes, or the day someone hardens the cookie with `httpOnly: true`, the payload filter would keep forwarding the same names and quietly defeat the flag.
 *
 * Pinning the flag AFTER the spread makes the payload contract local, visible and assertable: the forwarded set is `httpOnly: false` because this file says so. Anyone who wants these cookies to become `httpOnly` has to edit this line, which is also the line whose spec fails when they do — at which point the two payload filters are the change they must reckon with.
 *
 * Extracted from the client factory so the write path can be exercised without constructing a Supabase client; see `server.test.ts`.
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
  return createServerClient<Database>(constants.PUBLIC_SUPABASE_URL, constants.PUBLIC_SUPABASE_ANON_KEY, {
    cookies: createSupabaseCookieAdapter(event)
  });
}
