import {error} from '@sveltejs/kit';
import {setContext, getContext, hasContext} from 'svelte';
import {getI18nContext, type I18nContext} from './i18n';
import {getVaaDataContext, type VaaDataContext} from './vaaData';

const APP_CONTEXT_KEY = Symbol();

export function getAppContext() {
  if (!hasContext(APP_CONTEXT_KEY)) error(500, 'GetAppContext() called before initAppContext()');
  return getContext<AppContext>(APP_CONTEXT_KEY);
}

/**
 * Initialize and return the context. This must be called before `getAppContext()` and cannot be called twice.
 * @returns The context object
 */
export function initAppContext(): AppContext {
  console.info('[debug] initAppContext()');
  if (hasContext(APP_CONTEXT_KEY)) error(500, 'InitAppContext() called for a second time');
  return setContext<AppContext>(APP_CONTEXT_KEY, {...getI18nContext(), ...getVaaDataContext()});
}

export type AppContext = I18nContext & VaaDataContext;
