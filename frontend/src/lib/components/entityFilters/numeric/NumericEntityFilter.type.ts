import type { SvelteHTMLElements } from 'svelte/elements';
import type { NumericFilter } from '$voter/vaa-filters';

export type NumericEntityFilterProps = SvelteHTMLElements['form'] & {
  /**
   * The text filter object.
   */
  filter: NumericFilter<MaybeRanked>;
  /**
   * The targets of the filter objects.
   */
  targets: Array<MaybeRanked>;
};
