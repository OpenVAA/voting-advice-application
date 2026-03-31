import { toStore } from 'svelte/store';
import type { Readable } from 'svelte/store';

/**
 * A `$state`-based stack class that replaces the old closure-based `stackedStore`.
 * Exposes a backward-compatible `Readable<TMerged>` interface via `toStore()` so
 * existing `$store` consumers continue working during the migration.
 *
 * Differences from old `stackedStore`:
 * 1. Class instead of closure-based factory function
 * 2. `$state` array instead of `writable` store for internal stack
 * 3. `$derived` for `current` instead of `derived(stack, ...)`
 * 4. `toStore()` cached in `#store` field (lazy, created on first `subscribe` access)
 * 5. `push()` always creates new array via spread (never mutates in place)
 * 6. `revert()` uses `slice()` (immutable) instead of `splice()` (mutable)
 * 7. `revert()` throws plain `Error` instead of `error(500, ...)` from SvelteKit
 *
 * @typeParam TMerged - The type of the merged items in the stack.
 * @typeParam TAddition - The type of items added to the stack. Defaults to `TMerged`.
 */
export class StackedState<TMerged, TAddition = TMerged> implements Readable<TMerged> {
  #stack: TMerged[] = $state([]);
  #updater: (current: TMerged[], value: TAddition) => TMerged[];
  #store: Readable<TMerged> | undefined;

  /**
   * The last (top) item in the stack. Reactively derived from `$state`.
   */
  readonly current: TMerged = $derived(this.#stack[this.#stack.length - 1]);

  constructor(initialValue: TMerged, updater: (current: TMerged[], value: TAddition) => TMerged[]) {
    this.#stack = [initialValue];
    this.#updater = updater;
  }

  /**
   * Add an item to the stack. The `updater` function determines how the addition
   * is merged into the stack.
   */
  push(value: TAddition): void {
    this.#stack = this.#updater([...this.#stack], value);
  }

  /**
   * Revert the stack to the item at the given index. Items after the index are removed.
   * @param index - The index to revert to. Must be non-negative.
   * @returns The last item in the stack after reverting.
   * @throws {Error} If index is negative.
   */
  revert(index: number): TMerged {
    if (index < 0) throw new Error('StackedState.revert: index cannot be negative');
    if (index < this.#stack.length - 1) {
      this.#stack = this.#stack.slice(0, index + 1);
    }
    return this.#stack[this.#stack.length - 1];
  }

  /**
   * @returns The current number of items in the stack.
   */
  getLength(): number {
    return this.#stack.length;
  }

  /**
   * Provides a `Readable<TMerged>` subscribe function for backward compatibility.
   * The store is lazily created via `toStore()` and cached.
   */
  get subscribe(): Readable<TMerged>['subscribe'] {
    // Cache the store to avoid creating a new one on every access
    if (!this.#store) {
      this.#store = toStore(() => this.current);
    }
    return this.#store.subscribe;
  }
}

/**
 * Create a simple `StackedState` which appends items directly to the stack.
 * This is the equivalent of the old `simpleStackedStore`.
 * @param initialValue - The first item of the stack.
 */
export function simpleStackedState<TItem>(initialValue: TItem): StackedState<TItem> {
  return new StackedState(initialValue, (current, value) => [...current, value]);
}
