import type {LayoutLoad} from './$types';
import {addDynamicTranslations, locale, setRoute} from '$lib/i18n/init';

export const load: LayoutLoad = (async ({data}) => {
  const {appLabels} = data.election;
  const {currentLocale, route} = data.i18n;
  // Add app labels translations
  addDynamicTranslations(currentLocale, appLabels);
  if (currentLocale !== locale.get()) locale.set(currentLocale);
  // We must call setRoute even though we don't use routes in the translations
  await setRoute(route);

  return data;
}) satisfies LayoutLoad;
