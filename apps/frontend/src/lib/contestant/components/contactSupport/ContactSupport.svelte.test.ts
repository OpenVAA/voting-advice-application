/**
 * `ContactSupport`, mounted for real against a fake contestant context.
 *
 * The block is rendered on pages whose URL names no entity, so the fake context builds routes with the real `buildRoute` from an empty set of route params: a link into the pages of an entity would throw here as it does in the app.
 */

import { createRawSnippet, flushSync, mount, unmount } from 'svelte';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { buildRoute } from '$lib/routes';
import type { RouteOptions } from '$lib/routes';

const SUPPORT_EMAIL = 'support@example.org';

vi.mock('$lib/contexts/contestant', () => {
  // The sentences the cases render, each with the placeholder the block fills. Every other key translates to itself.
  const sentences: Record<string, string> = {
    'test.sentence': 'If the problem persists, {contactSupportLink}.',
    'test.hostile': '<img src="x" onerror="alert(1)">Ask {contactSupportLink}<script>alert(2)</script>'
  };
  return {
    getContestantContext: () => ({
      t: (key: string, params: Record<string, unknown> = {}) =>
        (sentences[key] ?? key).replace(/\{(\w+)\}/g, (match, name: string) =>
          name in params ? String(params[name]) : match
        ),
      getRoute: { current: (options: RouteOptions) => buildRoute(options, { params: {} }) },
      appSettings: { admin: { email: SUPPORT_EMAIL }, contestantApp: { entityTypes: ['candidate'] } }
    })
  };
});

vi.mock('$lib/contexts/component', () => ({
  getComponentContext: () => ({ t: (key: string) => key, darkMode: { current: false } })
}));

const { ContactSupport, SUPPORT_ANCHOR } = await import('.');

const BUTTON = '[data-testid="contestant-contact-support"]';
const SENTENCE = '[data-testid="support-sentence"]';

let teardown: Array<() => void> = [];

afterEach(() => {
  for (const fn of teardown.reverse()) fn();
  teardown = [];
});

/** Mount the block and return the element it was mounted into. */
function render(props: Record<string, unknown> = {}): HTMLElement {
  const target = document.createElement('div');
  document.body.appendChild(target);
  const component = mount(ContactSupport, { target, props: props as never });
  flushSync();
  teardown.push(() => {
    unmount(component);
    target.remove();
  });
  return target;
}

