/**
 * The voter app's privacy page, mounted for real against a fake app context.
 *
 * The fake context's `t` returns its key. Its analytics gate has an active relay, and the visitor sends Global Privacy Control, so the page renders its analytics text and no consent control. Assertions are on the DOM rather than on component state.
 *
 * What this file holds:
 *
 * 1. **The heading** — the page's one heading can take focus, and the root layout's post-navigation focus reset lands on it.
 */

import { flushSync, mount, unmount } from 'svelte';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { focusNavigationTarget } from '$lib/utils/focusNavigationTarget';

const context = {
  t: (key: string) => key,
  getRoute: { current: () => '/' },
  analyticsGate: {
    current: {
      projection: { active: true, consentMode: 'gated' },
      globalPrivacyControl: true,
      trackEvents: true,
      consent: undefined
    }
  }
};

vi.mock('$lib/contexts/app', () => ({ getAppContext: () => context }));

vi.mock('$lib/contexts/component', () => ({
  getComponentContext: () => ({ t: context.t, darkMode: { current: false } })
}));

vi.mock('$lib/contexts/layout', () => ({
  getLayoutContext: () => ({
    video: { hasContent: false },
    setRouteTitle: () => undefined,
    pageStyles: { use: () => undefined },
    topBarSettings: { use: () => undefined }
  })
}));

// jsdom ships no `window.matchMedia`, and `svelte/motion` reads it when it is imported. The page reaches it through the `$layouts/main` barrel, so without this the file fails at import. The stub answers "no preference".
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

const PrivacyPage = (await import('./+page.svelte')).default;

let teardown: Array<() => void> = [];

afterEach(() => {
  for (const fn of teardown.reverse()) fn();
  teardown = [];
});

/** Mount the page and run its effects. */
function render(): HTMLElement {
  const target = document.createElement('div');
  document.body.appendChild(target);
  const component = mount(PrivacyPage, { target, props: {} as never });
  teardown.push(() => {
    unmount(component);
    target.remove();
  });
  flushSync();
  return target;
}

describe('the heading', () => {
  it('is the one heading of the page, can take focus and reads the page title', () => {
    const target = render();
    const headings = target.querySelectorAll<HTMLElement>('h1');
    expect(headings.length, 'exactly one h1 should be rendered').toBe(1);
    const heading = headings[0];
    expect(heading.textContent?.trim()).toBe('privacy.title');
    expect(heading.getAttribute('tabindex')).toBe('-1');
    heading.focus();
    expect(document.activeElement).toBe(heading);
  });

  it("receives the root layout's post-navigation focus reset", () => {
    const target = render();
    const cancel = focusNavigationTarget({ schedule: (callback) => callback() });
    teardown.push(cancel);
    expect(document.activeElement).toBe(target.querySelector('h1'));
  });
});
