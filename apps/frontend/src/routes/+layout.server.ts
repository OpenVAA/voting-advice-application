/**
 * # Root server loader — the request's session, and the cookies a universal load may rebuild a client from
 *
 * ## Why this file exists
 *
 * A universal load runs twice — once on the SSR pass and once in the browser — and it has no `event`, so it cannot reach the per-request, cookie-bearing client `hooks.server.ts` puts on `event.locals`. Until this file, `routes/+layout.ts` closed that gap by handing the adapter a bare `fetch`, which fell through to a plain anonymous client: SvelteKit's load `fetch` forwards cookies same-domain only and Supabase is cross-origin, and PostgREST authenticates on `Authorization` rather than on cookies, so the transport override changed nothing about the credential. That is ruling **D10**'s root cause. The remedy is the official `@supabase/ssr` isomorphic shape: this server load returns the cookie list, which IS serialisable, and `routes/+layout.ts` rebuilds a real cookie-bearing client from it, which is NOT.
 *
 * ## The payload shape, and where it comes from
 *
 * There is no in-tree analog of a server load returning a cookie array, so the shape below is derived from the mechanism rather than copied: `createServerClient`'s cookie adapter reads `getAll()` and uses only `name` and `value`, so only `name` and `value` cross — the options a cookie was WRITTEN with (`httpOnly`, `secure`, `sameSite`, `maxAge`) are meaningless on the read side and are dropped rather than serialised.
 *
 * The key is `supabaseCookies` and not `cookies` on purpose: it says WHICH cookies, so a later reader cannot mistake it for the request's whole jar, and it keeps the payload's name honest about the filter below.
 *
 * ## ⚠ Why there is NO `session` here, and why there must not be
 *
 * This load used to return `locals.safeGetSession()`'s whole `Session` — `access_token`, **`refresh_token`**, `expires_at` and the full `user` record — alongside the cookie array. Everything a server load returns is serialised into the hydration payload in the HTML body, so that put a REFRESH TOKEN into the document of every route in the application, for every authenticated user. The refresh token is the higher-value credential of the pair: it is long-lived, and duplicating it into a document body exposes it to HTML/page caches (`render.example.yaml` provisions a cache disk for this service), to `view-source` sharing, and to DOM-snapshot error reporters.
 *
 * Nothing read it. `routes/+layout.ts` shadows this load and deliberately does not forward it, and `authContext`'s `page.data.session` is supplied by `routes/admin/+layout.server.ts` and `routes/candidate/+layout.server.ts`. Computing it also cost a `getUser()` round-trip to Supabase Auth on every authenticated request for a value nobody consumed.
 *
 * A future consumer that genuinely needs the session at the root gets a PROJECTION — `{ userId, expiresAt }` — and never the token-bearing object.
 *
 * ## ⚠ Shadowing
 *
 * `routes/+layout.ts` EXISTS, so it shadows this file: a missing layout module behaves as `({ data }) => data`, but a present one forwards only what it explicitly returns. Anything a descendant needs from here must appear in that file's return object. Its symptom when forgotten is an app that works on client-side navigation and 403s on refresh.
 */

import { SUPABASE_COOKIE_PREFIX } from '$lib/api/dataProvider';
import type { UniversalCookie } from '$lib/api/dataProvider';

export function load({ cookies }) {
  // ⚠ THE FILTER BELOW IS A DATA-PROTECTION BOUNDARY, NOT A TIDINESS MEASURE. Everything a server load returns is serialised into the HTML and is therefore readable by client JavaScript. `@supabase/ssr` writes its own auth cookies with `httpOnly: false`, so those are already JS-readable and passing them discloses nothing new — but the unfiltered read on the next line also yields this application's genuinely `httpOnly` cookies: the bank-auth `id_token` (`api/oidc/token/+server.ts`, `api/oidc/callback/+server.ts`), the OIDC `oidc_state` and `oidc_nonce` replay/CSRF guards (`api/oidc/authorize/+server.ts`), and the preregister pair. Serialising ANY of those into the payload defeats the `httpOnly` flag outright, because the whole point of that flag is that client-side JavaScript cannot read the value and an SSR payload is readable by exactly that. `requestCookies` is therefore a LOCAL and never a return value; only `supabaseCookies` leaves this function. The prefix is imported rather than spelled here so that a future `cookieOptions.name` cannot silently empty the array; see `SUPABASE_COOKIE_PREFIX`.
  const requestCookies = cookies.getAll();
  const supabaseCookies: Array<UniversalCookie> = requestCookies
    .filter(({ name }) => name.startsWith(SUPABASE_COOKIE_PREFIX))
    .map(({ name, value }) => ({ name, value }));

  return { supabaseCookies };
}
