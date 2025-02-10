import type { Tweened } from 'svelte/motion';
import type { Writable } from 'svelte/store';
import type { DeepPartial } from '$lib/utils/merge';
import type { StackedStore } from '../utils/stackedStore';

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
  /**
   * A store containing navigation settings.
   * NB. This is not contained under `navigation` for easier store access.
   */
  navigationSettings: StackedStore<NavigationSettings, DeepPartial<NavigationSettings>>;
};

export interface PageStyles {
  drawer: {
    background: 'bg-base-100' | 'bg-base-200' | 'bg-base-300';
  };
}

type TopBarAction = 'return' | 'help' | 'feedback' | 'results' | 'logout';

type TopBarActionsSettings = {
  [action in TopBarAction]: 'hide' | 'show';
} & {
  returnButtonLabel: string;
  returnButtonCallback?: () => void;
};

export interface TopBarSettings {
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

/**
 * A store containing navigation settings.
 */
export interface NavigationSettings {
  /**
   * Whether to hide the nav menu and the button opening it. Default is `false`.
   */
  hide?: boolean;
}
