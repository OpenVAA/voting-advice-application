import { createSupabaseBrowserClient } from '$lib/supabase/browser';
import { SupabaseDataProvider } from './adapters/supabase/dataProvider/supabaseDataProvider';
import type { Database } from '@openvaa/supabase-types';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { SupabaseAdapterConfig } from './adapters/supabase/supabaseAdapter.type';

// THE SEAM'S SECOND HALF, and the only legal import path a ROUTE has to the isomorphic client. The adapter-boundary guard's `no-restricted-imports` pattern `^\$lib/(supabase|api/adapters)(/|$)` bans `$lib/supabase/universal` at every path outside `ADAPTER_BOUNDARY_ALLOWLIST`, and its message names the remedy: *"Use the `$lib/api/{dataProvider,dataWriter,feedbackWriter}` selectors instead."* The root `+layout.server.ts` and `+layout.ts` are the two files that genuinely need the constant and the factory — the server load to FILTER the payload, the universal load to REBUILD the client from it — and neither can be allowlisted without opening the boundary at a route. Re-exporting them here routes both through the seam the guard already prescribes, and keeps the construction itself in `$lib/supabase/universal.ts` where it belongs. Measured with `ESLint#lintText` at the virtual path `src/routes/+layout.ts` before this line existed: *"'$lib/supabase/universal' import is restricted from being used by a pattern."*
export type { UniversalCookie } from '$lib/supabase/universal';
export { createSupabaseUniversalClient, SUPABASE_COOKIE_PREFIX } from '$lib/supabase/universal';

// THE SAME SEAM, for the one route that wants NO session. `157-16` moved `candidate/preregister/+layout.server.ts` off the adapter boundary and struck its allowlist entry, so that route cannot import `$lib/supabase/anon` itself: measured with `ESLint#lintText` at that exact path — *"'$lib/supabase/anon' import is restricted from being used by a pattern. … Use the `$lib/api/{dataProvider,dataWriter,feedbackWriter}` selectors instead."* Re-exporting the named anonymous client here routes that choice through the seam the guard prescribes, and keeps the choice greppable: `grep -rn 'createSupabaseAnonClient'` still enumerates every site in the tree that has decided to run without a session.
export { createSupabaseAnonClient } from '$lib/supabase/anon';

// THE SAME SEAM AGAIN, for the client a long-running JOB carries INSTEAD of the initiating request's. `src/lib/server/admin/features/**` is not on `ADAPTER_BOUNDARY_ALLOWLIST`, so neither admin job feature can import `$lib/supabase/job` itself: measured with `ESLint#lintText` at both feature paths this session — *"'$lib/supabase/job' import is restricted from being used by a pattern. The Supabase adapter and its client factories must not be imported directly. Use the `$lib/api/{dataProvider,dataWriter,feedbackWriter}` selectors instead."* — while the same text at this file's own path reports nothing, which is what makes this line the prescribed route rather than a convenience. It also keeps the choice greppable, as the anonymous client's re-export above does: `grep -rn 'createSupabaseJobClient'` enumerates every site that has decided to run under a job's own credential rather than the request's.
export { createSupabaseJobClient } from '$lib/supabase/job';

/**
 * The three — and only three — places a Supabase client can come from, one arm per runtime that reaches an adapter (decision **A2**, ruling **D10**).
 *
 * ## There is no arm without a client, and that is the whole point
 *
 * The defect ruling D10 names is not that some request got the wrong client; it is that a request could get an ANONYMOUS one without anyone choosing it. `supabaseAdapter.init` ended in an `else` that built a plain client and carried on, so "nobody supplied a client" and "this route runs anonymously" were the same program state. Every arm below names exactly one client source, and a caller that supplies none does not compile. A silent fallback is not something this type forbids by convention — it is something it cannot express.
 *
 * A route that genuinely wants no session says so by name, with `createSupabaseAnonClient` from `$lib/supabase/anon`, and hands the result in through the universal arm.
 *
 * ## The arms, and the runtime each one is for
 *
 * - **`locals`** — a server load, a form action or an endpoint. `hooks.server.ts` already builds one cookie-bearing client per request and puts it on `event.locals`; this arm reads it. The read happens HERE rather than at the route because `MemberExpression[property.name='supabase']` fires on `locals.supabase` anywhere outside `ADAPTER_BOUNDARY_ALLOWLIST`, and these four selector modules are on it. Renaming the property to dodge that selector would be true by spelling rather than by class, which is the failure the D-rulings exist to prevent.
 * - **`client`** — a caller that HOLDS a finished client and names it. Two callers do: a universal load, which has no `event` and therefore cannot reach `locals`, receives one from `await parent()` and the root rebuilds one per pass with `createSupabaseUniversalClient`; and a long-running admin job, which builds its own with `createSupabaseJobClient` because the initiating request's client stops being the right authority the moment the job outlives the response. **NO FOURTH ARM WAS ADDED FOR THE JOB, deliberately.** This arm's contract is exactly "the caller supplies the client", which is what a job does, and a `job` arm would resolve to the same `{ fetch, client }` configuration through a branch that was a copy of this one — buying nothing and adding one more chance to land an arm without its branch, which is the omission the throw below exists to catch. The arms name WHERE A CLIENT CAME FROM, not how long it lives; that the job's client outlives its request is a property of that client, argued where it is built rather than here.
 * - **`browser`** — a browser-only context. The client is the named singleton `$lib/supabase/browser` exposes — itself a thin memo over `@supabase/ssr`'s own module-level cache, which is the memo that actually decides — and it is deliberately NOT per-call: one client per tab means one auth listener and one cookie sync, while the ADAPTERS around it stay per-call (decision **B2(a)**). The browser arm of `createSupabaseUniversalClient` reaches the same singleton, so there is one browser client in a tab no matter which of the two paths asks first.
 */
