/**
 * The navigation item, mounted for real against a fake layout context.
 *
 * What this file holds:
 *
 * 1. **A disabled item with a reason** is a button that stays operable: it is announced as unavailable and as collapsed, and it names, as the region it controls, a polite live region that holds nothing. A click shows the reason in that region, a second click hides it. Neither click navigates, calls the caller's handler or closes the menu.
 * 2. **A disabled item without a reason** is not operable: a link has no link target and is announced as unavailable, a button is natively disabled, and neither is a disclosure.
 * 3. **An open item** is a link or a button as its props say, given a reason or not, and renders no region.
 *
 * The assertions are on the DOM rather than on component state: what matters is what the user is shown.
 */

import { flushSync, mount, unmount } from 'svelte';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { NavItemProps } from './NavItem.type';

const closeMenu = vi.hoisted(() => vi.fn());

vi.mock('$lib/contexts/layout', () => ({
  getLayoutContext: () => ({ navigation: { close: closeMenu } })
}));

const NavItem = (await import('./NavItem.svelte')).default;

const REASON = 'The preview opens once the profile is complete.';
const REASON_TEST_ID = 'the-reason';

let teardown: Array<() => void> = [];

afterEach(() => {
  for (const fn of teardown.reverse()) fn();
  teardown = [];
  closeMenu.mockClear();
});

/**
 * Mount an item.
 * @param props - The item's props, a rune state object when a case changes them under the mounted item.
 * @returns The element the item is mounted in.
 */
function render(props: NavItemProps): HTMLElement {
  const target = document.createElement('div');
  document.body.appendChild(target);
  const component = mount(NavItem, { target, props });
  flushSync();
  teardown.push(() => {
    unmount(component);
    target.remove();
  });
  return target;
}

/** The item itself: the element carrying the item's test id. */
function itemOf(target: HTMLElement): HTMLElement {
  const item = target.querySelector<HTMLElement>('[data-testid="the-item"]');
  expect(item, 'the item should be rendered').not.toBeNull();
  return item!;
}

/** The element the item names in `aria-controls`, or `null` when it names none or the element is absent. */
function controlledRegionOf(target: HTMLElement): HTMLElement | null {
  const id = itemOf(target).getAttribute('aria-controls');
  return id ? target.ownerDocument.getElementById(id) : null;
}

/** The reason as the caller marks it, or `null` when it is not shown. */
function reasonOf(target: HTMLElement): HTMLElement | null {
  return target.querySelector<HTMLElement>(`[data-testid="${REASON_TEST_ID}"]`);
}

/** Click the item and let the DOM settle. */
function click(target: HTMLElement): void {
  itemOf(target).click();
  flushSync();
}

/** The props of a closed item with a reason, as the menu passes them. */
function closedWithReason(overrides: Partial<NavItemProps> = {}): NavItemProps {
  return {
    href: '/somewhere',
    text: 'Preview',
    disabled: true,
    disabledReason: REASON,
    disabledReasonProps: { 'data-testid': REASON_TEST_ID, 'data-reason': 'previewNotReady' },
    'data-testid': 'the-item',
    ...overrides
  } as NavItemProps;
}

