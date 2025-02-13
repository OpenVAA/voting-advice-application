import { getContext, setContext } from 'svelte';
import { type StorageType, storageWritable } from './legacy-storage';
import type { Writable } from 'svelte/store';

/**
 * Create a context object whose values are persisted in `localStorage` or `sessionStorage`. Note that the `Context` is actually set only when the returned `get` or `set` functions are called for the first time, because `Context`s can only be created during component initialization.
 * @param name The name of the context.
 * @param content The initial content of the context.
 * @param storageType The type of storage to use. Defaults to `sessionStorage`.
 * @returns An object with `get` and `set` functions for the context. The `set` function accepts a partial content object and only updates the values defined. Usually, only the `get` function is necessary, because the properties are stores that can be directly updated.
 */

export function createStorageContext<TContext extends StorageContextContent>(
  name: string,
  content: TContext,
  storageType: StorageType = 'sessionStorage'
) {
  type S = StorageContext<TContext>;
  const context = Object.fromEntries(
    Object.entries(content).map(([key, value]) => {
      return [key, storageWritable(storageType, `${name}.${key}`, value)];
    })
  ) as S;
  function init() {
    return setContext<S>(name, context);
  }
  function get() {
    const ctx = getContext<S>(name);
    if (!ctx) {
      init();
      return context;
    }
    return ctx;
  }
  function set(content: Partial<TContext>) {
    const ctx = get();
    for (const [key, value] of Object.entries(content)) {
      ctx[key].set(value);
    }
  }
  return { get, set };
}

/**
 * NB. The values of the `Record` should be such that can be serialized to JSON. We cannot, however, define typing for that in a satisfactory way due to TS limitations. See the `storageWritable` function for more information.
 */
export type StorageContextContent = Record<string, unknown>;

export type StorageContext<TContext extends StorageContextContent> = {
  [K in keyof TContext]: Writable<TContext[K]>;
};
