import { derived, writable } from 'svelte/store';
import type { ModalComponent } from './modalComponent.type';
import type { ModalStore } from './modalStore.type';

/**
 * Create a store that manages a stack of popup components and resolves to the top component in the stack.
 */
export function modalStore(): ModalStore {
  const stack = writable<Array<{ component: ModalComponent; props: Record<string, unknown> }>>([]);
  const topItem = derived(stack, (stack) => stack[stack.length - 1]);

  function push(component: ModalComponent, props = {}): void {
    stack.update((v) => [...v, { component, props }]);
  }

  function pop(): void {
    stack.update((v) => v.slice(0, -1));
  }

  return { push, pop, subscribe: topItem.subscribe };
}
