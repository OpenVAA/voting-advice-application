/**
 * # The Supabase auth cookies of the located voter routes
 *
 * `parent()` resolves only after the root load's four Supabase round-trips, so this subtree returns its own filtered cookie array and `+layout.ts` builds its client from its own `data`, which lets `getQuestionData` and `getNominationData` start in parallel with the root. The cost is that the client is rebuilt once per server-load boundary. The filter is in `$lib/server/supabaseCookies`.
 */

export { supabaseCookiesLoad as load } from '$lib/server/supabaseCookies';
