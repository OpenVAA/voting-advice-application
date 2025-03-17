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
 */

import { staticSettings } from '@openvaa/app-shared';
import { DataRoot } from '@openvaa/data';
import { redirect } from '@sveltejs/kit';
import { buildRoute, getImpliedElectionIds, parseParams } from '$lib/utils/route';
import { mergeAppSettings } from '$lib/utils/settings';
import type { Route } from '$lib/utils/route';

export async function load({ parent, params, route, url }) {
  const { appSettingsData, constituencyData, electionData } = await parent();
  const appSettings = mergeAppSettings(staticSettings, await appSettingsData);
  appSettings.elections.disallowSelection = true;

  // Create a temporary data root we use for implication
  const dataRoot = new DataRoot();
  dataRoot.provideElectionData(await electionData);
  dataRoot.provideConstituencyData(await constituencyData);

  // Check whether can imply any parameters
  // NB. We  don't pass the selected constituencyIds here, because we want to show the election selector even if there's only one possible election in a multi-election app so that the user knows this
  const impliedElectionId = getImpliedElectionIds({
    appSettings,
    dataRoot
  });

  // If startFromConstituencyGroup is set, this route is the last one before questions
  if (appSettings.elections?.startFromConstituencyGroup) {
    // Check whether we have the necessary constituencyId parameter. If not, redirect to constituency selection page
    // NB. We don't try to imply it, because we assume that if startFromConstituencyGroup is set, the constituency must be selected
    const { constituencyId } = parseParams({ params, url });
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
