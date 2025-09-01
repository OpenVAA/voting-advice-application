/**
 * - Check if the nominations route is available
 * - Load the data used by the route
 */

import { staticSettings } from '@openvaa/app-shared';
import { redirect } from '@sveltejs/kit';
import { dataProvider as dataProviderPromise } from '$lib/api/dataProvider';
import { buildRoute } from '$lib/utils/route';
import { mergeAppSettings } from '$lib/utils/settings';

export async function load({ parent, fetch, params: { lang } }) {
  // 1. Check if the nominations route is available
  const { appSettingsData } = await parent();
  const appSettings = mergeAppSettings(staticSettings, await appSettingsData);
  if (!appSettings.entities.showAllNominations) {
    redirect(
      307,
      buildRoute({
        route: 'Home',
        lang
      })
    );
  }

  // 2. Load the data used by the route
  const dataProvider = await dataProviderPromise;
  dataProvider.init({ fetch });
  return {
    nominationData: dataProvider
      .getNominationData({
        locale: lang
      })
      .catch((e) => e)
  };
}
