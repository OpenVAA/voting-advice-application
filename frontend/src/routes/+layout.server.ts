import { error } from '@sveltejs/kit';
import { dataProvider } from '$lib/api/getData';
import { locale } from '$lib/i18n';

export async function load({ locals, params }) {
  // Get language from locals (see hooks.server.ts)
  const { currentLocale, preferredLocale, route } = locals;

  // In theory, we could just use currentLocale but we must explicitly use params.lang to rerun load on param changes
  const effectiveLocale = params.lang ?? currentLocale;

  // Set the locale so that getData can used it as default
  if (effectiveLocale !== locale.get()) locale.set(effectiveLocale);

  const { getAppSettings, getAppCustomization, getElection } = await dataProvider;

  // Get app settings and possibly enter maintenance mode. `getAppSettings` will resolve to `undefined` if the database connection could not be made.
  let appSettings = await getAppSettings();
  if (!appSettings) {
    appSettings = { underMaintenance: true };
  }

  let appCustomization: Partial<AppCustomization> | undefined;
  if (!appSettings.underMaintenance) {
    appCustomization = await getAppCustomization({ locale: effectiveLocale });
  }

  let election: ElectionProps | undefined;
  if (!appSettings.underMaintenance) {
    // Get basic data and translations
    election = await getElection({ locale: effectiveLocale });
    if (!election) {
      throw error(500, 'Error loading election');
    }
  }

  return {
    appSettings,
    appCustomization,
    election,
    i18n: {
      currentLocale: effectiveLocale,
      preferredLocale,
      route
    }
  };
}
