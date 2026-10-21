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

vi.mock('$lib/contexts/contestant', () => ({
  getContestantContext: () => ({
    t: (key: string) => key,
    getRoute: { current: (options: RouteOptions) => buildRoute(options, { params: {} }) },
    appSettings: { admin: { email: SUPPORT_EMAIL }, contestantApp: { entityTypes: ['candidate'] } }
  })
}));

vi.mock('$lib/contexts/component', () => ({
  getComponentContext: () => ({ t: (key: string) => key, darkMode: { current: false } })
}));

const { ContactSupport, SUPPORT_ANCHOR } = await import('.');

const BUTTON = '[data-testid="contestant-contact-support"]';

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
});
