import { error } from '@sveltejs/kit';
import { getContext, hasContext, setContext } from 'svelte';
import { darkMode } from './darkMode';
import { getI18nContext } from '../i18n';
import type { ComponentContext } from './componentContext.type';

const CONTEXT_KEY = Symbol();

export function getComponentContext() {
  if (!hasContext(CONTEXT_KEY)) error(500, 'GetComponentsContext() called before initComponentContext()');
  return getContext<ComponentContext>(CONTEXT_KEY);
}

/**
 * Initialize and return the context. This must be called before `getComponentContext()` and cannot be called twice.
 * @returns The context object
 */
export function initComponentContext(): ComponentContext {
  console.info('[debug] initComponentContext()');
  if (hasContext(CONTEXT_KEY)) error(500, 'InitComponentsContext() called for a second time');
  return setContext<ComponentContext>(CONTEXT_KEY, {
    ...getI18nContext(),
    darkMode
  });
}
