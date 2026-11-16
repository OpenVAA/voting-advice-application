/**
 * The home button of the Contestant App's Help and Privacy pages, each mounted for real with its contexts replaced.
 *
 * Both pages lie outside the protected tree, where the store that holds the entity being edited is empty. What this file holds:
 *
 * 1. **A signed-in user's home button leads to the app root, and a signed-out visitor's to the login page**, decided by the context's `isAuthenticated`.
 * 2. **The decision follows a sign-in and a sign-out while the page stays mounted**, so the page reads the flag inside a tracking scope and does not capture it.
 * 3. **Neither page reads the entity store for it.** The context handed to the pages has no `userData` member at all, so a page that reached for it would throw at mount.
 */

import { flushSync, mount, unmount } from 'svelte';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Component } from 'svelte';

const { authBox } = vi.hoisted(() => ({ authBox: { auth: { isAuthenticated: false } } }));

vi.mock('$lib/contexts/contestant/contestantContext.svelte', () => ({
  getContestantContext: () => ({
    t: (key: string) => key,
    getRoute: { current: (route: string) => `/route/${route}` },
    appCustomization: { current: {} },
    appSettings: { admin: { email: 'support@example.test' }, analytics: { trackEvents: false } },
    // No analytics provider and trackEvents off: the terms show no usage-data section and the gate offers no opt-out.
    analyticsGate: {
      current: {
        projection: { active: false, consentMode: 'gated', visitIdMode: 'memory' },
        globalPrivacyControl: false,
        trackEvents: false,
        consent: undefined
      }
    },
    // Read off the box on every access, so the flag is as live as the real context's accessor.
    get isAuthenticated() {
      return authBox.auth.isAuthenticated;
    }
  })
}));

vi.mock('$lib/contexts/app', () => ({
  getAppContext: () => ({
    appSettings: { analytics: { trackEvents: false } },
    // No analytics provider and trackEvents off: the terms show no usage-data section and the gate offers no opt-out.
    analyticsGate: {
      current: {
        projection: { active: false, consentMode: 'gated', visitIdMode: 'memory' },
        globalPrivacyControl: false,
        trackEvents: false,
        consent: undefined
      }
    }
  })
}));

vi.mock('$lib/contexts/component', () => ({
  getComponentContext: () => ({ t: (key: string) => key, darkMode: false })
}));

vi.mock('$lib/contexts/layout', () => ({
  getLayoutContext: () => ({ video: { hasContent: false }, setRouteTitle: () => undefined })
}));

// jsdom ships no `window.matchMedia`, and `svelte/motion` reads it when it is loaded. The pages reach it through the `$layouts/main` barrel.
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

const HelpPage = (await import('./help/+page.svelte')).default;
const PrivacyPage = (await import('./privacy/+page.svelte')).default;

const HOME = '/route/ContestantAppHome';
const LOGIN = '/route/ContestantAppLogin';

let teardown: Array<() => void> = [];

afterEach(() => {
  for (const fn of teardown.reverse()) fn();
  teardown = [];
  authBox.auth = { isAuthenticated: false };
});

/**
 * Mount a page and return its home button.
 * @param page - The page component.
 * @param testId - The test id of the page's home button.
 * @returns The button's anchor element.
 */
function homeButtonOf(page: Component, testId: string): HTMLAnchorElement {
  const target = document.createElement('div');
  document.body.appendChild(target);
  const component = mount(page, { target, props: {} });
  flushSync();
  teardown.push(() => {
    unmount(component);
    target.remove();
  });
  const button = target.querySelector<HTMLAnchorElement>(`[data-testid="${testId}"]`);
  expect(button, `the home button ${testId} should be rendered`).not.toBeNull();
  return button!;
}

describe.each([
  ['Help', HelpPage as Component, 'contestant-help-home'],
  ['Privacy', PrivacyPage as Component, 'contestant-privacy-home']
])('the %s page of the Contestant App — the home button', (_name, page, testId) => {
  it('leads a signed-out visitor to the login page', () => {
    authBox.auth = { isAuthenticated: false };

    expect(homeButtonOf(page, testId).getAttribute('href')).toBe(LOGIN);
  });

  it('leads a signed-in user to the app root, with no entity loaded', () => {
    authBox.auth = { isAuthenticated: true };

    expect(homeButtonOf(page, testId).getAttribute('href')).toBe(HOME);
  });

  it('follows a sign-in and a sign-out while the page stays mounted', () => {
    const auth = $state({ isAuthenticated: false });
    authBox.auth = auth;
    const button = homeButtonOf(page, testId);
    expect(button.getAttribute('href')).toBe(LOGIN);

    auth.isAuthenticated = true;
    flushSync();
    expect(button.getAttribute('href')).toBe(HOME);

    auth.isAuthenticated = false;
    flushSync();
    expect(button.getAttribute('href')).toBe(LOGIN);
  });
});
