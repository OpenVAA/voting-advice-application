import { toStore } from 'svelte/store';
import type { PopupQueueItem } from './popupComponent.type';
import type { PopupStore } from './popupStore.type';

/**
 * Create a store that manages a queue of popup components and resolves to the first component in the queue.
 */
export function popupStore(): PopupStore {
  let queue = $state<PopupQueueItem[]>([]);
  const firstItem = $derived(queue[0]);

  function push(item: PopupQueueItem): void {
    queue = [...queue, item];
  }

  function shift(): void {
    queue = queue.slice(1);
  }

  // Expose subscribe via toStore for backward compat with PopupStore type
  const store = toStore(() => firstItem as PopupQueueItem | undefined);

  return { push, shift, subscribe: store.subscribe };
}
