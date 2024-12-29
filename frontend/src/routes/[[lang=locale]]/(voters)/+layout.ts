/**
 * Load data used by the whole voter app.
 */

import { dataProvider as dataProviderPromise } from '$lib/api/dataProvider';

export async function load({ fetch, params: { lang: locale } }) {
  const dataProvider = await dataProviderPromise;
  dataProvider.init({ fetch });
  return {
    appSettingsData: dataProvider.getAppSettings().catch((e) => e),
    appCustomizationData: dataProvider.getAppCustomization({ locale }).catch((e) => e),
    electionData: dataProvider.getElectionData({ locale }).catch((e) => e),
    //  We need to greedily load constituency data bc it's needed by the intro route
    constituencyData: dataProvider.getConstituencyData({ locale }).catch((e) => e)
  };
}
