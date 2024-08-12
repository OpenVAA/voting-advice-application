import type {SvelteHTMLElements} from 'svelte/elements';
import type {FilterGroup} from 'vaa-filters';

export type EntityFiltersProps<TEntity extends MaybeRanked = MaybeRanked> =
  SvelteHTMLElements['div'] & {
    /**
     * The filters applied to the contents
     */
    filterGroup: FilterGroup<TEntity>;
    /**
     *  The target entitiess of the filter objects. Note that these will only be used to get value options, not for actual filtering.
     */
    targets: Array<TEntity>;
  };
