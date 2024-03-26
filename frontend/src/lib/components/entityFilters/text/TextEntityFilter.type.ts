import type {SvelteHTMLElements} from 'svelte/elements';
import type {TextFilter} from '$voter/vaa-filters';

export type TextEntityFilterProps = SvelteHTMLElements['form'] & {
  /**
   * The text filter object.
   */
  filter: TextFilter<EntityProps | RankingProps>;
};
