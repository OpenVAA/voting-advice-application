import type {SvelteHTMLElements} from 'svelte/elements';
import type {FilterGroup} from '$voter/vaa-filters';

export type EntityFiltersProps<T extends MaybeRanked = MaybeRanked> = SvelteHTMLElements['div'] & {
  /**
   * The filters applied to the contents
   */
  filterGroup: FilterGroup<T>;
  /**
   *  The target entitiess of the filter objects. Note that these will only be used to get value options, not for actual filtering.
   */
  targets: T[];
};
