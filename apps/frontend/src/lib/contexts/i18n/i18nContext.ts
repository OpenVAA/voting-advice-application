import { error } from '@sveltejs/kit';
import { getContext, hasContext, setContext } from 'svelte';
import { getLocale, locales, t, translate } from '$lib/i18n';
import type { I18nContext } from './i18nContext.type';

const CONTEXT_KEY = Symbol();

export function getI18nContext() {
  if (!hasContext(CONTEXT_KEY)) error(500, 'GetI18nContext() called before initI18nContext()');
  return getContext<I18nContext>(CONTEXT_KEY);
}

/**
 * Initialize and return the context. This must be called before `getI18nContext()` and cannot be called twice.
 * @returns The context object
 */
export function initI18nContext(): I18nContext {
  if (hasContext(CONTEXT_KEY)) error(500, 'InitI18nContext() called for a second time');

  // Locale changes trigger full page reloads (via data-sveltekit-reload),
  // so these values are constant within a page lifecycle — no reactivity needed.
  return setContext<I18nContext>(CONTEXT_KEY, {
    locale: getLocale(),
    locales,
    t,
    translate
  });
}
