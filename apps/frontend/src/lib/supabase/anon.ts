import { createClient } from '@supabase/supabase-js';
import { constants } from '$lib/utils/constants';
import type { Database } from '@openvaa/supabase-types';
import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Create a Supabase client that carries NO session, on purpose and by name.
 *
 * ## A named anonymous client is the opposite of a silent fallback
 *
 * This module exists so that "this request runs anonymously" can be a sentence someone WROTE, at the call site, rather than a branch someone FELL INTO. Until this phase, an anonymous client was what an adapter produced when nobody supplied one: `supabaseAdapter.init` ended in an `else` that built a plain `createClient` and carried on as if it had a session. Nothing at the call site said "anonymous", nothing in the type system asked, and the one place it was genuinely wanted was indistinguishable from the several places it was a bug. That branch is what ruling **D10** blames for the admin outage, and this phase removes it: `AdapterSource` has no arm without a client, so a caller that supplies none is a type error rather than an anonymous request.
 *
 * The danger was never the anonymous client itself — it is the correct client for a route that must work before anyone has logged in. The danger was that it was REACHED WITHOUT ANYONE CHOOSING IT. Importing this function is that choice, and it is greppable: `grep -rn 'createSupabaseAnonClient'` enumerates every site in the tree that has decided to run without a session.
 *
 * ## Its one intended caller
 *
 * `candidate/preregister/+layout.server.ts` refuses the request-scoped client deliberately — a preregistering candidate has no session yet, and reading through a client that might carry someone else's is exactly the confusion this phase is about. That refusal has a `157-16` rationale behind it and is a decision, so it gets a name.
 *
 * ## Why the auth options are set rather than defaulted
 *
 * `persistSession` and `autoRefreshToken` default to `true`, which in a browser context means this client would read an existing session out of storage and stop being anonymous. Setting both to `false` makes the module's NAME true by construction rather than true by the accident of where it happens to run.
 * @param options - The request-scoped `fetch`, so the anonymous request still participates in SvelteKit's request lifecycle.
 * @returns A client authenticating with the anon key and nothing else.
 */
export function createSupabaseAnonClient({ fetch }: { fetch: Fetch }): SupabaseClient<Database> {
  return createClient<Database>(constants.PUBLIC_SUPABASE_URL, constants.PUBLIC_SUPABASE_ANON_KEY, {
    global: { fetch },
    auth: { persistSession: false, autoRefreshToken: false }
  });
}
