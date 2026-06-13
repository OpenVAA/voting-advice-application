import { flushSync } from 'svelte';
import { afterEach, describe, expect, it } from 'vitest';
import { popupStore } from './popupState.svelte';
import type { PopupQueueItem } from './popupComponent.type';
import type { PopupStore } from './popupState.type';

// A minimal `PopupQueueItem` stub carrying a unique `props.marker` so queue
// items can be distinguished by content. Identity comparison via `toBe` is not
// usable: `.current` reads through the `$state` array proxy, which wraps each
// item in a reactive proxy distinct from the original object reference.
function makeItem(marker: string): PopupQueueItem {
  return {
    component: (() => undefined) as unknown as PopupQueueItem['component'],
    props: { marker }
  };
}

describe('popupStore', () => {
  let cleanup: (() => void) | undefined;

  afterEach(() => {
    cleanup?.();
    cleanup = undefined;
  });

  /**
   * Create the store inside an `$effect.root` so its `$state`/`$derived` settle,
   * returning the store handle.
   */
  function setup(): PopupStore {
    let store!: PopupStore;
    cleanup = $effect.root(() => {
      store = popupStore();
    });
    flushSync();
    return store;
  }

  it('a fresh popupStore has .current === undefined', () => {
    const store = setup();
    expect(store.current).toBeUndefined();
  });

  it('push(item) makes .current the first enqueued item', () => {
    const store = setup();
    const item = makeItem('only');
    store.push(item);
    flushSync();
    expect(store.current?.props?.marker).toBe('only');
  });

  it('push(a); push(b) keeps .current === a (FIFO head); after shift(), .current === b', () => {
    const store = setup();
    store.push(makeItem('a'));
    store.push(makeItem('b'));
    flushSync();
    expect(store.current?.props?.marker).toBe('a');
    store.shift();
    flushSync();
    expect(store.current?.props?.marker).toBe('b');
  });

  it('shift() on an empty queue is safe and leaves .current === undefined', () => {
    const store = setup();
    expect(() => store.shift()).not.toThrow();
    flushSync();
    expect(store.current).toBeUndefined();
  });
});
