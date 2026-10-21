import { createServerClient } from '@supabase/ssr';
import { constants } from '$lib/utils/constants';
import type { SetAllCookies } from '@supabase/ssr';
import type { RequestEvent } from '@sveltejs/kit';
import type { SupabaseDatabase } from '$lib/api/adapters/supabase/supabaseAdapter.type';

/**
 * The cookie adapter `createSupabaseServerClient` writes this request's auth cookies through.
 *
 * `httpOnly: false` is set here rather than inherited from `@supabase/ssr`'s defaults. `routes/+layout.server.ts` and `routes/(voters)/(located)/+layout.server.ts` forward these cookies into the SSR payload, which is safe only because client JavaScript can already read them. Setting the flag after the spread keeps that contract in this file: making the cookies `httpOnly` means editing this line, whose test then fails, and revisiting both payload filters.
 *
 * `setAll` also forwards the headers `@supabase/ssr` passes with the cookies. It passes `Cache-Control`, `Expires` and `Pragma` values that mark a response writing auth cookies as uncacheable, so no CDN or proxy serves one user's session to another. SvelteKit's `setHeaders` throws when a header is set twice in one request, so a header name is forwarded at most once per adapter, and an adapter belongs to one request.
 *
 * Kept separate from the client factory so the write path can be tested without constructing a client; see `server.test.ts`.
 * @param event - The request event whose cookie jar is read and written, and whose response headers are set.
 * @returns The `getAll`/`setAll` pair `createServerClient` expects.
 */
export function createSupabaseCookieAdapter(event: RequestEvent) {
  const forwardedHeaders = new Set<string>();
  return {
    getAll: () => event.cookies.getAll(),
    setAll: (cookiesToSet: Parameters<SetAllCookies>[0], headers: Parameters<SetAllCookies>[1] = {}) => {
      cookiesToSet.forEach(({ name, value, options }) => {
        event.cookies.set(name, value, { ...options, httpOnly: false, path: '/' });
      });
      const toForward: Record<string, string> = {};
      for (const [name, value] of Object.entries(headers)) {
        const key = name.toLowerCase();
        if (forwardedHeaders.has(key)) continue;
        forwardedHeaders.add(key);
        toForward[name] = value;
      }
      if (Object.keys(toForward).length > 0) event.setHeaders(toForward);
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
