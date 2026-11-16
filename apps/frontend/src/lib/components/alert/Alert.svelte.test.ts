/**
 * `Alert` with and without actions of its own, mounted for real against a fake component context whose `t` returns its key.
 *
 * Which buttons assistive technology meets is read from the DOM: a button inside an `aria-hidden` subtree is out of the accessibility tree, and a button is named by its text with its `aria-hidden` parts removed.
 */

import { createRawSnippet, flushSync, mount, unmount } from 'svelte';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Component } from 'svelte';

vi.mock('$lib/contexts/component', () => ({
  getComponentContext: () => ({ t: (key: string) => key, darkMode: false })
}));

const { Alert } = await import('.');

let teardown: Array<() => void> = [];

afterEach(() => {
  for (const fn of teardown.reverse()) fn();
  teardown = [];
});

/** Mount an alert and return its root element. */
function render(props: Record<string, unknown>): HTMLElement {
  const target = document.createElement('div');
  document.body.appendChild(target);
  const mounted = mount(Alert as Component<never>, { target, props: props as never });
  flushSync();
  teardown.push(() => {
    unmount(mounted);
    target.remove();
  });
  return target.firstElementChild as HTMLElement;
}

/** The text of `element` without anything hidden from assistive technology, its runs of white space read as one space. */
function spokenText(element: Element): string {
  const copy = element.cloneNode(true) as HTMLElement;
  for (const hidden of copy.querySelectorAll('[aria-hidden="true"]')) hidden.remove();
  return copy.textContent?.replace(/\s+/g, ' ').trim() ?? '';
}

/** The buttons of `root` that are in the accessibility tree: those with no `aria-hidden` element around them. */
function exposedButtons(root: HTMLElement): Array<HTMLButtonElement> {
  return [...root.querySelectorAll('button')].filter((button) => !button.closest('[aria-hidden="true"]'));
}

/** The round ✕ button in the corner, the one whose visible text is the ✕ alone. */
function cornerButton(root: HTMLElement): HTMLButtonElement | undefined {
  return [...root.querySelectorAll('button')].find((button) =>
    [...button.querySelectorAll('[aria-hidden="true"]')].some((part) => part.textContent?.trim() === '✕')
  );
}

const children = createRawSnippet(() => ({ render: () => '<p>We could not confirm the sign-out.</p>' }));

describe('Alert — with no actions of its own', () => {
  it('has one button named Close for assistive technology', () => {
    const alert = render({ title: 'Something went wrong', children });

    const buttons = exposedButtons(alert);
    expect(buttons.map(spokenText)).toEqual(['common.close']);
  });

  it('keeps the ✕ for pointer users, hidden from assistive technology and out of the tab order', () => {
    const alert = render({ title: 'Something went wrong', children });

    const corner = cornerButton(alert);
    expect(corner).toBeDefined();
    expect(corner?.getAttribute('aria-hidden')).toBe('true');
    expect(corner?.getAttribute('tabindex')).toBe('-1');
  });
});

describe('Alert — with actions of its own', () => {
  const actions = createRawSnippet(() => ({ render: () => '<button type="button">Yes</button>' }));

  it('exposes the ✕ to assistive technology, named Close, beside its actions', () => {
    const alert = render({ title: 'Can we help you?', children, actions });

    const corner = cornerButton(alert);
    expect(corner).toBeDefined();
    expect(corner?.hasAttribute('aria-hidden')).toBe(false);
    expect(corner?.hasAttribute('tabindex')).toBe(false);
    expect(exposedButtons(alert).map(spokenText)).toEqual(['Yes', 'common.close']);
  });
});
