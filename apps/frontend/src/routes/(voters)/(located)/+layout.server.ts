/**
 * # Located voter-routes server loader — this subtree's own copy of the Supabase auth cookies
 *
 * ## Why this exists rather than taking the client from `await parent()`
 *
 * The root builds an isomorphic client and forwards it, and a nested universal load can take it from `await parent()` — but `parent()` does not resolve until the ROOT LOAD HAS FINISHED, and the root load makes four Supabase round-trips. This subtree's own `getQuestionData` and `getNominationData` calls used to be issued in parallel with those four; behind a `parent()` await they would only start once the root was done, which is a latency regression on the voter app's hottest path and was MEASURED as an accessibility failure: `routes/+layout.svelte`'s `afterNavigate` focus reset runs inside a single `requestAnimationFrame` with no retry, so a question heading that arrives after that frame never receives focus at all. A load's OWN `data` — this file's return — is available to `+layout.ts` synchronously, with no `parent()` and therefore no dependency on the root load, which is what restores the parallelism.
 *
 * The cost the operator accepted for that: the isomorphic client is reconstructed once per server-load boundary rather than once per request. Streaming the root load's datasets would preserve BOTH single construction and parallelism, and is filed as a spike for v2.15 close rather than attempted here.
 *
 * ## Same filter, same constant, same reason
 *
 * The shape and the security contract are identical to `routes/+layout.server.ts`, deliberately: same `SUPABASE_COOKIE_PREFIX`, same name/value projection, same exclusion of this application's genuinely `httpOnly` cookies. Duplicating the FILTER while sharing the CONSTANT is the point — a future `cookieOptions.name` change moves one name and both arrays follow it, instead of one array silently emptying and leaving an anonymous client that raises no error.
 */

import { SUPABASE_COOKIE_PREFIX } from '$lib/api/dataProvider';
import type { UniversalCookie } from '$lib/api/dataProvider';

export async function load({ cookies }) {
  // ⚠ THE FILTER BELOW IS A DATA-PROTECTION BOUNDARY, NOT A TIDINESS MEASURE, and the reasoning is the same one written out at `routes/+layout.server.ts`. Everything a server load returns is serialised into the HTML and is readable by client JavaScript. The unfiltered read on the next line also yields the bank-auth `id_token`, the OIDC `oidc_state` and `oidc_nonce` replay/CSRF guards, and the preregister pair — all set `httpOnly: true` — and serialising any of them would defeat that flag outright. `requestCookies` is a LOCAL and never a return value; only `supabaseCookies` leaves this function.
  const requestCookies = cookies.getAll();
  const supabaseCookies: Array<UniversalCookie> = requestCookies
    .filter(({ name }) => name.startsWith(SUPABASE_COOKIE_PREFIX))
    .map(({ name, value }) => ({ name, value }));

  return { supabaseCookies };
}
