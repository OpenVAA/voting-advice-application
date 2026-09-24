/**
 * # An Admin App feature subtree's question data, loaded in PARALLEL with the root
 *
 * ## ⚠ ONE FILE, TWO HOMES
 *
 * This is one copy of a BYTE-IDENTICAL PAIR under `routes/admin/(protected)/`, one per feature subtree. It names neither feature on purpose — the directory it sits in already does — so a plain `diff` between the two copies is empty and an edit to one is mechanically an edit to both, which is the divergence obligation `OB-1` exists to prevent.
 *
 * ## ⚠ The client comes from THIS route's own `data`, and must not go back to `await parent()`
 *
 * This load used to take its Supabase client from `await parent()`. `parent()` does not resolve until the ROOT load has finished, and the root load makes four Supabase round-trips, so the read below was SERIALISED behind them — a serialisation phase 157.2 introduced when it moved every load onto a per-request client, and which it was forbidden from repairing here because the admin route surface belongs to phase 158.
 *
 * The remedy is the shape the operator ruled (option `a+`) and that `routes/(voters)/(located)/+layout.ts` already carries: this subtree's own `+layout.server.ts` returns the filtered cookie array, a universal load has its OWN `data` SYNCHRONOUSLY with no `parent()` involved, and the client is rebuilt from that. Taking the array from the ancestor instead would look correct while restoring the exact defect, so the absence of `parent()` here is load-bearing rather than incidental.
 *
 * The parent protected load is deliberately UNCHANGED: it already awaited `parent()` unconditionally for other data, so it was never newly serialised and takes its client from a call it was already making.
 */

import { createDataProvider, createSupabaseUniversalClient } from '$lib/api/dataProvider';
import { getLocale } from '$lib/paraglide/runtime';

export async function load({ data, fetch }) {
  const lang = getLocale();

  // Rebuilt per pass from THIS route's own server-load data — see the docstring's second section for why it is not taken from the ancestor.
  const supabaseClient = createSupabaseUniversalClient({ fetch, cookies: data.supabaseCookies });
  const dataProvider = createDataProvider({ fetch, client: supabaseClient });

  return {
    // ⚠ RETURNED UNAWAITED ON PURPOSE, exactly as it was before this route was de-serialised and exactly as the voter-side analog keeps its own reads. It streams, and SvelteKit resolves it after this load returns; that is safe under per-request instancing because the promise captures THIS request's own adapter, which nothing else can rebind. Awaiting it would convert streaming into blocking on the very path this file exists to unblock — do not "fix" it.
    questionData: dataProvider
      .getQuestionData({
        locale: lang
      })
      .catch((e) => e)
  };
}