export type AdapterSource =
  | ({ fetch: Fetch; locals: { supabase: SupabaseClient<Database> } } & AdapterLocales)
  | ({ fetch: Fetch; client: SupabaseClient<Database> } & AdapterLocales)
  | ({ fetch: Fetch; browser: true } & AdapterLocales);

/**
 * The locales an adapter extracts JSONB in, carried on every arm of {@link AdapterSource}.
 *
 * ## Why these are here rather than only on the read methods
 *
 * `SupabaseAdapterConfig` has always declared them and the mixin has always read them, but `resolveAdapterConfig` — the ONLY construction path in the application since `157.2-08` — set neither, so `this.locale` was permanently `''` and `this.defaultLocale` permanently `'en'` on every instance in production. The provider reads them at nine sites as the fallback behind each method's own `options.locale`, which made them look like live configuration while only `supabaseDataProvider.test.ts` could ever populate them: the Finnish-extraction cases were green for a code path no caller could reach.
 *
 * Forwarding them here makes the fallback real, and inverts the relationship the reviewer named: a caller that knows the request's language sets it ONCE, at construction, and each read method's `options.locale` becomes an OVERRIDE rather than the sole source. `routes/+layout.ts` is the first caller to do so. Both stay optional because a caller that passes `{ locale }` to every read — `loadElectionData` does — needs neither.
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
 * Declared in this module, and imported by the other three selectors, because a shared home for it has to satisfy two constraints at once and exactly these four files do: it must be allowed to import `@supabase/supabase-js` types, and it must be allowed to READ `.supabase`. Measured this session — a new `src/lib/api/adapterSource.type.ts` holding only the union fires `no-restricted-imports` with *"Supabase packages are banned outside the adapter"*, because the boundary guard's scope is per-file and named path by path. `dataProvider.ts` is the first of the four and the one the guard's own message names first.
 *
 * Both members it produces are REQUIRED by {@link SupabaseAdapterConfig}, which is what makes each arm below a total answer rather than a hint: there is no configuration an adapter can be constructed from that names no client, so there is nothing for a fallback to fall back to.
 * @param source - The named client source.
 * @returns The configuration carrying that request's own fetch and its own client.
 */
export function resolveAdapterConfig(source: AdapterSource): SupabaseAdapterConfig {
  // The locales ride along on every arm and are the same three lines each time; see {@link AdapterLocales} for why they are forwarded at all.
  const locales = { locale: source.locale, defaultLocale: source.defaultLocale };
  if ('locals' in source) return { ...locales, fetch: source.fetch, client: source.locals.supabase };
  if ('client' in source) return { ...locales, fetch: source.fetch, client: source.client };
  // ⚠ THE THIRD ARM IS TESTED, NOT ASSUMED. This used to be an unguarded `else`, which meant the `browser: true` discriminant was never read and "nobody named a client" resolved to the browser client — a PROCESS-LIFETIME shared instance carrying whatever session its first caller established. On the server that is precisely the cross-request contamination ruling D10 describes, reintroduced one layer above the code this phase deleted, and reachable by an `as AdapterSource` cast, by a JS consumer, by a spread that dropped an `undefined` `client` key, or by a fourth arm added to the union without a matching branch here. There is no live caller in that state today; the throw is what keeps it that way, and it is what makes the 30 lines of argument above true at runtime rather than only in the type.
  if ('browser' in source) return { ...locales, fetch: source.fetch, client: createSupabaseBrowserClient() };
  throw new Error('resolveAdapterConfig: no client source named. Pass { locals }, { client } or { browser: true }.');
}

/**
 * Obtain a `DataProvider` for ONE request.
 *
 * Every call returns a FRESH instance. That is the mechanism ruling **D11** asks for, and `supabaseAdapter.concurrency.test.ts` is the proof: bound to the module singleton this module re-exported until `157.2-07` deleted it, a request that parked on its own `await` resumed to find the next request's client on the object it had configured, and the same test passes against this factory with its assertions untouched.
 * @param source - Where this request's client comes from.
 * @returns A provider nothing else holds a reference to.
 */
export function createDataProvider(source: AdapterSource): SupabaseDataProvider {
  return new SupabaseDataProvider(resolveAdapterConfig(source));
}
