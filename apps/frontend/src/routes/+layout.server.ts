/**
 * # Root server loader — the Supabase cookies a universal load rebuilds its client from
 *
 * ## Why this file exists
 *
 * A universal load runs twice — once on the SSR pass and once in the browser — and it has no `event`, so it cannot reach the per-request, cookie-bearing client `hooks.server.ts` puts on `event.locals`. A bare `fetch` cannot stand in for that client: SvelteKit's load `fetch` forwards cookies same-domain only, Supabase is cross-origin, and PostgREST authenticates on `Authorization` rather than on cookies. So this server load returns the cookie list, which IS serialisable, and `routes/+layout.ts` rebuilds a real cookie-bearing client from it, which is NOT. That is the official `@supabase/ssr` isomorphic shape.
 *
 * ## The payload shape
 *
 * `createServerClient`'s cookie adapter reads `getAll()` and uses only `name` and `value`, so only `name` and `value` cross — the options a cookie was WRITTEN with (`httpOnly`, `secure`, `sameSite`, `maxAge`) are meaningless on the read side and are dropped rather than serialised.
 *
 * The key is `supabaseCookies` and not `cookies` on purpose: it says WHICH cookies, so a reader cannot mistake it for the request's whole jar, and it keeps the payload's name honest about the filter below.
 *
 * ## ⚠ Why there is NO `session` here, and why there must not be
 *
 * This load returns no `Session`. Everything a server load returns is serialised into the hydration payload in the HTML body, so a session returned here would sit in the document of every route in the application, for every authenticated user, carrying `access_token`, **`refresh_token`**, `expires_at` and the full `user` record. The refresh token is the higher-value credential of the pair: it is long-lived, and a document body exposes it to HTML/page caches, to `view-source` sharing, and to DOM-snapshot error reporters.
 *
 * Nothing needs it here either. `routes/+layout.ts` shadows this load and does not forward a session, and `authContext`'s `page.data.session` is supplied by `routes/admin/+layout.server.ts` and `routes/contestant/+layout.server.ts`. Computing it would also cost a `getUser()` round-trip to Supabase Auth on every authenticated request.
 *
 * A consumer that genuinely needs the session at the root gets a PROJECTION — `{ userId, expiresAt }` — and never the token-bearing object. `scripts/assert-no-session-in-loads.mjs` fails the lint chain if any server load returns the verified-session binding itself.
 *
 * ## The analytics projection
 *
 * `analytics` says only whether a relay is active and in which consent and visit-id modes. The provider's name and its key stay on the server, for the reason given above for the session: everything a server load returns is serialised into the hydration payload. This load reads no request URL, so it runs once per document and one document sees one mode.
 *
 * ## ⚠ Shadowing
 *
 * `routes/+layout.ts` EXISTS, so it shadows this file: a missing layout module behaves as `({ data }) => data`, but a present one forwards only what it explicitly returns. Anything a descendant needs from here must appear in that file's return object. Its symptom when forgotten is an app that works on client-side navigation and 403s on refresh.
 */

import { SUPABASE_COOKIE_PREFIX } from '$lib/api/dataProvider';
import { analyticsProjection } from '$lib/server/analytics/env';
import type { UniversalCookie } from '$lib/api/dataProvider';

export function load({ cookies }) {
  // ⚠ THE FILTER BELOW IS A DATA-PROTECTION BOUNDARY, NOT A TIDINESS MEASURE. Everything a server load returns is serialised into the HTML and is therefore readable by client JavaScript. `@supabase/ssr` writes its own auth cookies with `httpOnly: false`, so those are already JS-readable and passing them discloses nothing new — but the unfiltered read on the next line also yields this application's genuinely `httpOnly` cookies: the OIDC `oidc_state` and `oidc_nonce` replay/CSRF guards, the `oidc_code_verifier` PKCE companion and the `oidc_entity_type` selector (`api/oidc/authorize/+server.ts`), and the `identity_provider_arrival` marker (`api/oidc/callback/+server.ts`). Serialising ANY of those into the payload defeats the `httpOnly` flag outright, because the whole point of that flag is that client-side JavaScript cannot read the value and an SSR payload is readable by exactly that. `requestCookies` is therefore a LOCAL and never a return value; only `supabaseCookies` leaves this function. The prefix is imported rather than spelled here so that a future `cookieOptions.name` cannot silently empty the array; see `SUPABASE_COOKIE_PREFIX`.
  const requestCookies = cookies.getAll();
  const supabaseCookies: Array<UniversalCookie> = requestCookies
    .filter(({ name }) => name.startsWith(SUPABASE_COOKIE_PREFIX))
    .map(({ name, value }) => ({ name, value }));

  return { supabaseCookies, analytics: analyticsProjection };
}
