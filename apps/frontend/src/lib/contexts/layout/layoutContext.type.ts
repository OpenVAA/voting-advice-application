import type { DeepPartial, VideoContent } from '@openvaa/app-shared';
import type { Tween } from 'svelte/motion';
import type { OptionalVideoProps, Video, VideoMode } from '$lib/components/video';
import type { SettingsOverlayApi } from '../utils/SettingsOverlay.svelte';

export type LayoutContext = {
  /**
   * A token-keyed overlay registry containing top bar actions settings. When showing some buttons, make sure to provide a callback if they define one. Read the merged settings via `.current`; register an overlay declaratively via `useTopBar(...)` (or `.use(...)`), whose cleanup is `$effect`-scoped.
   */
  topBarSettings: SettingsOverlayApi<TopBarSettings, DeepPartial<TopBarSettings>>;
  /**
   * A token-keyed overlay registry containing CSS classes used to customize different parts of the layout. Register overlays via `usePageStyles(...)` (or `.use(...)`); the overlay is auto-reverted on component destroy via `$effect` cleanup (token-keyed, so out-of-order mount/unmount no longer corrupts the merged result).
   */
  pageStyles: SettingsOverlayApi<PageStyles, DeepPartial<PageStyles>>;
  /**
   * Progress bar status stores.
   */
  progress: Progress;
  /**
   * A context object that should contain a callback for closing the navigation menu.
   */
  navigation: Navigation;
  /**
   * A token-keyed overlay registry containing navigation settings.
   * NB. This is not contained under `navigation` for easier access. Register overlays via `useNavigation(...)` (or `.use(...)`).
   */
  navigationSettings: SettingsOverlayApi<NavigationSettings, DeepPartial<NavigationSettings>>;
  /**
   * Settings related to the video player.
   */
  video: VideoController;
  /**
   * The active route's already-localized page title (the value the route feeds to its document `<title>`, MINUS the constant app-name/maintenance suffix), surfaced for the root `#route-announcer`. Read the current value via `.current`; it is empty when no title-bearing layout component is mounted. Register a route's title declaratively via `setRouteTitle(...)`.
   */
  routeTitle: RouteTitle;
  /**
   * Declarative, `$effect`-scoped registrar for the route announcer's title — see `useTopBar`. The mounted title component (e.g. `MainContent` / `SingleCardContent`) calls it with its already-localized `title` prop; it writes the `routeTitle` signal and, on component teardown via `$effect` cleanup, resets the signal to the empty string so a route without a title-bearing component does not announce a stale title. No new i18n string is authored — the value carried is the one passed in.
   */
  setRouteTitle: (title: string) => void;
  /**
   * Declarative scoped overlay for the top bar — pushes the overlay and auto-reverts via `$effect` cleanup when the calling component is destroyed. Replaces the old imperative `topBarSettings.push(...)` + `onDestroy` index-revert.
   */
  useTopBar: (overlay: DeepPartial<TopBarSettings>) => void;
  /**
   * Declarative scoped overlay for page styles — see `useTopBar`.
   */
  usePageStyles: (overlay: DeepPartial<PageStyles>) => void;
  /**
   * Declarative scoped overlay for navigation settings — see `useTopBar`.
   */
  useNavigation: (overlay: DeepPartial<NavigationSettings>) => void;
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
  current: Tween<number>;
  max: number;
}

/**
 * A reactive signal carrying the active route's already-localized page title for the root
 * `#route-announcer`. Empty string when no title-bearing layout component is mounted.
 */
export interface RouteTitle {
  /**
   * The active route's localized title (minus the constant app-name/maintenance suffix), or the
   * empty string when no title-bearing layout component is currently mounted.
   */
  readonly current: string;
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
  load: (props: VideoContent & OptionalVideoProps, options?: { autoshow?: boolean }) => Promise<boolean>;
  /**
   * Whether to show the video player. @default false
   * Will be automatically set to `true` when `load` is called.
   */
  show: boolean;
  /**
   * Whether the video player has content. @default false
   * NB. You do not usually need to set this manually. It will instead be automatically set to `true` when `load` is called and `false` on `afterNavigate`.
   */
  hasContent: boolean;
  /**
   * Whether the player is in `text` or `video` mode. This will be set internally, so it should only be read under normal circumstances. @default 'video'
   */
  mode: VideoMode;
  /**
   * A reference to the `Video` component. This is mainly used internally, but can be accessed for fine-grained control.
   */
  player: Video | undefined;
}
