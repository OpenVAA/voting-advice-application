import { createClient } from '@supabase/supabase-js';
import { constants } from '$lib/utils/constants';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { SupabaseDatabase } from '$lib/api/adapters/supabase/supabaseAdapter.type';

/**
 * Create a Supabase client authorised as the admin who started a long-running job, holding that authority for the whole run and taking no part in the request's browser session.
 *
 * A job cannot use the request's client. `createSupabaseServerClient` writes refreshed sessions onto the request's cookie jar, but the admin job features run for minutes and the form action awaits them inline, so:
 *   1. A refreshed session written onto a response that is only sent when the job finishes reaches nobody once the platform gateway has timed the connection out, and the admin's session silently regresses.
 *   2. Once the response has been generated, SvelteKit replaces the jar's setter with one that throws, so a refresh after that point raises inside the client.
 * This client has no cookie adapter and does not refresh its token, so neither can happen.
 *
 * `persistSession` and `autoRefreshToken` default to `true` and are set to `false`, as in `anon.ts`; `job.test.ts` asserts the options passed to the library.
 *
 * The token rides on `global.headers`. The client sets `Authorization` itself only when the headers lack it, so this token is the one every request carries, and row-level security evaluates every read and write as the admin who started the job.
 *
 * `accessToken` is optional because the caller's verified-session lookup may find no session. A missing token throws instead of producing an anonymous client. What a job should do when the admin's session expires mid-run is not decided here.
 * @param options.accessToken - The initiating admin's verified access token, taken from the request hook's session helper and from nowhere else, so the application keeps exactly one verification path.
 * @returns A client carrying that admin's authority and no session state of its own.
 */
export function createSupabaseJobClient({
  accessToken
}: {
  accessToken: string | undefined;
}): SupabaseClient<SupabaseDatabase> {
  if (!accessToken)
    throw new Error(
      'createSupabaseJobClient: no access token supplied. A job runs as the admin who started it, and an anonymous client is not the fallback for one that named nobody.'
    );

  return createClient<SupabaseDatabase>(constants.PUBLIC_SUPABASE_URL, constants.PUBLIC_SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
    auth: { persistSession: false, autoRefreshToken: false }
  });
}
