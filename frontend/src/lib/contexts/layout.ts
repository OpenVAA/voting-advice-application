import {setContext, getContext, hasContext} from 'svelte';
import {deepMerge} from '$lib/utils/merge';
import {stackedStore, type StackedStore} from '$lib/utils/stackedStore';
import {error} from '@sveltejs/kit';

const LAYOUT_CONTEXT_KEY = Symbol();

export const DEFAULT_PAGE_STYLES: PageStyles = {
  drawer: {
    background: 'bg-base-100'
  }
} as const;

/**
 * Initialize and return the context. This must be called before `getLayoutContext()` and cannot be called twice.
 * @returns The context object
 */
export function initLayoutContext(): LayoutContext {
  if (hasContext(LAYOUT_CONTEXT_KEY)) error(500, 'InitLayoutContext() called for a second time');

  const pageStyles = stackedStore<PageStyles, DeepPartial<PageStyles>>(
    DEFAULT_PAGE_STYLES,
    (current, value) => [
      ...current,
      deepMerge(structuredClone(current[current.length - 1]), structuredClone(value))
    ]
  );
  // We can add more reversion actions here when needed
  const revert = (index: number) => pageStyles.revert(index);

  return setContext<LayoutContext>(LAYOUT_CONTEXT_KEY, {pageStyles, revert});
}

/**
 * Get the `LayoutContext` object.
 * @param onDestroy - The `onDestroy` callback for the component using the context. This is needed for automatic rolling back of any changes made to page styles or other context properties affecting layout.
 * @returns The `LayoutContext` object
 */
export function getLayoutContext(onDestroy: (fn: () => unknown) => void) {
  if (!hasContext(LAYOUT_CONTEXT_KEY))
    error(500, 'GetLayoutContext() called before initLayoutContext()');
  const ctx = getContext<LayoutContext>(LAYOUT_CONTEXT_KEY);
  const currentIndex = ctx.pageStyles.getLength() - 1;
  onDestroy(() => ctx.revert(currentIndex));
  return ctx;
}

export type LayoutContext = {
  /**
   * An store containing CSS classes used to customize different parts of the layout.
   */
  pageStyles: StackedStore<PageStyles, DeepPartial<PageStyles>>;
  /**
   * Called to revert any changes made to the `LayoutContext`. It will be automatically called when the component is destroyed.
   * @param index - The index in the stack that the changes should be rolled back to.
   */
  revert: (index: number) => void;
};

type DeepPartial<T> = {
  [K in keyof T]?: T[K] extends object ? DeepPartial<T[K]> : T[K];
};

interface PageStyles {
  drawer: {
    background: 'bg-base-100' | 'bg-base-300';
  };
}
