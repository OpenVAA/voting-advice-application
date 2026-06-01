import { error } from '@sveltejs/kit';
import { getContext, hasContext, setContext } from 'svelte';
import { getLocale, locales, t, translate } from '$lib/i18n';
import { assertTranslationKey } from '$lib/i18n/utils/assertTranslationKey';
import { locales as paraglideLocales } from '$lib/paraglide/runtime';
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

  // Locale display names are sourced from the Paraglide message catalog
  // (`messages/{locale}/lang.json`, keyed `lang.<code>`), so they ship in the
  // translations payload for every language and can be customized per-deployment
  // via backend `translationOverrides`. Built here (within component/request scope)
  // rather than at `init.ts` module load, where `t()` → `getLocale()` would run
  // outside any request context. Endonyms are locale-invariant, and locale changes
  // trigger a full page reload, so a one-time build at context init is correct.
  const localeNames: Record<string, string> = {};
  for (const code of paraglideLocales) {
    localeNames[code] = t(assertTranslationKey(`lang.${code}`));
  }

  return setContext<I18nContext>(CONTEXT_KEY, {
    locale: getLocale(),
    locales,
    localeNames,
    t,
    translate
  });
}
