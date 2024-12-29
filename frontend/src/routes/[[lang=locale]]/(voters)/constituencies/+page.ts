/**
 * 1. Check whether we have the necessary electionId parameter or if we can imply it. If not, redirect to election selection page.
 * 2. Check whether constituency selection is needed and redirect to questions if not.
 */

import { staticSettings } from '@openvaa/app-shared';
import { redirect } from '@sveltejs/kit';
import { buildRoute, getImpliedConstituencyIds, getImpliedElectionIds, parseParams } from '$lib/utils/route';
import { mergeAppSettings } from '$lib/utils/settings';

export async function load({ parent, params, route, url }) {
  const { appSettingsData, constituencyData, electionData } = await parent();

  // Check whether we have the necessary electionId parameter or if we can imply it. If not, redirect to election selection page.
  let { electionId } = parseParams({ params, url });
  if (!electionId) {
    electionId = getImpliedElectionIds({
      appSettings: mergeAppSettings(staticSettings, await appSettingsData),
      elections: await electionData
    });
    if (!electionId) {
      redirect(
        307,
        buildRoute(
          {
            route: 'Elections'
          },
          { params, route, url }
        )
      );
    }
  }

  // Check whether constituency selection is needed and redirect to questions if not.
  const constituencyId = getImpliedConstituencyIds({
    elections: await electionData,
    constituencies: await constituencyData
  });
  if (constituencyId) {
    redirect(
      307,
      buildRoute(
        {
          route: 'Questions'
        },
        { params, route, url }
      )
    );
  }
}
