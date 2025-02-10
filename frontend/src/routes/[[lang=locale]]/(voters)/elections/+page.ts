/**
 * Election selection loader
 *
 * Possibly redirect to another route. The behaviour depends on `appSettings.elections.startFromConstituencyGroup` and whether we have or can imply the `electionId` and `constituencyId` parameters.
 *
 * | `startFromConstituencyGroup` | `electionId`       | `constituencyId`    | Action                               |
 * | ---------------------------- | ------------------ | ------------------- | ------------------------------------ |
 * | Set                          | Implied            | Set or implied      | Redirect to Questions                |
 * | Set                          | Not implied        | Set or implied      | Do nothing (show Election selector)  |
 * | Set                          | Any                | Not set nor implied | Redirect to Constituencies           |
 * | Not set                      | Implied            | Any                 | Redirect to Constituencies           |
 * | Not set                      | Not implied        | Any                 | Do nothing (show Election selector)  |
 *
 * Not implied = Set or not set as long as not implied.
 * If `startFromConstituencyGroup` is not set and both ids can be implied, the Constituency selector route will redirect to Questions, but we leave the decision to that route.
 */

import { staticSettings } from '@openvaa/app-shared';
import { redirect } from '@sveltejs/kit';
import { buildRoute, getImpliedConstituencyIds, getImpliedElectionIds, parseParams } from '$lib/utils/route';
import { mergeAppSettings } from '$lib/utils/settings';
import type { Route } from '$lib/utils/route';

export async function load({ parent, params, route, url }) {
  const { appSettingsData, constituencyData, electionData } = await parent();
  const appSettings = mergeAppSettings(staticSettings, await appSettingsData);

  // Check whether can imply any parameters
  const impliedElectionId = getImpliedElectionIds({
    appSettings,
    elections: await electionData
  });

  // If startFromConstituencyGroup is set, this route is the last one before questions
  if (appSettings.elections?.startFromConstituencyGroup) {
    // Check whether we have the necessary constituencyId parameter or can imply it. If not, redirect to constituency selection page
    let { constituencyId } = parseParams({ params, url });
    if (!constituencyId)
      constituencyId = getImpliedConstituencyIds({
        elections: await electionData,
        constituencies: await constituencyData
      });
    if (constituencyId && impliedElectionId) _redirect('Questions');
    if (!constituencyId) _redirect('Constituencies');
    // Show election selector
    return;
  }

  // StartFromConstituencyGroup is not set, so constituency selection will come after this page
  if (impliedElectionId) _redirect('Constituencies');
  // Show election selector
  return;

  function _redirect(target: Route): never {
    redirect(307, buildRoute(target, { params, route, url }));
  }
}
