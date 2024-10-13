import {error} from '@sveltejs/kit';
import {writable, derived, get, type Readable} from 'svelte/store';

/**
 * Create a simple stacked store which a appends items to an internally stored stack when set. The store can be reverted to any previous state with the `revert(index)` function.
 * NB. The difference to a regular `stackedStore` is that both the merged value of the store and the additions have the same type.
 * @param initialValue - The first item of the stack.
 * @returns A `StackedStore` in which the `TMerged` and `TAddition` type parameters are the same.
 */
export function simpleStackedStore<TItem>(initialValue: TItem): StackedStore<TItem> {
  return stackedStore(initialValue, (current, value) => [...current, value]);
}

/**
 * Create a stacked store which a appends items to an internally stored stack when set. The store can be reverted to any previous state with the `revert(index)` function.
 * Depending on the `updater` function, the additions to the stack can be either of the same or different type as the output, e.g. or partials thereof. For details, see {@link StackedStore}.
 * @param initialValue - The first item of the stack, which defines the output type, i.e. the `TMerged` type param of the returned `StackedStore`.
 * @param updater - The function which is used to update the stack with new items. The `value` argument defines the `TAddition` type param of the returned `StackedStore`.
 * @returns A `StackedStore` object with the `getLength`, `revert`, `set`, and `subscribe` methods.
 */
export function stackedStore<TMerged, TAddition = TMerged>(
  initialValue: TMerged,
  updater: (current: Array<TMerged>, value: TAddition) => Array<TMerged>
): StackedStore<TMerged, TAddition> {
  // This internal store holds all the (merged) items in the stack. It cannot be directly accessed. The methods defined below are used instead.
  const stack = writable<Array<TMerged>>([initialValue]);

  // A getter for the current length of the stack
  const getLength = (): number => get(stack).length;

  // Push an item onto the internal stack store performing the merge by calling the `updater` callback with the current stack and the new value.
  const push = (value: TAddition): void => stack.update((s: Array<TMerged>) => updater(s, value));

  // A method that can be used to revert the stack to a previous state.
  const revert = (index: number): TMerged => {
    if (index < 0) error(500, 'StackedStore.revert: index cannot be negative');
    const current = get(stack);
    // Only modify the stack if the `index` refers to an item in the stack that's not the last one
    if (index < current.length - 1) {
      current.splice(index + 1);
      stack.set(current);
    }
    // Return the last item in the stack, regardless of whether it was modified
    return current[current.length - 1];
  };

  // We use `derived` to create another store, which always has the last item in the stack. We're only interested in its `subscribe` method, which will be used as the `subscribe` method for the whole `StackedStore`.
  const lastItem = derived(stack, ($stack: Array<TMerged>) => $stack[$stack.length - 1]);

  return {getLength, revert, push, subscribe: lastItem.subscribe};
}

/**
 * An extended `Readable` store which a appends items to an internally stored stack when set. The store can be reverted to any previous state with the `revert(index)` function. Subscribing to the stack returns the last item in the stack.
 * Depending on the `updater` function passed to the `stackedStore` constructor, the additions (`TAddition`) to the stack can be either of the same or different type as the output (`TMerged`), e.g. or partials thereof.
 * @typeParam TMerged - The type of the merged items in the stack, i.e., the type that is returned when subscribing to the stack.
 * @typeParam TAddition - The type of the items that can be added to the stack, which may differ from `TMerged`, e.g. by `Partial<TMerged>`. Defaults to `TMerged`.
 */
export type StackedStore<TMerged, TAddition = TMerged> = Readable<TMerged> & {
  /**
   * @returns The current length of the stack.
   */
  getLength: () => number;
  /**
   * Add another item to the stack.
   */
  push: (value: TAddition) => void;
  /**
   * Revert the stack to the item at the given index.
   * @param index - The index of the item to revert to. If the index is out of bounds, the stack remains unchanged, but the last item is still returned.
   * @returns The last item in the stack after reverting.
   */
  revert: (index: number) => TMerged;
};
