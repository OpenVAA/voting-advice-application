/**
 * Check whether election selection is needed and redirect to constituency selection if not.
 */

import { staticSettings } from '@openvaa/app-shared';
import { redirect } from '@sveltejs/kit';
import { buildRoute, getImpliedElectionIds } from '$lib/utils/route';
import { mergeAppSettings } from '$lib/utils/settings';

export async function load({ parent, params, route, url }) {
  const { appSettingsData, electionData } = await parent();
  const electionId = getImpliedElectionIds({
    appSettings: mergeAppSettings(staticSettings, await appSettingsData),
    elections: await electionData
  });
  if (electionId) {
    redirect(
      307,
      buildRoute(
        {
          route: 'Constituencies'
          // electionId,
        },
        { params, route, url }
      )
    );
  }
}
