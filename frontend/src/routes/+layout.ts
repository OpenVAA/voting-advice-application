import { addTranslations, loadTranslations, locale, setRoute } from '$lib/i18n/init';

export async function load({ data }) {
  const { currentLocale, route } = data.i18n;
  // Add dynamically defined translations but wait for the defaults to load first, otherwise the defaults for partially overwritten main keys will not be loaded
  await loadTranslations(currentLocale);
  addTranslations({
    [currentLocale]: data.appCustomization?.translationOverrides ?? {}
  });
  if (currentLocale !== locale.get()) locale.set(currentLocale);
  // We must call setRoute even though we don't use routes in the translations
  await setRoute(route);

  return data;
}
