/**
 * The Contestant App's protected layout and the identity provider's view it renders, mounted for real against a fake context and a fake page.
 *
 * A rerun load replaces the layout's `data` in place. The cases do the same: the layout's props are held in `$state`, a case assigns a new `data` object and flushes. The fake context's `user` is the user of the load data the layout was last given, which is how the real context derives it, and the page's data is that load data, which is where the view reads the arrival marker.
 *
 * What this file holds:
 *
 * 1. **A load gated on the identity provider renders its view in place of the page.** The view says which variant it is from the load data: a new account with no address asks for an address, and an account the provider found reads as returning. Neither the page nor another gate's view is rendered.
 * 2. **The view replacing another without a navigation moves focus to its heading**, as the set-password view does: from the set-password view, from the page, and on to the terms of use once the view is passed.
 *
 * `focusNavigationTarget` is the real helper: the cases read `document.activeElement`.
 */

import { createRawSnippet, flushSync, mount, unmount } from 'svelte';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { BasicUserData } from '$lib/api/base/dataWriter.type';

const { box, context, navigating } = vi.hoisted(() => {
  const box = { data: {} as { user?: unknown } };
  const context = {
    t: (key: string) => key,
    logout: async () => undefined,
    setPassword: async () => ({ type: 'success' }),
    clearEntryFlow: () => undefined,
    acceptTermsOfUse: async () => ({ type: 'success' }),
    userData: { init: () => undefined },
    appSettings: { analytics: { trackEvents: false } },
    answersLocked: false,
    // No analytics provider and trackEvents off: the terms show no usage-data section and the gate offers no opt-out.
    analyticsGate: {
      current: {
        projection: { active: false, consentMode: 'gated', visitIdMode: 'memory' },
        globalPrivacyControl: false,
        trackEvents: false,
        consent: undefined
      }
    },
    get user() {
      return box.data.user;
    }
  };
  const navigating = { from: null, to: null, type: null, willUnload: null, delta: null, complete: null };
  return { box, context, navigating };
});

vi.mock('$lib/contexts/contestant/contestantContext.svelte', () => ({ getContestantContext: () => context }));
vi.mock('$lib/contexts/contestant', () => ({ getContestantContext: () => context }));
vi.mock('$lib/contexts/app', () => ({ getAppContext: () => context }));
vi.mock('$lib/contexts/component', () => ({
  getComponentContext: () => ({
    t: (key: string) => key,
    locale: 'en',
    locales: ['en'],
    translate: (value: unknown) => (typeof value === 'string' ? value : ''),
    darkMode: false
  })
}));
vi.mock('$lib/contexts/layout', () => ({
  getLayoutContext: () => ({ video: { hasContent: false }, setRouteTitle: () => undefined })
}));
vi.mock('$app/state', async (importOriginal) => ({
  ...(await importOriginal<object>()),
  navigating,
  page: {
    get data() {
      return box.data;
    }
  }
}));

// jsdom has no `window.matchMedia`, and `svelte/motion` reads it when the views' layout components are imported. The stub answers "no preference".
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

const ProtectedLayout = (await import('./+layout.svelte')).default;

const CI1 = '[data-testid="contestant-identity-provider-gate"]';
const SET_PASSWORD = '[data-testid="contestant-set-password-gate"]';
const TERMS = '[data-testid="terms-of-use-submit"]';
const PAGE = '[data-testid="page"]';

/** User-level data of an identity-provider account with no password. */
function providerUser(addressState: BasicUserData['addressState']): BasicUserData {
  const proved = addressState === 'proved';
  return {
    id: 'user-1',
    email: proved ? 'proved@example.org' : '',
    username: proved ? 'proved@example.org' : '',
    role: 'contestant',
    settings: {},
    termsOfUseAccepted: null,
    passwordSet: false,
    addressState,
    pendingEmail: addressState === 'pending' ? 'waiting@example.org' : null,
    ownOrganizationUnnamed: false,
    pendingEmailTaken: false
  };
}

/** Load data gated on the identity provider's view. A new object on every call, as every rerun load returns one. */
function identityProviderData(arrival: 'created' | 'existing' | null = 'created'): object {
  return { gate: 'identityProvider', user: providerUser('none'), arrival };
}

