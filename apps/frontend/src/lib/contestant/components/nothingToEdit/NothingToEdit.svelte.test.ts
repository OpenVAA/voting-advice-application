/**
 * `NothingToEdit`, mounted for real against a fake contestant context, with the real `MainContent`, `ContactSupport` and `LogoutButton` below it.
 *
 * The fake context's `user` is rune state behind a getter, as the real accessor is. The view must read it as `contestantCtx.user` in its markup: one case replaces the user after the view has mounted and expects the address on the page to follow, which a value copied once at mount would not.
 *
 * The view is shown on a page whose URL names no entity, so routes are built with the real `buildRoute` from an empty set of route params, and a link into the pages of an entity would throw. The settings page belongs to the user and not to an entity, so its link is built.
 */

import { createRawSnippet, flushSync, mount, unmount } from 'svelte';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { buildRoute } from '$lib/routes';
import type { RouteOptions } from '$lib/routes';

const EMAIL = 'first.candidate-with-a-long-address@subdomain.example.org';

/** What the fake context answers with. Each case sets `user` before it mounts the view. */
const state = $state<{ user: { email?: string } | undefined }>({ user: undefined });

/** The titles the view registered with the layout, in order. */
const routeTitles = new Array<string>();

vi.mock('$lib/contexts/contestant', () => ({
  getContestantContext: () => ({
    t: (key: string) => key,
    getRoute: { current: (options: RouteOptions) => buildRoute(options, { params: {} }) },
    logout: async () => undefined,
    appSettings: { admin: { email: 'support@example.org' }, contestantApp: { entityTypes: ['candidate'] } },
    answersLocked: false,
    unansweredRequiredInfoQuestions: [],
    unansweredOpinionQuestions: [],
    get user() {
      return state.user;
    }
  })
}));

vi.mock('$lib/contexts/component', () => ({
  getComponentContext: () => ({ t: (key: string) => key, darkMode: { current: false } })
}));

vi.mock('$lib/contexts/layout', () => ({
  getLayoutContext: () => ({
    video: { hasContent: false },
    setRouteTitle: (title: string) => routeTitles.push(title)
  })
}));

// jsdom has no `window.matchMedia`, and `svelte/motion` reads it when the logout button's modal is imported. The stub answers "no preference".
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

const { NothingToEdit } = await import('.');

const CONTAINER = '[data-testid="contestant-nothing-to-edit"]';
const EMAIL_VALUE = '[data-testid="contestant-nothing-to-edit-email"]';
const LOGOUT = '[data-testid="contestant-nothing-to-edit-logout"]';
const SUPPORT = '[data-testid="contestant-contact-support"]';
const SETTINGS = '[data-testid="contestant-nothing-to-edit-settings"]';

let teardown: Array<() => void> = [];

afterEach(() => {
  for (const fn of teardown.reverse()) fn();
  teardown = [];
  routeTitles.length = 0;
});

/** Mount the view for a user and return the element it was mounted into. */
function render(user: { email?: string } | undefined, props: Record<string, unknown> = {}): HTMLElement {
  state.user = user;
  const target = document.createElement('div');
  document.body.appendChild(target);
  const component = mount(NothingToEdit, { target, props: props as never });
  flushSync();
  teardown.push(() => {
    unmount(component);
    target.remove();
  });
  return target;
}

/** Whether `first` comes before `second` in document order. */
function precedes(first: Element, second: Element): boolean {
  return Boolean(first.compareDocumentPosition(second) & Node.DOCUMENT_POSITION_FOLLOWING);
}

