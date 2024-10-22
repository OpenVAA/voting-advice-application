import {error} from '@sveltejs/kit';
import {writable, derived, get, type Writable, type Readable} from 'svelte/store';

/**
 * Create a simple stacked store which a appends items to an internally stored stack when set. The store can be reverted to any previous state with the `revert(index)` function.
 * @param initialValue - The first item of the stack.
 */
export function simpleStackedStore<TItem>(initialValue: TItem): StackedStore<TItem> {
  return stackedStore(initialValue, (current, value) => [...current, value]);
}

/**
 * Create a stacked store which a appends items to an internally stored stack when set. The store can be reverted to any previous state with the `revert(index)` function.
 * @param initialValue - The first item of the stack.
 * @param updater - The function which is used to update the stack with new items.
 */
export function stackedStore<TMerged, TAddition = TMerged>(
  initialValue: TMerged,
  updater: (current: Array<TMerged>, value: TAddition) => Array<TMerged>
): StackedStore<TMerged, TAddition> {
  const stack = writable<Array<TMerged>>([initialValue]);
  const {subscribe} = derived(stack, ($stack) => $stack[$stack.length - 1]);

  const revert = (index: number): TMerged => {
    if (index < 0) error(500, 'StackedStore.revert: index cannot be negative');
    const current = get(stack);
    if (index < current.length - 1) {
      current.splice(index + 1);
      stack.set(current);
    }
    return current[current.length - 1];
  };
  const set = (value: TAddition): void => stack.update((s) => updater(s, value));
  const getLength = (): number => get(stack).length;

  return {getLength, revert, set, subscribe};
}

/**
 * @typeParam TMerged - The type of the merged items in the stack, i.e., the type that is returned when subscribing to the stack.
 * @typeParam TAddition - The type of the items that can be added to the stack, which may differ from `TMerged`, e.g. by `Partial<TMerged>`.
 */
export type StackedStore<TMerged, TAddition = TMerged> = {
  /**
   * @returns The current length of the stack.
   */
  getLength: () => number;
  /**
   * Revert the stack to the item at the given index.
   * @param index - The index of the item to revert to. If the index is out of bounds, the stack remains unchanged, but the last item is still returned.
   * @returns The last item in the stack after reverting.
   */
  revert: (index: number) => TMerged;
  /**
   * Add another item to the stack.
   */
  set: Writable<TAddition>['set'];
  /**
   * Subscribe to the last item in the stack.
   */
  subscribe: Readable<TMerged>['subscribe'];
};
