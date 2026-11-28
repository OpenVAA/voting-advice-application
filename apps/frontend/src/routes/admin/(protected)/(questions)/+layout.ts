/**
 * # The question data of the Admin App's question features
 *
 * The Supabase client is built from this route's own `data`, which `+layout.server.ts` supplies, and must not be taken from `await parent()`: `parent()` resolves only after the root load's Supabase round-trips, and the read below would wait for them.
 */

import { createDataProvider, createSupabaseUniversalClient } from '$lib/api/dataProvider';
import { getLocale } from '$lib/paraglide/runtime';

export async function load({ data, fetch }) {
  const lang = getLocale();

  const supabaseClient = createSupabaseUniversalClient({ fetch, cookies: data.supabaseCookies });
  const dataProvider = createDataProvider({ fetch, client: supabaseClient });

  return {
    // Returned unawaited so it streams.
    questionData: dataProvider
      .getQuestionData({
        locale: lang
      })
      .catch((e) => e)
  };
}
