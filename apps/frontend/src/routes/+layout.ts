/**
 * Load data used by the whole app:
 * - translations (via Paraglide -- compiled, no loading needed)
 * - `AppSettings`
 * - `AppCustomization`
 * - `ElectionData`
 * - `ConstituencyData`
 *
 * All data is awaited before returning to ensure SvelteKit serializes it
 * for the client (instead of streaming promises which can cause hydration
 * issues in Svelte 5 legacy mode).
 */
import { dataProvider as dataProviderPromise } from '$lib/api/dataProvider';
import { setOverrides } from '$lib/i18n/overrides';
import { getLocale } from '$lib/paraglide/runtime';

export async function load({ fetch }) {
  const lang = getLocale();
  const dataProvider = await dataProviderPromise;
  dataProvider.init({ fetch });

  // Load app customization first, because it may contain translation overrides
  const appCustomizationData = await dataProvider.getAppCustomization({ locale: lang }).catch((e) => e);

  // Apply backend translation overrides
  if (appCustomizationData && !(appCustomizationData instanceof Error)) {
    const overrides = appCustomizationData.translationOverrides;
    if (overrides) setOverrides(lang, overrides);
  }

  // Await all remaining data in parallel
  const [appSettingsData, electionData, constituencyData] = await Promise.all([
    dataProvider.getAppSettings().catch((e) => e),
    dataProvider.getElectionData({ locale: lang }).catch((e) => e),
    dataProvider.getConstituencyData({ locale: lang }).catch((e) => e)
  ]);

  return {
    appCustomizationData,
    appSettingsData,
    electionData,
    constituencyData
  };
}
