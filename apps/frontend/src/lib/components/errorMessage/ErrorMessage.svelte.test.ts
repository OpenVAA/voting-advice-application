/**
 * What the inline variant of `ErrorMessage` shows, and what it speaks.
 *
 * The variant renders an emoji before its sentence. A sighted user reads past it; a screen reader announces its name first, ahead of the sentence the user has to act on. These cases hold both halves: the text content is the emoji and the sentence, and the text exposed to assistive technology is the sentence alone.
 */

import { flushSync, mount, unmount } from 'svelte';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('$lib/contexts/component', () => ({
  getComponentContext: () => ({
    locale: 'en',
    locales: ['en'],
    t: (key: string) => key,
    translate: (value: unknown) => (typeof value === 'string' ? value : ''),
    darkMode: false
  })
}));

const ErrorMessage = (await import('./ErrorMessage.svelte')).default;

/** The emoji as the mocked `t` renders it. */
const EMOJI = 'dynamic.error.heroEmoji';
const SENTENCE = 'The colour is not valid.';

let target: HTMLElement;
let component: ReturnType<typeof mount> | undefined;

/** Mount the inline variant and return its root element. */
function mountInline(): HTMLElement {
  target = document.createElement('div');
  document.body.appendChild(target);
  component = mount(ErrorMessage, { target, props: { inline: true, message: SENTENCE } });
  flushSync();
  const root = target.querySelector<HTMLElement>('[data-testid="error-message"]');
  expect(root, 'expected the error message to be rendered').not.toBeNull();
  return root!;
}

/** The text of `element` without anything hidden from assistive technology. */
function spokenText(element: HTMLElement): string {
  const copy = element.cloneNode(true) as HTMLElement;
  for (const hidden of copy.querySelectorAll('[aria-hidden="true"]')) hidden.remove();
  return (copy.textContent ?? '').trim();
}

afterEach(() => {
  if (component) unmount(component);
  component = undefined;
  target.remove();
});

describe('an inline error message', () => {
  it('has the emoji, a space and the sentence as its text content', () => {
    const root = mountInline();

    expect(root.textContent?.trim()).toBe(`${EMOJI} ${SENTENCE}`);
  });

  it('speaks its sentence and nothing else', () => {
    const root = mountInline();

    expect(spokenText(root)).toBe(SENTENCE);
  });

  it('keeps the emoji inside the coloured sentence element, hidden from assistive technology', () => {
    const root = mountInline();

    const sentence = root.querySelector('.text-error');
    const emoji = sentence?.querySelector('[aria-hidden="true"]');
    expect(emoji?.textContent).toBe(EMOJI);
  });
});
