/**
 * Election selection loader
 *
 * Possibly redirect to another route. The behaviour depends on `appSettings.elections.startFromConstituencyGroup` and whether we have or can imply the `electionId` and `constituencyId` parameters.
 *
 * | `startFromConstituencyGroup` | `electionId`       | `constituencyId`    | Action                               |
 * | ---------------------------- | ------------------ | ------------------- | ------------------------------------ |
 * | Set                          | Implied            | Set                 | Redirect to Questions                |
 * | Set                          | Not implied        | Set                 | Do nothing (show Election selector)  |
 * | Set                          | Any                | Not set             | Redirect to Constituencies           |
 * | Not set                      | Implied            | Any                 | Redirect to Constituencies           |
 * | Not set                      | Not implied        | Any                 | Do nothing (show Election selector)  |
 *
 * Not implied = Set or not set as long as not implied.
 * If `startFromConstituencyGroup` is not set and both ids can be implied, the Constituency selector route will redirect to Questions, but we leave the decision to that route.
 *
 * The rows are decided by `electionsStepOutcome` of `$lib/routes`, the shared module for the order of the selection; this load maps its outcome to the Voter App's routes.
 */

import { staticSettings } from '@openvaa/app-shared';
import { error, redirect } from '@sveltejs/kit';
import { t } from '$lib/i18n';
import { buildRoute, electionsStepOutcome, parseParams, selectionDataOf } from '$lib/routes';
import { mergeAppSettings } from '$lib/utils/settings';
import type { Route } from '$lib/routes';

export async function load({ parent, params, route, url }) {
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

  // Every election is on offer and `elections.disallowSelection` is honoured. A single election held in the selected constituencies is not treated as implied: the election selector is shown for it, so that the voter of a multi-election app learns that only that election is held there. A constituency is never implied here either: if `startFromConstituencyGroup` is set, the constituency must be selected.
  const { constituencyId } = parseParams({ params, url });
  const outcome = electionsStepOutcome({
    dataRoot,
    appSettings,
    honourDisallowSelection: true,
    implyWithinChosenConstituencies: false,
    skipWhenFullyImplied: false,
    constituencyIds: constituencyId ? [constituencyId].flat() : undefined
  });

  // Deferred-target handling: a `?next=` target from `(voters)/(located)/+layout.ts` is NOT a persistent search param, so it gets dropped by buildRoute's `filterPersistent` pass. Forward it explicitly so an auto-implied election still chains the deferred target through to /constituencies.
  const nextSearch = url.searchParams.get('next');
  const nextForward: { next?: string } = nextSearch ? { next: nextSearch } : {};

  if (outcome.action === 'done') _redirect('Questions', nextForward);
  // The implied `electionId` is passed forward so that /constituencies and the voter context's `selectedElections` see it without implying it again.
  if (outcome.action === 'goto')
    _redirect('Constituencies', {
      ...(outcome.electionIds ? { electionId: outcome.electionIds } : {}),
      ...nextForward
    });
  // Show election selector
  return;

  function _redirect(target: Route, extraParams?: Record<string, string | Array<string> | undefined>): never {
    redirect(307, buildRoute({ route: target, ...(extraParams ?? {}) }, { params, route, url }));
  }
}
