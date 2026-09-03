import { createServerClient, isBrowser } from '@supabase/ssr';
import { constants } from '$lib/utils/constants';
import { createSupabaseBrowserClient } from './browser';
import type { Database } from '@openvaa/supabase-types';
import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Derive the auth-cookie name prefix `@supabase/ssr` uses for a given project URL.
 *
 * TRANSCRIBED from the installed `@supabase/supabase-js@2.99.3`, which computes its default storage key as ``` `sb-${baseUrl.hostname.split('.')[0]}-auth-token` ``` and hands it to the auth client; `@supabase/ssr` writes that key, plus the `.0`/`.1` chunk suffixes and the `-code-verifier` PKCE companion, as cookie names — all of which this prefix still covers.
 *
 * It never throws, because both callers evaluate it at MODULE SCOPE: a `TypeError` from an unparseable URL would take the SSR process down at server start, which is the fail-closed outcome this codebase forbids (same rule `resolveLogLevel` follows). The `'sb-'` fallback is the widest safe superset and is unreachable in a working deployment — `createServerClient` throws on the same input one line later — so it degrades the FILTER's narrowness rather than the app's ability to boot.
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
 * The name prefix every cookie `@supabase/ssr` writes for this project carries, and the ONE name the payload filter and this client are both derived from.
 *
 * ## Why a constant and not a literal at the filter
 *
 * `createServerClient` and `createBrowserClient` accept a `cookieOptions.name` that renames their storage key; this project configures none — not in `server.ts`, not in `browser.ts`, not in this module — so the library default applies. A future `cookieOptions.name` would move that prefix, and a filter written against an inline literal would then match NOTHING while continuing to compile, lint and run. The array it produced would be empty, `createServerClient` would find no session in it, and the SSR pass would silently become anonymous — no throw, no log, no failing test. That is the exact fail-open shape ruling **D10** blames for the admin outage, reintroduced one layer up. Deriving both sides from this name means such a rename breaks loudly at one place instead of quietly everywhere.
 *
 * ## ⚠ Why it is the WHOLE storage key and not the three characters `sb-`
 *
 * The bare `sb-` form was a prefix match over EVERY request cookie, and the payload it filtered is published from the ROOT server load — i.e. into the HTML of every page in the application, public voter routes included. Two consequences followed. Any future application cookie whose name merely began with `sb-` joined the client payload with no review; and the safety argument for publishing the set at all ("`@supabase/ssr` sets its own cookies `httpOnly: false`, so this discloses nothing that was not already JS-readable") silently extended to cookies that argument was never made about. Narrowing to the storage key the client actually uses makes the forwarded set exactly the cookies whose `httpOnly: false` posture `server.ts` now PINS rather than inherits.
 */
export const SUPABASE_COOKIE_PREFIX = resolveSupabaseCookiePrefix(constants.PUBLIC_SUPABASE_URL);

/**
 * One cookie as it crosses the `+layout.server.ts` → `+layout.ts` payload boundary: a name and a value, never the options.
 *
 * The list a universal load receives must be FILTERED to the Supabase auth cookies by whoever produces it. Those cookies are written `httpOnly: false` — a property `lib/supabase/server.ts` now PINS rather than inherits from `@supabase/ssr`'s defaults — so passing them through the payload discloses nothing that was not already JS-readable; but `cookies.getAll()` also returns this app's genuinely `httpOnly` cookies — `id_token`, `oidc_state`, `oidc_nonce` and the preregister pair — and serialising those into the HTML would defeat their `httpOnly` flag outright. This module takes the list it is given and never reaches for the request itself, so the filtering obligation sits at the producer, where the request is in scope; {@link SUPABASE_COOKIE_PREFIX} is what keeps that filter narrow enough for the `httpOnly: false` argument to actually cover everything it forwards.
 */
export type UniversalCookie = { name: string; value: string };

/**
 * Create the Supabase client a UNIVERSAL load needs — one that works on the SSR pass and in the browser, from the same call.
 *
 * ## Why this exists at all
 *
 * A universal load runs twice, once on the server and once in the browser, and it has no `event`: it cannot reach `locals.supabase`, which is where the per-request cookie-bearing client lives on the server. Until this module, the adapter closed that gap by falling through to a plain `createClient` whose comment claimed *"the fetch from SvelteKit includes cookies"* — false on both clauses, and ruling **D10**'s root cause written down in prose. SvelteKit's load `fetch` forwards cookies **same-domain only** and Supabase is cross-origin; and PostgREST authenticates on `Authorization` rather than on cookies, so overriding the transport changes nothing about the credential. The result was an ANONYMOUS client reached without anyone choosing it, which is the fail-open shape this phase removes.
 *
 * The mechanism that actually works is the official `@supabase/ssr` isomorphic shape: the server load returns the cookie list (serialisable), the universal load rebuilds a real cookie-bearing client from it on the SSR pass, and the browser pass takes the browser client instead.
 *
 * ## What this deliberately does NOT do
 *
 * There is no `cookies.setAll`. `src/lib/supabase/server.ts` has one because it holds a `RequestEvent` and can write a `Set-Cookie`; a universal load holds neither, so a `setAll` here could only be a silent no-op pretending to persist a refreshed session. Session WRITES stay with `hooks.server.ts`, which is the one place per request that can perform them.
 *
 * There is no third arm and no fallback. Exactly two runtimes reach this function, and `isBrowser()` — exported by the installed `@supabase/ssr` 0.9.0 — tells them apart.
 *
 * ## ⚠ The browser arm does NOT receive this load's `fetch`, and that is deliberate
 *
 * It used to call `createBrowserClient(url, key, { global: { fetch } })` directly. `@supabase/ssr@0.9.0`'s `createBrowserClient` keeps its OWN module-level cache (`let cachedBrowserClient`) and returns it on every subsequent call in a browser, DISCARDING the options of every caller after the first. This function runs first in the browser — `routes/+layout.ts` is the root universal load — so the tab's one client was being created with a load-scoped `fetch` that belongs to a pass which finishes moments later, and every `prepareDataWriter()`, `prepareAdminWriter()` and `createFeedbackWriter({ browser: true })` for the rest of the tab's life then issued its network calls through it. `browser.ts`'s own memo could meanwhile stay unpopulated, leaving two memos disagreeing about which client is authoritative.
 *
 * Routing the browser arm through `createSupabaseBrowserClient()` makes the tab's client single-sourced and, crucially, stops handing a per-load value to a process-lifetime singleton. The `fetch` parameter is therefore consumed by the SERVER arm only, where the client genuinely is per-request.
 * @param options - The request-scoped `fetch` and the Supabase auth cookies the server load forwarded.
 * @returns A client bound to that request's cookies on the server, or the tab's single browser client in the browser.
 */
export function createSupabaseUniversalClient({
  fetch,
  cookies
}: {
  fetch: Fetch;
  cookies: Array<UniversalCookie>;
}): SupabaseClient<Database> {
  // The browser client is a TAB-LIFETIME singleton; it must not capture this load's `fetch`. See the docstring's third section.
  if (isBrowser()) return createSupabaseBrowserClient();
  return createServerClient<Database>(constants.PUBLIC_SUPABASE_URL, constants.PUBLIC_SUPABASE_ANON_KEY, {
    global: { fetch },
    cookies: { getAll: () => cookies }
  });
}
