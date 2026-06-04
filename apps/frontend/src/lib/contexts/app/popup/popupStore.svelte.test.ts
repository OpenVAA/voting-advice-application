import { flushSync } from 'svelte';
import { afterEach, describe, expect, it } from 'vitest';
import { popupStore } from './popupStore.svelte';
import type { PopupStore } from './popupStore.type';
import type { PopupQueueItem } from './popupComponent.type';

// A minimal `PopupQueueItem` stub — the queue is component-agnostic; the head
// item is identified by reference only, so a typed-but-empty object suffices.
function makeItem(): PopupQueueItem {
  return { component: (() => undefined) as unknown as PopupQueueItem['component'] };
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
    const item = makeItem();
    store.push(item);
    flushSync();
    expect(store.current).toBe(item);
  });

  it('push(a); push(b) keeps .current === a (FIFO head); after shift(), .current === b', () => {
    const store = setup();
    const a = makeItem();
    const b = makeItem();
    store.push(a);
    store.push(b);
    flushSync();
    expect(store.current).toBe(a);
    store.shift();
    flushSync();
    expect(store.current).toBe(b);
  });

  it('shift() on an empty queue is safe and leaves .current === undefined', () => {
    const store = setup();
    expect(() => store.shift()).not.toThrow();
    flushSync();
    expect(store.current).toBeUndefined();
  });
});
