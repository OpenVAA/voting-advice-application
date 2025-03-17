import type { Tweened } from 'svelte/motion';
import type { Writable } from 'svelte/store';
import type { OptionalVideoProps, Video, VideoContentProps, VideoMode } from '$lib/components/video';
import type { DeepPartial } from '$lib/utils/merge';
import type { StackedStore } from '../utils/stackedStore';

export type LayoutContext = {
  /**
   * A store containing top bar actions settings. When showing some buttons, make sure to provide a callback if they define one.
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
  /**
   * Settings related to the video player.
   */
  video: VideoController;
};

export interface PageStyles {
  drawer: {
    background: 'bg-base-100' | 'bg-base-200' | 'bg-base-300';
  };
}

export type TopBarAction = 'cancel' | 'feedback' | 'help' | 'logout' | 'results' | 'return';

export type TopBarActionsSettings = {
  [action in TopBarAction]: 'hide' | 'show';
} & {
  cancelButtonLabel: string;
  cancelButtonCallback?: () => void;
  returnButtonLabel: string;
  returnButtonCallback?: () => void;
};

export interface TopBarSettings {
  imageSrc?: string;
  progress: 'hide' | 'show';
  actions: TopBarActionsSettings;
}

export interface Progress {
  current: Tweened<number>;
  max: Writable<number>;
}

export interface Navigation {
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

/**
 * An object for controlling the video player.
 */
export interface VideoController {
  /**
   * Change the video contents, i.e. sources, captions, poster and transcript.
   * @param props - The new video content and other properties.
   * @param options.autoshow - If `true`, the video will be shown automatically. @default true
   * @returns A `Promise` that resolves to `true` if the `video` element was present.
   */
  load: (props: VideoContentProps & OptionalVideoProps, options?: { autoshow?: boolean }) => Promise<boolean>;
  /**
   * Whether to show the video player. @default false
   * Will be automatically set to `true` when `load` is called.
   */
  show: Writable<boolean>;
  /**
   * Whether the video player has content. @default false
   * NB. You do not usually need to set this manually. It will instead be automatically set to `true` when `load` is called and `false` on `afterNavigate`.
   */
  hasContent: Writable<boolean>;
  /**
   * Whether the player is in `text` or `video` mode. This will be set internally, so it should only be read under normal circumstances. @default 'video'
   */
  mode: Writable<VideoMode>;
  /**
   * A reference to the `Video` component. This is mainly used internally, but can be accessed for fine-grained control.
   */
  player: Writable<Video | undefined>;
}