describe('ContactSupport', () => {
  it('links to the support section of the Help page by default', () => {
    const target = render();

    const buttons = target.querySelectorAll<HTMLAnchorElement>(BUTTON);
    expect(buttons).toHaveLength(1);
    const button = buttons[0];
    expect(button.tagName).toBe('A');
    expect(SUPPORT_ANCHOR).toBe('support');
    expect(button.getAttribute('href')).toBe('/contestant/help#support');
    expect(button.hasAttribute('target')).toBe(false);
    expect(button.textContent).toContain('contestantApp.common.contactSupport');
  });

  it('opens an email to the configured support address when asked', () => {
    const target = render({ action: 'email' });

    const buttons = target.querySelectorAll<HTMLAnchorElement>(BUTTON);
    expect(buttons).toHaveLength(1);
    const href = buttons[0].getAttribute('href') ?? '';
    expect(href.startsWith(`mailto:${SUPPORT_EMAIL}?subject=`)).toBe(true);
    expect(decodeURIComponent(href)).toContain(
      'contestantApp.help.supportEmailSubject: dynamic.contestantAppName.candidate'
    );
    expect(buttons[0].getAttribute('target')).toBe('_blank');
  });

  it('renders a lead-in above the button', () => {
    const target = render({
      children: createRawSnippet(() => ({ render: () => '<p data-testid="lead-in">When to contact support</p>' }))
    });

    const leadIn = target.querySelector('[data-testid="lead-in"]');
    const button = target.querySelector(BUTTON);
    expect(leadIn).not.toBeNull();
    expect(button).not.toBeNull();
    expect(leadIn!.compareDocumentPosition(button!) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it('merges the caller’s class and attributes into its root', () => {
    const target = render({ class: 'mt-lg', id: SUPPORT_ANCHOR });

    const root = target.firstElementChild as HTMLElement;
    expect(root.tagName).toBe('DIV');
    expect(root.id).toBe('support');
    for (const cls of ['mt-lg', 'flex', 'w-full', 'flex-col', 'items-center', 'gap-md'])
      expect(root.classList, cls).toContain(cls);
  });

  it.each(['help', 'email'] as const)(
    'leaves the icon where the button puts it when no position is given (%s)',
    (action) => {
      const target = render({ action });

      const button = target.querySelector<HTMLElement>(BUTTON)!;
      expect(button.classList).toContain('flex-row-reverse');
      expect(target.firstElementChild!.hasAttribute('iconpos')).toBe(false);
    }
  );

  it.each(['help', 'email'] as const)('puts the icon of its button where the caller asks (%s)', (action) => {
    const target = render({ action, iconPos: 'left' });

    const buttons = target.querySelectorAll<HTMLElement>(BUTTON);
    expect(buttons).toHaveLength(1);
    expect(buttons[0].classList).toContain('flex-row');
    expect(buttons[0].classList).not.toContain('flex-row-reverse');
    expect(target.firstElementChild!.hasAttribute('iconpos')).toBe(false);
  });

  it.each(['help', 'email'] as const)('gives its button its default icon when no icon is given (%s)', (action) => {
    const target = render({ action });

    expect(target.querySelector(BUTTON)!.querySelectorAll('svg')).toHaveLength(1);
  });

  it.each(['help', 'email'] as const)('gives its button no icon when the icon is null (%s)', (action) => {
    const target = render({ action, icon: null });

    const button = target.querySelector<HTMLElement>(BUTTON)!;
    expect(button.querySelectorAll('svg')).toHaveLength(0);
    expect(button.textContent).toContain('contestantApp.common.contactSupport');
    expect(target.firstElementChild!.hasAttribute('icon')).toBe(false);
  });

  describe('with a sentence', () => {
    it('renders the sentence with a link to the support section of the Help page in place of its placeholder, and no button', () => {
      const target = render({ sentence: 'test.sentence', 'data-testid': 'support-sentence' });

      const sentence = one(target, SENTENCE);
      expect(sentence.tagName).toBe('P');
      expect(sentence.textContent?.trim()).toBe('If the problem persists, contestantApp.common.contactSupportLink.');
      const links = sentence.querySelectorAll('a');
      expect(links).toHaveLength(1);
      expect(links[0].getAttribute('href')).toBe('/contestant/help#support');
      expect(links[0].textContent).toBe('contestantApp.common.contactSupportLink');
      expect(target.querySelectorAll(BUTTON)).toHaveLength(0);
    });

    it('links to an email to the configured support address when asked', () => {
      const target = render({ sentence: 'test.sentence', action: 'email', 'data-testid': 'support-sentence' });

      const links = one(target, SENTENCE).querySelectorAll('a');
      expect(links).toHaveLength(1);
      const href = links[0].getAttribute('href') ?? '';
      expect(href.startsWith(`mailto:${SUPPORT_EMAIL}?subject=`)).toBe(true);
      expect(decodeURIComponent(href)).toContain(
        'contestantApp.help.supportEmailSubject: dynamic.contestantAppName.candidate'
      );
      expect(target.querySelectorAll(BUTTON)).toHaveLength(0);
    });

    it('renders no script or event handler a translation carries, and keeps the link', () => {
      const target = render({ sentence: 'test.hostile', 'data-testid': 'support-sentence' });

      const sentence = one(target, SENTENCE);
      expect(sentence.textContent).toContain('Ask contestantApp.common.contactSupportLink');
      expect(sentence.querySelector('script')).toBeNull();
      expect(sentence.querySelector('[onerror]')).toBeNull();
      expect(sentence.querySelectorAll('a')).toHaveLength(1);
      expect(sentence.querySelector('a')!.getAttribute('href')).toBe('/contestant/help#support');
    });

    it('merges the caller’s class into the sentence', () => {
      const target = render({ sentence: 'test.sentence', 'data-testid': 'support-sentence', class: 'mt-lg' });

      const sentence = one(target, SENTENCE);
      expect(sentence.tagName).toBe('P');
      expect(sentence.classList).toContain('mt-lg');
    });
  });
});

/** The one element the selector finds below the target. */
function one(target: ParentNode, selector: string): HTMLElement {
  const found = target.querySelectorAll<HTMLElement>(selector);
  expect(found.length, `exactly one ${selector} should be rendered`).toBe(1);
  return found[0];
}
