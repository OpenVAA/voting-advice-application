/**
 * # An Admin App feature subtree's own copy of the Supabase auth cookies
 *
 * ## ⚠ ONE FILE, TWO HOMES
 *
 * This is one copy of a BYTE-IDENTICAL PAIR under `routes/admin/(protected)/`, one per feature subtree. It names neither feature on purpose — the directory it sits in already does — so a plain `diff` between the two copies is empty and an edit to one is mechanically an edit to both. Two idioms for one problem is the outcome obligation `OB-1` exists to prevent, and `routes/admin/(protected)/layout.server.test.ts` drives BOTH copies from one spec so a behavioural divergence fails alongside a textual one.
 *
 * ## Why this exists rather than taking the client from `await parent()`
 *
 * The root builds an isomorphic client and forwards it, and a nested universal load can take it from `await parent()` — but `parent()` does not resolve until the ROOT LOAD HAS FINISHED, and the root load makes four Supabase round-trips. This subtree's `getQuestionData` call used to be issued behind them: phase 157.2 moved every load onto a per-request client and, in doing so, newly SERIALISED this subtree's read behind the root's, which it had not been before. 157.2 applied the remedy to the one load it was allowed to touch — `routes/(voters)/(located)/+layout.server.ts`, THE ANALOG THIS FILE IS COPIED FROM — and was explicitly forbidden from touching the two admin subtrees on the stated ground that the admin route surface belongs to phase 158. That debt is what `OB-1` carried here, and the operator ruled option (a+): every newly-serialised nested load gets its own server load returning the filtered cookie array. A load's OWN `data` — this file's return — is available to `+layout.ts` synchronously, with no `parent()` and therefore no dependency on the root load, which is what restores the parallelism.
 *
 * The cost the operator accepted for that: the isomorphic client is reconstructed once per server-load boundary rather than once per request. Streaming the root load's datasets would preserve BOTH single construction and parallelism, and is filed as a spike for v2.15 close rather than attempted here — if that spike lands it may delete this file.
 *
 * ## Same filter, same constant, same reason
 *
 * The shape and the security contract are identical to `routes/+layout.server.ts` and to the analog, deliberately: same `SUPABASE_COOKIE_PREFIX`, same name/value projection, same exclusion of this application's genuinely `httpOnly` cookies. Duplicating the FILTER while sharing the CONSTANT is the point — a future `cookieOptions.name` change moves one name and every array follows it, instead of one array silently emptying and leaving an anonymous client that raises no error.
 *
 * The constant arrives through `$lib/api/dataProvider` rather than from the client module it is defined in, because the adapter-boundary guard bans that module's path at every route outside its allowlist. The seam re-exports the constant and the cookie type for exactly that reason, and its own comment records the ESLint message measured at a route path. No allowlist entry is needed for THIS shape — the guard fires on the banned import paths and on a specific member access, and this file does neither — and `yarn lint:check` was run to confirm that rather than the absence being inferred from the analog's shape.
 */

import { SUPABASE_COOKIE_PREFIX } from '$lib/api/dataProvider';
import type { UniversalCookie } from '$lib/api/dataProvider';

export async function load({ cookies }) {
  // ⚠ THE FILTER BELOW IS A DATA-PROTECTION BOUNDARY, NOT A TIDINESS MEASURE, and the reasoning is the same one written out at `routes/+layout.server.ts`. Everything a server load returns is serialised into the HTML and is readable by client JavaScript. The unfiltered read on the next line also yields the bank-auth `id_token`, the OIDC state and nonce replay/CSRF guards, and the PKCE companion — all set `httpOnly: true` — and serialising any of them would defeat that flag outright. `requestCookies` is a LOCAL and never a return value; only `supabaseCookies` leaves this function. The prefix is imported and NEVER spelled: an inline literal would match nothing after a storage-key rename while continuing to compile, lint and run, the array would go empty, the rebuilt client would find no session, and the server-rendered pass would silently become anonymous — no throw, no log, no failing test.
  const requestCookies = cookies.getAll();
  const supabaseCookies: Array<UniversalCookie> = requestCookies
    .filter(({ name }) => name.startsWith(SUPABASE_COOKIE_PREFIX))
    .map(({ name, value }) => ({ name, value }));

  return { supabaseCookies };
}
