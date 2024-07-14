import { getContext, setContext } from 'svelte';

/**
 * Get the context object that should contain a callback for closing the navigation menu.
 */
export function getNavigationContext() {
  return getContext<NavigationContext>(NAVIGATION_CONTEXT_NAME) ?? {};
}

/**
 * Create context object that should contain a callback for closing the navigation menu.
 */
export function setNavigationContext(context: NavigationContext) {
  setContext<NavigationContext>(NAVIGATION_CONTEXT_NAME, context);
}

/**
 * The name of the navigation context.
 */
const NAVIGATION_CONTEXT_NAME = 'vaa-navigation';

/**
 * A context object that should contain a callback for closing the navigation menu.
 */
interface NavigationContext {
  /**
   * A function that closes the navigation drawer.
   */
  close?: () => void;
}
