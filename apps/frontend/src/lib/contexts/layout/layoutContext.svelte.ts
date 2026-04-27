import { error } from '@sveltejs/kit';
import { getContext, hasContext, setContext } from 'svelte';
import { cubicOut } from 'svelte/easing';
import { Tween } from 'svelte/motion';
import { afterNavigate, beforeNavigate } from '$app/navigation';
import { mergeSettings } from '$lib/utils/merge';
import { DELAY } from '$lib/utils/timing';
import { StackedState } from '../utils/StackedState.svelte';
import type { VideoContent } from '@openvaa/app-shared';
import type { Video, VideoMode } from '$lib/components/video';
import type { OptionalVideoProps } from '$lib/components/video';
import type { DeepPartial } from '$lib/utils/merge';
import type {
  LayoutContext,
  Navigation,
  NavigationSettings,
  PageStyles,
  Progress,
  TopBarSettings,
  VideoController
} from './layoutContext.type';

const CONTEXT_KEY = Symbol();

export const DEFAULT_TOP_BAR_SETTINGS: TopBarSettings = {
  progress: 'hide',
  actions: {
    cancel: 'hide',
    cancelButtonLabel: '',
    feedback: 'hide',
    help: 'hide',
    logout: 'hide',
    results: 'hide',
    return: 'hide',
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

  const pageStyles = new StackedState<PageStyles, DeepPartial<PageStyles>>(DEFAULT_PAGE_STYLES, (current, value) => [
    ...current,
    mergeSettings(current[current.length - 1], value)
  ]);

  const topBarSettings = new StackedState<TopBarSettings, DeepPartial<TopBarSettings>>(
    DEFAULT_TOP_BAR_SETTINGS,
    (current, value) => [...current, mergeSettings(current[current.length - 1], value)]
  );

  const navigationSettings = new StackedState<NavigationSettings, DeepPartial<NavigationSettings>>(
    DEFAULT_NAVIGATION_SETTINGS,
    (current, value) => [...current, mergeSettings(current[current.length - 1], value)]
  );

  let progressMax = $state(0);
  const progressTween = new Tween(0, {
    duration: 400,
    easing: cubicOut
  });

  const progress: Progress = {
    get max() {
      return progressMax;
    },
    set max(v) {
      progressMax = v;
    },
    current: progressTween
  };

  const navigation: Navigation = {};

  let videoShow = $state(false);
  let videoHasContent = $state(false);
  let videoMode = $state<VideoMode>('video');
  let videoPlayer = $state<Video | undefined>(undefined);

  const video: VideoController = {
    load,
    get show() {
      return videoShow;
    },
    set show(v) {
      videoShow = v;
    },
    get hasContent() {
      return videoHasContent;
    },
    set hasContent(v) {
      videoHasContent = v;
    },
    get mode() {
      return videoMode;
    },
    set mode(v) {
      videoMode = v;
    },
    get player() {
      return videoPlayer;
    },
    set player(v) {
      videoPlayer = v;
    }
  };

  /**
   * Used in connection with the timeout delay to allow for the next page to load possible video content before hiding it and setting `video.hasContent` to `false`, which triggers layout changes as well.
   */
  let shouldClearContent = false;

  async function load(
    props: VideoContent & OptionalVideoProps,
    { autoshow = true }: { autoshow?: boolean } = {}
  ): Promise<boolean> {
    const player = video.player;
    if (!player) return false;
    const result = await player.load(props);
    if (!result) return false;
    shouldClearContent = false;
    video.hasContent = true;
    if (autoshow) video.show = true;
    return true;
  }

  // Setup video player auto-hiding
  let timeout: NodeJS.Timeout | undefined;
  beforeNavigate(() => {
    shouldClearContent = true;
    video.player?.togglePlay('pause');
  });
  afterNavigate(() => {
    // Give a little timeout for the new page to load possible video content, but if no content is forthcoming, hide the video player. The wait prevents unnecessary minimizing and maximizing of the player between two consequtive pages with video content
    clearTimeout(timeout);
    timeout = setTimeout(() => {
      if (shouldClearContent) video.hasContent = false;
      if (!video.hasContent) video.show = false;
    }, DELAY.sm);
  });

  return setContext<LayoutContext>(CONTEXT_KEY, {
    pageStyles,
    topBarSettings,
    progress,
    navigation,
    navigationSettings,
    video
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
