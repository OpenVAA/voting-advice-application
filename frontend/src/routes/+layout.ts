/**
 * Load data used by the whole app.
 */
import { dataProvider as dataProviderPromise } from '$lib/api/dataProvider';
import { addTranslations, loadTranslations, locale, setRoute } from '$lib/i18n';

export async function load({ fetch, params: { lang } }) {
  const dataProvider = await dataProviderPromise;
  dataProvider.init({ fetch });

  // Load app customization first, because it may contain translation overrides. Any errors will be handled by +layout.svelte
  const appCustomizationData = dataProvider.getAppCustomization({ locale: lang }).catch((e) => e);
  const appCustomizationSync = await appCustomizationData;

  // Add dynamically defined translations but wait for the defaults to load first, otherwise the defaults for partially overwritten main keys will not be loaded
  await loadTranslations(lang);
  if (appCustomizationSync && !(appCustomizationSync instanceof Error))
    addTranslations({
      [lang]: appCustomizationSync.translationOverrides ?? {}
    });

  // Set current locale
  locale.set(lang);
  // We must call setRoute even though we don't use routes in the translations
  await setRoute('');

  return {
    // Return the promise, so that it's in line with the other data passed as Promises
    appCustomizationData,
    appSettingsData: dataProvider.getAppSettings().catch((e) => e)
  };
}
