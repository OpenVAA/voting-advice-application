/**
 * # Root server loader — the Supabase cookies a universal load rebuilds its client from
 *
 * ## Why this file exists
 *
 * A universal load runs twice — once on the SSR pass and once in the browser — and it has no `event`, so it cannot reach the per-request, cookie-bearing client `hooks.server.ts` puts on `event.locals`. A bare `fetch` cannot stand in for that client: SvelteKit's load `fetch` forwards cookies same-domain only, Supabase is cross-origin, and PostgREST authenticates on `Authorization` rather than on cookies. So this server load returns the cookie list, which IS serialisable, and `routes/+layout.ts` rebuilds a real cookie-bearing client from it, which is NOT. That is the official `@supabase/ssr` isomorphic shape.
 *
 * ## The payload shape
 *
 * `supabaseCookiesOf` (`$lib/server/supabaseCookies`) filters the request's cookies to the Supabase auth cookies and keeps only `name` and `value`. The key is `supabaseCookies` and not `cookies`: it says WHICH cookies, so a reader cannot mistake it for the request's whole jar.
 *
 * Those cookies hold a signed-in user's access and refresh tokens, so the tokens do reach the payload of every route. That is accepted, for the reasons and on the cache condition written at `supabaseCookiesOf`.
 *
 * ## ⚠ Why there is NO `session` here, and why there must not be
 *
 * This load returns no `Session`. Everything a server load returns is serialised into the hydration payload in the HTML body, so a session returned here would put the full `user` record, and a second copy of the tokens, into the document of every route for every authenticated user.
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

import { analyticsProjection } from '$lib/server/analytics/env';
import { supabaseCookiesOf } from '$lib/server/supabaseCookies';

export function load({ cookies }) {
  return { supabaseCookies: supabaseCookiesOf(cookies), analytics: analyticsProjection };
}
