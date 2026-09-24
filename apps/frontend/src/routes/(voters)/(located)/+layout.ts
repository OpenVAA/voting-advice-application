/**
 * Check whether we have the necessary electionId and constituencyId parameters or if we can imply them:
 * 1. If we don't have, them redirect to the necessary selection page.
 * 2. If we do, download the question and nomination data.
 *
 * Load the data used by the located parts of the voter app, i.e. those requiring the elections and constituencies to be selected.
 *
 * TODO: Validate that the constituencies provided are applicable to the elections
 */

import { staticSettings } from '@openvaa/app-shared';
import { DataRoot } from '@openvaa/data';
import { redirect } from '@sveltejs/kit';
import { createDataProvider, createSupabaseUniversalClient } from '$lib/api/dataProvider';
import { getLocale } from '$lib/paraglide/runtime';
import { buildRoute, getImpliedConstituencyIds, getImpliedElectionIds, parseParams } from '$lib/routes';
import { mergeAppSettings } from '$lib/utils/settings';
import type { Id } from '@openvaa/core';

/**
 * Whether an id parameter names an actual selection.
 *
 * An EMPTY ARRAY is not a selection, and a bare truthiness test says it is. Both producers of these values emit one: `parseParams` filters empty values out of an array param, so the degenerate `?electionId=` yields `[]`, and `getImpliedConstituencyIds` returns `[]` rather than `undefined` when it is handed no elections to imply from. Either one used to satisfy `if (!electionId)`, skip the redirect, and reach the adapter as a present-but-empty filter — which fanned out to zero RPC calls and produced a blank voter app with no error, no redirect and no log line. The predicate is used at all three guards so neither producer can reopen the hole.
 *
 * @param value - A parsed or implied id parameter.
 * @returns `true` when the value names at least one id.
 */
function hasSelection(value: Id | Array<Id> | undefined): value is Id | Array<Id> {
  return value != null && (!Array.isArray(value) || value.length > 0);
}

export async function load({ data, fetch, parent, untrack, url }) {
  const lang = getLocale();
  let electionId: Id | Array<Id> | undefined;
  let constituencyId: Id | Array<Id> | undefined;

  // We need to be careful to not rerun the load function unnecessarily
  untrack(() => ({ electionId, constituencyId } = parseParams({ url })));

  // reason: voter-app routes allowlist for ?next= deferred target — prevents open-redirect attacks. The whitelist accepts either a locale-prefixed path (`/en/...`) or one of the bare voter-app route roots (`/results`, `/questions`, `/nominations`). Cross-origin values (`https://...`, `//evil.com`) fail the regex and are dropped — the redirect proceeds to the selector without a `?next=` parameter.
  const isVoterRoute = /^\/[a-z]{2}\/.*|^\/(results|questions|nominations)\b/.test(url.pathname);
  const nextKv = isVoterRoute ? `next=${encodeURIComponent(url.pathname + url.search)}` : '';
  /**
   * Append `next=…` to a redirect target with the correct separator. `buildRoute` may emit a base URL that already carries `?electionId=…` (Constituencies branch below), in which case the next-param must join with `&`, not `?`. Concatenating a leading-`?` next directly produced `…?electionId=…?next=…` — a malformed URL that SvelteKit's URL parser 500s on (test 3 reproducer).
   */
  function withNext(base: string): string {
    return nextKv ? `${base}${base.includes('?') ? '&' : '?'}${nextKv}` : base;
  }

  // Try to imply ids if not provided
  if (!hasSelection(electionId) || !hasSelection(constituencyId)) {
    const { appSettingsData, constituencyData, electionData } = await parent();
    const appSettings = mergeAppSettings(staticSettings, await appSettingsData);

    // Create a temporary data root we use for implication
    const dataRoot = new DataRoot();
    dataRoot.provideElectionData(await electionData);
    dataRoot.provideConstituencyData(await constituencyData);
    if (!hasSelection(electionId)) {
      electionId = getImpliedElectionIds({
        appSettings,
        dataRoot,
        selectedConstituencyIds: hasSelection(constituencyId) ? [constituencyId].flat() : undefined
      });
      if (!hasSelection(electionId)) {
        redirect(
          307,
          withNext(
            buildRoute({
              route: 'Elections',
              locale: lang
            })
          )
        );
      }
    }

    if (!hasSelection(constituencyId)) {
      constituencyId = getImpliedConstituencyIds({
        dataRoot,
        selectedElectionIds: [electionId].flat()
      });
      if (!hasSelection(constituencyId)) {
        redirect(
          307,
          withNext(
            buildRoute({
              route: 'Constituencies',
              electionId,
              locale: lang
            })
          )
        );
      }
    }
  }

  // Get data. The client is built from this route's OWN server-load data rather than taken from `await parent()` on purpose: `parent()` does not resolve until the root load's four Supabase round-trips have finished, and the two calls below used to run in parallel with them. Blocking them behind the root measurably broke `afterNavigate`'s single-`requestAnimationFrame` focus reset, which finds no question heading yet and never retries. See this route's `+layout.server.ts` for the full reasoning and for the cost the operator accepted.
  const supabaseClient = createSupabaseUniversalClient({ fetch, cookies: data.supabaseCookies });
  const dataProvider = createDataProvider({ fetch, client: supabaseClient });
  return {
    // Both promises below are returned UNAWAITED on purpose: they stream, and SvelteKit resolves them after this load returns. That is safe under per-request instancing because the promise captures THIS request's own adapter, which nothing else can rebind; do not "fix" it by awaiting.
    questionData: dataProvider
      .getQuestionData({
        electionId,
        locale: lang
      })
      .catch((e) => e),
    nominationData: dataProvider
      .getNominationData({
        electionId,
        constituencyId,
        locale: lang
      })
      .catch((e) => e)
  };
}
