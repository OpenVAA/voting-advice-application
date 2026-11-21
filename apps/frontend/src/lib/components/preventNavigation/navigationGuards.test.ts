/**
 * Navigations held while a run is pending, with `goto` mocked and `history.go` stubbed: which are cancelled, and which is followed once the run has settled, and how.
 *
 * The order a full load leaves in, with `location` stubbed and `PreventNavigation` mounted for real. One engine fires `beforeunload` while `location.assign` runs and another after it has returned, so the guards must stay stood down past that return.
 *
 * `leaveTo`, with `page` faked: a navigation that moved the page ends it, and one that did not move it, or that rejected, is followed by the caller's `onStuck` and a full load.
 *
 * The full-load case comes last, because a full load keeps the guards stood down for the life of the module, as it does for the life of the document.
 */

import { log } from '@openvaa/app-shared';
import { flushSync, mount, unmount } from 'svelte';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  holdNavigation,
  holdNavigationWhile,
  isLeavingUnasked,
  isNavigationHeld,
  leaveByFullLoad,
  leaveTo,
  leaveUnasked
} from './navigationGuards';
import PreventNavigation from './PreventNavigation.svelte';

/** A navigation as far as the guard reads one. */
type FakeNavigation = { cancel: () => void };

/** A navigation as far as {@link holdNavigation} reads one. */
type HeldNavigation = Parameters<typeof holdNavigation>[0];

const { goto, navigationCallbacks } = vi.hoisted(() => ({
  goto: vi.fn(async (_address: string) => undefined),
  navigationCallbacks: [] as Array<(navigation: FakeNavigation) => void>
}));

vi.mock('$app/navigation', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  beforeNavigate: (callback: (navigation: FakeNavigation) => void) => {
    navigationCallbacks.push(callback);
  },
  goto
}));

const { pageBox } = vi.hoisted(() => ({ pageBox: { url: new URL('http://localhost/home') } }));
vi.mock('$app/state', () => ({ page: pageBox }));

// The guard removes its `beforeunload` listener only in the browser, and the tests' stub of this module reads as the server.
vi.mock('$app/environment', () => ({ browser: true }));

vi.mock('$lib/contexts/component', () => ({
  getComponentContext: () => ({ t: (key: string) => key })
}));

const ADDRESS = '/login';

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  goto.mockClear();
});

/**
 * A navigation to an address of the application, and whether it was cancelled.
 *
 * @param address - Where it leads.
 * @param type - Its type. @default 'link'
 */
function navigationTo(address: string, type: HeldNavigation['type'] = 'link') {
  const result = { cancelled: false };
  const navigation = {
    type,
    to: { url: new URL(address, 'http://localhost') },
    cancel: () => {
      result.cancelled = true;
    }
  } as HeldNavigation;
  return { navigation, result };
}

/**
 * A Back or Forward in the history, which the framework reports as a navigation of type `popstate` with the number of entries it moves, and whether it was cancelled.
 *
 * @param address - Where it leads.
 * @param delta - The entries it moves: negative for Back.
 */
function traversalTo(address: string, delta: number) {
  const { navigation, result } = navigationTo(address, 'popstate');
  return { navigation: { ...navigation, delta } as HeldNavigation, result };
}

/** Stub `history.go`, so that a case can read the traversals the module makes. */
function stubHistoryGo() {
  return vi.spyOn(history, 'go').mockImplementation(() => undefined);
}

/** A run that stays pending until the case settles it. */
function pendingRun() {
  let resolve!: () => void;
  let reject!: (reason: Error) => void;
  const promise = new Promise<void>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { run: () => promise, resolve, reject };
}

/** Let the promises the module chains on a settled run go on. */
async function settle(): Promise<void> {
  for (let i = 0; i < 10; i += 1) await Promise.resolve();
}

