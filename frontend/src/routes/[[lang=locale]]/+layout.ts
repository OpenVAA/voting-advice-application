import { addDynamicTranslations, locale, setRoute } from '$lib/i18n/init';
import type { LayoutLoad } from './$types';

export const load: LayoutLoad = (async ({ data }) => {
  const appLabels = data.election?.appLabels;
  const { currentLocale, route } = data.i18n;
  // Add possible app labels translations
  if (appLabels) addDynamicTranslations(currentLocale, appLabels);
  if (currentLocale !== locale.get()) locale.set(currentLocale);
  // We must call setRoute even though we don't use routes in the translations
  await setRoute(route);

  return data;
}) satisfies LayoutLoad;
