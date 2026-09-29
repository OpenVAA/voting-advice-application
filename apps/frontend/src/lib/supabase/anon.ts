import { createClient } from '@supabase/supabase-js';
import { constants } from '$lib/utils/constants';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { SupabaseDatabase } from '$lib/api/adapters/supabase/supabaseAdapter.type';

/**
 * Create a Supabase client that carries no session, on purpose and by name.
 *
 * An anonymous client is correct for a route that must work before anyone has logged in; the danger is reaching one without choosing it. `AdapterSource` has no arm without a client, so running anonymously has to be written at the call site by importing this function, and `grep -rn 'createSupabaseAnonClient'` lists every site that does.
 *
 * Its intended caller is `candidate/preregister/+layout.server.ts`: a preregistering candidate has no session yet, and the route must not read through a client that might carry someone else's.
 *
 * `persistSession` and `autoRefreshToken` default to `true`, and in a browser the client would then read an existing session out of storage and stop being anonymous. Both are set to `false` so the client is anonymous wherever it runs.
 * @param options - The request-scoped `fetch`, so the anonymous request still participates in SvelteKit's request lifecycle.
 * @returns A client authenticating with the anon key and nothing else.
 */
export function createSupabaseAnonClient({ fetch }: { fetch: Fetch }): SupabaseClient<SupabaseDatabase> {
  return createClient<SupabaseDatabase>(constants.PUBLIC_SUPABASE_URL, constants.PUBLIC_SUPABASE_ANON_KEY, {
    global: { fetch },
    auth: { persistSession: false, autoRefreshToken: false }
  });
}
