import {getLocaleFromNavigator, init, register} from 'svelte-i18n';
import {getData} from '../api/getData';
import {logDebugError} from './logger';

const frontendSupportedLocales = ['en'];
const strapiSupportedLocales: string[] = [];
const defaultLocale = 'en';
let currentLocale = defaultLocale;

/**
 * Finds a language match from two strings.
 * Used to compare locales with potential country codes, as Strapi locales
 * might be either 'en' or 'en-GB' for example.
 * The function returns if a match can be found regardless of country code,
 * so frontend supporting 'en' will return true for 'en-GB', 'en-US', 'en-AU' etc.
 * @param locale1 Locale to match without the country code (usually frontend supported language)
 * @param locale2 Locale to compare, either with or without country code
 */
function findMatchingLanguage(locale1: string, locale2: string) {
  return new RegExp(`\\b${locale1}\\b`).test(locale2);
}

/**
 * Compares languages supported by both Strapi and frontend, and returns a list
 * of the supported languages the app can use.
 */
function getSupportedLanguages() {
  const supportedLanguages: string[] = [];

  strapiSupportedLocales.forEach((locale) => {
    frontendSupportedLocales.forEach((feLocale) => {
      const support = findMatchingLanguage(feLocale, locale);
      if (support && !supportedLanguages.includes(feLocale)) supportedLanguages.push(feLocale);
    });
  });

  frontendSupportedLocales.forEach((locale) => {
    strapiSupportedLocales.forEach((feLocale) => {
      const support = findMatchingLanguage(feLocale, locale);
      if (support && !supportedLanguages.includes(feLocale)) supportedLanguages.push(feLocale);
    });
  });

  return supportedLanguages;
}

/**
 * Gets the current locale to use for Strapi API connections, potentially including country code.
 */
export function getCurrentLocaleForBackendQuery() {
  let localeToReturn = defaultLocale;

  // Strapi supported language might be "en-US" for example, so check correct locale to use here
  strapiSupportedLocales.forEach((strapiLocale) => {
    if (findMatchingLanguage(currentLocale, strapiLocale)) {
      localeToReturn = strapiLocale;
    }
  });

  return localeToReturn;
}

/**
 * Fetches list of supported languages from Strapi backend.
 * Used to filter out which frontend translations are required for the app,
 * and which detects possible missing localisations.
 */
async function getSupportedLocalesFromStrapi() {
  await getData('i18n/locales')
    .then((result) => {
      if (result) {
        result.forEach((locale: any) => {
          if (locale.code) {
            strapiSupportedLocales.push(locale.code);
          }
        });
      }
    })
    .catch((error) => {
      logDebugError('Could not get list of supported locales', error);
    });
}

function setInitialLocale() {
  let languageToUse = defaultLocale;
  const languageFromNavigator = getLocaleFromNavigator();
  if (languageFromNavigator) {
    languageToUse = languageFromNavigator.split('-')[0];
  }
  setNewLocale(languageToUse);
  return currentLocale;
}

function setNewLocale(newLocale: string) {
  // TODO: Currently only used for setting on app loads, but could be triggered through GUI
  if (getSupportedLanguages().includes(newLocale)) {
    currentLocale = newLocale;
  } else {
    console.error('Requested locale is not supported, falling back to default');
    currentLocale = defaultLocale;
  }
}

register('en', () => import('../i18n/en.json'));

await getSupportedLocalesFromStrapi();

init({
  fallbackLocale: defaultLocale,
  initialLocale: setInitialLocale()
});
