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
import { error, redirect } from '@sveltejs/kit';
import { createDataProvider, createSupabaseUniversalClient } from '$lib/api/dataProvider';
import { t } from '$lib/i18n';
import { getLocale } from '$lib/paraglide/runtime';
import {
  buildRoute,
  getImpliedConstituencyIds,
  getImpliedElectionIds,
  isVoterAppPath,
  parseParams,
  selectionDataOf
} from '$lib/routes';
import { mergeAppSettings } from '$lib/utils/settings';
import type { Id } from '@openvaa/core';

/**
 * Whether an id parameter names an actual selection.
 *
 * An EMPTY ARRAY is not a selection, and a bare truthiness test says it is. Both producers of these values emit one: `parseParams` filters empty values out of an array param, so the degenerate `?electionId=` yields `[]`, and `getImpliedConstituencyIds` returns `[]` rather than `undefined` when it is handed no elections to imply from. The predicate keeps either one from passing a guard as a selection and reaching the adapter as an empty filter, which would render a blank voter app with no error, no redirect and no log line. It is used at all three guards.
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

  // The `next=` redirect target is allowlisted to same-origin Voter App paths to prevent open redirects; anything else is dropped and the redirect goes to the selector without it.
  // The path + search are read untracked too: they only feed the `next=` target. Read tracked, they defeat the `untrack` above — every results tab / drawer navigation reruns this load, re-streams the question + nomination data and blanks the whole subtree via `+layout.svelte`'s `ready` flag (see spike 031). Guarded by `layout.tracking.test.ts`.
  const { pathname, search } = untrack(() => ({ pathname: url.pathname, search: url.search }));
  const nextParam = isVoterAppPath(pathname) ? { next: pathname + search } : {};

  // Try to imply ids if not provided
  if (!hasSelection(electionId) || !hasSelection(constituencyId)) {
    const { appSettingsData, constituencyData, electionData } = await parent();
    // A temporary data root we use for implication
    const selectionData = selectionDataOf({
      appSettingsData: await appSettingsData,
      electionData: await electionData,
      constituencyData: await constituencyData,
      mergeSettings: (data) => mergeAppSettings(staticSettings, data)
    });
    if (!selectionData) error(500, { message: t('error.default') });
    const { appSettings, dataRoot } = selectionData;
    if (!hasSelection(electionId)) {
      electionId = getImpliedElectionIds({
        appSettings,
        dataRoot,
        selectedConstituencyIds: hasSelection(constituencyId) ? [constituencyId].flat() : undefined
      });
      if (!hasSelection(electionId)) {
        redirect(307, buildRoute({ route: 'Elections', locale: lang, ...nextParam }));
      }
    }

    if (!hasSelection(constituencyId)) {
      constituencyId = getImpliedConstituencyIds({
        dataRoot,
        selectedElectionIds: [electionId].flat()
      });
      if (!hasSelection(constituencyId)) {
        redirect(307, buildRoute({ route: 'Constituencies', electionId, locale: lang, ...nextParam }));
      }
    }
  }

  // Get data. The client is built from this route's own server-load data, not from `await parent()`; `+layout.server.ts` says why.
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
