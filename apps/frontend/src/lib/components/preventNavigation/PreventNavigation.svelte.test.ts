/**
 * `PreventNavigation`, mounted for real, with its `beforeNavigate` callback captured and `window.confirm` spied: the question it asks on a navigation, how the answers to the logout modal reach it through `navigationGuards.ts`, which ask nothing, and the silence it keeps while navigations are held.
 */

import { flushSync, mount, unmount } from 'svelte';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  discardGuardedEdits,
  hasActiveNavigationGuard,
  holdNavigationWhile,
  isLeavingUnasked,
  keepGuardedEdits,
  leaveUnasked,
  registerNavigationGuard
} from './navigationGuards';
import PreventNavigation from './PreventNavigation.svelte';
import type { MockInstance } from 'vitest';

/** A navigation as far as the guard reads one. */
type FakeNavigation = { cancel: () => void };

const { navigationCallbacks } = vi.hoisted(() => ({
  navigationCallbacks: [] as Array<(navigation: FakeNavigation) => void>
}));

vi.mock('$app/navigation', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  beforeNavigate: (callback: (navigation: FakeNavigation) => void) => {
    navigationCallbacks.push(callback);
  }
}));

// The guard removes its `beforeunload` listener only in the browser, and the tests' stub of this module reads as the server.
vi.mock('$app/environment', () => ({ browser: true }));

vi.mock('$lib/contexts/component', () => ({
  getComponentContext: () => ({ t: (key: string) => key })
}));

const QUESTION = 'components.preventNavigation.unsavedChanges';

let confirm: MockInstance<typeof window.confirm>;
let teardown: Array<() => void> = [];

beforeEach(() => {
  confirm = vi.spyOn(window, 'confirm');
});

afterEach(() => {
  for (const fn of teardown.reverse()) fn();
  teardown = [];
  navigationCallbacks.length = 0;
  vi.restoreAllMocks();
});

/**
 * Mount the guard.
 * @param props - The guard's properties.
 * @returns The function that unmounts it, which is also called after the test if it was not called before.
 */
function mountGuard(props: { active: boolean | (() => boolean); onCancel?: () => void; onConfirm?: () => void }) {
  const target = document.createElement('div');
  document.body.appendChild(target);
  const component = mount(PreventNavigation, { target, props });
  flushSync();
  let mounted = true;
  function remove(): void {
    if (!mounted) return;
    mounted = false;
    unmount(component);
    target.remove();
  }
  teardown.push(remove);
  return remove;
}

/** Run the captured navigation callbacks over a navigation, and say whether it was cancelled. */
function navigate(): { cancelled: boolean } {
  const result = { cancelled: false };
  for (const callback of navigationCallbacks) {
    callback({
      cancel: () => {
        result.cancelled = true;
      }
    });
  }
  return result;
}

/** Dispatch `beforeunload`, and say whether it was prevented. */
function unloadPrevented(): boolean {
  const event = new Event('beforeunload', { cancelable: true });
  window.dispatchEvent(event);
  return event.defaultPrevented;
}

