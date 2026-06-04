import { mergeSettings } from '@openvaa/app-shared';
import { error } from '@sveltejs/kit';
import { getContext, hasContext, setContext } from 'svelte';
import { cubicOut } from 'svelte/easing';
import { Tween } from 'svelte/motion';
import { afterNavigate, beforeNavigate } from '$app/navigation';
import { DELAY } from '$lib/utils/timing';
import { settingsOverlay } from '../utils/SettingsOverlay.svelte';
import type { DeepPartial, VideoContent } from '@openvaa/app-shared';
import type { OptionalVideoProps,Video, VideoMode  } from '$lib/components/video';
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

  const pageStyles = settingsOverlay<PageStyles, DeepPartial<PageStyles>>(DEFAULT_PAGE_STYLES, (acc, ov) =>
    mergeSettings(acc, ov)
  );

  const topBarSettings = settingsOverlay<TopBarSettings, DeepPartial<TopBarSettings>>(DEFAULT_TOP_BAR_SETTINGS, (acc, ov) =>
    mergeSettings(acc, ov)
  );

  const navigationSettings = settingsOverlay<NavigationSettings, DeepPartial<NavigationSettings>>(
    DEFAULT_NAVIGATION_SETTINGS,
    (acc, ov) => mergeSettings(acc, ov)
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
    video,
    useTopBar(overlay) {
      topBarSettings.use(overlay);
    },
    usePageStyles(overlay) {
      pageStyles.use(overlay);
    },
    useNavigation(overlay) {
      navigationSettings.use(overlay);
    }
  });
}

/**
 * Get the `LayoutContext` object.
 *
 * Consumers register layout overlays declaratively via `useTopBar` / `usePageStyles` /
 * `useNavigation` (or `topBarSettings.use(...)` etc.), whose cleanup is `$effect`-scoped —
 * the overlay is auto-reverted when the calling component is destroyed. No `onDestroy`
 * plumbing is required (the old index-revert bookkeeping is gone, and out-of-order
 * mount/unmount no longer corrupts the merged overlay).
 * @returns The `LayoutContext` object
 */
export function getLayoutContext() {
  if (!hasContext(CONTEXT_KEY)) error(500, 'GetLayoutContext() called before initLayoutContext()');
  return getContext<LayoutContext>(CONTEXT_KEY);
}
