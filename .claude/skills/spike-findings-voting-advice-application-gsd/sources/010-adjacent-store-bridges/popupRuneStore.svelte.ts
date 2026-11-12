/**
 * SPIKE 010 — Rune-native popupQueue store.
 *
 * Replaces `apps/frontend/src/lib/contexts/app/popup/popupStore.svelte.ts`:
 *
 *   production:
 *     import { toStore } from 'svelte/store';
 *     const store = toStore(() => firstItem);
 *     return { push, shift, subscribe: store.subscribe };
 *
 *   spike (this file):
 *     // zero svelte/store imports
 *     return { push, shift, get current() { return firstItem; } };
 *
 * The PopupStore type alias `Readable<PopupQueueItem> & { push, shift }` becomes
 * `interface PopupRuneStore { readonly current; push; shift }` — losing the
 * Readable<T> compatibility (which is fine: no consumers passed PopupStore to
 * `fromStore`/`derived` outside the +layout.svelte direct consumption).
 *
 * Consumer migration (apps/frontend/src/routes/+layout.svelte:69, 230):
 *   - const popupQueueState = fromStore(popupQueue);        → DELETE
 *   - {#if popupQueueState.current}                          → {#if popupQueue.current}
 */

import type { PopupQueueItem } from '$lib/contexts/app/popup/popupComponent.type';

export interface PopupRuneStore {
  readonly current: PopupQueueItem | undefined;
  push: (item: PopupQueueItem) => void;
  shift: () => void;
}

export function popupRuneStore(): PopupRuneStore {
  let queue = $state<Array<PopupQueueItem>>([]);
  const firstItem = $derived(queue[0]);

  function push(item: PopupQueueItem): void {
    queue = [...queue, item];
  }

  function shift(): void {
    queue = queue.slice(1);
  }

  return {
    push,
    shift,
    get current() {
      return firstItem;
    }
  };
}
