/**
 * The `image` kind takes a caller's control into the thumbnail's row, through the `imageAction` snippet.
 *
 * The control is rendered before the button that opens the file dialog, as that button's sibling, and that button carries a test id of its own, so nothing has to take the first button of the row to reach it. Other kinds do not take the control.
 */

import { createRawSnippet, flushSync, mount, unmount } from 'svelte';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { InputProps } from './Input.type';

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

const UPLOAD = '[data-testid="input-image-upload"]';
const ACTION = '[data-testid="the-action"]';

const IMAGE = { url: 'https://example.test/portrait.png' };

/** A control as a caller hands one to the `image` kind. */
const imageAction = createRawSnippet(() => ({
  render: () => '<button type="button" data-testid="the-action">Act</button>'
}));

let target: HTMLElement;
let component: ReturnType<typeof mount> | undefined;

function render(props: InputProps): void {
  target = document.createElement('div');
  document.body.appendChild(target);
  component = mount(Input, { target, props });
  flushSync();
}

afterEach(() => {
  if (component) unmount(component);
  component = undefined;
  target.remove();
});

describe('the image kind’s action', () => {
  it('is rendered before the upload button, as its sibling', () => {
    render({ type: 'image', label: 'Portrait', value: IMAGE, imageAction });

    const action = target.querySelector(ACTION);
    const upload = target.querySelector(UPLOAD);
    expect(action, 'the action').not.toBeNull();
    expect(upload, 'the upload button').not.toBeNull();
    expect(action!.parentElement).toBe(upload!.parentElement);
    expect(action!.compareDocumentPosition(upload!) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it('leaves the upload button alone in the row when none is given', () => {
    render({ type: 'image', label: 'Portrait', value: IMAGE });

    const buttons = target.querySelectorAll('button');
    expect(buttons).toHaveLength(1);
    expect(buttons[0].matches(UPLOAD)).toBe(true);
  });

  it('is not taken by another kind', () => {
    render({ type: 'text', label: 'Name', value: 'Ada', imageAction } as unknown as InputProps);

    expect(target.querySelector('input')).not.toBeNull();
    expect(target.querySelector(ACTION)).toBeNull();
  });
});

describe('the upload button’s test id', () => {
  it.each([
    { what: 'with an image', value: IMAGE },
    { what: 'with no image', value: null }
  ])('is on the button that opens the file dialog, $what', ({ value }) => {
    render({ type: 'image', label: 'Portrait', value });

    const upload = target.querySelector<HTMLButtonElement>(UPLOAD);
    expect(upload?.tagName).toBe('BUTTON');
    const fileInput = target.querySelector<HTMLInputElement>('input[type="file"]');
    expect(fileInput).not.toBeNull();
    const click = vi.spyOn(fileInput!, 'click').mockImplementation(() => undefined);
    upload?.click();
    expect(click).toHaveBeenCalledTimes(1);
  });
});
