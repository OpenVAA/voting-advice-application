import { createClient } from '@supabase/supabase-js';
import { constants } from '$lib/utils/constants';
import type { Database } from '@openvaa/supabase-types';
import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Create a Supabase client authorised as the admin who STARTED a long-running job, holding that authority for the job's whole run and taking no part in the browser session the request carries.
 *
 * ## Why a job cannot use the request's client
 *
 * `createSupabaseServerClient` builds one client per request and hands it an adapter onto that request's own jar. That is right for a request: a refreshed session belongs on the response the browser is about to receive. A job is not a request. The two admin features run for MINUTES, sequentially across many questions, and the form action awaits them inline — so a client built for the request is still writing long after the response it was going to write onto has been decided. Two consequences follow, and both were named at the construction sites for a phase before anything was done about them:
 *   1. A refreshed session emitted onto a response that is only generated when the job finishes reaches nobody once the platform gateway has timed the connection out (Render's default is 100s; these jobs run for minutes), and the initiating admin's session silently regresses to the tokens it held before.
 *   2. Once the response HAS been generated, `@sveltejs/kit` replaces that jar's setter with a thrower, so any path outliving its response raises inside the client's own refresh rather than at a call site anyone would think to look at.
 * This factory closes both BY CONSTRUCTION rather than by care taken at the call site: the client it returns is configured with two option groups and no third, so there is no adapter for a write to travel through and nothing that renews a token on its own.
 *
 * ## Why the auth options are set rather than defaulted
 *
 * `persistSession` and `autoRefreshToken` both default to `true` — read from `SupabaseClientOptions` in the INSTALLED `@supabase/supabase-js` (2.99.3), not from memory. Setting both to `false` makes this module's name true by construction rather than true by the accident of which defaults the installed version happens to carry, and `job.test.ts` asserts them off the object handed to the library rather than trusting the sentence you are reading. This is the same argument, and the same pair of options, that `anon.ts` makes for the named anonymous client — the two modules are siblings in shape and differ only in whose authority they carry.
 *
 * ## Where the credential goes, and why the header is what decides
 *
 * The token rides on `global.headers`. The client copies that record onto `this.headers` and hands it to its PostgREST client as that client's request headers; its own `fetchWithAuth` wrapper then sets `Authorization` only `if (!headers.has("Authorization"))` — READ from `node_modules/@supabase/supabase-js/dist/index.mjs` in this tree rather than assumed — so the token below is the one every request carries, and the client's own session lookup can never displace it. Row-level security therefore evaluates every read and every write this job makes as the admin who started it, for the whole run.
 *
 * ## An absent credential RAISES, and that is the point
 *
 * `accessToken` is typed optional because the one caller legitimately holds an optional: a verified-session lookup answers with no session as readily as with one. What must never happen is that the two answers reach the same program state. Ruling **D10** blames exactly that shape for the admin outage — "nobody supplied a credential" and "this runs anonymously" were one branch, so an anonymous request was something a caller fell into rather than something a caller wrote. Here they are two branches and only one of them returns a client.
 *
 * ## What this does NOT decide
 *
 * It does not decide what a job should do when the initiating admin's session expires partway through a run. It removes the crash mode; the authority question is open.
 * @param options.accessToken - The initiating admin's verified access token, taken from the request hook's session helper and from nowhere else, so the application keeps exactly one verification path.
 * @returns A client carrying that admin's authority and no session state of its own.
 */
export function createSupabaseJobClient({
  accessToken
}: {
  accessToken: string | undefined;
}): SupabaseClient<Database> {
  if (!accessToken)
    throw new Error(
      'createSupabaseJobClient: no access token supplied. A job runs as the admin who started it, and an anonymous client is not the fallback for one that named nobody.'
    );

  return createClient<Database>(constants.PUBLIC_SUPABASE_URL, constants.PUBLIC_SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
    auth: { persistSession: false, autoRefreshToken: false }
  });
}
