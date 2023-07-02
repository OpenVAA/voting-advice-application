import {getLocaleFromNavigator, init, register} from 'svelte-i18n';
import {logDebugError} from '../utils/logger';

const supportedLanguages = ['en'];
export const defaultLocale = 'en';
let currentLocale = defaultLocale;
export function getCurrentLocale() {
  return currentLocale;
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
  if (supportedLanguages.includes(newLocale)) {
    currentLocale = newLocale;
  } else {
    logDebugError('Requested locale is not supported, falling back to default');
    currentLocale = defaultLocale;
  }
}

register('en', () => import('../i18n/en.json'));

init({
  fallbackLocale: defaultLocale,
  initialLocale: setInitialLocale()
});
