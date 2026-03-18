import { derived, get, writable } from 'svelte/store';
import { browser } from '$app/environment';
import type { Readable } from 'svelte/store';

// Svelte 5 does not export these types from 'svelte/store', so we define them locally.
// Definitions match Svelte's internal types exactly.
type Stores = Readable<any> | [Readable<any>, ...Array<Readable<any>>] | Array<Readable<any>>;
type StoresValues<T> = T extends Readable<infer U>
  ? U
  : { [K in keyof T]: T[K] extends Readable<infer U> ? U : never };

/**
 * A wrapped implementation of `derived` which caches the derived output so the derived update is run only when the inputs are updated. The regular `derived` store's update function will be rerun every time it's resubscribed even when the inputs remain the same.
 *
 * On the server, subscribing to a `derived` store that chains to the SvelteKit `page` store
 * throws outside of a Svelte component render context. This function detects the SSR
 * environment and skips the eager subscription, falling back to the `initialValue`.
 * In the browser, the subscription is established eagerly and never torn down, matching
 * the original behavior that keeps the derived chain always active.
 *
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

  // In the browser, eagerly subscribe to the deriver and never tear down.
  // This keeps the derived chain permanently active so that updates propagate
  // even when no component is currently subscribed to this store.
  //
  // On the server, skip the subscription entirely. The output store retains
  // its initialValue, which is safe because SSR renders a loading/placeholder
  // state that gets hydrated client-side.
  if (browser) {
    const deriver = derived(input, update, initialValue);
    deriver.subscribe((v) => {
      if (differenceChecker && differenceChecker(get(output)) === differenceChecker(v)) return;
      output.set(v);
    });
  }

  return { subscribe: output.subscribe };
}