describe('navigationGuards — navigations held while a run is pending', () => {
  it('`isNavigationHeld` is true while the run is pending, and false once it resolves or rejects', async () => {
    expect(isNavigationHeld()).toBe(false);

    const resolving = pendingRun();
    const resolved = holdNavigationWhile(resolving.run);
    expect(isNavigationHeld()).toBe(true);
    resolving.resolve();
    await resolved;
    expect(isNavigationHeld()).toBe(false);

    const rejecting = pendingRun();
    const rejected = holdNavigationWhile(rejecting.run);
    expect(isNavigationHeld()).toBe(true);
    rejecting.reject(new Error('the run failed'));
    await expect(rejected).rejects.toThrow('the run failed');
    expect(isNavigationHeld()).toBe(false);
  });

  it('a link navigation while held is cancelled, and after the run rejects its destination is followed with `goto`, once', async () => {
    const { run, reject } = pendingRun();
    const held = holdNavigationWhile(run);
    const { navigation, result } = navigationTo('/questions');

    holdNavigation(navigation);
    expect(result.cancelled).toBe(true);
    expect(goto).not.toHaveBeenCalled();

    reject(new Error('the run failed'));
    await expect(held).rejects.toThrow('the run failed');
    await settle();

    expect(goto).toHaveBeenCalledTimes(1);
    expect(goto).toHaveBeenCalledWith('http://localhost/questions');
  });

  it('of two navigations held, the last one is followed after the run rejects', async () => {
    const { run, reject } = pendingRun();
    const held = holdNavigationWhile(run);

    holdNavigation(navigationTo('/questions').navigation);
    holdNavigation(navigationTo('/settings').navigation);
    reject(new Error('the run failed'));
    await expect(held).rejects.toThrow('the run failed');
    await settle();

    expect(goto).toHaveBeenCalledTimes(1);
    expect(goto).toHaveBeenCalledWith('http://localhost/settings');
  });

  it('a Back held while the run is pending is cancelled, and after the run rejects it is followed as a Back with `history.go(-1)`, not with `goto`', async () => {
    const go = stubHistoryGo();
    const { run, reject } = pendingRun();
    const held = holdNavigationWhile(run);
    const { navigation, result } = traversalTo('/questions', -1);

    holdNavigation(navigation);
    expect(result.cancelled).toBe(true);
    expect(go).not.toHaveBeenCalled();

    reject(new Error('the run failed'));
    await expect(held).rejects.toThrow('the run failed');
    await settle();

    expect(go.mock.calls).toEqual([[-1]]);
    expect(goto).not.toHaveBeenCalled();
  });

  it('a Forward held while the run is pending is followed as a Forward with `history.go(1)` after the run rejects', async () => {
    const go = stubHistoryGo();
    const { run, reject } = pendingRun();
    const held = holdNavigationWhile(run);

    holdNavigation(traversalTo('/settings', 1).navigation);
    reject(new Error('the run failed'));
    await expect(held).rejects.toThrow('the run failed');
    await settle();

    expect(go.mock.calls).toEqual([[1]]);
    expect(goto).not.toHaveBeenCalled();
  });

  it('of a Back and a link held, the last one is followed after the run rejects, as what it is', async () => {
    const go = stubHistoryGo();

    const linkLast = pendingRun();
    const heldLinkLast = holdNavigationWhile(linkLast.run);
    holdNavigation(traversalTo('/questions', -1).navigation);
    holdNavigation(navigationTo('/settings').navigation);
    linkLast.reject(new Error('the run failed'));
    await expect(heldLinkLast).rejects.toThrow('the run failed');
    await settle();

    expect(go).not.toHaveBeenCalled();
    expect(goto.mock.calls).toEqual([['http://localhost/settings']]);
    goto.mockClear();

    const backLast = pendingRun();
    const heldBackLast = holdNavigationWhile(backLast.run);
    holdNavigation(navigationTo('/settings').navigation);
    holdNavigation(traversalTo('/questions', -1).navigation);
    backLast.reject(new Error('the run failed'));
    await expect(heldBackLast).rejects.toThrow('the run failed');
    await settle();

    expect(go.mock.calls).toEqual([[-1]]);
    expect(goto).not.toHaveBeenCalled();
  });

  it('after the run resolves, a Back held during it is not followed', async () => {
    const go = stubHistoryGo();
    const { run, resolve } = pendingRun();
    const held = holdNavigationWhile(run);
    const { navigation, result } = traversalTo('/questions', -1);

    holdNavigation(navigation);
    resolve();
    await held;
    await settle();

    expect(result.cancelled).toBe(true);
    expect(go).not.toHaveBeenCalled();
    expect(goto).not.toHaveBeenCalled();
  });

  it('after the run resolves, a navigation held during it is not followed', async () => {
    const { run, resolve } = pendingRun();
    const held = holdNavigationWhile(run);
    const { navigation, result } = navigationTo('/questions');

    holdNavigation(navigation);
    resolve();
    await held;
    await settle();

    expect(result.cancelled).toBe(true);
    expect(goto).not.toHaveBeenCalled();
  });

  it('a navigation inside `leaveUnasked` and one of type `leave` are not cancelled while held, and neither is followed', async () => {
    const { run, reject } = pendingRun();
    const held = holdNavigationWhile(run);
    const unasked = navigationTo('/login');
    const leaving = navigationTo('https://example.org/', 'leave');

    await leaveUnasked(async () => {
      holdNavigation(unasked.navigation);
    });
    holdNavigation(leaving.navigation);
    reject(new Error('the run failed'));
    await expect(held).rejects.toThrow('the run failed');
    await settle();

    expect(unasked.result.cancelled).toBe(false);
    expect(leaving.result.cancelled).toBe(false);
    expect(goto).not.toHaveBeenCalled();
  });

  it('with no run pending, a navigation is not cancelled', () => {
    const { navigation, result } = navigationTo('/questions');

    holdNavigation(navigation);

    expect(result.cancelled).toBe(false);
  });
});