describe('NothingToEdit — a user with an email', () => {
  it('shows the address verbatim under its label, never hyphenated and never translated', () => {
    const target = render({ email: EMAIL });

    const value = target.querySelector<HTMLElement>(EMAIL_VALUE);
    expect(value, 'the address should be rendered').not.toBeNull();
    expect(value!.tagName).toBe('DD');
    expect(value!.textContent?.trim()).toBe(EMAIL);
    expect(value!.children).toHaveLength(0);
    expect(value!.getAttribute('translate')).toBe('no');
    expect(value!.classList).toContain('hyphens-none');
    expect(value!.classList).toContain('[overflow-wrap:anywhere]');
    expect(value!.classList).not.toContain('truncate');

    const list = value!.closest('dl');
    expect(list).not.toBeNull();
    const label = list!.querySelector('dt');
    expect(label?.textContent?.trim()).toBe('contestantApp.nothingToEdit.signedInAs');
    expect(label!.classList).toContain('small-label');
  });

  it('renders an address that holds markup as text', () => {
    const target = render({ email: '<b>bold</b>@example.org' });

    const value = target.querySelector<HTMLElement>(EMAIL_VALUE)!;
    expect(value.textContent?.trim()).toBe('<b>bold</b>@example.org');
    expect(value.querySelector('b')).toBeNull();
  });

  it('ends with the sentence that points at the address shown', () => {
    const target = render({ email: EMAIL });

    const paragraphs = [...target.querySelectorAll('p')].map((p) => p.textContent?.trim());
    expect(paragraphs).toContain('contestantApp.nothingToEdit.nextSteps');
    expect(paragraphs).not.toContain('contestantApp.nothingToEdit.nextStepsNoAddress');
  });

  it('follows the context when the signed-in user changes', () => {
    const target = render({ email: EMAIL });

    state.user = { email: 'second@example.org' };
    flushSync();
    expect(target.querySelector(EMAIL_VALUE)?.textContent?.trim()).toBe('second@example.org');

    state.user = undefined;
    flushSync();
    expect(target.querySelector(EMAIL_VALUE)).toBeNull();
    expect(target.querySelector('dl')).toBeNull();
  });

  it('reads in the order title, explanation, address, next steps, support, settings, logout', () => {
    const target = render({ email: EMAIL });

    const paragraphs = [...target.querySelectorAll('p')];
    const explanation = paragraphs.find((p) => p.textContent?.trim() === 'contestantApp.nothingToEdit.content');
    const nextSteps = paragraphs.find((p) => p.textContent?.trim() === 'contestantApp.nothingToEdit.nextSteps');
    const sequence = [
      target.querySelector('h1'),
      explanation,
      target.querySelector(EMAIL_VALUE),
      nextSteps,
      target.querySelector(SUPPORT),
      target.querySelector(SETTINGS),
      target.querySelector(LOGOUT)
    ];
    for (const element of sequence) expect(element).toBeTruthy();
    for (let i = 1; i < sequence.length; i++) expect(precedes(sequence[i - 1]!, sequence[i]!), `step ${i}`).toBe(true);
  });
});

describe('NothingToEdit — a user without an email', () => {
  it.each([
    ['no user', undefined],
    ['a user with no email', {}],
    ['a user with an empty email', { email: '' }]
  ] as Array<[string, { email?: string } | undefined]>)('leaves the label and the value out for %s', (_, user) => {
    const target = render(user);

    expect(target.querySelector(CONTAINER)).not.toBeNull();
    expect(target.querySelector('dl')).toBeNull();
    expect(target.querySelector(EMAIL_VALUE)).toBeNull();
    expect(target.textContent).not.toContain('contestantApp.nothingToEdit.signedInAs');
  });

  it.each([
    ['no user', undefined],
    ['a user with no email', {}],
    ['a user with an empty email', { email: '' }]
  ] as Array<[string, { email?: string } | undefined]>)(
    'ends with the sentence that names no address for %s, and not the one pointing at an address',
    (_, user) => {
      const target = render(user);

      const paragraphs = [...target.querySelectorAll('p')].map((p) => p.textContent?.trim());
      expect(paragraphs).toContain('contestantApp.nothingToEdit.nextStepsNoAddress');
      expect(paragraphs).not.toContain('contestantApp.nothingToEdit.nextSteps');
    }
  );

  it('reads in the order title, explanation, next steps, support, settings, logout', () => {
    const target = render({ email: '' });

    const paragraphs = [...target.querySelectorAll('p')];
    const explanation = paragraphs.find((p) => p.textContent?.trim() === 'contestantApp.nothingToEdit.content');
    const nextSteps = paragraphs.find(
      (p) => p.textContent?.trim() === 'contestantApp.nothingToEdit.nextStepsNoAddress'
    );
    const sequence = [
      target.querySelector('h1'),
      explanation,
      nextSteps,
      target.querySelector(SUPPORT),
      target.querySelector(SETTINGS),
      target.querySelector(LOGOUT)
    ];
    for (const element of sequence) expect(element).toBeTruthy();
    for (let i = 1; i < sequence.length; i++) expect(precedes(sequence[i - 1]!, sequence[i]!), `step ${i}`).toBe(true);
  });

  it('offers the link to the settings page to a user without an address too', () => {
    const target = render({ email: '' });

    expect(target.querySelector(SETTINGS)?.getAttribute('href')).toBe('/contestant/settings');
  });

  it('switches between the two sentences when the address comes and goes', () => {
    const target = render({ email: '' });
    function texts(): Array<string | undefined> {
      return [...target.querySelectorAll('p')].map((p) => p.textContent?.trim());
    }
    expect(texts()).toContain('contestantApp.nothingToEdit.nextStepsNoAddress');

    state.user = { email: EMAIL };
    flushSync();
    expect(texts()).toContain('contestantApp.nothingToEdit.nextSteps');
    expect(texts()).not.toContain('contestantApp.nothingToEdit.nextStepsNoAddress');

    state.user = { email: '' };
    flushSync();
    expect(texts()).toContain('contestantApp.nothingToEdit.nextStepsNoAddress');
    expect(texts()).not.toContain('contestantApp.nothingToEdit.nextSteps');
  });
});

