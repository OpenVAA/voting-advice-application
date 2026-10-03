/**
 * `Layout.svelte` drawer focus return (WCAG 2.4.3 Focus Order).
 *
 * Opening the navigation drawer moves focus into it (to `#drawerCloseButton`). Closing it must hand focus back to the menu button in `Header.svelte` that opened it, so a keyboard user continues from where they left off instead of from the top of the document. `closeDrawer()` has always called `drawerOpenElement?.focus()` for this, but `Header` bound its menu button to its own, non-bindable copy of the prop, so `Layout`'s variable stayed `undefined` and the call did nothing. ESLint 10's `no-unassigned-vars` found it (Phase 169).
 *
 * Both close paths `Layout` owns are covered: `LayoutContext.navigation.close()`, which the nav menus' close buttons and links call, and the drawer overlay.
 *
 * The component is mounted for real against fake contexts, following `routes/candidate/(protected)/termsOfUseLayout.svelte.test.ts`. The assertion is on `document.activeElement`, because where focus lands is the behaviour under test.
 */

import { createRawSnippet, flushSync, mount, unmount } from 'svelte';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

/** The layout context's `navigation` object. `Layout` assigns its `closeDrawer` to `close`. */
const navigation: { close?: () => void } = {};

vi.mock('$lib/contexts/app', () => ({
  getAppContext: () => ({
    t: (key: string) => key,
    startEvent: () => undefined,
    track: () => undefined,
    darkMode: { current: false },
    appType: { current: 'admin' },
    appCustomization: { current: {} },
    appSettings: {
      headerStyle: {
        dark: { bgColor: '', overImgBgColor: '' },
        light: { bgColor: '', overImgBgColor: '' },
        imgSize: '',
        imgPosition: ''
      }
    },
    getRoute: { current: () => '' },
    openFeedbackModal: { current: () => undefined }
  })
}));

vi.mock('$lib/contexts/layout', () => ({
  getLayoutContext: () => ({
    pageStyles: { current: { drawer: { background: '' } } },
    navigation,
    navigationSettings: { current: { hide: false } },
    progress: { current: { current: 0 }, max: 1 },
    topBarSettings: { current: { imageSrc: undefined, progress: 'hide', actions: {} } },
    video: { show: false, hasContent: false, player: undefined, mode: undefined }
  })
}));

vi.mock('$lib/contexts/component', () => ({
  getComponentContext: () => ({ t: (key: string) => key, darkMode: false })
}));

/** jsdom ships no `window.matchMedia`; `svelte/motion` reads it while the header's dependencies load. Same stub as `termsOfUseLayout.svelte.test.ts`. */
if (typeof window.matchMedia !== 'function') {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
      addListener: () => undefined,
      removeListener: () => undefined,
      dispatchEvent: () => false
    })
  });
}

const Layout = (await import('./Layout.svelte')).default;

/** jsdom implements no media playback: `play()` returns `undefined` instead of a promise, and the layout's `Video` chains `.catch()` on it. */
const media = HTMLMediaElement.prototype;
const originalMedia = { play: media.play, pause: media.pause, load: media.load };

beforeAll(() => {
  media.play = () => Promise.resolve();
  media.pause = () => undefined;
  media.load = () => undefined;
});

afterAll(() => {
  media.play = originalMedia.play;
  media.pause = originalMedia.pause;
  media.load = originalMedia.load;
});

/** Stands in for `VoterNav` / `CandidateNav`: the element `openDrawer()` moves focus to. */
const menu = createRawSnippet(() => ({
  render: () => '<nav id="testMenu"><button id="drawerCloseButton" type="button">close</button></nav>'
}));

let component: ReturnType<typeof mount> | undefined;
let target: HTMLElement;

beforeEach(() => {
  vi.useFakeTimers();
  delete navigation.close;
  target = document.body.appendChild(document.createElement('div'));
  component = mount(Layout, { target, props: { menuId: 'testMenu', menu } });
  flushSync();
});

afterEach(() => {
  if (component) unmount(component);
  component = undefined;
  target.remove();
  vi.useRealTimers();
});

/** Open the drawer from the menu button and let `openDrawer()` move focus into the drawer. */
function openFromMenuButton(): HTMLButtonElement {
  const menuButton = target.querySelector<HTMLButtonElement>('[data-testid="nav-menu-toggle"]')!;
  menuButton.focus();
  menuButton.click();
  flushSync();
  vi.advanceTimersByTime(100);
  expect(document.activeElement?.id).toBe('drawerCloseButton');
  return menuButton;
}

describe('Layout drawer focus return', () => {
  it('returns focus to the menu button when the drawer is closed through LayoutContext.navigation.close()', () => {
    const menuButton = openFromMenuButton();
    expect(navigation.close).toBeTypeOf('function');

    navigation.close!();
    flushSync();

    expect(document.activeElement).toBe(menuButton);
    expect(menuButton.getAttribute('aria-expanded')).toBe('false');
  });

  it('returns focus to the menu button when the drawer is closed by clicking the overlay', () => {
    const menuButton = openFromMenuButton();

    target.querySelector<HTMLElement>('.drawer-overlay')!.click();
    flushSync();

    expect(document.activeElement).toBe(menuButton);
    expect(menuButton.getAttribute('aria-expanded')).toBe('false');
  });
});
