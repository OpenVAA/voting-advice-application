/**
 * Constituency selection loader
 *
 * Possibly redirect to another route. The behaviour depends on `appSettings.elections.startFromConstituencyGroup` and whether we have or can imply the `electionId` and `constituencyId` parameters.
 *
 * | `startFromConstituencyGroup` | `electionId`        | `constituencyId`    | Action                                   |
 * | ---------------------------- | ------------------- | ------------------- | ---------------------------------------- |
 * | Set                          | Any                 | Implied             | Redirect to Elections                    |
 * | Set                          | Any                 | Not implied         | Do nothing (show Constituency selector)  |
 * | Not set                      | Not set nor implied | Any                 | Redirect to Elections                    |
 * | Not set                      | Set or implied      | Implied             | Redirect to Questions                    |
 * | Not set                      | Set or implied      | Not implied         | Do nothing (show Constituency selector)  |
 *
 * Not implied = Set or not set as long as not implied.
 * If `startFromConstituencyGroup` is set and both ids can be implied, the Election selector route will redirect to Questions, but we leave the decision to that route.
 */

import { staticSettings } from '@openvaa/app-shared';
import { redirect } from '@sveltejs/kit';
import { buildRoute, getImpliedConstituencyIds, getImpliedElectionIds, parseParams } from '$lib/utils/route';
import { mergeAppSettings } from '$lib/utils/settings';
import type { Route } from '$lib/utils/route';

export async function load({ parent, params, route, url }) {
  const { appSettingsData, constituencyData, electionData } = await parent();
  const appSettings = mergeAppSettings(staticSettings, await appSettingsData);

  // If startFromConstituencyGroup is set, election selection will come after this page
  if (appSettings.elections?.startFromConstituencyGroup) {
    // Check whether we can imply the constituencyId
    const impliedConstituencyId = getImpliedConstituencyIds({
      elections: await electionData,
      constituencies: await constituencyData
    });
    if (impliedConstituencyId) _redirect('Elections');
    // Show constituency selector
    return;
  }

  // StartFromConstituencyGroup is not set, this route is the last one before questions

  // Check whether we have the necessary electionId parameter or can imply it. If not, redirect to election selection page
  let { electionId } = parseParams({ params, url });
  if (!electionId)
    electionId = getImpliedElectionIds({
      appSettings,
      elections: await electionData
    });

  // Check whether we can now imply the constituencyId
  const impliedConstituencyId = getImpliedConstituencyIds({
    elections: await electionData,
    constituencies: await constituencyData,
    selectedElectionIds: electionId ? [electionId].flat() : undefined
  });

  if (electionId && impliedConstituencyId) _redirect('Questions');
  if (!electionId) _redirect('Elections');
  // Show election selector
  return;

  function _redirect(target: Route): never {
    redirect(307, buildRoute(target, { params, route, url }));
  }
}
