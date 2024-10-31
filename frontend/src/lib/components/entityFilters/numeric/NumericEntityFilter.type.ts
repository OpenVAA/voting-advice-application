import type {SvelteHTMLElements} from 'svelte/elements';
import type {NumericFilter} from 'vaa-filters';

export type NumericEntityFilterProps = SvelteHTMLElements['form'] & {
  /**
   * The text filter object.
   */
  filter: NumericFilter<MaybeRanked>;
  /**
   * The targets of the filter objects.
   */
  targets: MaybeRanked[];
};
