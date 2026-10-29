/**
 * `Button` with and without a label suffix, mounted for real against a fake component context whose `t` returns its key.
 *
 * Assertions are on the DOM, never on component state.
 */

import { flushSync, mount, unmount } from 'svelte';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Component } from 'svelte';

vi.mock('$lib/contexts/component', () => ({
  getComponentContext: () => ({ t: (key: string) => key, darkMode: false })
}));

const { Button } = await import('.');

let teardown: Array<() => void> = [];

afterEach(() => {
  for (const fn of teardown.reverse()) fn();
  teardown = [];
});

/** Mount a button and return it. */
function render(props: Record<string, unknown>): HTMLElement {
  const target = document.createElement('div');
  document.body.appendChild(target);
  const mounted = mount(Button as Component<never>, { target, props: props as never });
  flushSync();
  teardown.push(() => {
    unmount(mounted);
    target.remove();
  });
  return target.firstElementChild as HTMLElement;
}

/** The text of an element with its runs of white space read as one space. */
function textOf(element: Element | null | undefined): string {
  return element?.textContent?.replace(/\s+/g, ' ').trim() ?? '';
}

describe('Button — the label suffix', () => {
  it('follows the text, inside the label, in normal weight and the secondary colour', () => {
    const button = render({ text: 'Send again', suffix: '(in 12s)' });

    const suffix = [...button.querySelectorAll('span')].find((span) => textOf(span) === '(in 12s)');
    expect(suffix).toBeDefined();
    expect(suffix?.classList.contains('font-normal')).toBe(true);
    expect(suffix?.classList.contains('text-secondary')).toBe(true);
    expect(suffix?.parentElement?.textContent?.trim().startsWith('Send again')).toBe(true);
  });

  it('is part of the button’s name: the text, a space, the suffix', () => {
    const button = render({ text: 'Send again', suffix: '(in 12s)' });

    expect(textOf(button)).toBe('Send again (in 12s)');
    expect(button.hasAttribute('aria-label')).toBe(false);
  });

  it('carries the attributes given for it', () => {
    const button = render({
      text: 'Send again',
      suffix: '(in 12s)',
      suffixProps: { id: 'the-suffix', 'data-testid': 'the-suffix-test-id' }
    });

    const suffix = button.querySelector<HTMLElement>('#the-suffix');
    expect(suffix?.getAttribute('data-testid')).toBe('the-suffix-test-id');
    expect(textOf(suffix)).toBe('(in 12s)');
    expect(suffix?.classList.contains('font-normal')).toBe(true);
  });

  it('is the suffix as text, never as markup', () => {
    const button = render({ text: 'Send again', suffix: '<b>(in 12s)</b>' });

    expect(button.querySelector('b')).toBeNull();
    expect(textOf(button)).toBe('Send again <b>(in 12s)</b>');
  });
});

describe('Button — without a suffix', () => {
  it('renders its text alone, with no element after it', () => {
    const button = render({ text: 'Send again' });

    expect(textOf(button)).toBe('Send again');
    expect(button.querySelectorAll('span')).toHaveLength(1);
    expect(button.querySelector('.text-secondary')).toBeNull();
  });

  it('renders no suffix for an empty one', () => {
    const button = render({ text: 'Send again', suffix: '' });

    expect(button.querySelectorAll('span')).toHaveLength(1);
  });
});
