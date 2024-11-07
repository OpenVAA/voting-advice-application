import type { NumericFilter } from '@openvaa/filters';
import type { SvelteHTMLElements } from 'svelte/elements';

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
