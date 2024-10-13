import {getContext, setContext} from 'svelte';
import {writable, type Writable} from 'svelte/store';
import {deepMerge} from '$lib/utils/merge';

type DeepPartial<T> = {
  [K in keyof T]?: T[K] extends object ? DeepPartial<T[K]> : T[K];
};

interface PageStyles {
  drawer: {
    background: 'bg-base-100' | 'bg-base-300';
  };
}

export const DEFAULT_SETTINGS: PageStyles = {
  drawer: {
    background: 'bg-base-100'
  }
};

/**
 * Initialise top bar context.
 */
export function setPageStylesContext() {
  setContext('pageStyles', writable<PageStyles>({...DEFAULT_SETTINGS}));
}

/**
 * Initialise top bar context.
 */
export function resetPageStylesContext(override: DeepPartial<PageStyles> = {}) {
  const ctx = getPageStylesContext();
  ctx.set(deepMerge(structuredClone(DEFAULT_SETTINGS), structuredClone(override)));
}

/**
 * Get top bar context.
 */
export function getPageStylesContext() {
  return getContext<Writable<PageStyles>>('pageStyles');
}
