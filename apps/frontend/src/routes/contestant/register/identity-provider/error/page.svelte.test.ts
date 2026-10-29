/**
 * The identity provider's error screen, mounted for real with its real support block against a fake contestant context.
 *
 * The page receives what its server load returns: the class and whether Try again is offered. The fake context's `t` returns its key, and its `getRoute` builds routes with the real `buildRoute` from an empty set of route params. Assertions are on the DOM rather than on component state.
 *
 * What this file holds:
 *
 * 1. **The frame** — the screen's marker with its class, and a heading per class that can take focus, under the app's name.
 * 2. **The sentence** — one per class.
 * 3. **The actions** — one way to support in every class; in `cancelled` and `retry` a filled Try again and a sentence of the class whose own words link to support, with no support button; in `noRetry` the filled support action, with no icon, and a text Try again; Return always.
 * 4. **Try again** — a link to the registration page with the provider's option named, rendered only while it is offered.
 * 5. **Nothing echoed** — a crafted parameter on the page's address appears nowhere in the markup.
 */

import { flushSync, mount, unmount } from 'svelte';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { page } from '$app/state';
import { buildRoute } from '$lib/routes';
import type { OidcErrorClass } from '$lib/contestant/utils/oidcError';
import type { RouteOptions } from '$lib/routes';

const context = {
  // A key translates to itself, followed by the values of its parameters, so a link given to a sentence is rendered with it.
  t: (key: string, params: Record<string, unknown> = {}) => [key, ...Object.values(params)].join(' '),
  getRoute: { current: (options: RouteOptions) => buildRoute(options, { params: {} }) },
  appSettings: { admin: { email: 'support@example.test' }, contestantApp: { entityTypes: ['candidate'] } }
};

vi.mock('$lib/contexts/contestant', () => ({ getContestantContext: () => context }));

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

const ErrorPage = (await import('./+page.svelte')).default;

const FRAME = '[data-testid="contestant-identity-provider-error"]';
const MESSAGE = '[data-testid="identity-provider-error-message"]';
const TRY_AGAIN = '[data-testid="identity-provider-error-try-again"]';
const RETURN = '[data-testid="identity-provider-error-return"]';
const SUPPORT = '[data-testid="contestant-contact-support"]';
const SUPPORT_SENTENCE = '[data-testid="contestant-identity-provider-error-support"]';
const HELP_SUPPORT_SECTION = `${buildRoute({ route: 'ContestantAppHelp' }, { params: {} })}#support`;

const LOGIN_ROUTE = buildRoute({ route: 'ContestantAppLogin' }, { params: {} });
const REGISTER_WITH_PROVIDER = buildRoute(
  { route: 'ContestantAppRegister', mode: 'identity_provider' } as RouteOptions,
  { params: {} }
);

const CLASSES: Array<OidcErrorClass> = ['cancelled', 'retry', 'noRetry'];

let teardown: Array<() => void> = [];

afterEach(() => {
  for (const fn of teardown.reverse()) fn();
  teardown = [];
  page.url = new URL('http://localhost/') as typeof page.url;
});

/** Mount the page with what its load returns, and run its effects. */
function render(errorClass: OidcErrorClass, providerOffered = true): HTMLElement {
  const target = document.createElement('div');
  document.body.appendChild(target);
  const component = mount(ErrorPage, { target, props: { data: { errorClass, providerOffered } } as never });
  teardown.push(() => {
    unmount(component);
    target.remove();
  });
  flushSync();
  return target;
}

function one<TElement extends HTMLElement = HTMLElement>(target: ParentNode, selector: string): TElement {
  const found = target.querySelectorAll<TElement>(selector);
  expect(found.length, `exactly one ${selector} should be rendered`).toBe(1);
  return found[0];
}

/** Whether a button is the filled one: every other variant is a ghost button. */
function isFilled(element: HTMLElement): boolean {
  return !element.classList.contains('btn-ghost');
}

describe('the frame', () => {
  it.each(CLASSES)('states the class %s', (errorClass) => {
    expect(one(render(errorClass), FRAME).getAttribute('data-error-class')).toBe(errorClass);
  });

  it.each(CLASSES)("has one heading for %s that can take focus, under the app's name", (errorClass) => {
    const target = render(errorClass);
    const heading = one(target, 'h1');
    expect(heading.getAttribute('tabindex')).toBe('-1');
    expect(heading.textContent?.trim()).toBe(`contestantApp.identityProvider.error.${errorClass}.title`);
  });

  it('gives each class its own heading', () => {
    const headings = CLASSES.map((errorClass) => one(render(errorClass), 'h1').textContent?.trim());
    expect(new Set(headings).size).toBe(3);
  });

  it('adds no dialog and names no element for a view transition', () => {
    const target = render('retry');
    expect(target.querySelector('dialog')).toBeNull();
    expect(Array.from(target.querySelectorAll(`${FRAME} [style*="view-transition-name"]`))).toEqual([]);
  });
});