describe('NavItem — a disabled item with a reason', () => {
  it('is a button announced as unavailable and collapsed, still operable, with no link target', () => {
    const target = render(closedWithReason());
    const item = itemOf(target);
    expect(item.tagName).toBe('BUTTON');
    expect(item.getAttribute('type')).toBe('button');
    expect(item.getAttribute('aria-disabled')).toBe('true');
    expect(item.hasAttribute('disabled'), 'it is not natively disabled, so it stays a tab stop').toBe(false);
    expect(item.hasAttribute('href')).toBe(false);
    expect(item.getAttribute('aria-expanded')).toBe('false');
    expect([...item.classList], 'it takes pointer events').not.toContain('pointer-events-none');
  });

  it('controls a polite live region that holds nothing while collapsed', () => {
    const target = render(closedWithReason());
    const region = controlledRegionOf(target);
    expect(region, 'aria-controls names an element that is rendered').not.toBeNull();
    expect(region!.getAttribute('role')).toBe('status');
    expect(region!.textContent?.trim()).toBe('');
    expect(reasonOf(target)).toBeNull();
  });

  it('shows the reason in that region on a click, and hides it on a second click', () => {
    const target = render(closedWithReason());
    click(target);
    expect(itemOf(target).getAttribute('aria-expanded')).toBe('true');
    const reason = reasonOf(target);
    expect(reason, 'the reason is shown').not.toBeNull();
    expect(reason!.textContent?.trim()).toBe(REASON);
    expect(reason!.getAttribute('data-reason'), 'the caller’s attributes reach the reason').toBe('previewNotReady');
    expect(controlledRegionOf(target)!.contains(reason), 'the reason is in the controlled region').toBe(true);
    click(target);
    expect(itemOf(target).getAttribute('aria-expanded')).toBe('false');
    expect(reasonOf(target)).toBeNull();
    expect(controlledRegionOf(target), 'the region stays rendered').not.toBeNull();
  });

  it('neither calls the caller’s handler nor closes the menu when clicked', () => {
    const onclick = vi.fn();
    const target = render(closedWithReason({ href: undefined, onclick } as Partial<NavItemProps>));
    click(target);
    click(target);
    expect(onclick).not.toHaveBeenCalled();
    expect(closeMenu).not.toHaveBeenCalled();
  });

  it('gives each item a region of its own', () => {
    const first = render(closedWithReason());
    const second = render(closedWithReason());
    const firstId = itemOf(first).getAttribute('aria-controls');
    const secondId = itemOf(second).getAttribute('aria-controls');
    expect(firstId).toBeTruthy();
    expect(firstId).not.toBe(secondId);
  });

  it('is collapsed again once it has opened and closed again', () => {
    const props = $state(closedWithReason());
    const target = render(props);
    click(target);
    expect(reasonOf(target)).not.toBeNull();
    props.disabled = false;
    flushSync();
    expect(itemOf(target).tagName, 'an open item with a link target is a link').toBe('A');
    expect(controlledRegionOf(target)).toBeNull();
    props.disabled = true;
    flushSync();
    expect(itemOf(target).getAttribute('aria-expanded')).toBe('false');
    expect(reasonOf(target)).toBeNull();
  });
});

describe('NavItem — a disabled item without a reason', () => {
  it('is a link with no link target, announced as unavailable and taking no pointer events', () => {
    const target = render({
      href: '/somewhere',
      text: 'Preview',
      disabled: true,
      'data-testid': 'the-item'
    } as NavItemProps);
    const item = itemOf(target);
    expect(item.tagName).toBe('A');
    expect(item.hasAttribute('href')).toBe(false);
    expect(item.getAttribute('aria-disabled')).toBe('true');
    expect([...item.classList]).toContain('pointer-events-none');
    expect(item.hasAttribute('aria-expanded')).toBe(false);
    expect(item.hasAttribute('aria-controls')).toBe(false);
  });

  it('is a natively disabled button when it has no link target', () => {
    const target = render({ text: 'Do it', disabled: true, 'data-testid': 'the-item' } as NavItemProps);
    const item = itemOf(target);
    expect(item.tagName).toBe('BUTTON');
    expect(item.hasAttribute('disabled')).toBe(true);
    expect(item.hasAttribute('aria-expanded')).toBe(false);
  });
});

describe('NavItem — an open item', () => {
  it('is a link to its target, given a reason or not, and renders no region', () => {
    const target = render(closedWithReason({ disabled: false }));
    const item = itemOf(target);
    expect(item.tagName).toBe('A');
    expect(item.getAttribute('href')).toBe('/somewhere');
    expect(item.hasAttribute('aria-disabled')).toBe(false);
    expect(item.hasAttribute('aria-expanded')).toBe(false);
    expect(item.hasAttribute('aria-controls')).toBe(false);
    expect(target.querySelector('[role="status"]')).toBeNull();
  });

  it('calls the caller’s handler and closes the menu when clicked', () => {
    const onclick = vi.fn();
    const target = render({ text: 'Do it', onclick, 'data-testid': 'the-item' } as NavItemProps);
    click(target);
    expect(onclick).toHaveBeenCalledTimes(1);
    expect(closeMenu).toHaveBeenCalledTimes(1);
  });
});