const page = createRawSnippet(() => ({ render: () => '<div data-testid="page"><h1 tabindex="-1">Page</h1></div>' }));

let teardown: Array<() => void> = [];

afterEach(() => {
  for (const fn of teardown.reverse()) fn();
  teardown = [];
  (document.activeElement as HTMLElement | null)?.blur?.();
  box.data = {};
});

/**
 * Mount the layout over a page.
 * @returns The element it was mounted into and `rerun` for replacing its load data as a rerun load does.
 */
function render(data: object): { target: HTMLElement; rerun: (next: object) => void } {
  box.data = data as { user?: unknown };
  const target = document.createElement('div');
  document.body.appendChild(target);
  const props = $state({ data: data as never, children: page });
  const component = mount(ProtectedLayout, { target, props });
  flushSync();
  teardown.push(() => {
    void unmount(component);
    target.remove();
  });
  return {
    target,
    rerun: (next) => {
      box.data = next as { user?: unknown };
      props.data = next as never;
      flushSync();
    }
  };
}

/** Wait for the next animation frame, by which the focus helper has made its first lookup. */
function frame(): Promise<void> {
  return new Promise((resolve) => requestAnimationFrame(() => resolve()));
}

function one<TElement extends Element>(target: HTMLElement, selector: string): TElement {
  const found = target.querySelectorAll<TElement>(selector);
  expect(found.length, `elements matching ${selector}`).toBe(1);
  return found[0];
}

describe('contestant protected layout — a load gated on the identity provider', () => {
  it('renders the identity provider’s view for a new account in place of the page, asking for an address', () => {
    const { target } = render(identityProviderData('created'));

    const view = one(target, CI1);
    expect(view.getAttribute('data-variant')).toBe('new');
    expect(view.getAttribute('data-address-state')).toBe('none');
    expect(view.getAttribute('data-asks')).toBe('email');
    expect(one(target, 'h1').textContent?.trim()).toBe('contestantApp.identityProvider.title.complete');
    expect(target.querySelector(PAGE)).toBeNull();
    expect(target.querySelector(SET_PASSWORD)).toBeNull();
    expect(target.querySelector(TERMS)).toBeNull();
  });

  it('renders the returning variant for an account the provider found, from the marker in the load data', () => {
    const { target } = render(identityProviderData('existing'));

    expect(one(target, CI1).getAttribute('data-variant')).toBe('returning');
    expect(one(target, 'h1').textContent?.trim()).toBe('contestantApp.identityProvider.title.alreadyRegistered');
  });
});

describe('contestant protected layout — focus when the identity provider’s view replaces another', () => {
  it('moves focus to the view’s heading when it replaces the set-password view', async () => {
    const { target, rerun } = render({ gate: 'setPassword', user: providerUser('proved') });
    expect(target.querySelector(SET_PASSWORD)).not.toBeNull();

    rerun(identityProviderData(null));
    await frame();

    const heading = one<HTMLHeadingElement>(target, `${CI1} h1`);
    expect(heading.getAttribute('tabindex')).toBe('-1');
    expect(document.activeElement).toBe(heading);
  });

  it('moves focus to the view’s heading when it replaces the page', async () => {
    const { target, rerun } = render({ gate: null, user: { ...providerUser('proved'), passwordSet: true } });
    expect(target.querySelector(PAGE)).not.toBeNull();

    rerun(identityProviderData('existing'));
    await frame();

    expect(document.activeElement).toBe(one(target, `${CI1} h1`));
  });

  it('moves focus on to the terms of use when a rerun load passes the view', async () => {
    const { target, rerun } = render(identityProviderData('created'));

    rerun({ gate: 'termsOfUse', user: providerUser('pending'), arrival: null });
    await frame();

    expect(target.querySelector(CI1)).toBeNull();
    expect(target.querySelector(SET_PASSWORD)).toBeNull();
    expect(target.querySelectorAll(TERMS).length).toBe(1);
    expect(document.activeElement).toBe(one(target, 'h1'));
  });
});