describe('the sentence', () => {
  it.each(CLASSES)('is the sentence of %s', (errorClass) => {
    expect(one(render(errorClass), MESSAGE).textContent?.trim()).toBe(
      `contestantApp.identityProvider.error.${errorClass}.content`
    );
  });
});

describe('the actions', () => {
  it('render one support block in noRetry', () => {
    one(render('noRetry'), SUPPORT);
  });

  it.each<OidcErrorClass>(['cancelled', 'retry'])(
    'in %s give support as a link inside its sentence, and no support button',
    (errorClass) => {
      const target = render(errorClass);
      const sentence = one(target, SUPPORT_SENTENCE);
      expect(sentence.textContent).toContain(`contestantApp.identityProvider.error.${errorClass}.support`);
      const links = sentence.querySelectorAll('a');
      expect(links).toHaveLength(1);
      expect(links[0].getAttribute('href')).toBe(HELP_SUPPORT_SECTION);
      expect(links[0].textContent).toBe('contestantApp.common.contactSupportLink');
      expect(target.querySelectorAll(SUPPORT)).toHaveLength(0);
    }
  );

  it.each<OidcErrorClass>(['cancelled', 'retry'])(
    'in %s fill Try again, after which the support sentence follows',
    (errorClass) => {
      const target = render(errorClass);
      const tryAgain = one(target, TRY_AGAIN);
      expect(isFilled(tryAgain)).toBe(true);
      expect(
        tryAgain.compareDocumentPosition(one(target, SUPPORT_SENTENCE)) & Node.DOCUMENT_POSITION_FOLLOWING
      ).toBeTruthy();
    }
  );

  it.each(CLASSES)('lead back to the login screen in %s', (errorClass) => {
    const back = one(render(errorClass), RETURN);
    expect(back.tagName).toBe('A');
    expect(back.getAttribute('href')).toBe(LOGIN_ROUTE);
  });

  it('in noRetry fill the support action and leave Try again a text button', () => {
    const target = render('noRetry');
    expect(isFilled(one(target, SUPPORT))).toBe(true);
    expect(one(target, SUPPORT).querySelectorAll('svg')).toHaveLength(0);
    expect(isFilled(one(target, TRY_AGAIN))).toBe(false);
    expect(target.textContent).not.toContain('contestantApp.identityProvider.error.retry.support');
    expect(target.textContent).not.toContain('contestantApp.identityProvider.error.cancelled.support');
    expect(target.querySelectorAll(SUPPORT_SENTENCE)).toHaveLength(0);
  });

  it.each(CLASSES)('fill one action at most in %s', (errorClass) => {
    const target = render(errorClass);
    const filled = Array.from(target.querySelectorAll<HTMLElement>('.btn')).filter(isFilled);
    expect(filled).toHaveLength(1);
  });
});

describe('Try again', () => {
  it.each(CLASSES)("in %s is a link to the registration page with the provider's option named", (errorClass) => {
    const link = one(render(errorClass), TRY_AGAIN);
    expect(link.tagName).toBe('A');
    expect(link.getAttribute('href')).toBe(REGISTER_WITH_PROVIDER);
    expect(link.getAttribute('href')).toContain('mode=identity_provider');
    expect(link.textContent).toContain('contestantApp.identityProvider.error.tryAgain');
  });

  it.each(CLASSES)('in %s is not rendered while it is not offered, and Return still is', (errorClass) => {
    const target = render(errorClass, false);
    expect(target.querySelectorAll(TRY_AGAIN)).toHaveLength(0);
    one(target, RETURN);
    one(target, errorClass === 'noRetry' ? SUPPORT : SUPPORT_SENTENCE);
  });
});

describe('nothing echoed', () => {
  it('renders no part of a crafted parameter on its address', () => {
    page.url = new URL(
      'http://localhost/contestant/register/identity-provider/error?error=xss-marker-1234'
    ) as typeof page.url;
    for (const errorClass of CLASSES) {
      const target = render(errorClass);
      expect(target.innerHTML).not.toContain('xss-marker-1234');
    }
  });
});
