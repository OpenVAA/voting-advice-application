import type {LayoutServerLoad} from './$types';
import {error} from '@sveltejs/kit';
import {getElection, defaultLocale, supportedLocales} from '$lib/api/getData';
import {
  loadTranslations,
  locales,
  setLocale,
  translations,
  defaultLocale as defaultStaticLocale
} from '$lib/i18n';
import {logDebugError} from '$lib/utils/logger';

export const load = (async ({url, locals}) => {
  // Get language from locals (see hooks.server.ts)
  const {currentLocale, preferredLocale} = locals;
  logDebugError(`/+layout.server.ts: Got language ${currentLocale} from locals`);

  // Set the locale so that getData can used it as default
  setLocale(currentLocale);

  // The route without the language prefix
  const route = url.pathname.replace(new RegExp(`^/${currentLocale}`, 'i'), '');

  // Get basic data and translations
  const election = await getElection({locale: currentLocale});
  if (!election || !supportedLocales || !defaultLocale) {
    throw error(500, 'Error loading appLabels, locales or election');
  }

  // Check that languages defined locally match those supported by the database
  const staticLocales = locales.get();
  logDebugError(`/+layout.server.ts: Static locales: ${staticLocales}`);

  if (staticLocales.length !== supportedLocales.length)
    throw error(
      500,
      `Local and data locales do not match. Static: ${staticLocales.join(
        ', '
      )}. Data: ${supportedLocales.map((l) => l.code).join(', ')}`
    );
  if (defaultLocale.toLowerCase() !== defaultStaticLocale.toLowerCase())
    throw error(
      500,
      `Local and data default locales do not match. Static: ${defaultStaticLocale}. Data: ${defaultLocale}`
    );
  for (const loc of staticLocales) {
    if (!supportedLocales.find((d) => d.code.toLowerCase() === loc.toLowerCase()))
      throw error(
        500,
        `Local and data locales do not match. Static: ${staticLocales.join(
          ', '
        )}. Data: ${supportedLocales.map((l) => l.code).join(', ')}`
      );
  }

  await loadTranslations(currentLocale);

  return {
    appLabels: election.appLabels,
    election,
    // We'll initialize as empty Arrays because they are required by `PageData`.
    // See `app.d.ts` for more details
    candidates: [],
    parties: [],
    questions: [],
    i18n: {
      currentLocale,
      preferredLocale,
      route,
      translations: translations.get()
    }
  };
}) satisfies LayoutServerLoad;
