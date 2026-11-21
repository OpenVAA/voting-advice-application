/**
 * `ElectionTag.svelte` writes a declaration into its `style` attribute, and adds the class that reads it, only for a colour member that holds a colour.
 */

import { flushSync, mount, unmount } from 'svelte';
import { afterEach, describe, expect, it } from 'vitest';
import ElectionTag from './ElectionTag.svelte';
import type { Colors, Election } from '@openvaa/data';

const mounted: Array<{ component: ReturnType<typeof mount>; target: HTMLElement }> = [];

afterEach(() => {
  for (const { component, target } of mounted.splice(0)) {
    unmount(component);
    target.remove();
  }
});

/**
 * Mount the tag of an election with the given colour.
 * @param color - The election's colour as the data root holds it: `null` for an election without one.
 * @returns The tag's element.
 */
function tagOf(color: Colors | null): HTMLElement {
  const target = document.body.appendChild(document.createElement('div'));
  const election = { name: 'Election', shortName: 'E', color } as Election;
  mounted.push({ component: mount(ElectionTag, { target, props: { election } }), target });
  flushSync();
  return target.querySelector<HTMLElement>('[data-testid="election-tag"]')!;
}

describe('ElectionTag', () => {
  it('renders an election whose colour members are both empty exactly as it renders an election with no colour', () => {
    const withoutColor = tagOf(null);
    const withEmptyColor = tagOf({ normal: '', dark: '' });

    expect(withEmptyColor.outerHTML).toBe(withoutColor.outerHTML);
    expect(withEmptyColor.getAttribute('style') ?? '').toBe('');
    expect(withEmptyColor.className).not.toContain('--tag-color');
  });

  it('declares each colour member that holds a colour, and reads it from a class', () => {
    const tag = tagOf({ normal: '#123456', dark: '#abcdef' });

    expect(tag.getAttribute('style')?.trim()).toBe('--tag-color: #123456; --tag-color-dark: #abcdef;');
    expect(tag.className).toContain('text-[var(--tag-color)]');
    expect(tag.className).toContain('dark:text-[var(--tag-color-dark)]');
  });

  it('declares only the dark colour when the normal member is empty', () => {
    const tag = tagOf({ normal: '', dark: '#abcdef' });

    expect(tag.getAttribute('style')?.trim()).toBe('--tag-color-dark: #abcdef;');
    expect(tag.className).not.toContain('text-[var(--tag-color)]');
    expect(tag.className).toContain('dark:text-[var(--tag-color-dark)]');
  });
});
