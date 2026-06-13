import type { PopupQueueItem } from './popupComponent.type';
import type { PopupStore as PopupStoreApi } from './popupState.type';

/**
 * Manages a queue of popup components and resolves to the first component in the
 * queue, as a Svelte 5 CLASS (Group F helper; v2.13 context-as-class migration,
 * CLASS-01).
 *
 * The reactive core is the private `#queue` `$state` array field, reassigned
 * wholesale on `push`/`shift` (CONVENTIONS §17 — a reassigned array field needs
 * no `{current}` handle; the `$derived` head tracks the reassignment). `current`
 * is a prototype getter over the `#current` `$derived` head-of-queue.
 *
 * `push`/`shift` are ARROW-FUNCTION FIELDS (§18): they are destructured / passed
 * as handlers (`+layout.svelte` calls `popupQueue.shift()`), so they capture
 * `this` on detach. No `$effect` is used — the class is SSR-safe and
 * constructable in any context (§20).
 */
class PopupStore implements PopupStoreApi {
  #queue = $state<Array<PopupQueueItem>>([]);
  #current = $derived(this.#queue[0]);

  push = (item: PopupQueueItem): void => {
    this.#queue = [...this.#queue, item];
  };

  shift = (): void => {
    this.#queue = this.#queue.slice(1);
  };

  get current(): PopupQueueItem | undefined {
    return this.#current;
  }
}

/**
 * Create a store that manages a queue of popup components and resolves to the first component in the queue.
 */
export function popupStore(): PopupStoreApi {
  return new PopupStore();
}
