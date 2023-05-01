import {browser} from '$app/environment';
import {init, register} from 'svelte-i18n';

const supportedLanguages = ['en'];
export const defaultLocale = supportedLanguages[0];

function setInitialLocale() {
  let initialLocale = defaultLocale;
  if (browser) {
    const browserLang = window.navigator.language.split('-')[0];
    if (supportedLanguages.includes(browserLang)) {
      initialLocale = browserLang;
    }
  }
  return initialLocale;
}

register('en', () => import('../i18n/en.json'));

init({
  fallbackLocale: defaultLocale,
  initialLocale: setInitialLocale()
});
