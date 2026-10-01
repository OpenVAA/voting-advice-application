import { createServerClient, isBrowser } from '@supabase/ssr';
import { constants } from '$lib/utils/constants';
import { createSupabaseBrowserClient } from './browser';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { SupabaseDatabase } from '$lib/api/adapters/supabase/supabaseAdapter.type';

/**
 * Derive the auth-cookie name prefix `@supabase/ssr` uses for a given project URL.
 *
 * Mirrors `@supabase/supabase-js`'s default storage key, ``` `sb-${baseUrl.hostname.split('.')[0]}-auth-token` ```. `@supabase/ssr` writes that key, its `.0`/`.1` chunk suffixes and the `-code-verifier` PKCE companion as cookie names, and this prefix covers them all.
 *
 * It never throws, because both callers evaluate it at module scope, where a `TypeError` from an unparseable URL would stop the SSR process at startup. The `'sb-'` fallback is the widest safe superset and is unreachable in a working deployment, since `createServerClient` throws on the same input.
 * @param supabaseUrl - The project URL every client in this app is constructed from.
 * @returns The prefix the request's auth cookies carry.
 */
export function resolveSupabaseCookiePrefix(supabaseUrl: string): string {
  try {
    return `sb-${new URL(supabaseUrl).hostname.split('.')[0]}-auth-token`;
  } catch {
    return 'sb-';
  }
}

/**
 * The name prefix of every cookie `@supabase/ssr` writes for this project. The payload filter and this module's client are both derived from it.
 *
 * It is a constant rather than a literal at the filter because a `cookieOptions.name` would rename the storage key; a filter over a literal would then match nothing, and the SSR pass would silently become anonymous. Deriving both sides from one name makes such a rename fail in one place.
 *
 * It is the whole storage key rather than `sb-` because the filtered payload is published from the root server load into every page. A bare `sb-` prefix would also forward any other cookie whose name begins with `sb-`, which the `httpOnly: false` argument does not cover. The storage key limits the forwarded set to the cookies `server.ts` writes with `httpOnly: false`.
 */
export const SUPABASE_COOKIE_PREFIX = resolveSupabaseCookiePrefix(constants.PUBLIC_SUPABASE_URL);

/**
 * One cookie as it crosses the `+layout.server.ts` → `+layout.ts` payload boundary: a name and a value, never the options.
 *
 * The producer must filter the list to the Supabase auth cookies. Those are written `httpOnly: false` (set in `lib/supabase/server.ts`), so forwarding them discloses nothing client JavaScript could not already read; but `cookies.getAll()` also returns genuinely `httpOnly` cookies, such as `id_token`, `oidc_state`, `oidc_nonce` and the preregister pair, and serialising those into the HTML would defeat the flag. This module never reads the request, so the filtering belongs to the producer, and {@link SUPABASE_COOKIE_PREFIX} keeps that filter narrow.
 */
export type UniversalCookie = { name: string; value: string };

/**
 * Create the Supabase client a universal load needs, one that works on the SSR pass and in the browser from the same call.
 *
 * A universal load runs on the server and in the browser and has no `event`, so it cannot reach `locals.supabase`. SvelteKit's load `fetch` does not carry the session either: it forwards cookies to the same domain only, Supabase is cross-origin, and PostgREST authenticates on `Authorization` rather than on cookies. This follows the `@supabase/ssr` isomorphic pattern instead: the server load returns the serialisable cookie list, the SSR pass rebuilds a cookie-bearing client from it, and the browser pass uses the browser client.
 *
 * There is no `cookies.setAll`: a universal load holds no `RequestEvent` and cannot write `Set-Cookie`, so a setter here could only be a silent no-op. Session writes stay with `hooks.server.ts`. There is no fallback either; `isBrowser()` tells the two runtimes apart.
 *
 * The browser arm does not receive this load's `fetch`. `createBrowserClient` caches its first client in a browser and discards later callers' options, and this function runs first, from the root universal load, so passing `fetch` would bind the tab's client to a load that finishes moments later. Going through `createSupabaseBrowserClient()` keeps one browser client per tab and leaves `fetch` to the server arm, where the client is per request.
 * @param options - The request-scoped `fetch` and the Supabase auth cookies the server load forwarded.
 * @returns A client bound to that request's cookies on the server, or the tab's single browser client in the browser.
 */
export function createSupabaseUniversalClient({
  fetch,
  cookies
}: {
  fetch: Fetch;
  cookies: Array<UniversalCookie>;
}): SupabaseClient<SupabaseDatabase> {
  if (isBrowser()) return createSupabaseBrowserClient();
  return createServerClient<SupabaseDatabase>(constants.PUBLIC_SUPABASE_URL, constants.PUBLIC_SUPABASE_ANON_KEY, {
    global: { fetch },
    cookies: { getAll: () => cookies }
  });
}
