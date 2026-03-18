/**
 * Load data used by the whole app:
 * - translations (via Paraglide -- compiled, no loading needed)
 * - `AppSettings`
 * - `AppCustomization`
 * - `ElectionData`
 * - `ConstituencyData`
 */
import { dataProvider as dataProviderPromise } from '$lib/api/dataProvider';
import { setOverrides } from '$lib/i18n/overrides';
import { getLocale } from '$lib/paraglide/runtime';

export async function load({ fetch }) {
  const lang = getLocale();
  const dataProvider = await dataProviderPromise;
  dataProvider.init({ fetch });

  // Load app customization first, because it may contain translation overrides
  const appCustomizationData = dataProvider.getAppCustomization({ locale: lang }).catch((e) => e);
  const appCustomizationSync = await appCustomizationData;

  // Apply backend translation overrides
  if (appCustomizationSync && !(appCustomizationSync instanceof Error)) {
    const overrides = appCustomizationSync.translationOverrides;
    if (overrides) setOverrides(lang, overrides);
  }

  return {
    appCustomizationData,
    appSettingsData: dataProvider.getAppSettings().catch((e) => e),
    electionData: dataProvider.getElectionData({ locale: lang }).catch((e) => e),
    constituencyData: dataProvider.getConstituencyData({ locale: lang }).catch((e) => e)
  };
}
