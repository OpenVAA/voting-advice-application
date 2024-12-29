import { derived, writable } from 'svelte/store';
import type { PopupComponent } from './popupComponent.type';
import type { PopupStore } from './popupStore.type';

/**
 * Create a store that manages a queue of popup components and resolves to the first component in the queue.
 */
export function popupStore(): PopupStore {
  const queue = writable([] as Array<PopupComponent>);
  const firstItem = derived(queue, (queue) => queue[0]);

  function push(component: PopupComponent): void {
    queue.update((v) => [...v, component]);
  }

  function shift(): void {
    queue.update((v) => v.slice(1));
  }

  return { push, shift, subscribe: firstItem.subscribe };
}
