/**
 * # The Supabase auth cookies of the Admin App's question features
 *
 * `+layout.ts` builds its client from this load's `data` rather than from `await parent()`, so `getQuestionData` starts in parallel with the root load's Supabase round-trips. The filter, and the prefix it shares with `routes/+layout.server.ts`, are in `$lib/server/supabaseCookies`.
 */

export { supabaseCookiesLoad as load } from '$lib/server/supabaseCookies';
