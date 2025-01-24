import { error } from '@sveltejs/kit';
import { getContext, hasContext, setContext } from 'svelte';
import { locale, locales, t, translate } from '$lib/i18n';
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
  console.info('[debug] initI18nContext()');
  if (hasContext(CONTEXT_KEY)) error(500, 'InitI18nContext() called for a second time');
  return setContext<I18nContext>(CONTEXT_KEY, { locale, locales, t, translate });
}
