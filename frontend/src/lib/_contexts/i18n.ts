import {error} from '@sveltejs/kit';
import {setContext, getContext, hasContext} from 'svelte';
import {locale, locales, t} from '$lib/i18n';

const I18N_CONTEXT_KEY = Symbol();

export function getI18nContext() {
  if (!hasContext(I18N_CONTEXT_KEY)) error(500, 'GetI18nContext() called before initI18nContext()');
  return getContext<I18nContext>(I18N_CONTEXT_KEY);
}

/**
 * Initialize and return the context. This must be called before `getI18nContext()` and cannot be called twice.
 * @returns The context object
 */
export function initI18nContext(): I18nContext {
  console.info('[debug] initI18nContext()');
  if (hasContext(I18N_CONTEXT_KEY)) error(500, 'InitI18nContext() called for a second time');
  return setContext<I18nContext>(I18N_CONTEXT_KEY, {locale, locales, t});
}

export type I18nContext = {
  locale: typeof locale;
  locales: typeof locales;
  t: typeof t;
};
