import type {SvelteHTMLElements} from 'svelte/elements';
import type {FilterGroup} from '$lib/voter/vaa-filters';

export type EntityListControlsProps<T extends MaybeRanked = MaybeRanked> =
  SvelteHTMLElements['div'] & {
    /**
     * A list of possibly ranked entities, e.g. candidates or a parties.
     */
    contents: T[];
    /**
     * The filters applied to the contents
     */
    filterGroup?: FilterGroup<T>;
    /**
     * The property used for the search tool. @default 'name'
     */
    searchProperty?: string;
    /**
     * Bind to this to access filtered and sorted contents.
     */
    readonly output: T[];
  };