describe('navigationGuards — leaveTo', () => {
  const BEFORE = 'http://localhost/home';

  afterEach(() => {
    pageBox.url = new URL(BEFORE);
    goto.mockReset();
    goto.mockImplementation(async () => undefined);
  });

  /** Let settled promises' reactions run. */
  async function settle(): Promise<void> {
    for (let i = 0; i < 10; i += 1) await Promise.resolve();
  }

  it('resolves once the navigation has moved the page, with no full load and no onStuck', async () => {
    const assign = vi.fn();
    vi.stubGlobal('location', { assign });
    goto.mockImplementationOnce(async (address: string) => {
      pageBox.url = new URL(address, BEFORE);
    });
    const onStuck = vi.fn();

    await leaveTo(ADDRESS, BEFORE, onStuck);

    expect(goto).toHaveBeenCalledWith(ADDRESS, { invalidateAll: true });
    expect(onStuck).not.toHaveBeenCalled();
    expect(assign).not.toHaveBeenCalled();
  });

  it('calls onStuck and then makes a full load when the navigation did not move the page', async () => {
    const order: Array<string> = [];
    vi.stubGlobal('location', { assign: (address: string) => order.push(`assign ${address}`) });

    void leaveTo(ADDRESS, BEFORE, () => order.push('onStuck'));
    await settle();

    expect(order).toEqual(['onStuck', `assign ${ADDRESS}`]);
  });

  it('logs a rejection and makes a full load, also when the address changed before it', async () => {
    const assign = vi.fn();
    vi.stubGlobal('location', { assign });
    const logError = vi.spyOn(log, 'error').mockImplementation(() => undefined);
    goto.mockImplementationOnce(async (address: string) => {
      pageBox.url = new URL(address, BEFORE);
      throw new Error('the navigation failed');
    });

    void leaveTo(ADDRESS, BEFORE);
    await settle();

    expect(logError).toHaveBeenCalledTimes(1);
    expect(assign).toHaveBeenCalledWith(ADDRESS);
  });
});

describe('navigationGuards — leaving by a full load', () => {
  it('keeps the guards stood down past the return of `location.assign`, with the promise pending, so a late `beforeunload` is not prevented and a late navigation callback asks nothing', async () => {
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false);
    const target = document.createElement('div');
    document.body.appendChild(target);
    const guard = mount(PreventNavigation, { target, props: { active: true } });
    flushSync();

    const flagAtAssign: Array<boolean> = [];
    const assign = vi.fn((_address: string) => {
      flagAtAssign.push(isLeavingUnasked());
    });
    vi.stubGlobal('location', { assign });

    let settled = false;
    leaveUnasked(() => leaveByFullLoad(ADDRESS)).finally(() => {
      settled = true;
    });
    for (let i = 0; i < 10; i += 1) await Promise.resolve();

    expect(assign).toHaveBeenCalledTimes(1);
    expect(assign).toHaveBeenCalledWith(ADDRESS);
    expect(flagAtAssign).toEqual([true]);
    expect(isLeavingUnasked()).toBe(true);
    expect(settled).toBe(false);

    const unload = new Event('beforeunload', { cancelable: true });
    window.dispatchEvent(unload);
    expect(unload.defaultPrevented).toBe(false);

    const cancel = vi.fn();
    for (const callback of navigationCallbacks) callback({ cancel });
    expect(navigationCallbacks).not.toHaveLength(0);
    expect(cancel).not.toHaveBeenCalled();
    expect(confirm).not.toHaveBeenCalled();

    unmount(guard);
    target.remove();
  });
});
