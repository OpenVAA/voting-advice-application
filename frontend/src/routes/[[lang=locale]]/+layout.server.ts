import type {LayoutServerLoad} from './$types';
import {error} from '@sveltejs/kit';
import {getElection} from '$lib/api/getData';
import {loadTranslations, setLocale} from '$lib/i18n';

export const load = (async ({locals}) => {
  // Get language from locals (see hooks.server.ts)
  const {currentLocale, preferredLocale, route} = locals;

  // Set the locale so that getData can used it as default
  setLocale(currentLocale);

  // Get basic data and translations
  const election = await getElection({locale: currentLocale});
  if (!election) {
    throw error(500, 'Error loading election');
  }

  await loadTranslations(currentLocale);

  return {
    election,
    // We'll initialize as empty Arrays because they are required by `PageData`. See `app.d.ts` for more details
    candidates: [],
    parties: [],
    questions: [],
    infoQuestions: [],
    i18n: {
      currentLocale,
      preferredLocale,
      route
    }
  };
}) satisfies LayoutServerLoad;
