import type { SvelteHTMLElements } from 'svelte/elements';
import type { ChoiceQuestionFilter, ObjectFilter } from '$voter/vaa-filters';

export type EnumeratedEntityFilterProps = SvelteHTMLElements['form'] & {
  /**
   * The object filter object.
   */
  filter: ObjectFilter<MaybeRanked, PartyProps> | ChoiceQuestionFilter<MaybeRanked>;
  /**
   * The targets of the filter objects.
   */
  targets: Array<MaybeRanked>;
};