describe('PreventNavigation — a navigation', () => {
  it('with the guard active it asks once, and Cancel cancels and runs `onCancel`', () => {
    confirm.mockReturnValue(false);
    const onCancel = vi.fn();
    const onConfirm = vi.fn();
    mountGuard({ active: true, onCancel, onConfirm });

    const { cancelled } = navigate();

    expect(confirm).toHaveBeenCalledTimes(1);
    expect(confirm).toHaveBeenCalledWith(QUESTION);
    expect(cancelled).toBe(true);
    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it('with the guard active it asks once, and OK runs `onConfirm` and cancels nothing', () => {
    confirm.mockReturnValue(true);
    const onCancel = vi.fn();
    const onConfirm = vi.fn();
    mountGuard({ active: () => true, onCancel, onConfirm });

    const { cancelled } = navigate();

    expect(confirm).toHaveBeenCalledTimes(1);
    expect(cancelled).toBe(false);
    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onCancel).not.toHaveBeenCalled();
  });

  it('with the guard inactive it asks nothing and cancels nothing', () => {
    const onCancel = vi.fn();
    const onConfirm = vi.fn();
    mountGuard({ active: () => false, onCancel, onConfirm });

    const { cancelled } = navigate();

    expect(confirm).not.toHaveBeenCalled();
    expect(cancelled).toBe(false);
    expect(onCancel).not.toHaveBeenCalled();
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it('prevents `beforeunload` only while the guard is active', () => {
    let active = true;
    mountGuard({ active: () => active });

    expect(unloadPrevented()).toBe(true);

    active = false;
    expect(unloadPrevented()).toBe(false);
  });
});

describe('navigationGuards — the answers to the logout modal', () => {
  it('`keepGuardedEdits` runs the `onCancel` of a mounted active guard, and asks nothing', () => {
    const onCancel = vi.fn();
    const onConfirm = vi.fn();
    mountGuard({ active: true, onCancel, onConfirm });

    expect(hasActiveNavigationGuard()).toBe(true);
    keepGuardedEdits();

    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onConfirm).not.toHaveBeenCalled();
    expect(confirm).not.toHaveBeenCalled();
  });

  it('`discardGuardedEdits` runs the `onConfirm` of a mounted active guard, and asks nothing', () => {
    const onCancel = vi.fn();
    const onConfirm = vi.fn();
    mountGuard({ active: true, onCancel, onConfirm });

    discardGuardedEdits();

    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onCancel).not.toHaveBeenCalled();
    expect(confirm).not.toHaveBeenCalled();
  });

  it('an inactive guard runs neither', () => {
    const onCancel = vi.fn();
    const onConfirm = vi.fn();
    mountGuard({ active: () => false, onCancel, onConfirm });

    expect(hasActiveNavigationGuard()).toBe(false);
    keepGuardedEdits();
    discardGuardedEdits();

    expect(onCancel).not.toHaveBeenCalled();
    expect(onConfirm).not.toHaveBeenCalled();
    expect(confirm).not.toHaveBeenCalled();
  });

  it('an unmounted guard is gone, and runs neither', () => {
    const onCancel = vi.fn();
    const onConfirm = vi.fn();
    const remove = mountGuard({ active: true, onCancel, onConfirm });
    expect(hasActiveNavigationGuard()).toBe(true);

    remove();

    expect(hasActiveNavigationGuard()).toBe(false);
    keepGuardedEdits();
    discardGuardedEdits();
    expect(onCancel).not.toHaveBeenCalled();
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it('two active guards each run', () => {
    const first = { isActive: () => true, keep: vi.fn(), discard: vi.fn() };
    const second = { isActive: () => true, keep: vi.fn(), discard: vi.fn() };
    teardown.push(registerNavigationGuard(first), registerNavigationGuard(second));

    keepGuardedEdits();
    discardGuardedEdits();

    for (const guard of [first, second]) {
      expect(guard.keep).toHaveBeenCalledTimes(1);
      expect(guard.discard).toHaveBeenCalledTimes(1);
    }
  });

  it('with no guard both do nothing', () => {
    expect(hasActiveNavigationGuard()).toBe(false);
    keepGuardedEdits();
    discardGuardedEdits();
    expect(confirm).not.toHaveBeenCalled();
  });
});

describe('navigationGuards — a navigation the user has already agreed to', () => {
  it('while it runs a navigation asks nothing, cancels nothing and runs neither callback, and `beforeunload` is not prevented', async () => {
    confirm.mockReturnValue(false);
    const onCancel = vi.fn();
    const onConfirm = vi.fn();
    mountGuard({ active: true, onCancel, onConfirm });
    const seen: Array<unknown> = [];

    await leaveUnasked(async () => {
      seen.push(isLeavingUnasked(), navigate().cancelled, unloadPrevented());
    });

    expect(seen).toEqual([true, false, false]);
    expect(confirm).not.toHaveBeenCalled();
    expect(onCancel).not.toHaveBeenCalled();
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it('after it resolves the guard asks again', async () => {
    confirm.mockReturnValue(false);
    mountGuard({ active: true });

    await leaveUnasked(async () => undefined);

    expect(isLeavingUnasked()).toBe(false);
    expect(navigate().cancelled).toBe(true);
    expect(unloadPrevented()).toBe(true);
    expect(confirm).toHaveBeenCalledTimes(1);
  });

  it('after it rejects the rejection reaches the caller and the guard asks again', async () => {
    confirm.mockReturnValue(false);
    mountGuard({ active: true });

    await expect(leaveUnasked(() => Promise.reject(new Error('the navigation failed')))).rejects.toThrow(
      'the navigation failed'
    );

    expect(isLeavingUnasked()).toBe(false);
    expect(navigate().cancelled).toBe(true);
    expect(unloadPrevented()).toBe(true);
    expect(confirm).toHaveBeenCalledTimes(1);
  });
});

describe('PreventNavigation — while navigations are held', () => {
  it('an active guard asks nothing, cancels nothing, runs neither callback and prevents no unload', async () => {
    confirm.mockReturnValue(false);
    const onCancel = vi.fn();
    const onConfirm = vi.fn();
    mountGuard({ active: true, onCancel, onConfirm });
    let release!: () => void;
    const held = holdNavigationWhile(() => new Promise<void>((resolve) => (release = resolve)));

    const { cancelled } = navigate();
    const prevented = unloadPrevented();
    release();
    await held;

    expect(cancelled).toBe(false);
    expect(prevented).toBe(false);
    expect(confirm).not.toHaveBeenCalled();
    expect(onCancel).not.toHaveBeenCalled();
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it('once the run has settled the guard asks again', async () => {
    confirm.mockReturnValue(false);
    mountGuard({ active: true });

    await holdNavigationWhile(async () => undefined);

    expect(navigate().cancelled).toBe(true);
    expect(unloadPrevented()).toBe(true);
    expect(confirm).toHaveBeenCalledTimes(1);
  });
});
