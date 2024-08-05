import type { SvelteHTMLElements } from 'svelte/elements';
import type { FilterGroup } from '$lib/voter/vaa-filters';

export type EntityListControlsProps<TData extends MaybeRanked = MaybeRanked> =
  SvelteHTMLElements['div'] & {
    /**
     * A list of possibly ranked entities, e.g. candidates or a parties.
     */
    contents: Array<TData>;
    /**
     * The filters applied to the contents
     */
    filterGroup?: FilterGroup<TData>;
    /**
     * The property used for the search tool. @default 'name'
     */
    searchProperty?: string;
    /**
     * Bind to this to access filtered and sorted contents.
     */
    readonly output: Array<TData>;
  };
