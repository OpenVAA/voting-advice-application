import {getLocaleFromNavigator, init, register} from 'svelte-i18n';
import {getData} from '../api/getData';
import {logDebugError} from './logger';

const frontendSupportedLocales = ['en'];
const strapiSupportedLocales: string[] = [];

function getSupportedLanguages() {
  const supportedLanguages = frontendSupportedLocales.filter((value) =>
    strapiSupportedLocales.includes(value)
  );

  // Compare languages that don't have mutual support
  const arrayDifference = [];
  arrayDifference.push(
    frontendSupportedLocales.filter((value) => !strapiSupportedLocales.includes(value))
  );
  arrayDifference.push(
    strapiSupportedLocales.filter((value) => !frontendSupportedLocales.includes(value))
  );

  if (arrayDifference.length > 0) {
    logDebugError('Number of languages supported by frontend and Strapi are different.');
    logDebugError('Languages supported by frontend: ', frontendSupportedLocales);
    logDebugError('Languages supported by Strapi: ', strapiSupportedLocales);
  }
  return supportedLanguages;
}

export const defaultLocale = 'en';
let currentLocale = defaultLocale;
export function getCurrentLocale() {
  return currentLocale;
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
