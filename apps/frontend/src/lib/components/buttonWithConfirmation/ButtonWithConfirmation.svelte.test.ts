/**
 * `ButtonWithConfirmation` asking inline, mounted for real against a fake component context whose `t` returns its key.
 *
 * Assertions are on the DOM, never on component state.
 */

import { flushSync, mount, unmount } from 'svelte';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Component } from 'svelte';

vi.mock('$lib/contexts/component', () => ({
  getComponentContext: () => ({ t: (key: string) => key, darkMode: false })
}));

const { ButtonWithConfirmation } = await import('.');

const TRIGGER = '[data-testid="delete"]';
const PROMPT = '[data-testid="delete-prompt"]';
const CONFIRM = '[data-testid="delete-confirm"]';
const CANCEL = '[data-testid="delete-cancel"]';

let teardown: Array<() => void> = [];

afterEach(() => {
  for (const fn of teardown.reverse()) fn();
  teardown = [];
});

/** Mount an inline confirmation and return its container. */
function render(props: Record<string, unknown>): HTMLElement {
  const target = document.createElement('div');
  document.body.appendChild(target);
  const mounted = mount(ButtonWithConfirmation as Component<never>, {
    target,
    props: {
      confirmationType: 'inline',
      text: 'Delete',
      modalTitle: 'Delete this?',
      confirmLabel: 'Yes, delete',
      cancelLabel: 'Keep',
      'data-testid': 'delete',
      ...props
    } as never
  });
  flushSync();
  teardown.push(() => {
    unmount(mounted);
    target.remove();
  });
  return target;
}

function one(root: ParentNode, selector: string): HTMLElement {
  const element = root.querySelector<HTMLElement>(selector);
  if (!element) throw new Error(`No element matches ${selector}`);
  return element;
}

function textOf(element: Element | null | undefined): string {
  return element?.textContent?.replace(/\s+/g, ' ').trim() ?? '';
}

/** Press a control and let the component settle. */
async function press(root: ParentNode, selector: string): Promise<void> {
  one(root, selector).click();
  await settle();
}

async function settle(): Promise<void> {
  flushSync();
  for (let i = 0; i < 3; i++) await new Promise((resolve) => setTimeout(resolve, 0));
  flushSync();
}

describe('ButtonWithConfirmation — inline', () => {
  it('shows only the button until it is pressed, and opens no dialog', () => {
    const target = render({ onConfirm: vi.fn() });

    expect(textOf(one(target, TRIGGER))).toBe('Delete');
    expect(target.querySelector(PROMPT)).toBeNull();
    expect(document.querySelector('dialog')).toBeNull();
  });

  it('asks in place of the button, with Confirm described by the question and focused', async () => {
    const onConfirm = vi.fn();
    const target = render({ onConfirm });

    await press(target, TRIGGER);

    const prompt = one(target, PROMPT);
    const confirm = one(target, CONFIRM);
    expect(textOf(prompt)).toBe('Delete this?');
    expect(textOf(confirm)).toBe('Yes, delete');
    expect(confirm.getAttribute('aria-describedby')).toBe(prompt.id);
    expect(textOf(one(target, CANCEL))).toBe('Keep');
    expect(target.querySelector(TRIGGER)).toBeNull();
    expect(document.activeElement).toBe(confirm);
    expect(document.querySelector('dialog')).toBeNull();
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it('Cancel takes the question back and moves focus to the button', async () => {
    const onConfirm = vi.fn();
    const onCancel = vi.fn();
    const target = render({ onConfirm, onCancel });

    await press(target, TRIGGER);
    await press(target, CANCEL);

    expect(target.querySelector(PROMPT)).toBeNull();
    expect(document.activeElement).toBe(one(target, TRIGGER));
    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it('Confirm runs the action once, shows its loading state while it is pending and then closes', async () => {
    const pending = Promise.withResolvers<void>();
    const onConfirm = vi.fn(() => pending.promise);
    const target = render({ onConfirm });

    await press(target, TRIGGER);
    await press(target, CONFIRM);
    await press(target, CONFIRM);

    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(one(target, CONFIRM).hasAttribute('disabled')).toBe(true);
    expect(one(target, CANCEL).hasAttribute('disabled')).toBe(true);

    pending.resolve();
    await settle();

    expect(target.querySelector(PROMPT)).toBeNull();
    expect(one(target, TRIGGER)).toBeDefined();
  });

  it('follows a bound open', () => {
    const target = render({ onConfirm: vi.fn(), open: true });

    expect(one(target, PROMPT)).toBeDefined();
    expect(target.querySelector(TRIGGER)).toBeNull();
  });
});
