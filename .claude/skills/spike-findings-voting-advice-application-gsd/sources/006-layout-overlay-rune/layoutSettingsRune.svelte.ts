/**
 * SPIKE 006 — Rune-native layout settings context.
 *
 * Replaces the production `LayoutContext` plus the `getLayoutContext(onDestroy)`
 * bookkeeping pattern with a registry-based API that auto-cleans on component
 * destroy via `$effect`.
 *
 * Production today (apps/frontend/src/lib/contexts/layout/layoutContext.svelte.ts):
 *
 *   const { pageStyles, topBarSettings, navigationSettings } = getLayoutContext(onDestroy);
 *   topBarSettings.push({ progress: 'fixed-bottom' });          // imperative + LIFO
 *   pageStyles.push({ drawer: { background: 'bg-base-300' } }); // index-snapshot revert
 *
 * Spike consumer pattern:
 *
 *   const layout = getLayoutSettingsRune();
 *   layout.useTopBar({ progress: 'fixed-bottom' });             // declarative, $effect-scoped
 *   layout.usePageStyles({ drawer: { background: 'bg-base-300' } });
 *
 *   // Read the merged effective settings reactively:
 *   $derived(layout.topBar.current).progress
 *   layout.pageStyles.current.drawer.background
 *
 * No `svelte/store` imports. No `onDestroy` plumbing. No index-based revert.
 */

import { mergeSettings } from '@openvaa/app-shared';
import { error } from '@sveltejs/kit';
import { getContext, hasContext, setContext } from 'svelte';
import { settingsOverlay } from './SettingsOverlay.svelte';
import type { DeepPartial } from '@openvaa/app-shared';
import type { SettingsOverlayApi } from './SettingsOverlay.svelte';

// ─── shapes (subset of production LayoutContext for the spike) ───

export interface TopBarSettings {
  progress: 'hide' | 'fixed-bottom' | 'fixed-top';
  actions: {
    cancel: 'hide' | 'show';
    feedback: 'hide' | 'show';
    help: 'hide' | 'show';
    return: 'hide' | 'show';
  };
}

export interface PageStyles {
  drawer: { background: string };
}

export interface NavigationSettings {
  hide: boolean;
}

const DEFAULT_TOP_BAR: TopBarSettings = {
  progress: 'hide',
  actions: { cancel: 'hide', feedback: 'hide', help: 'hide', return: 'hide' }
};
const DEFAULT_PAGE_STYLES: PageStyles = { drawer: { background: 'bg-base-100' } };
const DEFAULT_NAVIGATION: NavigationSettings = { hide: false };

// ─── context ───

const CONTEXT_KEY = Symbol('layoutSettingsRune');

export interface LayoutSettingsRune {
  readonly topBar: SettingsOverlayApi<TopBarSettings, DeepPartial<TopBarSettings>>;
  readonly pageStyles: SettingsOverlayApi<PageStyles, DeepPartial<PageStyles>>;
  readonly navigation: SettingsOverlayApi<NavigationSettings, DeepPartial<NavigationSettings>>;

  /** Declarative scoped overlays — auto-cleaned via $effect on component destroy. */
  useTopBar: (overlay: DeepPartial<TopBarSettings>) => void;
  usePageStyles: (overlay: DeepPartial<PageStyles>) => void;
  useNavigation: (overlay: DeepPartial<NavigationSettings>) => void;
}

export function getLayoutSettingsRune(): LayoutSettingsRune {
  if (!hasContext(CONTEXT_KEY)) error(500, 'getLayoutSettingsRune() called before initLayoutSettingsRune()');
  return getContext<LayoutSettingsRune>(CONTEXT_KEY);
}

export function initLayoutSettingsRune(): LayoutSettingsRune {
  if (hasContext(CONTEXT_KEY)) error(500, 'initLayoutSettingsRune() called twice');

  const topBar = settingsOverlay<TopBarSettings, DeepPartial<TopBarSettings>>(DEFAULT_TOP_BAR, (acc, ov) =>
    mergeSettings(acc, ov)
  );
  const pageStyles = settingsOverlay<PageStyles, DeepPartial<PageStyles>>(DEFAULT_PAGE_STYLES, (acc, ov) =>
    mergeSettings(acc, ov)
  );
  const navigation = settingsOverlay<NavigationSettings, DeepPartial<NavigationSettings>>(
    DEFAULT_NAVIGATION,
    (acc, ov) => mergeSettings(acc, ov)
  );

  const api: LayoutSettingsRune = {
    topBar,
    pageStyles,
    navigation,
    useTopBar(overlay) {
      topBar.use(overlay);
    },
    usePageStyles(overlay) {
      pageStyles.use(overlay);
    },
    useNavigation(overlay) {
      navigation.use(overlay);
    }
  };

  return setContext(CONTEXT_KEY, api);
}
