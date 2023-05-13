import {getLocaleFromNavigator, init, register} from 'svelte-i18n';
import {getData} from '../api/getData';
import {logDebugError, logDebugInfo} from './logger';
import {supportedLanguagesLoadedFromBackend} from '../stores';

const defaultLocale = 'en';
let currentLocale = defaultLocale;
let strapiSupportedLocales: any[] = [];
let localesLoadedFromStrapi = false;

supportedLanguagesLoadedFromBackend.subscribe((value) => {
  localesLoadedFromStrapi = value;
});

/**
 * Fetches a list of supported languages from Strapi backend.
 */
async function getSupportedLocales() {
  if (!localesLoadedFromStrapi) {
    strapiSupportedLocales = [];
    await getData('i18n/locales')
      .then((result) => {
        result?.forEach((locale: any) => {
          strapiSupportedLocales.push(locale);
        });
      })
      .catch((error) => {
        logDebugError('Could not get list of supported locales', error);
      });
  }
  return strapiSupportedLocales;
}

/**
 * Gets the current locale to use for backend connections.
 */
export function getCurrentLocale() {
  return currentLocale;
}

/**
 * Changes the locale to use for backend connections & UI texts.
 * @param newLocale New locale code
 */
async function changeLocale(newLocale: string) {
  // TODO: Currently only used for setting on app loads, but could be triggered through GUI
  const supportedLanguages = await getSupportedLocales();
  if (supportedLanguages.find((locale) => locale.code === newLocale)) {
    logDebugInfo('Changed new locale to ', newLocale);
    currentLocale = newLocale;
  } else {
    console.error(`Requested locale '${newLocale}' is not supported, falling back to default`);
    currentLocale = defaultLocale;
  }
}

/**
 * Sets the initial locale to use on application start
 */
async function setInitialLocale() {
  let languageToUse = defaultLocale;

  // Initially find default language from Strapi and use that
  await getSupportedLocales()
    .then((result) => {
      result?.forEach((locale) => {
        if (locale.isDefault) {
          logDebugInfo('Got default locale from Strapi: ', locale);
          languageToUse = locale.code;
        }
      });
    })
    .catch((error) => {
      logDebugError('Failed to fetch supported languages from backend.');
      // Use locale from browser as a fallback

      const languageFromNavigator = getLocaleFromNavigator();
      if (languageFromNavigator) {
        // Language might contain country code like 'en-GB'
        // Make sure to ignore that for fallback purposes
        languageToUse = languageFromNavigator.split('-')[0];
      }
    });

  await changeLocale(languageToUse);
  return currentLocale;
}

register('en', () => import('../i18n/en.json'));

init({
  fallbackLocale: defaultLocale,
  initialLocale: await setInitialLocale()
});
