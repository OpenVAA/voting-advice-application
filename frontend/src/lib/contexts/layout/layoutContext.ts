import { error } from '@sveltejs/kit';
import { getContext, hasContext, setContext } from 'svelte';
import { cubicOut } from 'svelte/easing';
import { tweened } from 'svelte/motion';
import { writable } from 'svelte/store';
import { type DeepPartial, mergeSettings } from '$lib/utils/merge';
import { stackedStore } from '../utils/stackedStore';
import type { LayoutContext, NavigationSettings, PageStyles, TopBarSettings } from './layoutContext.type';

const CONTEXT_KEY = Symbol();

export const DEFAULT_TOP_BAR_SETTINGS: TopBarSettings = {
  progress: 'hide',
  actions: {
    return: 'hide',
    help: 'hide',
    feedback: 'hide',
    logout: 'hide',
    results: 'hide',
    returnButtonLabel: ''
  }
};

export const DEFAULT_PAGE_STYLES: PageStyles = {
  drawer: {
    background: 'bg-base-100'
  }
} as const;

export const DEFAULT_NAVIGATION_SETTINGS: NavigationSettings = {
  hide: false
} as const;

/**
 * Initialize and return the context. This must be called before `getLayoutContext()` and cannot be called twice.
 * @returns The context object
 */
export function initLayoutContext(): LayoutContext {
  if (hasContext(CONTEXT_KEY)) error(500, 'InitLayoutContext() called for a second time');

  const pageStyles = stackedStore<PageStyles, DeepPartial<PageStyles>>(DEFAULT_PAGE_STYLES, (current, value) => [
    ...current,
    mergeSettings(current[current.length - 1], value)
  ]);

  const topBarSettings = stackedStore<TopBarSettings, DeepPartial<TopBarSettings>>(
    DEFAULT_TOP_BAR_SETTINGS,
    (current, value) => [...current, mergeSettings(current[current.length - 1], value)]
  );

  const navigationSettings = stackedStore<NavigationSettings, DeepPartial<NavigationSettings>>(
    DEFAULT_NAVIGATION_SETTINGS,
    (current, value) => [...current, mergeSettings(current[current.length - 1], value)]
  );

  const progress = {
    max: writable(0),
    current: tweened(0, {
      duration: 400,
      easing: cubicOut
    })
  };

  const navigation = {};

  return setContext<LayoutContext>(CONTEXT_KEY, {
    pageStyles,
    topBarSettings,
    progress,
    navigation,
    navigationSettings
  });
}

/**
 * Get the `LayoutContext` object.
 * @param onDestroy - The `onDestroy` callback for the component using the context. This is needed for automatic rolling back of any changes made to page styles or other context properties affecting layout.
 * @returns The `LayoutContext` object
 */
export function getLayoutContext(onDestroy: (fn: () => unknown) => void) {
  if (!hasContext(CONTEXT_KEY)) error(500, 'GetLayoutContext() called before initLayoutContext()');
  const ctx = getContext<LayoutContext>(CONTEXT_KEY);
  const indexPageStyle = ctx.pageStyles.getLength() - 1;
  const indexTopBar = ctx.topBarSettings.getLength() - 1;
  const indexNavigation = ctx.navigationSettings.getLength() - 1;
  onDestroy(() => {
    ctx.pageStyles.revert(indexPageStyle);
    ctx.topBarSettings.revert(indexTopBar);
    ctx.navigationSettings.revert(indexNavigation);
  });
  return ctx;
}
