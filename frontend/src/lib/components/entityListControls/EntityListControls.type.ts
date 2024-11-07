import type { FilterGroup } from '@openvaa/filters';
import type { SvelteHTMLElements } from 'svelte/elements';

export type EntityListControlsProps<TEntity extends MaybeRanked = MaybeRanked> =
  SvelteHTMLElements['div'] & {
    /**
     * A list of possibly ranked entities, e.g. candidates or a parties.
     */
    contents: Array<TEntity>;
    /**
     * The filters applied to the contents
     */
    filterGroup?: FilterGroup<TEntity>;
    /**
     * The property used for the search tool. @default 'name'
     */
    searchProperty?: string;
    /**
     * Bind to this to access filtered and sorted contents.
     */
    readonly output: Array<TEntity>;
  };
