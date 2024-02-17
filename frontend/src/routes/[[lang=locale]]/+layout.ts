import type {LayoutLoad} from './$types';
import {addTranslations, setLocale, setRoute} from '$lib/i18n/init';

export const load: LayoutLoad = (async ({data}) => {
  const {appLabels} = data.election;
  const {currentLocale, route, translations} = data.i18n;
  // Add app labels translations
  addTranslations({...translations, [currentLocale]: appLabels});
  await setLocale(currentLocale);
  // We must call setRoute even though we don't use routes in the translations
  await setRoute(route);
  return data;
}) satisfies LayoutLoad;
