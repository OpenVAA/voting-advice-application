/**
 * `Image.svelte` follows the colour-scheme preference after mount: a change of `darkMode` swaps the rendered variant without remounting.
 */

import { flushSync, mount, unmount } from 'svelte';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Image as ImageObject } from '@openvaa/data';

const scheme = vi.hoisted(() => ({ dark: false, listeners: new Set<() => void>() }));

vi.mock('$lib/contexts/component', async () => {
  const { createSubscriber } = await import('svelte/reactivity');
  const subscribe = createSubscriber((update) => {
    scheme.listeners.add(update);
    return () => scheme.listeners.delete(update);
  });
  return {
    getComponentContext: () => ({
      t: (key: string) => key,
      get darkMode() {
        subscribe();
        return scheme.dark;
      }
    })
  };
});

const Image = (await import('./Image.svelte')).default;

const IMAGE: ImageObject = { url: 'light.png', urlDark: 'dark.png' } as ImageObject;

let component: ReturnType<typeof mount> | undefined;
let target: HTMLElement;

afterEach(() => {
  if (component) unmount(component);
  component = undefined;
  target?.remove();
  scheme.dark = false;
});

function setDark(dark: boolean): void {
  scheme.dark = dark;
  for (const update of scheme.listeners) update();
  flushSync();
}

describe('Image', () => {
  it('switches to the dark variant, and back, when the preference changes after mount', () => {
    target = document.body.appendChild(document.createElement('div'));
    component = mount(Image, { target, props: { image: IMAGE } });
    flushSync();
    const img = target.querySelector('img')!;
    expect(img.getAttribute('src')).toBe('light.png');

    setDark(true);
    expect(img.getAttribute('src')).toBe('dark.png');
    expect(target.querySelector('img')).toBe(img);

    setDark(false);
    expect(img.getAttribute('src')).toBe('light.png');
  });
});
