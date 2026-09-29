import { createSupabaseBrowserClient } from '$lib/supabase/browser';
import { SupabaseDataProvider } from './adapters/supabase/dataProvider/supabaseDataProvider';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { SupabaseAdapterConfig, SupabaseDatabase } from './adapters/supabase/supabaseAdapter.type';

// Routes may not import `$lib/supabase/universal` (the adapter-boundary lint rule bans it outside its allowlist), so the root `+layout.server.ts` and `+layout.ts` reach the cookie prefix and the universal client factory through these re-exports.
export type { UniversalCookie } from '$lib/supabase/universal';
export { createSupabaseUniversalClient, SUPABASE_COOKIE_PREFIX } from '$lib/supabase/universal';

// The route that deliberately runs without a session, `candidate/preregister/+layout.server.ts`, reaches the named anonymous client through this re-export for the same reason. `grep -rn 'createSupabaseAnonClient'` lists every site that runs without a session.
export { createSupabaseAnonClient } from '$lib/supabase/anon';

// The admin job features reach the job client through this re-export for the same reason. `grep -rn 'createSupabaseJobClient'` lists every site that runs under a job's own credential rather than the request's.
export { createSupabaseJobClient } from '$lib/supabase/job';

/**
 * The places an adapter's Supabase client can come from, one arm per runtime that reaches an adapter.
 *
 * Every arm names exactly one client source and no arm lacks one, so a caller that supplies no client does not compile instead of silently getting an anonymous client. A route that genuinely wants no session says so with `createSupabaseAnonClient` and passes the result through the `client` arm.
 *
 * - **`locals`**: a server load, form action or endpoint. `hooks.server.ts` builds one cookie-bearing client per request on `event.locals`, and this arm reads it. The read happens here rather than in the route because the adapter-boundary lint rule bans `locals.supabase` outside its allowlist, and the selector modules are on it.
 * - **`client`**: a caller that holds a finished client. A universal load has no `event`, so it receives one from `await parent()`, built per pass with `createSupabaseUniversalClient`. A long-running admin job builds its own with `createSupabaseJobClient`, because the request's client stops being the right authority once the job outlives the response. The arms name where a client came from, not how long it lives, so a job needs no arm of its own.
 * - **`browser`**: a browser-only context. The client is the tab's singleton from `$lib/supabase/browser`: one client per tab means one auth listener and one cookie sync, while the adapters around it stay per call. The browser arm of `createSupabaseUniversalClient` returns the same singleton.
 */
export type AdapterSource =
  | ({ fetch: Fetch; locals: { supabase: SupabaseClient<SupabaseDatabase> } } & AdapterLocales)
  | ({ fetch: Fetch; client: SupabaseClient<SupabaseDatabase> } & AdapterLocales)
  | ({ fetch: Fetch; browser: true } & AdapterLocales);

/**
 * The locales an adapter extracts JSONB in, carried on every arm of {@link AdapterSource}.
 *
 * A caller that knows the request's language sets them once, at construction, and each read method's `options.locale` overrides them. Both are optional, because a caller that passes `{ locale }` to every read needs neither.
 */
type AdapterLocales = {
  /** The locale JSONB columns are extracted in when a read method names none. */
  locale?: string;
  /** The locale `getLocalized` falls back to when a column carries no entry for `locale`. Defaults to `'en'` in the mixin. */
  defaultLocale?: string;
};

/**
 * Turn a named source into the configuration an adapter is constructed from.
 *
 * It lives in this module, and the other selectors import it, because it must both import `@supabase/supabase-js` types and read `.supabase`, and the adapter-boundary lint rule allows both only in the selector modules.
 *
 * {@link SupabaseAdapterConfig} requires both members it returns, so every arm is a total answer: no configuration can be built without a client, and there is nothing for a fallback to fall back to.
 * @param source - The named client source.
 * @returns The configuration carrying that request's own fetch and its own client.
 */
export function resolveAdapterConfig(source: AdapterSource): SupabaseAdapterConfig {
  // Every arm forwards the same locales.
  const locales = { locale: source.locale, defaultLocale: source.defaultLocale };
  if ('locals' in source) return { ...locales, fetch: source.fetch, client: source.locals.supabase };
  if ('client' in source) return { ...locales, fetch: source.fetch, client: source.client };
  // The browser arm is matched explicitly rather than reached by `else`. A source that names no client (through an `as AdapterSource` cast, a JS caller, a spread that dropped an `undefined` `client`, or a new arm without a branch here) would otherwise get the process-lifetime browser client and, on the server, share one session across requests. It reaches the throw instead.
  if ('browser' in source) return { ...locales, fetch: source.fetch, client: createSupabaseBrowserClient() };
  throw new Error('resolveAdapterConfig: no client source named. Pass { locals }, { client } or { browser: true }.');
}

/**
 * Obtain a `DataProvider` for one request.
 *
 * Every call returns a fresh instance, so a request that awaits cannot resume to find another request's client on its provider; `supabaseAdapter.concurrency.test.ts` covers this.
 * @param source - Where this request's client comes from.
 * @returns A provider nothing else holds a reference to.
 */
export function createDataProvider(source: AdapterSource): SupabaseDataProvider {
  return new SupabaseDataProvider(resolveAdapterConfig(source));
}
