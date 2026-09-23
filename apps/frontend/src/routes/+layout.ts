/**
 * Load data used by the whole app:
 * - translations (via Paraglide -- compiled, no loading needed)
 * - `AppSettings`
 * - `AppCustomization`
 * - `ElectionData`
 * - `ConstituencyData`
 *
 * All data is awaited before returning to ensure SvelteKit serializes it for the client (instead of streaming promises which can cause hydration issues in Svelte 5 legacy mode).
 *
 * ## This is also where the app's isomorphic Supabase client is built, once per pass
 *
 * A universal load runs on the server and in the browser and has no `event`, so it cannot reach the per-request cookie-bearing client on `event.locals`. `routes/+layout.server.ts` hands down the request's Supabase auth cookies — the only form that survives a server load's serialization requirement — and this file rebuilds a real client from them. Returning a live client from HERE is legal precisely because a universal load's return value is NOT serialized and may carry custom classes; the same value could not have been returned from the server load. TWO nested universal loads still take the finished client from `await parent()` — `routes/(voters)/nominations/+layout.ts` and `routes/admin/(protected)/+layout.ts` — and both already awaited `parent()` unconditionally for other data, so neither pays for the client. The other three rebuild their own from their own `+layout.server.ts`, because taking the client from `parent()` SERIALISES a nested read behind this load's four round-trips; obligation `OB-1` and the operator's `a+` ruling cover why, and the cost accepted for it is a reconstruction per server-load boundary rather than per request. This sentence said FIVE and "once rather than six times" until phase 158 plan 14; it was already stale by one when `157.2` converted the first of the three, and the count is re-measured here rather than adjusted.
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
