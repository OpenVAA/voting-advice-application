import { derived, writable } from 'svelte/store';
import type { PopupQueueItem } from './popupComponent.type';
import type { PopupStore } from './popupStore.type';

/**
 * Create a store that manages a queue of popup components and resolves to the first component in the queue.
 */
export function popupStore(): PopupStore {
  const queue = writable([] as Array<PopupQueueItem>);
  const firstItem = derived(queue, (queue) => queue[0]);

  function push(item: PopupQueueItem): void {
    queue.update((v) => [...v, item]);
  }

  function shift(): void {
    queue.update((v) => v.slice(1));
  }

  return { push, shift, subscribe: firstItem.subscribe };
}
