import {setContext, getContext, hasContext} from 'svelte';
import {mergeSettings, type DeepPartial} from '$lib/utils/merge';
import {stackedStore, type StackedStore} from '$lib/utils/stackedStore';
import {type Writable, writable} from 'svelte/store';
import {type Tweened, tweened} from 'svelte/motion';
import {cubicOut} from 'svelte/easing';
import {error} from '@sveltejs/kit';

const LAYOUT_CONTEXT_KEY = Symbol();

export const DEFAULT_TOP_BAR_SETTINGS: TopBarSettings = {
  progress: 'hide',
  actions: {
    return: 'hide',
    help: 'hide',
    feedback: 'hide',
    results: 'hide',
    returnButtonLabel: ''
  }
};

export const DEFAULT_PAGE_STYLES: PageStyles = {
  drawer: {
    background: 'bg-base-100'
  },
  foo: 'a'
} as const;

/**
 * Initialize and return the context. This must be called before `getLayoutContext()` and cannot be called twice.
 * @returns The context object
 */
export function initLayoutContext(): LayoutContext {
  if (hasContext(LAYOUT_CONTEXT_KEY)) error(500, 'InitLayoutContext() called for a second time');

  const pageStyles = stackedStore<PageStyles, DeepPartial<PageStyles>>(
    DEFAULT_PAGE_STYLES,
    (current, value) => [...current, mergeSettings(current[current.length - 1], value)]
  );
  const topBarSettings = stackedStore<TopBarSettings, DeepPartial<TopBarSettings>>(
    DEFAULT_TOP_BAR_SETTINGS,
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

  return setContext<LayoutContext>(LAYOUT_CONTEXT_KEY, {
    pageStyles,
    topBarSettings,
    progress,
    navigation
  });
}

/**
 * Get the `LayoutContext` object.
 * @param onDestroy - The `onDestroy` callback for the component using the context. This is needed for automatic rolling back of any changes made to page styles or other context properties affecting layout.
 * @returns The `LayoutContext` object
 */
export function getLayoutContext(onDestroy: (fn: () => unknown) => void) {
  if (!hasContext(LAYOUT_CONTEXT_KEY))
    error(500, 'GetLayoutContext() called before initLayoutContext()');
  const ctx = getContext<LayoutContext>(LAYOUT_CONTEXT_KEY);
  const indexPageStyle = ctx.pageStyles.getLength() - 1;
  const indexTopBar = ctx.topBarSettings.getLength() - 1;
  onDestroy(() => {
    ctx.pageStyles.revert(indexPageStyle);
    ctx.topBarSettings.revert(indexTopBar);
  });
  return ctx;
}

export type LayoutContext = {
  /**
   * A store containing top bar actions settings.
   */
  topBarSettings: StackedStore<TopBarSettings, DeepPartial<TopBarSettings>>;
  /**
   * A store containing CSS classes used to customize different parts of the layout.
   * NB. You should set any changes to the styles during component initialization, because if changes are pushed to the `pageStyles` stack later they may be overwritten when another component initialized after the currrent one is destroyed.
   */
  pageStyles: StackedStore<PageStyles, DeepPartial<PageStyles>>;
  /**
   * Progress bar status stores.
   */
  progress: Progress;
  /**
   * A context object that should contain a callback for closing the navigation menu.
   */
  navigation: Navigation;
};

interface PageStyles {
  drawer: {
    background: 'bg-base-100' | 'bg-base-300';
  };
  foo: string;
}

type TopBarAction = 'return' | 'help' | 'feedback' | 'results';

type TopBarActionsSettings = {
  [action in TopBarAction]: 'hide' | 'show';
} & {
  returnButtonLabel: string;
  returnButtonCallback?: () => void;
};

interface TopBarSettings {
  imageSrc?: string;
  progress: 'hide' | 'show';
  actions: TopBarActionsSettings;
}

interface Progress {
  current: Tweened<number>;
  max: Writable<number>;
}

interface Navigation {
  /**
   * A function that closes the navigation drawer.
   */
  close?: () => void;
}
