import { SUPABASE_COOKIE_PREFIX } from '$lib/api/dataProvider';
import type { Cookies, ServerLoadEvent } from '@sveltejs/kit';
import type { UniversalCookie } from '$lib/api/dataProvider';

/**
 * The Supabase auth cookies of a request, as the `supabaseCookies` a server load returns so that its universal `+layout.ts` can rebuild a cookie-bearing client with `createSupabaseUniversalClient`. Only `name` and `value` cross: the client's `getAll()` reads nothing else.
 *
 * ⚠ The filter is a data-protection boundary. Everything a server load returns is serialised into the hydration payload of the document and of `__data.json`, where client JavaScript can read it. `cookies.getAll()` also yields this application's `httpOnly` cookies (the identity provider's `oidc_*` cookies and `identity_provider_arrival`), and serialising any of them would defeat that flag, so only names that start with {@link SUPABASE_COOKIE_PREFIX}, the project's storage key, pass. The prefix is imported rather than spelled, so that a renamed storage key cannot silently empty the array and leave the server-rendered pass anonymous.
 *
 * The payload therefore carries a signed-in user's access and refresh tokens, and that is accepted:
 * - It follows the current Supabase SvelteKit guide, whose root `+layout.server.ts` returns `cookies.getAll()` and whose `+layout.ts` builds `createServerClient` with a `getAll()` that returns `data.cookies`. This filter is stricter: it forwards the storage key's cookies alone.
 * - The auth cookies are not `httpOnly`, and need not be: the browser client reads the refresh token from them to refresh the session.
 * - A document or `__data.json` that carries them must never be cached by a CDN or a shared proxy. The `Cache-Control`, `Expires` and `Pragma` headers `@supabase/ssr` hands `setAll` for that are applied in `lib/supabase/server.ts`.
 *
 * @param cookies - The request's cookies.
 * @returns The Supabase auth cookies, as name and value.
 */
export function supabaseCookiesOf(cookies: Cookies): Array<UniversalCookie> {
  return cookies
    .getAll()
    .filter(({ name }) => name.startsWith(SUPABASE_COOKIE_PREFIX))
    .map(({ name, value }) => ({ name, value }));
}

/**
 * A server load that returns only the request's Supabase auth cookies, for a subtree whose universal load builds its own client.
 *
 * A universal load has its own server load's `data` without `await parent()`, and `parent()` resolves only after the root load's Supabase round-trips, so a subtree with this load starts its reads in parallel with the root's. The cost is that the client is rebuilt once per server-load boundary.
 *
 * @param event - The request event, of which only `cookies` is read.
 * @returns The `supabaseCookies` payload.
 */
export function supabaseCookiesLoad({ cookies }: Pick<ServerLoadEvent, 'cookies'>): {
  supabaseCookies: Array<UniversalCookie>;
} {
  return { supabaseCookies: supabaseCookiesOf(cookies) };
}
