import type { NumberFilter } from '@openvaa/filters';
import type { SvelteHTMLElements } from 'svelte/elements';

export type NumericEntityFilterProps = SvelteHTMLElements['form'] & {
  /**
   * The text filter object.
   */
  filter: NumberFilter<MaybeWrappedEntityVariant>;
  /**
   * The targets of the filter objects.
   */
  targets: Array<MaybeWrappedEntityVariant>;
};
