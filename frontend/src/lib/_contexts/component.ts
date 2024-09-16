import {error} from '@sveltejs/kit';
import {setContext, getContext, hasContext} from 'svelte';
import {getI18nContext, type I18nContext} from './i18n';

const COMPONENT_CONTEXT_KEY = Symbol();

export function getComponentsContext() {
  if (!hasContext(COMPONENT_CONTEXT_KEY))
    error(500, 'GetComponentsContext() called before initComponentsContext()');
  return getContext<ComponentsContext>(COMPONENT_CONTEXT_KEY);
}

/**
 * Initialize and return the context. This must be called before `getComponentsContext()` and cannot be called twice.
 * @returns The context object
 */
export function initComponentsContext(): ComponentsContext {
  console.info('[debug] initComponentsContext()');
  if (hasContext(COMPONENT_CONTEXT_KEY))
    error(500, 'InitComponentsContext() called for a second time');
  return setContext<ComponentsContext>(COMPONENT_CONTEXT_KEY, {...getI18nContext()});
}

export type ComponentsContext = I18nContext;
