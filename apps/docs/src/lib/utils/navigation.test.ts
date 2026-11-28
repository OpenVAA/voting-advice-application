import { render } from 'svelte/server';
import { describe, expect, it } from 'vitest';
import { getPeerNavigation } from './navigation';
import NavigationItem from '../components/NavigationItem.svelte';
import { navigation } from '../navigation.config';
import type { NavigationItem as NavigationItemType, NavigationSection } from '$lib/navigation.type';

const SITE = 'https://docs.example';

/**
 * The leaf items under a navigation node, in menu order.
 * @param items - The children of a navigation node.
 * @returns Every leaf below them, depth first.
 */
function leavesOf(items: Array<NavigationSection | NavigationItemType>): Array<NavigationItemType> {
  return items.flatMap((item) => ('children' in item && item.children.length > 0 ? leavesOf(item.children) : [item]));
}

/**
 * The navigation node with the given title, searched depth first.
 * @param title - The title shown in the menu.
 * @returns The node.
 */
function nodeTitled(title: string): NavigationSection | NavigationItemType {
  const stack: Array<NavigationSection | NavigationItemType> = [...navigation];
  while (stack.length > 0) {
    const node = stack.shift()!;
    if (node.title === title) return node;
    if ('children' in node) stack.push(...node.children);
  }
  throw new Error(`No navigation node titled ${title}`);
}

/**
 * The links a rendered navigation node marks as the current page.
 * @param item - The navigation node to render.
 * @param pathname - The path of the page being viewed.
 * @returns The `href` of every link carrying `aria-current="page"`.
 */
function currentLinks(item: NavigationSection | NavigationItemType, pathname: string): Array<string> {
  const { body } = render(NavigationItem, { props: { item, url: new URL(pathname, SITE) } });
  return [...body.matchAll(/<a\b[^>]*>/g)]
    .map(([tag]) => tag)
    .filter((tag) => /\saria-current="page"/.test(tag))
    .map((tag) => /\shref="([^"]*)"/.exec(tag)?.[1] ?? '');
}

describe('getPeerNavigation', () => {
  it('links a deployment sub-page to its neighbours, never to itself', () => {
    const hosted = getPeerNavigation(new URL('/developers-guide/deployment/hosted-settings', SITE));
    expect(hosted.prev?.route).toBe('/developers-guide/deployment');
    expect(hosted.next?.route).toBe('/developers-guide/deployment/operations');

    const operations = getPeerNavigation(new URL('/developers-guide/deployment/operations', SITE));
    expect(operations.prev?.route).toBe('/developers-guide/deployment/hosted-settings');
  });

  it.each(navigation.map((section) => [section.title, section] as const))(
    'walks every leaf of %s in menu order',
    (_title, section) => {
      const leaves = leavesOf(section.children);
      leaves.forEach((leaf, index) => {
        const { prev, next } = getPeerNavigation(new URL(leaf.route, SITE));
        expect(prev?.route ?? null, `prev of ${leaf.route}`).toBe(leaves[index - 1]?.route ?? null);
        expect(next?.route ?? null, `next of ${leaf.route}`).toBe(leaves[index + 1]?.route ?? null);
      });
    }
  );

  it('places a page below a leaf but outside the menu on that leaf', () => {
    const { prev } = getPeerNavigation(new URL('/developers-guide/deployment/operations/unlisted', SITE));
    expect(prev?.route).toBe('/developers-guide/deployment/hosted-settings');
  });
});

describe('NavigationItem', () => {
  it.each([
    ['/developers-guide/deployment', '/developers-guide/deployment'],
    ['/developers-guide/deployment/hosted-settings', '/developers-guide/deployment/hosted-settings'],
    ['/developers-guide/deployment/operations', '/developers-guide/deployment/operations']
  ])('marks only the page itself as current on %s', (pathname, expected) => {
    expect(currentLinks(nodeTitled('Deployment'), pathname)).toEqual([expected]);
  });

  it('opens the disclosure that holds the current page', () => {
    const { body } = render(NavigationItem, {
      props: { item: nodeTitled('Deployment'), url: new URL('/developers-guide/deployment/operations', SITE) }
    });
    expect(body).toMatch(/<details[^>]*\sopen/);
  });
});
