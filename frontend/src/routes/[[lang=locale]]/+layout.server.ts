import type {LayoutServerLoad} from './$types';
import {error} from '@sveltejs/kit';
import {getAppSettings, getElection} from '$lib/api/getData';
import {loadTranslations, locale} from '$lib/i18n';

export const load = (async ({locals, params}) => {
  // Get language from locals (see hooks.server.ts)
  const {currentLocale, preferredLocale, route} = locals;

  // In theory, we could just use currentLocale but we must explicitly use params.lang to rerun load on param changes
  const effectiveLocale = params.lang ?? currentLocale;

  // Set the locale so that getData can used it as default
  if (effectiveLocale !== locale.get()) locale.set(effectiveLocale);

  // Get basic data and translations
  const election = await getElection({locale: effectiveLocale});
  if (!election) {
    throw error(500, 'Error loading election');
  }

  await loadTranslations(effectiveLocale);

  return {
    appSettings: await getAppSettings({locale: effectiveLocale}),
    election,
    // We'll initialize as empty Arrays because they are required by `PageData`. See `app.d.ts` for more details
    candidates: [],
    parties: [],
    questions: [],
    infoQuestions: [],
    i18n: {
      currentLocale: effectiveLocale,
      preferredLocale,
      route
    }
  };
}) satisfies LayoutServerLoad;