describe('NothingToEdit — title, explanation and actions', () => {
  it('uses its own title by default, in exactly one h1', () => {
    const target = render({ email: EMAIL });

    const headings = target.querySelectorAll('h1');
    expect(headings).toHaveLength(1);
    expect(headings[0].textContent?.trim()).toBe('contestantApp.nothingToEdit.title');
    // The logout button's closed dialog holds a heading of its own; the view adds none below its title.
    const lowerHeadings = [...target.querySelectorAll('h2, h3, h4, h5, h6')].filter((h) => !h.closest('dialog'));
    expect(lowerHeadings).toHaveLength(0);
    expect(routeTitles).toEqual(['contestantApp.nothingToEdit.title']);
  });

  it('takes a title from its caller', () => {
    const target = render({ email: EMAIL }, { title: 'Another Title' });

    const headings = target.querySelectorAll('h1');
    expect(headings).toHaveLength(1);
    expect(headings[0].textContent?.trim()).toBe('Another Title');
    expect(target.textContent).not.toContain('contestantApp.nothingToEdit.title');
  });

  it('lets its caller replace the explanation and keeps the rest', () => {
    const target = render(
      { email: EMAIL },
      { children: createRawSnippet(() => ({ render: () => '<p data-testid="reason">Another reason</p>' })) }
    );

    expect(target.querySelector('[data-testid="reason"]')?.textContent).toBe('Another reason');
    expect(target.textContent).not.toContain('contestantApp.nothingToEdit.content');
    expect(target.textContent).toContain('contestantApp.nothingToEdit.nextSteps');
    expect(target.querySelector(EMAIL_VALUE)).not.toBeNull();
  });

  it('offers the support block, the settings page and logout, and no other link', () => {
    const target = render({ email: EMAIL });
    const container = target.querySelector(CONTAINER)!;

    const support = container.querySelectorAll<HTMLAnchorElement>(SUPPORT);
    expect(support).toHaveLength(1);
    expect(support[0].getAttribute('href')).toBe('/contestant/help#support');

    const settings = container.querySelectorAll<HTMLAnchorElement>(SETTINGS);
    expect(settings, 'the link to the settings page').toHaveLength(1);
    expect(settings[0].tagName).toBe('A');
    expect(settings[0].getAttribute('href')).toBe('/contestant/settings');
    expect(settings[0].textContent).toContain('contestantApp.nothingToEdit.settings');

    const logout = container.querySelectorAll<HTMLElement>(LOGOUT);
    expect(logout).toHaveLength(1);
    expect(logout[0].tagName).toBe('BUTTON');
    expect(logout[0].textContent).toContain('common.logout');

    expect([...container.querySelectorAll('a')].map((link) => link.getAttribute('href'))).toEqual([
      '/contestant/help#support',
      '/contestant/settings'
    ]);
  });
});
