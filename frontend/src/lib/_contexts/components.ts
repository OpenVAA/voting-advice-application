import {error} from '@sveltejs/kit';
import {setContext, getContext, hasContext} from 'svelte';
import {getI18nContext, type I18nContext} from './i18n';

export const COMPONENTS_CONTEXT_NAME = 'components';

export function getComponentsContext() {
  if (!hasContext(COMPONENTS_CONTEXT_NAME))
    error(500, 'GetComponentsContext() called before initComponentsContext()');
  return getContext<ComponentsContext>(COMPONENTS_CONTEXT_NAME);
}

/**
 * Initialize and return the context. This must be called before `getComponentsContext()` and cannot be called twice.
 * @returns The context object
 */
export function initComponentsContext(): ComponentsContext {
  console.info('[debug] initComponentsContext()');
  if (hasContext(COMPONENTS_CONTEXT_NAME))
    error(500, 'InitComponentsContext() called for a second time');
  return setContext<ComponentsContext>(COMPONENTS_CONTEXT_NAME, {...getI18nContext()});
}

export type ComponentsContext = I18nContext;
