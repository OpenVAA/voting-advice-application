/**
 * `DrawerHost.svelte` timing: focus enters the dialog only while it still shows the payload it opened with, the close waits out the CSS animation unless the user prefers reduced motion — regardless of View Transitions support — and a drawer closed within its first two frames keeps its closed-state styles, so its next open slides up again. User dismissal calls the payload's `onDismiss` once per open: Escape, the backdrop and the close button do nothing while the drawer is closing.
 */

import { flushSync, mount, unmount } from 'svelte';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { Button } from '$lib/components/button';
import { DELAY } from '$lib/utils/timing';
import { drawerHost } from './drawerHostState.svelte';

vi.mock('$app/environment', () => ({ browser: true, dev: true, building: false, version: 'test' }));

vi.mock('$lib/contexts/component', () => ({
  getComponentContext: () => ({ t: (key: string) => key, darkMode: false })
}));

const DrawerHost = (await import('./DrawerHost.svelte')).default;

const proto = HTMLDialogElement.prototype as HTMLDialogElement & Record<string, unknown>;
const original = { showModal: proto.showModal, close: proto.close };

beforeAll(() => {
  // jsdom implements neither method.
  proto.showModal = function (this: HTMLDialogElement) {
    this.setAttribute('open', '');
  };
  proto.close = function (this: HTMLDialogElement) {
    this.removeAttribute('open');
  };
});

afterAll(() => {
  proto.showModal = original.showModal;
  proto.close = original.close;
});

let host: ReturnType<typeof mount> | undefined;
let target: HTMLElement;

beforeEach(() => {
  vi.useFakeTimers();
  stubReducedMotion(false);
});

afterEach(() => {
  drawerHost.close();
  flushSync();
  if (host) unmount(host);
  host = undefined;
  target?.remove();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

function stubReducedMotion(reduce: boolean): void {
  vi.stubGlobal('matchMedia', (query: string) => ({
    matches: reduce && query === '(prefers-reduced-motion: reduce)'
  }));
}

function mountHost(): HTMLDialogElement {
  target = document.body.appendChild(document.createElement('div'));
  host = mount(DrawerHost, { target });
  flushSync();
  return target.querySelector('dialog')!;
}

function openPayload(): void {
  drawerHost.open({
    key: 'test',
    title: () => 'Test drawer',
    component: Button,
    props: () => ({ text: 'Inside', 'data-testid': 'inside' })
  });
  flushSync();
}

describe('DrawerHost', () => {
  it('moves focus into the payload after the open delay', () => {
    const dialog = mountHost();
    openPayload();
    expect(dialog.open).toBe(true);
    vi.advanceTimersByTime(DELAY.sm);
    expect(document.activeElement).toBe(dialog.querySelector('[data-testid="inside"]'));
  });

  it('does not move focus into a drawer dismissed before the open delay elapsed', () => {
    const outside = document.body.appendChild(document.createElement('button'));
    outside.focus();
    const dialog = mountHost();
    openPayload();
    drawerHost.close();
    flushSync();
    vi.advanceTimersByTime(DELAY.sm + DELAY.xs);
    expect(dialog.open).toBe(false);
    expect(document.activeElement).toBe(outside);
    outside.remove();
  });

  it('waits out the close animation even where View Transitions are unsupported', () => {
    expect('startViewTransition' in document).toBe(false);
    const dialog = mountHost();
    openPayload();
    drawerHost.close();
    flushSync();
    expect(dialog.open).toBe(true);
    vi.advanceTimersByTime(DELAY.xs);
    expect(dialog.open).toBe(false);
  });

  it('closes at once under reduced motion', () => {
    stubReducedMotion(true);
    const dialog = mountHost();
    openPayload();
    drawerHost.close();
    flushSync();
    expect(dialog.open).toBe(false);
  });

  it('stays in the closed-state styles when closed within its first two frames', () => {
    const dialog = mountHost();
    openPayload();
    drawerHost.close();
    flushSync();
    advanceTwoFrames();
    const panel = dialog.querySelector('.transition-transform')!;
    expect(panel.classList.contains('translate-y-full')).toBe(true);
    expect(panel.classList.contains('translate-y-0')).toBe(false);
    expect(dialog.classList.contains('backdrop:opacity-0')).toBe(true);
    vi.advanceTimersByTime(DELAY.xs);
    expect(dialog.open).toBe(false);
  });

  it('starts a reopen from the closed-state styles after a close within its first two frames', () => {
    const dialog = mountHost();
    openPayload();
    drawerHost.close();
    flushSync();
    advanceTwoFrames();
    vi.advanceTimersByTime(DELAY.xs);
    openPayload();
    const panel = dialog.querySelector('.transition-transform')!;
    expect(panel.classList.contains('translate-y-full')).toBe(true);
    advanceTwoFrames();
    expect(panel.classList.contains('translate-y-0')).toBe(true);
    expect(dialog.classList.contains('backdrop:opacity-60')).toBe(true);
  });

  it('calls onDismiss once, not again while the drawer is closing', () => {
    const dialog = mountHost();
    const onDismiss = openRoutedPayload();
    dismissWhileClosing(dialog, onDismiss);
  });

  it('is dismissable again after a reopen that reuses the key', () => {
    const dialog = mountHost();
    const onDismiss = openRoutedPayload();
    dismissWhileClosing(dialog, onDismiss);
    openRoutedPayload(onDismiss);
    pressEscape();
    expect(onDismiss).toHaveBeenCalledTimes(2);
  });
});

function advanceTwoFrames(): void {
  vi.advanceTimersToNextFrame();
  vi.advanceTimersToNextFrame();
  flushSync();
}

/** Opens a payload shaped like a routed opener's: its dismissal closes the host, as the opener's unmount would. */
function openRoutedPayload(onDismiss = vi.fn(() => drawerHost.close('routed'))): typeof onDismiss {
  drawerHost.open({
    key: 'routed',
    title: () => 'Routed drawer',
    component: Button,
    props: () => ({ text: 'Inside' }),
    onDismiss
  });
  flushSync();
  return onDismiss;
}

function pressEscape(): void {
  document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
  flushSync();
}

/** Dismisses once, then tries every user dismissal path again during the close animation, and lets the close complete. */
function dismissWhileClosing(dialog: HTMLDialogElement, onDismiss: ReturnType<typeof vi.fn>): void {
  pressEscape();
  expect(onDismiss).toHaveBeenCalledTimes(1);
  expect(dialog.open).toBe(true);
  pressEscape();
  dialog.querySelector<HTMLButtonElement>('button[tabindex="-1"]')!.click();
  const buttons = dialog.querySelectorAll('button');
  buttons[buttons.length - 1].click();
  flushSync();
  expect(onDismiss).toHaveBeenCalledTimes(1);
  vi.advanceTimersByTime(DELAY.xs);
  expect(dialog.open).toBe(false);
}
