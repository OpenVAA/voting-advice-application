/**
 * The value and the placeholder of an `Input` start at the start of its field.
 *
 * `text-start` is a logical value, so in a right-to-left locale the text starts at the right. A DOM without layout cannot show where the text sits; what these cases hold is that the rendered control carries the start alignment and no end alignment.
 */

import { flushSync, mount, unmount } from 'svelte';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { InputProps, InputType } from './Input.type';

vi.mock('$lib/contexts/component', () => ({
  getComponentContext: () => ({
    locale: 'en',
    locales: ['en'],
    t: (key: string) => key,
    translate: (value: unknown) => (typeof value === 'string' ? value : ''),
    darkMode: false
  })
}));

const Input = (await import('./Input.svelte')).default;

const OPTIONS = [
  { id: 'a', label: 'Option A' },
  { id: 'b', label: 'Option B' }
];

/** Each kind, its props and the selector of its control. */
const KINDS: Array<{ type: InputType; props: Record<string, unknown>; control: string }> = [
  { type: 'text', props: { value: 'x', placeholder: 'Placeholder' }, control: 'input[type="text"]' },
  { type: 'email', props: { value: '', placeholder: 'name@example.com' }, control: 'input[type="email"]' },
  { type: 'select', props: { value: 'a', options: OPTIONS }, control: 'select' }
];

let target: HTMLElement;
let component: ReturnType<typeof mount> | undefined;

afterEach(() => {
  if (component) unmount(component);
  component = undefined;
  target?.remove();
});

/** Mount an `Input` of `type` and return its control. */
function mountControl(type: InputType, props: Record<string, unknown>, selector: string): HTMLElement {
  target = document.createElement('div');
  document.body.appendChild(target);
  component = mount(Input, { target, props: { label: 'Label', type, ...props } as InputProps });
  flushSync();
  const control = target.querySelector<HTMLElement>(selector);
  expect(control, `the ${type} Input renders no ${selector}`).not.toBeNull();
  return control!;
}

describe('Input text alignment', () => {
  it.each(KINDS)('the $type control starts its text at the start', ({ type, props, control }) => {
    const classes = mountControl(type, props, control).classList;
    expect(classes.contains('text-start'), `the ${type} control has no text-start`).toBe(true);
    expect(classes.contains('text-end'), `the ${type} control still has text-end`).toBe(false);
    if (type !== 'select') expect(classes.contains('justify-end'), `the ${type} control has justify-end`).toBe(false);
  });
});
