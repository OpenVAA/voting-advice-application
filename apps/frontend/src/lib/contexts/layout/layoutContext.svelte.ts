import { mergeSettings } from '@openvaa/app-shared';
import { error } from '@sveltejs/kit';
import { getContext, hasContext, setContext, untrack } from 'svelte';
import { cubicOut } from 'svelte/easing';
import { Tween } from 'svelte/motion';
import { afterNavigate, beforeNavigate } from '$app/navigation';
import { DELAY } from '$lib/utils/timing';
import { VideoController } from './VideoController.svelte';
import { settingsOverlay } from '../utils/settingsOverlay.svelte';
import type { DeepPartial } from '@openvaa/app-shared';
import type {
  LayoutContext,
  Navigation,
  NavigationSettings,
  PageStyles,
  Progress,
  RouteTitle,
  TopBarSettings
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

  const topBarSettings = settingsOverlay<TopBarSettings, DeepPartial<TopBarSettings>>(
    DEFAULT_TOP_BAR_SETTINGS,
    (acc, ov) => mergeSettings(acc, ov)
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

  // Route-announcer title signal: carries the active route's already-localized page title (the value fed to the document `<title>`, minus the constant app-name suffix) up to the root `#route-announcer`. Empty string when no title-bearing layout component is mounted.
  let routeTitleValue = $state('');
  const routeTitle: RouteTitle = {
    get current() {
      return routeTitleValue;
    }
  };

  const navigation: Navigation = {};

  // The video player controller is a standalone `class VideoController`.
  // Its public read/write surface is `show`/`hasContent`/`mode`/`player`/`load`, which is what every `getLayoutContext()` consumer reads.
  const video = new VideoController();

  // Setup video player auto-hiding. The navigation-driven auto-hide stays here in the host's beforeNavigate/afterNavigate hooks, NOT an `$effect` on the class; they toggle the instance's `shouldClearContent` flag and drive it.
  let timeout: NodeJS.Timeout | undefined;
  beforeNavigate(() => {
    video.shouldClearContent = true;
    video.player?.togglePlay('pause');
  });
  afterNavigate(() => {
    // Give a little timeout for the new page to load possible video content, but if no content is forthcoming, hide the video player. The wait prevents unnecessary minimizing and maximizing of the player between two consequtive pages with video content
    clearTimeout(timeout);
    timeout = setTimeout(() => {
      if (video.shouldClearContent) video.hasContent = false;
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
    routeTitle,
    setRouteTitle(title) {
      // Declarative, $effect-scoped registrar: the mounted title component calls this with its already-localized `title`. We assign the signal on mount/update of the calling component and reset it on teardown via the $effect cleanup (last-writer-wins). The writes are wrapped in `untrack` to avoid the write-after-read hazard settingsOverlay.svelte.ts documents (a write inside an $effect that the effect also reads would otherwise loop / disable the scheduler).
      $effect(() => {
        untrack(() => {
          routeTitleValue = title;
        });
        return () => {
          untrack(() => {
            // Guard the cleanup: on a route swap between two title-bearing layout components (e.g. MainContent ↔ SingleCardContent) the incoming component can register its title before the outgoing component's teardown runs. Clear only if the signal still holds the value THIS registrar set, so a stale teardown can't blank the announcer that a newer writer already populated.
            if (routeTitleValue === title) routeTitleValue = '';
          });
        };
      });
    },
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
 * Consumers register layout overlays declaratively via `useTopBar` / `usePageStyles` / `useNavigation` (or `topBarSettings.use(...)` etc.), whose cleanup is `$effect`-scoped — the overlay is auto-reverted when the calling component is destroyed. No `onDestroy` plumbing is required, and out-of-order mount/unmount cannot corrupt the merged overlay because the registry is token-keyed rather than index-based.
 * @returns The `LayoutContext` object
 */
export function getLayoutContext() {
  if (!hasContext(CONTEXT_KEY)) error(500, 'GetLayoutContext() called before initLayoutContext()');
  return getContext<LayoutContext>(CONTEXT_KEY);
}
