import { derived, get, writable } from 'svelte/store';
import type { Readable, Stores, StoresValues } from 'svelte/store';

/**
 * A wrapped implementation of `derived` which caches the derived output so the derived update is run only when the inputs are updated. The regular `derived` store’s update function will be rerun every time it's resubscribed even when the inputs remain the same.
 * TODO[Svelte 5]: Check if this is necessary any more
 * @param stores - The stores used for input
 * @param update - The update function
 * @param options.initialValue - The initial value of the store
 * @param options.differenceChecker - If this callback is defined, an update will only be triggered if the new value and stored value are different (`!==`) after passed through this callback
 */
export function parsimoniusDerived<TInput extends Stores, TOutput>(
  input: TInput,
  update: (args: StoresValues<TInput>) => TOutput,
  {
    differenceChecker,
    initialValue
  }: {
    differenceChecker?: (value: TOutput) => unknown;
    initialValue?: TOutput;
  } = {}
): Readable<TOutput> {
  // The internal store we use for the output
  const output = writable<TOutput>(initialValue);
  const deriver = derived(input, update, initialValue);
  deriver.subscribe((v) => {
    if (differenceChecker && differenceChecker(get(output)) === differenceChecker(v)) return;
    output.set(v);
  });
  return { subscribe: output.subscribe };
}
